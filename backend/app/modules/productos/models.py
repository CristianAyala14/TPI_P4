
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.categorias.models import Categoria
    from app.modules.pedidos.models import DetallePedido


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    categoria_id: int = Field(
        foreign_key="categorias.id"
    )

    nombre: str
    descripcion: str | None = Field(default=None)

    precio_base: float

    imagen_url: str | None = Field(default=None)

    stock: int = Field(default=0)

    disponible: bool = Field(default=True)
    activo: bool = Field(default=True)

    categoria: "Categoria" = Relationship(
        back_populates="productos"
    )

    detalles: list["DetallePedido"] = Relationship(
        back_populates="producto"
    )
