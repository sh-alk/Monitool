"""
Common schemas and responses
"""
from typing import Optional, Any
from pydantic import BaseModel


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[Any] = None


class PaginationParams(BaseModel):
    """Pagination parameters"""
    skip: int = 0
    limit: int = 100


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    total: int
    items: list
    skip: int
    limit: int
