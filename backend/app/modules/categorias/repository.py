
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):

    def __init__(self, session: Session):
        super().__init__(session, Categoria)

    # Buscar una categoría por su nombre
    def get_by_nombre(self, nombre: str) -> Categoria | None:
        statement = select(Categoria).where(
            Categoria.nombre == nombre
        )

        return self.session.exec(statement).first()
