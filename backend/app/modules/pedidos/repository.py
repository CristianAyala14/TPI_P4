
from sqlmodel import Session, select
from sqlalchemy import func

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido
from datetime import datetime, timezone

class PedidoRepository(BaseRepository[Pedido]):

    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    # CONSULTA GENERAL DE PEDIDOS

    def _listar(
        self,
        usuario_id: int | None = None,
        estado: str | None = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[int, list[Pedido]]:

        filtros = []

        if usuario_id is not None:
            filtros.append(Pedido.usuario_id == usuario_id)

        if estado is not None:
            filtros.append(Pedido.estado == estado)

        # Contar pedidos que cumplen los filtros
        consulta_total = select(
            func.count(Pedido.id)
        ).where(*filtros)

        total = self.session.exec(consulta_total).one()

        # Obtener pedidos paginados
        consulta = (
            select(Pedido)
            .where(*filtros)
            .order_by(Pedido.created_at.desc(), Pedido.id.desc())
            .offset(skip)
            .limit(limit)
        )

        pedidos = list(
            self.session.exec(consulta).all()
        )

        return total, pedidos

    # PEDIDOS DE UN USUARIO

    def list_by_usuario(
        self,
        usuario_id: int,
        skip: int = 0,
        limit: int = 20,
        estado: str | None = None
    ) -> tuple[int, list[Pedido]]:

        return self._listar(
            usuario_id=usuario_id,
            estado=estado,
            skip=skip,
            limit=limit
        )

    # TODOS LOS PEDIDOS (ADMIN)

    def list_all(
        self,
        skip: int = 0,
        limit: int = 20,
        estado: str | None = None
    ) -> tuple[int, list[Pedido]]:

        return self._listar(
            estado=estado,
            skip=skip,
            limit=limit
        )

    # CONTAR PEDIDOS POR ESTADO

    def count_by_estado(self, estado: str) -> int:

        consulta = select(
            func.count(Pedido.id)
        ).where(
            Pedido.estado == estado
        )

        return self.session.exec(consulta).one()

    
    # CONTAR PEDIDOS CREADOS HOY (UTC)
    def count_hoy(self) -> int:

        hoy = datetime.now(timezone.utc).date()

        consulta = select(
            func.count(Pedido.id)
        ).where(
            func.date(Pedido.created_at) == hoy
        )

        return self.session.exec(consulta).one()

    # SUMAR INGRESOS DE PEDIDOS ENTREGADOS
    def sum_ingresos_entregados(self) -> float:

        consulta = select(
            func.coalesce(func.sum(Pedido.total), 0.0)
        ).where(
            Pedido.estado == "ENTREGADO"
        )

        resultado = self.session.exec(consulta).one()

        return float(resultado)

