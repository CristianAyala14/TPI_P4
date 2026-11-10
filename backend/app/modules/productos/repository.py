
from sqlmodel import Session, select, col
from sqlalchemy import func

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):

    def __init__(self, session: Session):
        super().__init__(session, Producto)

    # BUSCAR PRODUCTOS CON FILTROS

    def search(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None
    ) -> tuple[int, list[Producto]]:

        # Solo productos activos
        filtros = [
            col(Producto.activo).is_(True)
        ]

        # Filtrar por nombre
        if search:
            filtros.append(
                col(Producto.nombre).ilike(
                    f"%{search.strip()}%"
                )
            )

        # Filtrar por categoría
        if categoria_id is not None:
            filtros.append(
                Producto.categoria_id == categoria_id
            )

        # Filtrar por disponibilidad
        if disponible is not None:
            filtros.append(
                Producto.disponible == disponible
            )

        # Contar todos los productos que cumplen los filtros
        consulta_total = (
            select(func.count(Producto.id))
            .where(*filtros)
        )

        total = self.session.exec(consulta_total).one()

        # Obtener los productos de la página solicitada
        consulta = (
            select(Producto)
            .where(*filtros)
            .order_by(Producto.id)
            .offset(skip)
            .limit(limit)
        )

        productos = list(
            self.session.exec(consulta).all()
        )

        return total, productos
