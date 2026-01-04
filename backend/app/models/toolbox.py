"""
Toolbox model for tracking toolbox inventory
"""
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


class Toolbox(Base):
    __tablename__ = "toolboxes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    zone = Column(String(50), index=True)
    location_description = Column(String(500))
    raspberry_pi_serial = Column(String(100), unique=True)
    status = Column(String(50), default="operational", index=True)  # operational, maintenance, offline
    total_items = Column(Integer, default=0)
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="toolbox", cascade="all, delete-orphan")
    access_logs = relationship("AccessLog", back_populates="toolbox", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="toolbox")
