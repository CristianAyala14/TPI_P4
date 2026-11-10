
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";

import TablaAdmin from "../components/TablaAdmin";
import { useAuthStore } from "../store/authStore";

import {
  obtenerUsuariosAdmin,
  activarUsuarioAdmin,
  desactivarUsuarioAdmin,
} from "../services/adminUsuarios";

import type { Usuario } from "../types/usuario";


// TIPOS

type AccionUsuario = "activar" | "desactivar";

interface CambioUsuario {
  id: number;
  nombre: string;
  accion: AccionUsuario;
}

// FUNCIONES AUXILIARES

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function obtenerError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detalle = error.response?.data?.detail;

    if (typeof detalle === "string") {
      return detalle;
    }

    if (error.response?.status === 403) {
      return "No tenés permisos para esta operación.";
    }

    if (error.response?.status === 404) {
      return "El usuario no existe.";
    }
  }

  return "No se pudo completar la operación.";
}

// COMPONENTE PRINCIPAL

export default function AdminUsuarios() {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // USUARIO AUTENTICADO - ZUSTAND

  const usuarioActual = useAuthStore(
    (state) => state.usuario
  );

  // OBTENER USUARIOS - TANSTACK QUERY

  const {
    data,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: obtenerUsuariosAdmin,
  });

  const usuarios = useMemo(
    () => data ?? [],
    [data]
  );

  // ACTIVAR Y DESACTIVAR CUENTAS

  const cambioEstado = useMutation({
    mutationFn: async ({
      id,
      accion,
    }: CambioUsuario) => {
      if (accion === "activar") {
        await activarUsuarioAdmin(id);
      } else {
        await desactivarUsuarioAdmin(id);
      }
    },

    onSuccess: async (_, variables) => {
      setError("");

      setMensaje(
        variables.accion === "activar"
          ? `Usuario "${variables.nombre}" activado correctamente.`
          : `Usuario "${variables.nombre}" desactivado correctamente.`
      );

      await queryClient.invalidateQueries({
        queryKey: ["usuarios-admin"],
      });
    },

    onError: (err) => {
      setMensaje("");
      setError(obtenerError(err));
    },
  });

  // SOLICITAR CAMBIO DE ESTADO

  const solicitarCambio = useCallback(
    (usuario: Usuario, accion: AccionUsuario) => {
      if (cambioEstado.isPending) {
        return;
      }

      // No permitir desactivar la propia cuenta
      if (
        accion === "desactivar" &&
        usuario.id === usuarioActual?.id
      ) {
        setError(
          "No podés desactivar tu propia cuenta."
        );
        return;
      }

      const confirmado = window.confirm(
        accion === "activar"
          ? `¿Querés activar la cuenta de "${usuario.username}"?`
          : `¿Querés desactivar la cuenta de "${usuario.username}"?`
      );

      if (!confirmado) {
        return;
      }

      setMensaje("");
      setError("");

      cambioEstado.mutate({
        id: usuario.id,
        nombre: usuario.username,
        accion,
      });
    },
    [
      cambioEstado.isPending,
      cambioEstado.mutate,
      usuarioActual?.id,
    ]
  );

  // BUSCAR USUARIOS

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      return (
        usuario.username
          .toLowerCase()
          .includes(texto) ||
        usuario.full_name
          .toLowerCase()
          .includes(texto) ||
        usuario.email
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [usuarios, busqueda]);

  // INDICADORES

  const totalUsuarios = usuarios.length;

  const usuariosActivos = usuarios.filter(
    (usuario) => !usuario.disabled
  ).length;

  const usuariosInactivos = usuarios.filter(
    (usuario) => usuario.disabled
  ).length;

  const administradores = usuarios.filter(
    (usuario) => usuario.role === "admin"
  ).length;

  // COLUMNAS - TANSTACK TABLE V8

  const columnas = useMemo<ColumnDef<Usuario>[]>(
    () => [
      // USUARIO
      {
        accessorKey: "username",
        header: "Usuario",

        cell: ({ row }) => {
          const usuario = row.original;
          const esMiCuenta =
            usuario.id === usuarioActual?.id;

          return (
            <div>
              <p className="font-semibold">
                {usuario.username}
              </p>

              {esMiCuenta && (
                <span className="text-xs text-orange-400">
                  Tu cuenta
                </span>
              )}
            </div>
          );
        },
      },

      // NOMBRE COMPLETO
      {
        accessorKey: "full_name",
        header: "Nombre completo",
      },

      // CORREO
      {
        accessorKey: "email",
        header: "Correo electrónico",

        cell: ({ row }) => (
          <span className="text-slate-300">
            {row.original.email}
          </span>
        ),
      },

      // ROL
      {
        accessorKey: "role",
        header: "Rol",

        cell: ({ row }) => {
          const esAdmin =
            row.original.role === "admin";

          return (
            <span
              className={
                esAdmin
                  ? "rounded-full bg-orange-950 px-3 py-1 text-xs font-semibold text-orange-400"
                  : "rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200"
              }
            >
              {esAdmin
                ? "Administrador"
                : "Usuario"}
            </span>
          );
        },
      },

      // ESTADO
      {
        accessorKey: "disabled",
        header: "Estado",

        cell: ({ row }) => {
          const desactivado = row.original.disabled;

          return (
            <span
              className={
                desactivado
                  ? "rounded-full bg-red-950 px-3 py-1 text-xs font-semibold text-red-400"
                  : "rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-400"
              }
            >
              {desactivado
                ? "Desactivado"
                : "Activo"}
            </span>
          );
        },
      },

      // FECHA DE REGISTRO
      {
        accessorKey: "created_at",
        header: "Registro",

        cell: ({ row }) => (
          <span className="text-slate-400">
            {formatearFecha(
              row.original.created_at
            )}
          </span>
        ),
      },

      // ACCIONES
      {
        id: "acciones",
        header: "Acciones",

        cell: ({ row }) => {
          const usuario = row.original;

          const esMiCuenta =
            usuario.id === usuarioActual?.id;

          const procesando =
            cambioEstado.isPending &&
            cambioEstado.variables?.id === usuario.id;

          // No mostrar desactivar en nuestra cuenta
          if (esMiCuenta) {
            return (
              <span className="text-xs text-slate-500">
                Cuenta actual
              </span>
            );
          }

          // ACTIVAR
          if (usuario.disabled) {
            return (
              <button
                type="button"
                onClick={() =>
                  solicitarCambio(usuario, "activar")
                }
                disabled={cambioEstado.isPending}
                className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {procesando
                  ? "Procesando..."
                  : "Activar"}
              </button>
            );
          }

          // DESACTIVAR
          return (
            <button
              type="button"
              onClick={() =>
                solicitarCambio(usuario, "desactivar")
              }
              disabled={cambioEstado.isPending}
              className="rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold hover:bg-red-800 disabled:opacity-50"
            >
              {procesando
                ? "Procesando..."
                : "Desactivar"}
            </button>
          );
        },
      },
    ],
    [
      usuarioActual?.id,
      cambioEstado.isPending,
      cambioEstado.variables?.id,
      solicitarCambio,
    ]
  );

  // VISTA PRINCIPAL

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ENCABEZADO */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-orange-400">
            ADMINISTRACIÓN
          </p>

          <h1 className="text-3xl font-bold">
            Gestión de usuarios
          </h1>

          <p className="mt-2 text-slate-400">
            Consultá y administrá las cuentas de Food Store.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-800"
          >
            Volver al panel
          </Link>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {isFetching
              ? "Actualizando..."
              : "Actualizar"}
          </button>
        </div>
      </div>

      {/* INDICADORES */}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Total de usuarios
          </p>

          <p className="mt-3 text-3xl font-bold">
            {totalUsuarios}
          </p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Activos
          </p>

          <p className="mt-3 text-3xl font-bold text-green-400">
            {usuariosActivos}
          </p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Desactivados
          </p>

          <p className="mt-3 text-3xl font-bold text-red-400">
            {usuariosInactivos}
          </p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            Administradores
          </p>

          <p className="mt-3 text-3xl font-bold text-orange-400">
            {administradores}
          </p>
        </article>

      </div>

      {/* MENSAJE DE ÉXITO */}

      {mensaje && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-green-800 bg-green-950 p-4 text-green-300"
        >
          {mensaje}
        </p>
      )}

      {/* MENSAJE DE ERROR */}

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300"
        >
          {error}
        </p>
      )}

      {/* BUSCADOR */}

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <label
          htmlFor="buscar-usuario"
          className="mb-3 block text-sm font-semibold"
        >
          Buscar usuarios
        </label>

        <input
          id="buscar-usuario"
          type="search"
          value={busqueda}
          onChange={(evento) =>
            setBusqueda(evento.target.value)
          }
          placeholder="Buscar por usuario, nombre o correo..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-orange-500"
        />

        <p className="mt-3 text-xs text-slate-500">
          La búsqueda se realiza sobre los usuarios cargados.
        </p>
      </div>

      {/* ENCABEZADO DE TABLA */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold">
          Usuarios registrados
        </h2>

        <p className="text-sm text-slate-400">
          Mostrando {usuariosFiltrados.length} de{" "}
          {totalUsuarios} usuarios
        </p>
      </div>

      {/* CARGANDO */}

      {isPending && (
        <p className="py-8 text-slate-400">
          Cargando usuarios...
        </p>
      )}

      {/* ERROR DE CONSULTA */}

      {isError && (
        <div className="rounded-lg bg-red-950 p-5 text-red-300">
          <p>
            No se pudieron consultar los usuarios.
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-lg bg-red-800 px-4 py-2 font-semibold hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 
          TANSTACK TABLE V8
       */}

      {!isPending && !isError && (
        <TablaAdmin<Usuario>
          datos={usuariosFiltrados}
          columnas={columnas}
          tamanoPagina={10}
        />
      )}

    </main>
  );
}
