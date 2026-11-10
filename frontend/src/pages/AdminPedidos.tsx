
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import {
  listarPedidosAdmin,
  cambiarEstadoPedidoAdmin,
} from "../services/adminPedidos";

import type {
  EstadoPedido,
  Pedido,
} from "../types/pedido";


// CONFIGURACIÓN DE ESTADOS

const nombresEstado: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const coloresEstado: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-yellow-900 text-yellow-300",
  EN_PREPARACION: "bg-blue-900 text-blue-300",
  ENTREGADO: "bg-green-900 text-green-300",
  CANCELADO: "bg-red-900 text-red-300",
};

// TRANSICIONES PERMITIDAS POR EL BACKEND
const transiciones: Record<
  EstadoPedido,
  EstadoPedido[]
> = {
  PENDIENTE: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

const LIMITE = 10;

// FUNCIONES AUXILIARES

function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detalle = error.response?.data?.detail;

    if (typeof detalle === "string") {
      return detalle;
    }

    if (error.response?.status === 403) {
      return "No tenés permisos para esta operación.";
    }
  }

  return "No se pudo actualizar el pedido.";
}

// COMPONENTE PRINCIPAL

export default function AdminPedidos() {
  const queryClient = useQueryClient();

  const [pagina, setPagina] = useState(1);

  const [filtroEstado, setFiltroEstado] =
    useState<EstadoPedido | "">("");

  const [mensaje, setMensaje] = useState("");

  // CONSULTAR PEDIDOS
  const {
    data,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "pedidos-admin",
      pagina,
      filtroEstado,
    ],
    queryFn: () =>
      listarPedidosAdmin(
        pagina,
        filtroEstado || undefined
      ),
  });

  // MODIFICAR ESTADO
  const cambioEstado = useMutation({
    mutationFn: ({
      pedidoId,
      estado,
    }: {
      pedidoId: number;
      estado: EstadoPedido;
    }) => cambiarEstadoPedidoAdmin(pedidoId, estado),

    onSuccess: async (pedido) => {
      setMensaje(
        `Pedido #${pedido.id} actualizado a ${
          nombresEstado[pedido.estado]
        }.`
      );

      // Actualizar todas las consultas afectadas
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pedidos-admin"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["pedidos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["resumenPedidos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["productos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-productos"],
        }),
      ]);
    },
  });

  // SOLICITAR CAMBIO DE ESTADO
  function solicitarCambio(
    pedido: Pedido,
    nuevoEstado: EstadoPedido
  ) {
    if (
      !transiciones[pedido.estado].includes(nuevoEstado)
    ) {
      return;
    }

    if (nuevoEstado === "CANCELADO") {
      const confirmado = window.confirm(
        `¿Querés cancelar el pedido #${pedido.id}?\n` +
        "Se restituirá el stock de sus productos."
      );

      if (!confirmado) return;
    }

    setMensaje("");

    cambioEstado.mutate({
      pedidoId: pedido.id,
      estado: nuevoEstado,
    });
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / LIMITE)
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ENCABEZADO */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-orange-400">
            ADMINISTRACIÓN
          </p>

          <h1 className="text-3xl font-bold">
            Gestión de pedidos
          </h1>

          <p className="mt-2 text-slate-400">
            Consultá y administrá los pedidos de Food Store.
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
            className="rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* FILTRO POR ESTADO */}

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <label
          htmlFor="filtro-estado"
          className="mb-2 block text-sm font-semibold"
        >
          Filtrar por estado
        </label>

        <select
          id="filtro-estado"
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(
              e.target.value as EstadoPedido | ""
            );
            setPagina(1);
          }}
          className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 p-3"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="EN_PREPARACION">
            En preparación
          </option>
          <option value="ENTREGADO">Entregados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
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

      {/* CARGANDO */}

      {isPending && (
        <p className="text-slate-400">
          Cargando pedidos...
        </p>
      )}

      {/* ERROR DE CONSULTA */}

      {isError && (
        <p
          role="alert"
          className="rounded-lg bg-red-950 p-4 text-red-300"
        >
          No se pudieron consultar los pedidos.
        </p>
      )}

      {/* SIN RESULTADOS */}

      {data && data.total === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
          <p className="text-slate-400">
            No hay pedidos para el filtro seleccionado.
          </p>
        </div>
      )}

      {/* LISTADO */}

      {data && data.total > 0 && (
        <>
          <p className="mb-5 text-sm text-slate-400">
            {data.total} pedidos encontrados
          </p>

          <div className="space-y-6">
            {data.items.map((pedido) => {
              const estadosPermitidos =
                transiciones[pedido.estado];

              const actualizando =
                cambioEstado.isPending &&
                cambioEstado.variables?.pedidoId ===
                  pedido.id;

              const errorDeEstePedido =
                cambioEstado.isError &&
                cambioEstado.variables?.pedidoId ===
                  pedido.id;

              return (
                <article
                  key={pedido.id}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                >
                  {/* ENCABEZADO */}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-6">
                    <div>
                      <h2 className="text-xl font-bold">
                        Pedido #{pedido.id}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatearFecha(pedido.created_at)}
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        Cliente ID: {pedido.usuario_id}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        coloresEstado[pedido.estado]
                      }`}
                    >
                      {nombresEstado[pedido.estado]}
                    </span>
                  </div>

                  {/* DATOS DEL PEDIDO */}

                  <div className="p-6">
                    <div className="grid gap-5 sm:grid-cols-2">

                      <div>
                        <p className="text-sm text-slate-400">
                          Medio de pago
                        </p>

                        <p className="mt-1 font-semibold">
                          {pedido.forma_pago}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">
                          Dirección de entrega
                        </p>

                        <p className="mt-1 font-semibold">
                          {pedido.direccion_entrega}
                        </p>
                      </div>

                    </div>

                    {/* NOTAS */}

                    {pedido.notas && (
                      <div className="mt-5">
                        <p className="text-sm text-slate-400">
                          Notas del cliente
                        </p>

                        <p className="mt-1">
                          {pedido.notas}
                        </p>
                      </div>
                    )}

                    {/* PRODUCTOS */}

                    <h3 className="mb-4 mt-7 font-bold">
                      Productos del pedido
                    </h3>

                    <div className="space-y-3">
                      {pedido.items.map((detalle) => (
                        <div
                          key={detalle.id}
                          className="flex justify-between gap-4 border-b border-slate-800 pb-3"
                        >
                          <div>
                            <p className="font-medium">
                              {detalle.nombre_producto}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {detalle.cantidad} ×{" "}
                              {formatearPrecio(
                                detalle.precio_unitario
                              )}
                            </p>
                          </div>

                          <p className="font-semibold">
                            {formatearPrecio(
                              detalle.subtotal
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* TOTAL */}

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-lg font-bold">
                        Total
                      </span>

                      <span className="text-2xl font-bold text-orange-400">
                        {formatearPrecio(pedido.total)}
                      </span>
                    </div>

                    {/* ERROR AL CAMBIAR ESTADO */}

                    {errorDeEstePedido && (
                      <p
                        role="alert"
                        className="mt-5 rounded-lg bg-red-950 p-4 text-sm text-red-300"
                      >
                        {mensajeError(cambioEstado.error)}
                      </p>
                    )}

                    {/* ACCIONES DISPONIBLES */}

                    {estadosPermitidos.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">

                        {estadosPermitidos.includes(
                          "EN_PREPARACION"
                        ) && (
                          <button
                            type="button"
                            disabled={cambioEstado.isPending}
                            onClick={() =>
                              solicitarCambio(
                                pedido,
                                "EN_PREPARACION"
                              )
                            }
                            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold hover:bg-blue-600 disabled:opacity-50"
                          >
                            {actualizando
                              ? "Actualizando..."
                              : "Iniciar preparación"}
                          </button>
                        )}

                        {estadosPermitidos.includes(
                          "ENTREGADO"
                        ) && (
                          <button
                            type="button"
                            disabled={cambioEstado.isPending}
                            onClick={() =>
                              solicitarCambio(
                                pedido,
                                "ENTREGADO"
                              )
                            }
                            className="rounded-lg bg-green-700 px-5 py-3 font-semibold hover:bg-green-600 disabled:opacity-50"
                          >
                            {actualizando
                              ? "Actualizando..."
                              : "Marcar como entregado"}
                          </button>
                        )}

                        {estadosPermitidos.includes(
                          "CANCELADO"
                        ) && (
                          <button
                            type="button"
                            disabled={cambioEstado.isPending}
                            onClick={() =>
                              solicitarCambio(
                                pedido,
                                "CANCELADO"
                              )
                            }
                            className="rounded-lg border border-red-700 px-5 py-3 font-semibold text-red-400 hover:bg-red-950 disabled:opacity-50"
                          >
                            Cancelar pedido
                          </button>
                        )}

                      </div>
                    )}

                    {/* PEDIDOS FINALIZADOS */}

                    {estadosPermitidos.length === 0 && (
                      <p className="mt-6 border-t border-slate-800 pt-5 text-sm text-slate-400">
                        Este pedido está finalizado y no admite cambios de estado.
                      </p>
                    )}

                  </div>
                </article>
              );
            })}
          </div>

          {/* PAGINACIÓN */}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              Página {pagina} de {totalPaginas}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setPagina((actual) =>
                    Math.max(1, actual - 1)
                  )
                }
                disabled={pagina === 1}
                className="rounded-lg bg-slate-800 px-5 py-2 disabled:opacity-40"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() =>
                  setPagina((actual) => actual + 1)
                }
                disabled={pagina >= totalPaginas}
                className="rounded-lg bg-slate-800 px-5 py-2 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
