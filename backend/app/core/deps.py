
from fastapi import Cookie, Depends, HTTPException, status

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

# los modelos relacionados en SQLModel
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.pedidos.models import Pedido, DetallePedido


# OBTENER USUARIO AUTENTICADO

def get_current_user(
    access_token: str | None = Cookie(default=None)
) -> Usuario:

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )

    payload = decode_access_token(access_token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )

    username = payload.get("sub")

    if not isinstance(username, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

    with session_factory() as session:
        repo = UsuarioRepository(session)
        usuario = repo.get_by_username(username)

        if usuario is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )

        return usuario


# VERIFICAR USUARIO ACTIVO

def get_current_active_user(
    usuario: Usuario = Depends(get_current_user)
) -> Usuario:

    if usuario.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada"
        )

    return usuario


# VERIFICAR ROL DEL USUARIO

def require_role(roles_permitidos: list[str]):

    def verificar_rol(
        usuario: Usuario = Depends(get_current_active_user)
    ) -> Usuario:

        if usuario.role not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para realizar esta acción"
            )

        return usuario

    return verificar_rol
