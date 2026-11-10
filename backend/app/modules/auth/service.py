
from app.core.security import (
    verify_password,
    create_access_token
)

from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# EXCEPCIONES DE AUTENTICACIÓN

class CredencialesInvalidas(Exception):
    pass


class CuentaDesactivada(Exception):
    pass


# SERVICE DE AUTENTICACIÓN

class AuthService:

    def __init__(self):
        self.uow = UsuarioUnitOfWork()

    # AUTENTICAR USUARIO
    def autenticar(
        self,
        username: str,
        password: str
    ) -> str:

        with self.uow as uow:

            # Buscar usuario en PostgreSQL
            usuario = uow.usuarios.get_by_username(username)

            # Verificar usuario y contraseña
            if usuario is None or not verify_password(
                password,
                usuario.hashed_password
            ):
                raise CredencialesInvalidas(
                    "Usuario o contraseña incorrectos"
                )

            # Comprobar si la cuenta está desactivada
            if usuario.disabled:
                raise CuentaDesactivada(
                    "Cuenta de usuario desactivada"
                )

            # Generar JWT
            token = create_access_token(
                usuario.username
            )

            return token
