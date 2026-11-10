
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import (
    UsuarioService,
    UsuarioNoEncontrado,
    AutoDesactivacionNoPermitida
)


router = APIRouter(
    prefix="/admin/usuarios",
    tags=["Administracion - Usuarios"]
)


# DEPENDENCIA DEL SERVICE
def get_usuario_service() -> UsuarioService:
    return UsuarioService()


# LISTAR TODOS LOS USUARIOS

@router.get("", response_model=list[UserPublic])
def listar_usuarios(
    service: UsuarioService = Depends(get_usuario_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    return service.listar()


# ACTIVAR USUARIO

@router.post(
    "/{usuario_id}/activar",
    response_model=UserPublic
)
def activar_usuario(
    usuario_id: int,
    service: UsuarioService = Depends(get_usuario_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.activar(usuario_id)

    except UsuarioNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error


# DESACTIVAR USUARIO

@router.post(
    "/{usuario_id}/desactivar",
    response_model=UserPublic
)
def desactivar_usuario(
    usuario_id: int,
    service: UsuarioService = Depends(get_usuario_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.desactivar(
            usuario_id,
            admin_actual_id=admin.id
        )

    except UsuarioNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except AutoDesactivacionNoPermitida as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error
