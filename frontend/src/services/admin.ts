
import { api } from "../api/client";
import type { ResumenPedidos } from "../types/resumen";

export async function obtenerResumen(): Promise<ResumenPedidos> {
  const respuesta = await api.get<ResumenPedidos>(
    "/pedidos/resumen"
  );

  return respuesta.data;
}
