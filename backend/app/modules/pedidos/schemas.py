
from datetime import datetime
from typing import Literal

from sqlmodel import SQLModel, Field


# TIPOS PERMITIDOS

EstadoPedido = Literal[
    "PENDIENTE",
    "EN_PREPARACION",
    "ENTREGADO",
    "CANCELADO"
]

FormaPago = Literal[
    "EFECTIVO",
    "TRANSFERENCIA"
]


# CREACIÓN DE PEDIDOS

class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    items: list[ItemPedidoCreate] = Field(
        min_length=1
    )

    forma_pago: FormaPago

    direccion_entrega: str = Field(
        min_length=5,
        max_length=200
    )

    notas: str | None = None


# LECTURA DE PEDIDOS

class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: EstadoPedido
    forma_pago: FormaPago
    direccion_entrega: str
    notas: str | None
    total: float
    created_at: datetime
    updated_at: datetime

    items: list[DetallePedidoRead]


# LISTADO PAGINADO

class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


# CAMBIO DE ESTADO

class CambioEstado(SQLModel):
    estado: EstadoPedido


# RESUMEN PARA ADMIN

class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
