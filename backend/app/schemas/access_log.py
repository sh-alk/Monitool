"""
Access Log schemas for API validation
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AccessLogBase(BaseModel):
    """Base access log schema"""
    toolbox_id: str
    technician_id: str
    action_type: str  # open, close, access_denied


class AccessLogCreate(AccessLogBase):
    """Schema for creating an access log"""
    before_image_id: Optional[str] = None
    after_image_id: Optional[str] = None
    condition_image_url: Optional[str] = None
    items_before: Optional[int] = None
    items_after: Optional[int] = None
    items_missing: int = 0
    missing_items_list: Optional[str] = None
    notes: Optional[str] = None
    ip_address: Optional[str] = None


class AccessLogResponse(AccessLogBase):
    """Schema for access log response"""
    id: str
    timestamp: datetime
    condition_image_url: Optional[str] = None
    items_before: Optional[int] = None
    items_after: Optional[int] = None
    items_missing: int
    missing_items_list: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
