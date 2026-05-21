from fastapi import APIRouter, Depends
from app.models.user import UserCreate, UserLogin, UserUpdate
from app.controllers.auth_controller import register_user, login_user, get_user_profile, update_user_profile
from app.middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", summary="Register a new farmer")
async def register(user_data: UserCreate):
    return await register_user(user_data)


@router.post("/login", summary="Login with phone and password")
async def login(credentials: UserLogin):
    return await login_user(credentials)


@router.get("/me", summary="Get current user profile")
async def get_me(current_user: dict = Depends(get_current_user)):
    return await get_user_profile(current_user)


@router.put("/me", summary="Update user profile")
async def update_me(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    return await update_user_profile(current_user, update_data)


@router.post("/logout", summary="Logout (client-side token removal)")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
