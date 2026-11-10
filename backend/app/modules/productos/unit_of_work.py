
from app.core.unit_of_work import UnitOfWork
from app.modules.productos.repository import ProductoRepository
from app.modules.categorias.repository import CategoriaRepository


class ProductoUnitOfWork(UnitOfWork):

    def __enter__(self) -> "ProductoUnitOfWork":

        # Abrir la sesión de PostgreSQL
        super().__enter__()

        if self.session is None:
            raise RuntimeError(
                "No se pudo iniciar la sesión"
            )

        # Ambos repositorios comparten la misma sesión
        self.productos = ProductoRepository(self.session)
        self.categorias = CategoriaRepository(self.session)

        return self
