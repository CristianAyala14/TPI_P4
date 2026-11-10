
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import axios from "axios";

import App from "./App";
import { api } from "./api/client";
import { useAuthStore } from "./store/authStore";

import "./index.css";

// ===================================
// TANSTACK QUERY
// ===================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ===================================
// LIMPIAR DATOS DE SESIÓN
// ===================================

function limpiarSesionLocal() {
  useAuthStore.getState().limpiarSesion();

  queryClient.setQueryData(["usuarioActual"], null);

  const consultasPrivadas = [
    "pedidos",
    "pedidos-admin",
    "resumenPedidos",
    "usuarios-admin",
  ];

  for (const clave of consultasPrivadas) {
    queryClient.removeQueries({
      queryKey: [clave],
    });
  }
}

// ===================================
// INTERCEPTOR AXIOS
// ===================================

api.interceptors.response.use(
  (respuesta) => respuesta,

  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const estado = error.response?.status;
    const ruta = error.config?.url ?? "";
    const detalle = error.response?.data?.detail;

    // Normalizar el mensaje para comparar
    // incluso cuando hay diferencias de acentos.
    const mensaje =
      typeof detalle === "string"
        ? detalle
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
        : "";

    const cuentaDesactivada =
      estado === 400 &&
      mensaje.includes("cuenta de usuario desactivada");

    const sesionInvalida = estado === 401;

    const esLogin = ruta.includes("/auth/token");

    // Un login incorrecto puede devolver 401.
    // Eso no debe provocar una limpieza global.
    if (
      cuentaDesactivada ||
      (sesionInvalida && !esLogin)
    ) {
      limpiarSesionLocal();
    }

    // Conservamos el error para que el formulario
    // o la página puedan mostrar su mensaje.
    return Promise.reject(error);
  }
);

// ===================================
// INICIAR REACT
// ===================================

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
