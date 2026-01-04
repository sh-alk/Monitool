"""
Alert model for system notifications
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    toolbox_id = Column(String(36), ForeignKey("toolboxes.id"), index=True)
    alert_type = Column(String(50), nullable=False)  # missing_items, unauthorized_access, system_error
    severity = Column(String(50), default="medium", index=True)  # low, medium, high, critical
    message = Column(String(1000), nullable=False)
    is_resolved = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(String(36), ForeignKey("users.id"))
