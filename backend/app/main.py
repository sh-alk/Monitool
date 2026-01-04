"""
Main FastAPI application
"""
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.db.session import get_db, engine, Base
from app.models import (
    User,
    Technician,
    Toolbox,
    AccessLog,
)
from app.schemas.common import Token, MessageResponse
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.technician import TechnicianCreate, TechnicianResponse, TechnicianUpdate
from app.schemas.toolbox import ToolboxCreate, ToolboxResponse, ToolboxUpdate
from app.schemas.access_log import AccessLogCreate, AccessLogResponse
from app.services.storage import storage_service

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


# ==================== API KEY AUTHENTICATION MIDDLEWARE ====================

class APIKeyMiddleware(BaseHTTPMiddleware):
    """Middleware to check API key for all requests except public endpoints"""

    async def dispatch(self, request: Request, call_next):
        # Skip API key check for public endpoints
        public_paths = [
            "/up",
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]

        if request.url.path in public_paths:
            return await call_next(request)

        # Skip API key check for uploaded files (images are public)
        if request.url.path.startswith("/uploads/"):
            return await call_next(request)

        # Skip API key check for documentation paths
        if request.url.path.startswith(f"{settings.API_V1_STR}/openapi.json"):
            return await call_next(request)

        # Skip API key check for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Get API key from header
        api_key = request.headers.get("X-API-Key")

        # Check if API key matches
        if api_key != settings.API_KEY:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or missing API key"}
            )

        return await call_next(request)

app.add_middleware(APIKeyMiddleware)


# ==================== HEALTHCHECK ENDPOINT ====================

@app.get("/up")
async def healthcheck():
    """Healthcheck endpoint"""
    return {"status": "ok"}


