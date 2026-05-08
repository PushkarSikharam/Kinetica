from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileResponse(UserResponse):
    display_name: Optional[str] = None
    biological_sex: str
    goal_type: str
    goal_rate_kg_week: float
    target_calories: float
    calorie_floor: float
    katori_multiplier: float
    roti_multiplier: float
    oil_level: str
    last_known_region: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    biological_sex: Optional[str] = None
    goal_type: Optional[str] = None
    goal_rate_kg_week: Optional[float] = None
    target_calories: Optional[float] = None
    calorie_floor: Optional[float] = None
    katori_multiplier: Optional[float] = None
    roti_multiplier: Optional[float] = None
    oil_level: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
