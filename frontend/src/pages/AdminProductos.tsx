
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";

import { api } from "../api/client";
import TablaAdmin from "../components/TablaAdmin";

import type {
  Producto,
  Categoria,
} from "../types/producto";

// TIPOS

interface ProductosPaginados {
  total: number;
  items: Producto[];
}

interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio_base: number;
  imagen_url: string;
  stock: number;
  disponible: boolean;
  categoria_id: number;
}

interface FormularioProducto {
  nombre: string;
  descripcion: string;
  precio_base: string;
  imagen_url: string;
  stock: string;
  disponible: boolean;
  categoria_id: string;
}

interface GuardarProducto {
  id: number | null;
  datos: DatosProducto;
}

interface ActualizarStock {
  id: number;
  stock: number;
  disponible: boolean;
}

// VALORES INICIALES

const valoresIniciales: FormularioProducto = {
  nombre: "",
  descripcion: "",
  precio_base: "0",
  imagen_url: "",
  stock: "0",
  disponible: true,
  categoria_id: "",
};

// FUNCIONES AUXILIARES

function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function obtenerError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detalle = error.response?.data?.detail;

    if (typeof detalle === "string") {
      return detalle;
    }

    if (error.response?.status === 403) {
      return "No tenés permisos para realizar esta operación.";
    }

    if (error.response?.status === 404) {
      return "El producto o la categoría no existe.";
    }

    if (error.response?.status === 422) {
      return "Los datos ingresados no son válidos.";
    }
  }

  return "No se pudo completar la operación.";
}

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

function validarPrecio(valor: string) {
  if (valor.trim() === "") {
    return "El precio es obligatorio.";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return "Ingresá un precio válido mayor o igual a cero.";
  }

  return undefined;
}

function validarStock(valor: string) {
  if (valor.trim() === "") {
    return "El stock es obligatorio.";
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 0) {
    return "El stock debe ser un número entero mayor o igual a cero.";
  }

  return undefined;
}

// COMPONENTE PRINCIPAL

