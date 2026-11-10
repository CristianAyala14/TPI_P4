
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):

    def __init__(self, session: Session):
        super().__init__(session, Usuario)

    # buscar usuario por username
    def get_by_username(self, username: str) -> Usuario | None:
        statement = select(Usuario).where(
            Usuario.username == username
        )

        return self.session.exec(statement).first()

    # buscar usuario por email
    def get_by_email(self, email: str) -> Usuario | None:
        statement = select(Usuario).where(
            Usuario.email == email
        )

        return self.session.exec(statement).first()
