from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True
        