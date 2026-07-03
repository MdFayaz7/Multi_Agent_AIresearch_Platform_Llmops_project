from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.database import users_collection
from app.schemas.user import PasswordChange, UserOut, UserSettingsUpdate, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


def _user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        username=doc["username"],
        email=doc["email"],
        full_name=doc.get("full_name"),
        theme=doc.get("theme", "dark"),
        created_at=doc["created_at"],
    )


@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return _user_out(current_user)


@router.put("/profile", response_model=UserOut)
async def update_profile(payload: UserUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "username" in updates and updates["username"] != current_user["username"]:
        if await users_collection.find_one({"username": updates["username"]}):
            raise HTTPException(status_code=400, detail="Username already taken")
    if updates:
        await users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated = await users_collection.find_one({"_id": current_user["_id"]})
    return _user_out(updated)


@router.put("/settings", response_model=UserOut)
async def update_settings(payload: UserSettingsUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        await users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated = await users_collection.find_one({"_id": current_user["_id"]})
    return _user_out(updated)


@router.put("/password")
async def change_password(payload: PasswordChange, current_user: dict = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"hashed_password": hash_password(payload.new_password)}},
    )
    return {"detail": "Password updated"}
