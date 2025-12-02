# src/schemas.py
from pydantic import BaseModel, EmailStr

# Schema for incoming Signup/Signin data
class UserAuth(BaseModel):
    email: EmailStr
    password: str

# Schema for returning User data (hide password)
class UserResponse(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True