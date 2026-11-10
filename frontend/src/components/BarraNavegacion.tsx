
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { cerrarSesion } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import { useCarritoStore } from "../store/carrito";

// BARRA DE NAVEGACIÓN

export default function BarraNavegacion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [saliendo, setSaliendo] = useState(false);

  // SESIÓN - ZUSTAND

  const usuario = useAuthStore(
    (state) => state.usuario
  );

  const verificado = useAuthStore(
    (state) => state.verificado
  );

  const comprobando = useAuthStore(
    (state) => state.comprobando
  );

  // CARRITO - ZUSTAND

  const cantidadCarrito = useCarritoStore(
    (state) =>
      state.items.reduce(
        (total, item) => total + item.cantidad,
        0
      )
  );

  // CERRAR SESIÓN

  async function salir() {
    if (saliendo) return;

    setSaliendo(true);

    try {
      // 1. Eliminar cookie desde FastAPI
      await cerrarSesion();

      // 2. Limpiar sesión en Zustand
      useAuthStore.getState().limpiarSesion();

      // 3. Vaciar carrito
      useCarritoStore.getState().vaciarCarrito();

      // 4. Limpiar usuario en TanStack Query
      queryClient.setQueryData(
        ["usuarioActual"],
        null
      );

      // 5. Eliminar consultas privadas
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

      // 6. Redirigir al inicio
      navigate("/", { replace: true });

    } catch {
      alert("No se pudo cerrar la sesión.");
    } finally {
      setSaliendo(false);
    }
  }

  // VISTA PRINCIPAL

  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

        {/* LOGO */}

        <Link
          to="/"
          className="text-xl font-bold text-orange-500"
        >
          Food Store
        </Link>

        {/* ENLACES */}

        <div className="flex flex-wrap items-center gap-4">

          {/* CATÁLOGO */}

          <Link
            to="/"
            className="text-sm font-semibold text-slate-300 hover:text-white"
          >
            Catálogo
          </Link>

          {/* MI CARRITO - VISIBLE PARA TODOS */}

          <Link
            to="/carrito"
            className="flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300"
          >
            Mi carrito

            {cantidadCarrito > 0 && (
              <span className="flex min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
                {cantidadCarrito}
              </span>
            )}
          </Link>

          {/* VERIFICACIÓN DE SESIÓN */}

          {!verificado || comprobando ? (
            <span className="text-sm text-slate-400">
              Verificando sesión...
            </span>
          ) : usuario ? (
            <>

              {/* USUARIO AUTENTICADO */}

              <span className="text-sm text-slate-300">
                Hola, {usuario.username}
                {usuario.role === "admin" && " (Admin)"}
              </span>

              {/* MIS PEDIDOS */}

              <Link
                to="/mis-pedidos"
                className="text-sm font-semibold text-orange-400 hover:text-orange-300"
              >
                Mis pedidos
              </Link>

              {/* PANEL ADMINISTRATIVO */}

              {usuario.role === "admin" && (
                <Link
                  to="/admin"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                >
                  Panel Admin
                </Link>
              )}

              {/* CERRAR SESIÓN */}

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

              {/* USUARIO NO AUTENTICADO */}

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
