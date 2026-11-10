
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { cerrarSesion } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useCarritoStore } from "../store/carrito";

export default function BarraNavegacion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [saliendo, setSaliendo] = useState(false);

  const usuario = useAuthStore(
    (state) => state.usuario
  );

  const verificado = useAuthStore(
    (state) => state.verificado
  );

  // CERRAR SESIÓN
  async function salir() {
    setSaliendo(true);

    try {
      await cerrarSesion();

      useAuthStore.getState().limpiarSesion();
      useCarritoStore.getState().vaciarCarrito();

      queryClient.setQueryData(
        ["usuarioActual"],
        null
      );

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

      navigate("/");
    } catch {
      alert("No se pudo cerrar la sesión.");
    } finally {
      setSaliendo(false);
    }
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

        <Link
          to="/"
          className="text-xl font-bold text-orange-500"
        >
          Food Store
        </Link>

        <div className="flex flex-wrap items-center gap-4">

          {!verificado ? (
            <span className="text-sm text-slate-400">
              Verificando sesión...
            </span>
          ) : usuario ? (
            <>
              <span className="text-sm text-slate-300">
                Hola, {usuario.username}
                {usuario.role === "admin" && " (Admin)"}
              </span>

              <Link
                to="/mis-pedidos"
                className="text-sm font-semibold text-orange-400 hover:text-orange-300"
              >
                Mis pedidos
              </Link>

              {usuario.role === "admin" && (
                <Link
                  to="/admin"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                >
                  Panel Admin
                </Link>
              )}

              <button
                type="button"
                onClick={() => void salir()}
                disabled={saliendo}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {saliendo
                  ? "Cerrando..."
                  : "Cerrar sesión"}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-slate-300 hover:text-white"
              >
                Ingresar
              </Link>

              <Link
                to="/registro"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold hover:bg-orange-600"
              >
                Registrarse
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}
