from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class FarmerProfile(BaseModel):
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    farm_size: Optional[float] = None  # in acres
    soil_type: Optional[str] = None
    crop_types: Optional[List[str]] = []
    preferred_language: str = "en"


class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    phone: str
    email: Optional[str] = None
    hashed_password: str
    profile: FarmerProfile = FarmerProfile()
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    crop_types: Optional[List[str]] = []
    preferred_language: str = "en"


class UserLogin(BaseModel):
    phone: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    profile: FarmerProfile
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    farm_size: Optional[float] = None
    soil_type: Optional[str] = None
    crop_types: Optional[List[str]] = None
    preferred_language: Optional[str] = None
