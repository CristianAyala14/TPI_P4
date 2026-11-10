
from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# EXCEPCIONES DE NEGOCIO

class UsuarioDuplicado(Exception):
    pass


class UsuarioNoEncontrado(Exception):
    pass


class AutoDesactivacionNoPermitida(Exception):
    pass


# SERVICE DE USUARIOS

class UsuarioService:

    def __init__(self):
        self.uow = UsuarioUnitOfWork()

    # REGISTRAR USUARIO
    def registrar(self, datos: UserCreate) -> UserPublic:

        with self.uow as uow:

            # Comprobar username duplicado
            existente = uow.usuarios.get_by_username(
                datos.username
            )

            if existente is not None:
                raise UsuarioDuplicado(
                    "El nombre de usuario ya está registrado"
                )

            # Comprobar email duplicado
            existente = uow.usuarios.get_by_email(
                datos.email
            )

            if existente is not None:
                raise UsuarioDuplicado(
                    "El correo electrónico ya está registrado"
                )

            # Crear usuario con contraseña hasheada
            usuario = Usuario(
                username=datos.username,
                full_name=datos.full_name,
                email=datos.email,
                hashed_password=hash_password(datos.password),
                role="user",
                disabled=False
            )

            uow.usuarios.add(usuario)

            return UserPublic.model_validate(usuario)

    # LISTAR TODOS LOS USUARIOS
    def listar(self) -> list[UserPublic]:

        with self.uow as uow:

            usuarios = uow.usuarios.get_all()

            return [
                UserPublic.model_validate(usuario)
                for usuario in usuarios
            ]

    # ACTIVAR USUARIO
    def activar(self, usuario_id: int) -> UserPublic:

        with self.uow as uow:

            usuario = uow.usuarios.get_by_id(usuario_id)

            if usuario is None:
                raise UsuarioNoEncontrado(
                    "El usuario no existe"
                )

            usuario.disabled = False

            return UserPublic.model_validate(usuario)

    # DESACTIVAR USUARIO
    def desactivar(
        self,
        usuario_id: int,
        admin_actual_id: int
    ) -> UserPublic:

        with self.uow as uow:

            usuario = uow.usuarios.get_by_id(usuario_id)

            if usuario is None:
                raise UsuarioNoEncontrado(
                    "El usuario no existe"
                )

            # Un administrador no puede desactivarse a sí mismo
            if usuario.id == admin_actual_id:
                raise AutoDesactivacionNoPermitida(
                    "No podés desactivar tu propia cuenta"
                )

            usuario.disabled = True

            return UserPublic.model_validate(usuario)
