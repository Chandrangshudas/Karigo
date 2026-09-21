from app.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.auth_utils import verify_password, create_access_token


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    role = user.role.strip().lower()
    if role not in {"artisan", "buyer"}:
        raise HTTPException(status_code=422, detail="Role must be either artisan or buyer")

    if len(user.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = pwd_context.hash(
        user.password
    )

    # Create user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login_user(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    # Find user
    user = db.query(User).filter(
        User.email == email
    ).first()

    # User doesn't exist
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check password
    if not verify_password(
        password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
@router.post("/token")
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check password
    if not verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user