export default function AdminProductos() {
  const queryClient = useQueryClient();

  const [editando, setEditando] =
    useState<Producto | null>(null);

  const [productoStock, setProductoStock] =
    useState<Producto | null>(null);

  const [stockNuevo, setStockNuevo] = useState("0");

  const [disponibleNuevo, setDisponibleNuevo] =
    useState(true);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // OBTENER PRODUCTOS

  const {
    data,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-productos"],

    queryFn: async () => {
      const respuesta =
        await api.get<ProductosPaginados>(
          "/productos",
          {
            params: {
              skip: 0,
              limit: 100,
            },
          }
        );

      return respuesta.data;
    },
  });

  // OBTENER CATEGORÍAS

  const {
    data: categorias = [],
    isPending: cargandoCategorias,
    isError: errorCategorias,
  } = useQuery({
    queryKey: ["categorias"],

    queryFn: async () => {
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
        queryKey: ["admin-productos"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["productos"],
      }),
    ]);
  }

  // MUTACIÓN: CREAR O EDITAR

  const guardarMutation = useMutation({
    mutationFn: async ({
      id,
      datos,
    }: GuardarProducto) => {
      if (id === null) {
        await api.post("/productos", datos);
      } else {
        await api.put(`/productos/${id}`, datos);
      }
    },

    onSuccess: actualizarConsultas,
  });

  // MUTACIÓN: ACTUALIZAR STOCK

  const stockMutation = useMutation({
    mutationFn: async ({
      id,
      stock,
      disponible,
    }: ActualizarStock) => {
      await api.patch(`/productos/${id}/stock`, {
        stock,
        disponible,
      });
    },

    onSuccess: async () => {
      await actualizarConsultas();

      setProductoStock(null);
      setMensaje("Stock actualizado correctamente.");
      setError("");
    },

    onError: (err) => {
      setError(obtenerError(err));
    },
  });

  // MUTACIÓN: ELIMINAR PRODUCTO

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/productos/${id}`);
    },

    onSuccess: async () => {
      await actualizarConsultas();

      setMensaje("Producto dado de baja correctamente.");
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

      const datos: DatosProducto = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim(),
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim(),
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      };

      try {
        const esEdicion = editando !== null;

        await guardarMutation.mutateAsync({
          id: editando?.id ?? null,
          datos,
        });

        setMensaje(
          esEdicion
            ? "Producto actualizado correctamente."
            : "Producto creado correctamente."
        );

        setEditando(null);
        form.reset(valoresIniciales);
      } catch (err) {
        setError(obtenerError(err));
      }
    },
  });

  // NUEVO PRODUCTO

  function nuevoProducto() {
    setEditando(null);
    setProductoStock(null);

    form.reset(valoresIniciales);

    setError("");
    setMensaje("");
  }

  // EDITAR PRODUCTO

  function editarProducto(producto: Producto) {
    setEditando(producto);
    setProductoStock(null);

    form.reset({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      precio_base: String(producto.precio_base),
      imagen_url: producto.imagen_url ?? "",
      stock: String(producto.stock),
      disponible: producto.disponible,
      categoria_id: String(producto.categoria_id),
    });

    setError("");
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ABRIR CAMBIO DE STOCK

  function abrirStock(producto: Producto) {
    setProductoStock(producto);
    setStockNuevo(String(producto.stock));
    setDisponibleNuevo(producto.disponible);

    setError("");
    setMensaje("");
  }

  // GUARDAR STOCK

  function guardarStock() {
    if (!productoStock) {
      return;
    }

    const errorStock = validarStock(stockNuevo);

    if (errorStock) {
      setError(errorStock);
      return;
    }

    setError("");

    stockMutation.mutate({
      id: productoStock.id,
      stock: Number(stockNuevo),
      disponible: disponibleNuevo,
    });
  }

  // ELIMINAR PRODUCTO

  function eliminarProducto(producto: Producto) {
    const confirmado = window.confirm(
      `¿Querés dar de baja el producto "${producto.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    setError("");
    setMensaje("");

    eliminarMutation.mutate(producto.id);
  }

  
  // COLUMNAS - TANSTACK TABLE V8
  

  const columnas: ColumnDef<Producto>[] = [
    {
      id: "imagen",
      header: "Imagen",

      cell: ({ row }) => {
        const producto = row.original;

        return producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="h-14 w-14 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-slate-500">
            Sin imagen
          </span>
        );
      },
    },

    {
      accessorKey: "nombre",
      header: "Producto",

      cell: ({ row }) => (
        <div>
          <p className="font-semibold">
            {row.original.nombre}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            ID: {row.original.id}
          </p>
        </div>
      ),
    },

    {
      id: "categoria",
      header: "Categoría",

      cell: ({ row }) => (
        <span>
          {row.original.categoria?.nombre ??
            categorias.find(
              (categoria) =>
                categoria.id === row.original.categoria_id
            )?.nombre ??
            "Sin categoría"}
        </span>
      ),
    },

    {
      accessorKey: "precio_base",
      header: "Precio",

      cell: ({ row }) => (
        <span className="font-semibold">
          {formatearPrecio(row.original.precio_base)}
        </span>
      ),
    },

    {
      accessorKey: "stock",
      header: "Stock",

      cell: ({ row }) => (
        <span
          className={
            row.original.stock > 0
              ? "font-semibold text-green-400"
              : "font-semibold text-red-400"
          }
        >
          {row.original.stock}
        </span>
      ),
    },

    {
      accessorKey: "disponible",
      header: "Disponibilidad",

      cell: ({ row }) => (
        <span
          className={
            row.original.disponible
              ? "rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-400"
              : "rounded-full bg-red-950 px-3 py-1 text-xs font-semibold text-red-400"
          }
        >
          {row.original.disponible
            ? "Disponible"
            : "No disponible"}
        </span>
      ),
    },

    {
      id: "acciones",
      header: "Acciones",

      cell: ({ row }) => {
        const producto = row.original;

        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => editarProducto(producto)}
              className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-semibold hover:bg-blue-700"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={() => abrirStock(producto)}
              className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-600"
            >
              Stock
            </button>

            <button
              type="button"
              onClick={() => eliminarProducto(producto)}
              disabled={eliminarMutation.isPending}
              className="rounded-lg bg-red-900 px-3 py-2 text-xs font-semibold hover:bg-red-800 disabled:opacity-40"
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
            Gestión de productos
          </h1>

          <p className="mt-2 text-slate-400">
            Administrá el catálogo, los precios y el stock.
          </p>
        </div>

        <div className="flex gap-3">
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
            {isFetching ? "Actualizando..." : "Actualizar"}
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
          FORMULARIO DE PRODUCTOS
       */}

      <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">
            {editando
              ? `Editar producto #${editando.id}`
              : "Crear nuevo producto"}
          </h2>

          {editando && (
            <button
              type="button"
              onClick={nuevoProducto}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
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

          <div className="grid gap-5 md:grid-cols-2">

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
                    Nombre del producto *
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value)
                    }
                    placeholder="Ej: Pizza mozzarella"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-orange-500"
                  />

                  {!field.state.meta.isValid && (
                    <p className="mt-2 text-sm text-red-400">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* CATEGORÍA */}

            <form.Field
              name="categoria_id"
              validators={{
                onBlur: ({ value }) =>
                  Number(value) <= 0
                    ? "Seleccioná una categoría."
                    : undefined,

                onSubmit: ({ value }) =>
                  Number(value) <= 0
                    ? "Seleccioná una categoría."
                    : undefined,
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    Categoría *
                  </label>

                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value)
                    }
                    disabled={cargandoCategorias}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                  >
                    <option value="">
                      Seleccionar categoría
                    </option>

                    {categorias.map((categoria) => (
                      <option
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>

                  {!field.state.meta.isValid && (
                    <p className="mt-2 text-sm text-red-400">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* PRECIO */}

            <form.Field
              name="precio_base"
              validators={{
                onBlur: ({ value }) =>
                  validarPrecio(value),
                onSubmit: ({ value }) =>
                  validarPrecio(value),
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    Precio *
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                  />

                  {!field.state.meta.isValid && (
                    <p className="mt-2 text-sm text-red-400">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* STOCK */}

            <form.Field
              name="stock"
              validators={{
                onBlur: ({ value }) =>
                  validarStock(value),
                onSubmit: ({ value }) =>
                  validarStock(value),
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    Stock inicial *
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min="0"
                    step="1"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                  />

                  {!field.state.meta.isValid && (
                    <p className="mt-2 text-sm text-red-400">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

          </div>

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
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value)
                  }
                  placeholder="Descripción del producto"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                />
              </div>
            )}
          </form.Field>

          {/* URL DE IMAGEN */}

          <form.Field name="imagen_url">
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium"
                >
                  URL de imagen
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value)
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                />
              </div>
            )}
          </form.Field>

          {/* DISPONIBILIDAD */}

          <form.Field name="disponible">
            {(field) => (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.checked)
                  }
                  className="h-5 w-5 accent-orange-500"
                />

                <span className="text-sm font-medium">
                  Producto disponible para la venta
                </span>
              </label>
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
                  guardarMutation.isPending ||
                  cargandoCategorias ||
                  errorCategorias
                }
                className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Crear producto"}
              </button>
            )}
          </form.Subscribe>

        </form>

      </section>

      {/* 
          MODIFICAR STOCK Y DISPONIBILIDAD
       */}

      {productoStock && (
        <section className="mb-10 rounded-xl border border-blue-800 bg-slate-900 p-6">

          <h2 className="text-xl font-bold">
            Modificar stock
          </h2>

          <p className="mt-2 text-slate-400">
            Producto: {productoStock.nombre}
          </p>

          <div className="mt-5 max-w-sm">
            <label
              htmlFor="stock-nuevo"
              className="mb-2 block text-sm font-medium"
            >
              Nuevo stock
            </label>

            <input
              id="stock-nuevo"
              type="number"
              min="0"
              step="1"
              value={stockNuevo}
              onChange={(e) =>
                setStockNuevo(e.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
            />
          </div>

          <label className="mt-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={disponibleNuevo}
              onChange={(e) =>
                setDisponibleNuevo(e.target.checked)
              }
              className="h-5 w-5 accent-orange-500"
            />

            <span>
              Disponible para la venta
            </span>
          </label>

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={guardarStock}
              disabled={stockMutation.isPending}
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {stockMutation.isPending
                ? "Guardando..."
                : "Guardar stock"}
            </button>

            <button
              type="button"
              onClick={() => setProductoStock(null)}
              className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-800"
            >
              Cancelar
            </button>

          </div>
        </section>
      )}

      {/* 
          LISTADO DE PRODUCTOS
       */}

      <section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">

          <h2 className="text-xl font-bold">
            Productos registrados
          </h2>

          {data && (
            <p className="text-sm text-slate-400">
              Total: {data.total}
            </p>
          )}

        </div>

        {/* CARGANDO */}

        {isPending && (
          <p className="py-8 text-slate-400">
            Cargando productos...
          </p>
        )}

        {/* ERROR */}

        {isError && (
          <p className="rounded-lg bg-red-950 p-4 text-red-300">
            No se pudieron cargar los productos.
          </p>
        )}

        {/* TANSTACK TABLE V8 */}

        {data && (
          <TablaAdmin<Producto>
            datos={data.items}
            columnas={columnas}
            tamanoPagina={10}
          />
        )}

        {data && data.total > data.items.length && (
          <p className="mt-4 text-sm text-yellow-400">
            Se muestran los primeros 100 productos.
            El listado completo requiere paginación
            desde el servidor.
          </p>
        )}

      </section>

    </main>
  );
}
