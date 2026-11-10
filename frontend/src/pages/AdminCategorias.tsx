
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";

import { api } from "../api/client";
import TablaAdmin from "../components/TablaAdmin";
import type { Categoria } from "../types/producto";

// TIPOS

interface DatosCategoria {
  nombre: string;
  descripcion: string;
}

interface GuardarCategoria {
  id: number | null;
  datos: DatosCategoria;
}

const valoresIniciales: DatosCategoria = {
  nombre: "",
  descripcion: "",
};

// FUNCIONES AUXILIARES

function validarNombre(valor: string) {
  const nombre = valor.trim();

  if (nombre.length < 2) {
    return "El nombre debe tener al menos 2 caracteres.";
  }

  if (nombre.length > 100) {
    return "El nombre no puede superar los 100 caracteres.";
  }

  return undefined;
}

function obtenerError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detalle = error.response?.data?.detail;

    if (typeof detalle === "string") {
      return detalle;
    }

    if (error.response?.status === 409) {
      return "Ya existe una categoría con ese nombre.";
    }

    if (error.response?.status === 403) {
      return "No tenés permisos para esta operación.";
    }

    if (error.response?.status === 404) {
      return "La categoría no existe.";
    }
  }

  return "No se pudo completar la operación.";
}

// COMPONENTE PRINCIPAL

