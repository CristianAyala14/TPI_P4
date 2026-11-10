
import axios from "axios";

import { api } from "../api/client";
import type {
  Usuario,
  DatosRegistro
} from "../types/usuario";

// INICIAR SESIÓN
export async function iniciarSesion(
  username: string,
  password: string
): Promise<void> {
  const formulario = new URLSearchParams();

  formulario.append("username", username);
  formulario.append("password", password);

  await api.post("/auth/token", formulario, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

// REGISTRAR USUARIO
export async function registrarUsuario(
  datos: DatosRegistro
): Promise<Usuario> {
  const respuesta = await api.post<Usuario>(
    "/auth/register",
    datos
  );

  return respuesta.data;
}

// OBTENER SESIÓN ACTUAL
export async function obtenerUsuarioActual():
  Promise<Usuario | null> {
  try {
    const respuesta = await api.get<Usuario>(
      "/auth/me"
    );

    return respuesta.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      return null;
    }

    throw error;
  }
}

// CERRAR SESIÓN
export async function cerrarSesion(): Promise<void> {
  await api.post("/auth/logout");
}
