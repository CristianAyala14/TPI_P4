
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(UnitOfWork):

    def __enter__(self) -> "CategoriaUnitOfWork":

        # abre la sesión desde el UnitOfWork base
        super().__enter__()

        if self.session is None:
            raise RuntimeError("No se pudo iniciar la sesión")

        # Crea el repositorio con la misma sesión
        self.categorias = CategoriaRepository(self.session)

        return self
