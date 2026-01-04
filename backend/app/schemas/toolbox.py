"""
Toolbox schemas for API validation
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ToolboxBase(BaseModel):
    """Base toolbox schema"""
    name: str
    zone: Optional[str] = None
    location_description: Optional[str] = None
    raspberry_pi_serial: Optional[str] = None


class ToolboxCreate(ToolboxBase):
    """Schema for creating a toolbox"""
    total_items: int = 0
    image_url: Optional[str] = None


class ToolboxUpdate(BaseModel):
    """Schema for updating a toolbox"""
    name: Optional[str] = None
    zone: Optional[str] = None
    location_description: Optional[str] = None
    status: Optional[str] = None
    total_items: Optional[int] = None
    image_url: Optional[str] = None


class ToolboxResponse(ToolboxBase):
    """Schema for toolbox response"""
    id: str
    status: str
    total_items: int
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
