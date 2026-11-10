
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

// TANSTACK QUERY

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// INTERCEPTOR AXIOS

api.interceptors.response.use(
  (respuesta) => respuesta,

  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      const ruta = error.config?.url ?? "";

      // El 401 de /auth/me puede ser normal
      // cuando el visitante no inició sesión.
      // Un login incorrecto tampoco debe
      // borrar otra sesión automáticamente.
      if (
        ruta !== "/auth/me" &&
        ruta !== "/auth/token"
      ) {
        useAuthStore.getState().limpiarSesion();

        queryClient.setQueryData(
          ["usuarioActual"],
          null
        );

        // Limpiar datos privados en caché
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
    }

    return Promise.reject(error);
  }
);

// INICIA REACT

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
