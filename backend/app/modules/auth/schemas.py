
from sqlmodel import SQLModel


class AuthMessage(SQLModel):
    message: str
