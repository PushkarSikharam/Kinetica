from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class UserFeedback(Base):
    """Direct feedback loop from users to administrators."""
    __tablename__ = "user_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Message content
    message = Column(Text, nullable=False)
    
    # Status tracking for Admin
    status = Column(String, default="unread") # "unread", "read", "resolved"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User")
