
import { api } from "../api/client";

import type {
  Pedido,
  PedidoCreate,
  PedidoCreado,
  PedidosPaginados,
} from "../types/pedido";

// CREAR PEDIDO
export async function crearPedido(
  datos: PedidoCreate
): Promise<PedidoCreado> {
  const respuesta = await api.post<PedidoCreado>(
    "/pedidos",
    datos
  );

  return respuesta.data;
}

// OBTENER PEDIDOS DEL USUARIO
export async function obtenerPedidos(
  skip: number = 0,
  limit: number = 10
): Promise<PedidosPaginados> {
  const respuesta = await api.get<PedidosPaginados>(
    "/pedidos",
    {
      params: {
        skip,
        limit,
      },
    }
  );

  return respuesta.data;
}

// CANCELAR UN PEDIDO
export async function cancelarPedido(
  pedidoId: number
): Promise<Pedido> {
  const respuesta = await api.patch<Pedido>(
    `/pedidos/${pedidoId}/cancelar`
  );

  return respuesta.data;
}
