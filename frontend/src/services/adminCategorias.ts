
import { api } from "../api/client";
import type { Categoria } from "../types/producto";

export interface DatosCategoria {
  nombre: string;
  descripcion: string | null;
}

// LISTAR CATEGORÍAS
export async function obtenerCategoriasAdmin(): Promise<Categoria[]> {
  const respuesta = await api.get<Categoria[]>("/categorias");

  return respuesta.data.filter((categoria) => categoria.activo);
}

// CREAR CATEGORÍA
export async function crearCategoria(
  datos: DatosCategoria
): Promise<Categoria> {
  const respuesta = await api.post<Categoria>(
    "/categorias",
    datos
  );

  return respuesta.data;
}

// EDITAR CATEGORÍA
export async function editarCategoria(
  id: number,
  datos: DatosCategoria
): Promise<Categoria> {
  const respuesta = await api.put<Categoria>(
    `/categorias/${id}`,
    datos
  );

  return respuesta.data;
}

// BAJA LÓGICA
export async function eliminarCategoria(
  id: number
): Promise<void> {
  await api.delete(`/categorias/${id}`);
}
