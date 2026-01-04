"""
Technician model for field technicians with NFC cards
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nfc_card_uid = Column(String(100), unique=True, nullable=False, index=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    department = Column(String(100))
    status = Column(String(50), default="active")  # active, inactive, suspended
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    access_logs = relationship("AccessLog", back_populates="technician", cascade="all, delete-orphan")
