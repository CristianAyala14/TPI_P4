
from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import PedidoRepository
from app.modules.productos.repository import ProductoRepository


class PedidoUnitOfWork(UnitOfWork):

    def __enter__(self) -> "PedidoUnitOfWork":

        # Abrir sesión con el UnitOfWork base
        super().__enter__()

        if self.session is None:
            raise RuntimeError(
                "No se pudo iniciar la sesión"
            )

        # Ambos repositorios comparten la misma sesión
        self.pedidos = PedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)

        return self
