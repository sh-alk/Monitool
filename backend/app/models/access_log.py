"""
Access Log model for tracking toolbox access events
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    toolbox_id = Column(String(36), ForeignKey("toolboxes.id"), nullable=False, index=True)
    technician_id = Column(String(36), ForeignKey("technicians.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)  # open, close, access_denied
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    before_image_id = Column(String(36))  # Reference to image
    after_image_id = Column(String(36))  # Reference to image
    condition_image_url = Column(String(500))  # Optional image of toolbox condition
    items_before = Column(Integer)
    items_after = Column(Integer)
    items_missing = Column(Integer, default=0)
    missing_items_list = Column(String(1000))  # JSON array of missing item names
    notes = Column(String(1000))
    ip_address = Column(String(50))

    # Relationships
    toolbox = relationship("Toolbox", back_populates="access_logs")
    technician = relationship("Technician")
