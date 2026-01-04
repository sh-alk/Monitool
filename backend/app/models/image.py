"""
Image model for storing toolbox images
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


class Image(Base):
    __tablename__ = "images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    toolbox_id = Column(String(36), ForeignKey("toolboxes.id"), nullable=False, index=True)
    access_log_id = Column(String(36), ForeignKey("access_logs.id"), index=True)
    image_url = Column(String(500), nullable=False)  # Local file path or S3 URL
    image_type = Column(String(50))  # before, after, reference
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    perceptual_hash = Column(String(64))  # For image comparison
    captured_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    image_metadata = Column(String(2000))  # JSON string for camera settings, detection results, etc.

    # Relationships
    toolbox = relationship("Toolbox", back_populates="images")
