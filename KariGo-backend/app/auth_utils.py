from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext


# Password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# JWT settings
SECRET_KEY = "karigo-super-secret-key-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )