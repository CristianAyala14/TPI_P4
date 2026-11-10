
import { api } from "../api/client";

import type {
  Categoria,
  Producto,
  ProductosPaginados,
} from "../types/producto";


export interface DatosProducto {
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  stock: number;
  disponible: boolean;
}


// LISTAR PRODUCTOS CON BUSQUEDA Y PAGINACION
export async function listarProductosAdmin(
  pagina: number,
  busqueda: string
): Promise<ProductosPaginados> {
  const respuesta = await api.get<ProductosPaginados>(
    "/productos",
    {
      params: {
        skip: (pagina - 1) * 10,
        limit: 10,
        search: busqueda || undefined,
      },
    }
  );

  return respuesta.data;
}


// OBTENER CATEGORIAS
export async function listarCategorias(): Promise<Categoria[]> {
  const respuesta = await api.get<Categoria[]>(
    "/categorias"
  );

  return respuesta.data.filter(
    (categoria) => categoria.activo
  );
}


// CREAR PRODUCTO
export async function crearProductoAdmin(
  datos: DatosProducto
): Promise<Producto> {
  const respuesta = await api.post<Producto>(
    "/productos",
    datos
  );

  return respuesta.data;
}


// ACTUALIZAR PRODUCTO
export async function actualizarProductoAdmin(
  id: number,
  datos: DatosProducto
): Promise<Producto> {
  const respuesta = await api.put<Producto>(
    `/productos/${id}`,
    datos
  );

  return respuesta.data;
}


// ACTUALIZAR STOCK
export async function actualizarStockAdmin(
  id: number,
  stock: number,
  disponible: boolean
): Promise<Producto> {
  const respuesta = await api.patch<Producto>(
    `/productos/${id}/stock`,
    { stock, disponible }
  );

  return respuesta.data;
}


// BAJA LOGICA
export async function eliminarProductoAdmin(
  id: number
): Promise<void> {
  await api.delete(`/productos/${id}`);
}
