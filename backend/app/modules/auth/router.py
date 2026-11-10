
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status
)
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import get_current_active_user

from app.modules.auth.schemas import AuthMessage
from app.modules.auth.service import (
    AuthService,
    CredencialesInvalidas,
    CuentaDesactivada
)

from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import (
    UsuarioService,
    UsuarioDuplicado
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticacion"]
)


# DEPENDENCIAS
def get_auth_service() -> AuthService:
    return AuthService()


def get_usuario_service() -> UsuarioService:
    return UsuarioService()


# REGISTRO DE USUARIOS

@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED
)
def registrar(
    datos: UserCreate,
    service: UsuarioService = Depends(get_usuario_service)
):
    try:
        return service.registrar(datos)

    except UsuarioDuplicado as error:
        raise HTTPException(
            status_code=409,
            detail=str(error)
        ) from error


# LOGIN

@router.post("/token", response_model=AuthMessage)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service)
):
    try:
        token = service.autenticar(
            form_data.username,
            form_data.password
        )

    except CredencialesInvalidas as error:
        raise HTTPException(
            status_code=401,
            detail=str(error)
        ) from error

    except CuentaDesactivada as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error

    # Guardar JWT en cookie HttpOnly
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return AuthMessage(message="Login exitoso")


# LOGOUT

@router.post("/logout", response_model=AuthMessage)
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/"
    )

    return AuthMessage(message="Sesión cerrada correctamente")


# PERFIL DEL USUARIO

@router.get("/me", response_model=UserPublic)
def obtener_perfil(
    usuario: Usuario = Depends(get_current_active_user)
):
    return UserPublic.model_validate(usuario)