# Dependency to get current user from token
async def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post(f"{settings.API_V1_STR}/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post(f"{settings.API_V1_STR}/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ==================== USER ENDPOINTS ====================

@app.get(f"{settings.API_V1_STR}/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


# ==================== TECHNICIAN ENDPOINTS ====================

@app.post(f"{settings.API_V1_STR}/technicians", response_model=TechnicianResponse)
async def create_technician(
    technician_data: TechnicianCreate,
    db: Session = Depends(get_db),
):
    """Create a new technician"""
    # Check if NFC card UID already exists
    if db.query(Technician).filter(Technician.nfc_card_uid == technician_data.nfc_card_uid).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NFC card UID already registered",
        )

    if db.query(Technician).filter(Technician.employee_id == technician_data.employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID already registered",
        )

    new_technician = Technician(**technician_data.model_dump())
    db.add(new_technician)
    db.commit()
    db.refresh(new_technician)

    return new_technician


@app.get(f"{settings.API_V1_STR}/technicians", response_model=List[TechnicianResponse])
async def get_technicians(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get all technicians"""
    technicians = db.query(Technician).offset(skip).limit(limit).all()
    return technicians


@app.get(f"{settings.API_V1_STR}/technicians/by-nfc/{{nfc_uid}}", response_model=TechnicianResponse)
async def get_technician_by_nfc(nfc_uid: str, db: Session = Depends(get_db)):
    """Get technician by NFC card UID"""
    technician = db.query(Technician).filter(Technician.nfc_card_uid == nfc_uid).first()
    if not technician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found",
        )
    return technician


@app.put(f"{settings.API_V1_STR}/technicians/{{technician_id}}", response_model=TechnicianResponse)
async def update_technician(
    technician_id: str,
    technician_data: TechnicianUpdate,
    db: Session = Depends(get_db),
):
    """Update a technician"""
    technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not technician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found",
        )

    for field, value in technician_data.model_dump(exclude_unset=True).items():
        setattr(technician, field, value)

    db.commit()
    db.refresh(technician)

    return technician


@app.delete(f"{settings.API_V1_STR}/technicians/{{technician_id}}")
async def delete_technician(
    technician_id: str,
    db: Session = Depends(get_db),
):
    """Delete a technician"""
    technician = db.query(Technician).filter(Technician.id == technician_id).first()
    if not technician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found",
        )

    db.delete(technician)
    db.commit()

    return {"message": "Technician deleted successfully"}


# ==================== TOOLBOX ENDPOINTS ====================

@app.post(f"{settings.API_V1_STR}/toolboxes", response_model=ToolboxResponse)
async def create_toolbox(
    toolbox_data: ToolboxCreate,
    db: Session = Depends(get_db),
):
    """Create a new toolbox"""
    if db.query(Toolbox).filter(Toolbox.name == toolbox_data.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Toolbox name already exists",
        )

    new_toolbox = Toolbox(**toolbox_data.model_dump())
    db.add(new_toolbox)
    db.commit()
    db.refresh(new_toolbox)

    return new_toolbox


@app.get(f"{settings.API_V1_STR}/toolboxes", response_model=List[ToolboxResponse])
async def get_toolboxes(
    skip: int = 0,
    limit: int = 100,
    zone: str = None,
    status: str = None,
    db: Session = Depends(get_db),
):
    """Get all toolboxes with optional filters"""
    query = db.query(Toolbox)

    if zone:
        query = query.filter(Toolbox.zone == zone)
    if status:
        query = query.filter(Toolbox.status == status)

    toolboxes = query.offset(skip).limit(limit).all()
    return toolboxes


@app.get(f"{settings.API_V1_STR}/toolboxes/{{toolbox_id}}", response_model=ToolboxResponse)
async def get_toolbox(toolbox_id: str, db: Session = Depends(get_db)):
    """Get a specific toolbox"""
    toolbox = db.query(Toolbox).filter(Toolbox.id == toolbox_id).first()
    if not toolbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Toolbox not found",
        )
    return toolbox


@app.put(f"{settings.API_V1_STR}/toolboxes/{{toolbox_id}}", response_model=ToolboxResponse)
async def update_toolbox(
    toolbox_id: str,
    toolbox_data: ToolboxUpdate,
    db: Session = Depends(get_db),
):
    """Update a toolbox"""
    toolbox = db.query(Toolbox).filter(Toolbox.id == toolbox_id).first()
    if not toolbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Toolbox not found",
        )

    for field, value in toolbox_data.model_dump(exclude_unset=True).items():
        setattr(toolbox, field, value)

    db.commit()
    db.refresh(toolbox)

    return toolbox


@app.delete(f"{settings.API_V1_STR}/toolboxes/{{toolbox_id}}")
async def delete_toolbox(
    toolbox_id: str,
    db: Session = Depends(get_db),
):
    """Delete a toolbox"""
    toolbox = db.query(Toolbox).filter(Toolbox.id == toolbox_id).first()
    if not toolbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Toolbox not found",
        )

    # Delete associated image if exists
    if toolbox.image_url:
        storage_service.delete_image(toolbox.image_url)

    db.delete(toolbox)
    db.commit()

    return {"message": "Toolbox deleted successfully"}


# ==================== ACCESS LOG ENDPOINTS ====================

@app.post(f"{settings.API_V1_STR}/access-logs", response_model=AccessLogResponse)
async def create_access_log(
    log_data: AccessLogCreate,
    db: Session = Depends(get_db),
):
    """Create a new access log entry"""
    # Verify toolbox exists
    toolbox = db.query(Toolbox).filter(Toolbox.id == log_data.toolbox_id).first()
    if not toolbox:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Toolbox not found",
        )

    # Verify technician exists
    technician = db.query(Technician).filter(Technician.id == log_data.technician_id).first()
    if not technician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Technician not found",
        )

    new_log = AccessLog(**log_data.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


@app.get(f"{settings.API_V1_STR}/access-logs", response_model=List[AccessLogResponse])
async def get_access_logs(
    skip: int = 0,
    limit: int = 100,
    toolbox_id: str = None,
    technician_id: str = None,
    db: Session = Depends(get_db),
):
    """Get access logs with optional filters"""
    query = db.query(AccessLog)

    if toolbox_id:
        query = query.filter(AccessLog.toolbox_id == toolbox_id)
    if technician_id:
        query = query.filter(AccessLog.technician_id == technician_id)

    logs = query.order_by(AccessLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs


@app.delete(f"{settings.API_V1_STR}/access-logs/{{log_id}}")
async def delete_access_log(
    log_id: str,
    db: Session = Depends(get_db),
):
    """Delete an access log entry"""
    log = db.query(AccessLog).filter(AccessLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access log not found",
        )

    db.delete(log)
    db.commit()

    return {"message": "Access log deleted successfully"}


# ==================== DASHBOARD ENDPOINTS ====================

@app.get(f"{settings.API_V1_STR}/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    from sqlalchemy import func
    from datetime import datetime, timedelta

    today = datetime.utcnow().date()

    # Total checkouts today
    checkouts_today = db.query(func.count(AccessLog.id)).filter(
        func.date(AccessLog.timestamp) == today
    ).scalar()

    # Missing items count (distinct toolboxes with missing items)
    missing_items = db.query(AccessLog).filter(
        AccessLog.items_missing > 0
    ).order_by(AccessLog.timestamp.desc()).first()

    missing_count = missing_items.items_missing if missing_items else 0

    # Active technicians (unique technicians accessed today)
    active_technicians = db.query(func.count(func.distinct(AccessLog.technician_id))).filter(
        func.date(AccessLog.timestamp) == today
    ).scalar()

    return {
        "total_checkouts_today": checkouts_today or 0,
        "missing_items": missing_count,
        "active_technicians": active_technicians or 0,
    }


# ==================== IMAGE UPLOAD ====================

@app.post(f"{settings.API_V1_STR}/images/upload")
async def upload_image(
    file: UploadFile = File(...),
    subfolder: str = "toolboxes",
):
    """Upload an image file"""
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG and PNG images are allowed",
        )

    # Save file
    try:
        file_path, file_size = await storage_service.save_image(file, subfolder)
        return {
            "filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "content_type": file.content_type,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}",
        )


@app.get("/uploads/{subfolder}/{filename}")
async def get_uploaded_file(subfolder: str, filename: str):
    """Serve uploaded images"""
    file_path = storage_service.get_file_path(f"{subfolder}/{filename}")

    if not file_path or not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    return FileResponse(file_path)


@app.delete(f"{settings.API_V1_STR}/images")
async def delete_image(file_path: str):
    """Delete an uploaded image"""
    success = storage_service.delete_image(file_path)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    return {"message": "Image deleted successfully"}


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.VERSION}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
    }
