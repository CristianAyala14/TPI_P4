
import { api } from "../api/client";

import type {
  Categoria,
  ProductosPaginados,
} from "../types/producto";

// FILTROS DEL CATÁLOGO
export interface FiltrosProductos {
  pagina?: number;
  limite?: number;
  search?: string;
  categoriaId?: number | null;
}

// OBTENER PRODUCTOS PAGINADOS
export async function obtenerProductos({
  pagina = 1,
  limite = 8,
  search = "",
  categoriaId = null,
}: FiltrosProductos = {}): Promise<ProductosPaginados> {
  const respuesta = await api.get<ProductosPaginados>(
    "/productos",
    {
      params: {
        skip: (pagina - 1) * limite,
        limit: limite,
        search: search.trim() || undefined,
        categoria_id: categoriaId ?? undefined,
      },
    }
  );

  return respuesta.data;
}

// OBTENER CATEGORÍAS ACTIVAS
export async function obtenerCategorias(): Promise<Categoria[]> {
  const respuesta = await api.get<Categoria[]>(
    "/categorias"
  );

  return respuesta.data.filter(
    (categoria) => categoria.activo
  );
}
