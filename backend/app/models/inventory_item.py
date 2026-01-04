"""
Inventory Item model for tracking individual tools in toolboxes
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    toolbox_id = Column(String(36), ForeignKey("toolboxes.id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String(255), nullable=False)
    item_description = Column(String(500))
    quantity = Column(Integer, default=1)
    status = Column(String(50), default="present", index=True)  # present, missing, damaged
    last_verified = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    toolbox = relationship("Toolbox", back_populates="inventory_items")
