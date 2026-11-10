
from datetime import datetime

from sqlmodel import SQLModel, Field


# Schema para registrar un usuario
class UserCreate(SQLModel):
    username: str
    full_name: str
    email: str
    password: str = Field(min_length=8)


# Schema para devolver información pública
class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: datetime
