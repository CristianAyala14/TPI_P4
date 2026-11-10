
from datetime import datetime, timezone

from app.modules.usuarios.models import Usuario
from app.modules.pedidos.models import Pedido, DetallePedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork


# EXCEPCIONES DE NEGOCIO

class PedidoNoEncontrado(Exception):
    pass


class PedidoAjeno(Exception):
    pass


class ProductoNoEncontrado(Exception):
    pass


class ProductoNoDisponible(Exception):
    pass


class StockInsuficiente(Exception):
    pass


class ProductoRepetido(Exception):
    pass


class TransicionInvalida(Exception):
    pass


# TRANSICIONES PERMITIDAS

TRANSICIONES = {
    "PENDIENTE": ["EN_PREPARACION", "CANCELADO"],
    "EN_PREPARACION": ["ENTREGADO", "CANCELADO"],
    "ENTREGADO": [],
    "CANCELADO": []
}


# SERVICE DE PEDIDOS

class PedidoService:

    def __init__(self):
        self.uow = PedidoUnitOfWork()

    # CREAR PEDIDO - RN-01

    def crear(
        self,
        datos: PedidoCreate,
        usuario: Usuario
    ) -> PedidoRead:

        # No permitir productos repetidos
        ids = [item.producto_id for item in datos.items]

        if len(ids) != len(set(ids)):
            raise ProductoRepetido(
                "No se puede repetir un producto en el pedido"
            )

        with self.uow as uow:

            pedido = Pedido(
                usuario_id=usuario.id,
                estado="PENDIENTE",
                forma_pago=datos.forma_pago,
                direccion_entrega=datos.direccion_entrega,
                notas=datos.notas,
                total=0.0
            )

            uow.pedidos.add(pedido)

            total = 0.0

            for item in datos.items:

                producto = uow.productos.get_by_id(
                    item.producto_id
                )

                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(
                        f"Producto {item.producto_id} inexistente"
                    )

                if not producto.disponible:
                    raise ProductoNoDisponible(
                        f"El producto {producto.nombre} no está disponible"
                    )

                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente de {producto.nombre}"
                    )

                # Descontar stock
                producto.stock -= item.cantidad

                # Copiar el precio al momento de comprar
                precio = producto.precio_base
                subtotal = precio * item.cantidad

                detalle = DetallePedido(
                    producto_id=producto.id,
                    cantidad=item.cantidad,
                    nombre_producto=producto.nombre,
                    precio_unitario=precio,
                    subtotal=subtotal
                )

                # Asociar el detalle al pedido
                pedido.items.append(detalle)

                total += subtotal

            pedido.total = total

            # Sincronizar cambios antes de construir la respuesta
            uow.session.flush()

            return PedidoRead.model_validate(pedido)

    # LISTAR PEDIDOS - RN-04

    def listar(
        self,
        usuario: Usuario,
        skip: int = 0,
        limit: int = 20,
        estado: str | None = None
    ) -> PedidosPaginados:

        with self.uow as uow:

            if usuario.role == "admin":
                total, pedidos = uow.pedidos.list_all(
                    skip=skip,
                    limit=limit,
                    estado=estado
                )
            else:
                total, pedidos = uow.pedidos.list_by_usuario(
                    usuario_id=usuario.id,
                    skip=skip,
                    limit=limit,
                    estado=estado
                )

            return PedidosPaginados(
                total=total,
                items=[
                    PedidoRead.model_validate(p)
                    for p in pedidos
                ]
            )

    # OBTENER PEDIDO - RN-04

    def obtener(
        self,
        pedido_id: int,
        usuario: Usuario
    ) -> PedidoRead:

        with self.uow as uow:

            pedido = uow.pedidos.get_by_id(pedido_id)

            if pedido is None:
                raise PedidoNoEncontrado(
                    "El pedido no existe"
                )

            if (
                usuario.role != "admin"
                and pedido.usuario_id != usuario.id
            ):
                raise PedidoAjeno(
                    "No podés consultar un pedido ajeno"
                )

            return PedidoRead.model_validate(pedido)

    # CAMBIAR ESTADO - RN-02 Y RN-03

    def cambiar_estado(
        self,
        pedido_id: int,
        nuevo_estado: str
    ) -> PedidoRead:

        with self.uow as uow:

            pedido = uow.pedidos.get_by_id(pedido_id)

            if pedido is None:
                raise PedidoNoEncontrado(
                    "El pedido no existe"
                )

            permitidos = TRANSICIONES.get(pedido.estado, [])

            if nuevo_estado not in permitidos:
                raise TransicionInvalida(
                    f"No se puede pasar de {pedido.estado} "
                    f"a {nuevo_estado}"
                )

            # Si se cancela, restituir el stock
            if nuevo_estado == "CANCELADO":
                self._restituir_stock(uow, pedido)

            pedido.estado = nuevo_estado
            pedido.updated_at = datetime.now(timezone.utc)

            uow.session.flush()

            return PedidoRead.model_validate(pedido)

    # CANCELAR PEDIDO DEL CLIENTE
    # RN-03 Y RN-04

    def cancelar(
        self,
        pedido_id: int,
        usuario: Usuario
    ) -> PedidoRead:

        with self.uow as uow:

            pedido = uow.pedidos.get_by_id(pedido_id)

            if pedido is None:
                raise PedidoNoEncontrado(
                    "El pedido no existe"
                )

            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno(
                    "No podés cancelar un pedido ajeno"
                )

            if pedido.estado != "PENDIENTE":
                raise TransicionInvalida(
                    "Solo se pueden cancelar pedidos pendientes"
                )

            self._restituir_stock(uow, pedido)

            pedido.estado = "CANCELADO"
            pedido.updated_at = datetime.now(timezone.utc)

            uow.session.flush()

            return PedidoRead.model_validate(pedido)

    # RESTITUIR STOCK - RN-03

    def _restituir_stock(self, uow, pedido: Pedido):

        for detalle in pedido.items:

            producto = uow.productos.get_by_id(
                detalle.producto_id
            )

            if producto is None:
                raise ProductoNoEncontrado(
                    f"Producto {detalle.producto_id} inexistente"
                )

            producto.stock += detalle.cantidad

    # RESUMEN PARA ADMINISTRADOR

    def resumen(self) -> ResumenPedidos:

        with self.uow as uow:

            return ResumenPedidos(
                pendientes=uow.pedidos.count_by_estado(
                    "PENDIENTE"
                ),
                en_preparacion=uow.pedidos.count_by_estado(
                    "EN_PREPARACION"
                ),
                entregados=uow.pedidos.count_by_estado(
                    "ENTREGADO"
                ),
                cancelados=uow.pedidos.count_by_estado(
                    "CANCELADO"
                ),
                pedidos_hoy=uow.pedidos.count_hoy(),
                ingresos_entregados=(
                    uow.pedidos.sum_ingresos_entregados()
                )
            )
