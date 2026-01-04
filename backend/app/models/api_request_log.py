"""
API Request Log model for monitoring and debugging
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import uuid


class APIRequestLog(Base):
    __tablename__ = "api_request_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE
    endpoint = Column(String(500), nullable=False, index=True)
    status_code = Column(Integer, index=True)
    response_time_ms = Column(Integer)
    user_id = Column(String(36), ForeignKey("users.id"))
    technician_id = Column(String(36), ForeignKey("technicians.id"))
    toolbox_id = Column(String(36), ForeignKey("toolboxes.id"))
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    request_body = Column(String(10240))  # JSON string, max 10KB
    response_body = Column(String(10240))  # JSON string, max 10KB
    error_message = Column(String(1000))
