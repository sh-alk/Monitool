"""
Technician schemas for API validation
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class TechnicianBase(BaseModel):
    """Base technician schema"""
    nfc_card_uid: str
    employee_id: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None


class TechnicianCreate(TechnicianBase):
    """Schema for creating a technician"""
    pass


class TechnicianUpdate(BaseModel):
    """Schema for updating a technician"""
    nfc_card_uid: Optional[str] = None
    employee_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None


class TechnicianResponse(TechnicianBase):
    """Schema for technician response"""
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