export default function AdminCategorias() {
  const queryClient = useQueryClient();

  const [editando, setEditando] =
    useState<Categoria | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // CONSULTAR CATEGORÍAS

  const {
    data: categorias = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["categorias"],

    queryFn: async (): Promise<Categoria[]> => {
      const respuesta = await api.get<Categoria[]>(
        "/categorias"
      );

      return respuesta.data.filter(
        (categoria) => categoria.activo
      );
    },
  });

  // INVALIDAR CONSULTAS

  async function actualizarConsultas() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["categorias"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin-productos"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["productos"],
      }),
    ]);
  }

  // CREAR O ACTUALIZAR CATEGORÍA

  const guardarMutation = useMutation({
    mutationFn: async ({
      id,
      datos,
    }: GuardarCategoria) => {
      if (id === null) {
        await api.post("/categorias", datos);
      } else {
        await api.put(`/categorias/${id}`, datos);
      }
    },

    onSuccess: actualizarConsultas,
  });

  // ELIMINAR CATEGORÍA

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categorias/${id}`);
    },

    onSuccess: async (_, id) => {
      await actualizarConsultas();

      if (editando?.id === id) {
        setEditando(null);
        form.reset(valoresIniciales);
      }

      setMensaje(
        "Categoría dada de baja correctamente."
      );

      setError("");
    },

    onError: (err) => {
      setError(obtenerError(err));
    },
  });

  // TANSTACK FORM

  const form = useForm({
    defaultValues: valoresIniciales,

    onSubmit: async ({ value }) => {
      setError("");
      setMensaje("");

      const datos: DatosCategoria = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim(),
      };

      try {
        const esEdicion = editando !== null;

        await guardarMutation.mutateAsync({
          id: editando?.id ?? null,
          datos,
        });

        setMensaje(
          esEdicion
            ? "Categoría actualizada correctamente."
            : "Categoría creada correctamente."
        );

        setEditando(null);
        form.reset(valoresIniciales);

      } catch (err) {
        setError(obtenerError(err));
      }
    },
  });

  // NUEVA CATEGORÍA

  function nuevaCategoria() {
    setEditando(null);

    form.reset(valoresIniciales);

    setMensaje("");
    setError("");
  }

  // EDITAR CATEGORÍA

  function editarCategoria(categoria: Categoria) {
    setEditando(categoria);

    form.reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? "",
    });

    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ELIMINAR CATEGORÍA

  function eliminarCategoria(categoria: Categoria) {
    const confirmado = window.confirm(
      `¿Querés dar de baja la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    setMensaje("");
    setError("");

    eliminarMutation.mutate(categoria.id);
  }

  
  // COLUMNAS - TANSTACK TABLE V8
  

  const columnas: ColumnDef<Categoria>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },

    {
      accessorKey: "nombre",
      header: "Nombre",

      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.nombre}
        </span>
      ),
    },

    {
      accessorKey: "descripcion",
      header: "Descripción",

      cell: ({ row }) => (
        <span className="text-slate-300">
          {row.original.descripcion ||
            "Sin descripción"}
        </span>
      ),
    },

    {
      id: "estado",
      header: "Estado",

      cell: ({ row }) => (
        <span
          className={
            row.original.activo
              ? "rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-400"
              : "rounded-full bg-red-950 px-3 py-1 text-xs font-semibold text-red-400"
          }
        >
          {row.original.activo
            ? "Activa"
            : "Inactiva"}
        </span>
      ),
    },

    {
      id: "acciones",
      header: "Acciones",

      cell: ({ row }) => {
        const categoria = row.original;

        return (
          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() => editarCategoria(categoria)}
              disabled={guardarMutation.isPending}
              className="rounded-lg bg-blue-800 px-4 py-2 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={() => eliminarCategoria(categoria)}
              disabled={eliminarMutation.isPending}
              className="rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold hover:bg-red-800 disabled:opacity-50"
            >
              Eliminar
            </button>

          </div>
        );
      },
    },
  ];

  // 
  // VISTA PRINCIPAL
  // 

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ENCABEZADO */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-orange-400">
            ADMINISTRACIÓN
          </p>

          <h1 className="text-3xl font-bold">
            Gestión de categorías
          </h1>

          <p className="mt-2 text-slate-400">
            Creá, editá y administrá las categorías de Food Store.
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

      {/* MENSAJES */}

      {mensaje && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-green-800 bg-green-950 p-4 text-green-300"
        >
          {mensaje}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300"
        >
          {error}
        </p>
      )}

      {/* 
          FORMULARIO
       */}

      <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <h2 className="text-xl font-bold">
            {editando
              ? `Editar categoría #${editando.id}`
              : "Crear nueva categoría"}
          </h2>

          {editando && (
            <button
              type="button"
              onClick={nuevaCategoria}
              disabled={guardarMutation.isPending}
              className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar edición
            </button>
          )}

        </div>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            void form.handleSubmit();
          }}
          className="space-y-5"
        >

          {/* NOMBRE */}

          <form.Field
            name="nombre"
            validators={{
              onBlur: ({ value }) =>
                validarNombre(value),

              onSubmit: ({ value }) =>
                validarNombre(value),
            }}
          >
            {(field) => (
              <div>

                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium"
                >
                  Nombre de la categoría *
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  maxLength={100}
                  placeholder="Ej: Pizzas"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(evento) =>
                    field.handleChange(evento.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-orange-500"
                />

                {!field.state.meta.isValid && (
                  <p
                    role="alert"
                    className="mt-2 text-sm text-red-400"
                  >
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}

              </div>
            )}
          </form.Field>

          {/* DESCRIPCIÓN */}

          <form.Field name="descripcion">
            {(field) => (
              <div>

                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium"
                >
                  Descripción
                </label>

                <textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  placeholder="Descripción de la categoría"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(evento) =>
                    field.handleChange(evento.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-orange-500"
                />

              </div>
            )}
          </form.Field>

          {/* GUARDAR */}

          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
            ]}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={
                  !canSubmit ||
                  isSubmitting ||
                  guardarMutation.isPending
                }
                className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Crear categoría"}
              </button>
            )}
          </form.Subscribe>

        </form>

      </section>

      {/* 
          TABLA DE CATEGORÍAS
       */}

      <section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">

          <h2 className="text-xl font-bold">
            Categorías registradas
          </h2>

          <p className="text-sm text-slate-400">
            Total: {categorias.length}
          </p>

        </div>

        {/* CARGANDO */}

        {isPending && (
          <p className="py-8 text-slate-400">
            Cargando categorías...
          </p>
        )}

        {/* ERROR DE CONSULTA */}

        {isError && (
          <p className="rounded-lg bg-red-950 p-4 text-red-300">
            No se pudieron cargar las categorías.
          </p>
        )}

        {/* TANSTACK TABLE V8 */}

        {!isPending && !isError && (
          <TablaAdmin<Categoria>
            datos={categorias}
            columnas={columnas}
            tamanoPagina={10}
          />
        )}

      </section>

    </main>
  );
}
