from datetime import datetime
from fastapi import HTTPException, status
from bson import ObjectId
from app.models.user import UserCreate, UserLogin, UserResponse, UserUpdate, FarmerProfile
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.database import get_database


async def register_user(user_data: UserCreate) -> dict:
    db = get_database()

    # Check if phone already exists
    existing = await db.users.find_one({"phone": user_data.phone})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )

    # Check email if provided
    if user_data.email:
        existing_email = await db.users.find_one({"email": user_data.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    hashed = hash_password(user_data.password)
    profile = FarmerProfile(
        village=user_data.village,
        district=user_data.district,
        state=user_data.state,
        farm_size=user_data.farm_size,
        soil_type=user_data.soil_type,
        crop_types=user_data.crop_types or [],
        preferred_language=user_data.preferred_language,
    )

    user_doc = {
        "name": user_data.name,
        "phone": user_data.phone,
        "email": user_data.email,
        "hashed_password": hashed,
        "profile": profile.dict(),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "phone": user_data.phone})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user_data.name,
            "phone": user_data.phone,
            "email": user_data.email,
            "profile": profile.dict(),
        }
    }


async def login_user(credentials: UserLogin) -> dict:
    db = get_database()

    user = await db.users.find_one({"phone": credentials.phone})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )

    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "phone": user["phone"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user["name"],
            "phone": user["phone"],
            "email": user.get("email"),
            "profile": user.get("profile", {}),
        }
    }


async def get_user_profile(user: dict) -> dict:
    return {
        "id": user["_id"],
        "name": user["name"],
        "phone": user["phone"],
        "email": user.get("email"),
        "profile": user.get("profile", {}),
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
    }


async def update_user_profile(user: dict, update_data: UserUpdate) -> dict:
    db = get_database()
    user_id = user["_id"]

    update_fields = {}
    if update_data.name:
        update_fields["name"] = update_data.name
    if update_data.email:
        update_fields["email"] = update_data.email

    profile_updates = {}
    if update_data.village is not None:
        profile_updates["profile.village"] = update_data.village
    if update_data.district is not None:
        profile_updates["profile.district"] = update_data.district
    if update_data.state is not None:
        profile_updates["profile.state"] = update_data.state
    if update_data.farm_size is not None:
        profile_updates["profile.farm_size"] = update_data.farm_size
    if update_data.soil_type is not None:
        profile_updates["profile.soil_type"] = update_data.soil_type
    if update_data.crop_types is not None:
        profile_updates["profile.crop_types"] = update_data.crop_types
    if update_data.preferred_language is not None:
        profile_updates["profile.preferred_language"] = update_data.preferred_language

    all_updates = {**update_fields, **profile_updates, "updated_at": datetime.utcnow()}

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": all_updates}
    )

    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])
    return updated_user
