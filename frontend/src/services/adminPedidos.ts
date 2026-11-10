
import { api } from "../api/client";

import type {
  Pedido,
  PedidosPaginados,
  EstadoPedido,
} from "../types/pedido";

// CONSULTAR TODOS LOS PEDIDOS
export async function listarPedidosAdmin(
  pagina: number,
  estado?: EstadoPedido
): Promise<PedidosPaginados> {
  const respuesta = await api.get<PedidosPaginados>(
    "/pedidos",
    {
      params: {
        skip: (pagina - 1) * 10,
        limit: 10,
        estado: estado || undefined,
      },
    }
  );

  return respuesta.data;
}

// CAMBIAR EL ESTADO DE UN PEDIDO
export async function cambiarEstadoPedidoAdmin(
  pedidoId: number,
  estado: EstadoPedido
): Promise<Pedido> {
  const respuesta = await api.patch<Pedido>(
    `/pedidos/${pedidoId}/estado`,
    { estado }
  );

  return respuesta.data;
}
