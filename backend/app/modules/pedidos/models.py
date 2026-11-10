
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.usuarios.models import Usuario
    from app.modules.productos.models import Producto


# MODELO PEDIDO

class Pedido(SQLModel, table=True):
    __tablename__ = "pedidos"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    usuario_id: int = Field(
        foreign_key="usuarios.id"
    )

    estado: str = Field(default="PENDIENTE")

    forma_pago: str

    direccion_entrega: str

    notas: str | None = Field(default=None)

    total: float = Field(default=0.0)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Relaciones
    usuario: "Usuario" = Relationship(
        back_populates="pedidos"
    )

    items: list["DetallePedido"] = Relationship(
        back_populates="pedido"
    )


# MODELO DETALLE PEDIDO

class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedidos"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    pedido_id: int = Field(
        foreign_key="pedidos.id"
    )

    producto_id: int = Field(
        foreign_key="productos.id"
    )

    cantidad: int

    nombre_producto: str

    precio_unitario: float

    subtotal: float

    # Relaciones
    pedido: "Pedido" = Relationship(
        back_populates="items"
    )

    producto: "Producto" = Relationship(
        back_populates="detalles"
    )
