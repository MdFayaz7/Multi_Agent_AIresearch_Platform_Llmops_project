from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import users_collection
from app.schemas.user import Token, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        username=doc["username"],
        email=doc["email"],
        full_name=doc.get("full_name"),
        theme=doc.get("theme", "dark"),
        created_at=doc["created_at"],
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    if await users_collection.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await users_collection.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    doc = {
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "full_name": payload.full_name,
        "theme": "dark",
        "created_at": datetime.now(timezone.utc),
    }
    result = await users_collection.insert_one(doc)
    token = create_access_token(subject=str(result.inserted_id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # form_data.username carries the email (OAuth2 spec field name)
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(subject=str(user["_id"]))
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return _user_out(current_user)
