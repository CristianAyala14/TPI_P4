
export type FormaPago = "EFECTIVO" | "TRANSFERENCIA";

export type EstadoPedido =
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "ENTREGADO"
  | "CANCELADO";

// DATOS PARA CREAR UN PEDIDO
export interface ItemPedidoCreate {
  producto_id: number;
  cantidad: number;
}

export interface PedidoCreate {
  items: ItemPedidoCreate[];
  forma_pago: FormaPago;
  direccion_entrega: string;
  notas: string | null;
}

// DETALLE DE UN PRODUCTO COMPRADO
export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  nombre_producto: string;
  precio_unitario: number;
  subtotal: number;
}

// PEDIDO QUE DEVUELVE FASTAPI
export interface Pedido {
  id: number;
  usuario_id: number;
  estado: EstadoPedido;
  forma_pago: FormaPago;
  direccion_entrega: string;
  notas: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  items: DetallePedido[];
}

// RESPUESTA PAGINADA
export interface PedidosPaginados {
  total: number;
  items: Pedido[];
}

// MANTENEMOS COMPATIBILIDAD CON CHECKOUT
export type PedidoCreado = Pedido;
