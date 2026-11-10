
import { api } from "../api/client";
import type { Usuario } from "../types/usuario";

// LISTAR TODOS LOS USUARIOS
export async function obtenerUsuariosAdmin(): Promise<Usuario[]> {
  const respuesta = await api.get<Usuario[]>(
    "/admin/usuarios"
  );

  return respuesta.data;
}

// ACTIVAR USUARIO
export async function activarUsuarioAdmin(
  usuarioId: number
): Promise<void> {
  await api.post(
    `/admin/usuarios/${usuarioId}/activar`
  );
}

// DESACTIVAR USUARIO
export async function desactivarUsuarioAdmin(
  usuarioId: number
): Promise<void> {
  await api.post(
    `/admin/usuarios/${usuarioId}/desactivar`
  );
}
