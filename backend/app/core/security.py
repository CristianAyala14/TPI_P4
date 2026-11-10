
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# Configuración de contraseñas
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# Convierte una contraseña en hash
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# verifica una contraseña
def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# crea un token JWT
def create_access_token(username: str) -> str:

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": username,
        "exp": expire
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


# decodifica y verificar un token JWT
def decode_access_token(token: str) -> dict | None:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        if not isinstance(payload.get("sub"), str):
            return None

        return payload

    except JWTError:
        return None
