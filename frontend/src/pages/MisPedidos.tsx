
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import { obtenerUsuarioActual } from "../services/auth";
import {
  obtenerPedidos,
  cancelarPedido,
} from "../services/pedidos";

import type { EstadoPedido } from "../types/pedido";


// FORMATEAR IMPORTES
function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}


// FORMATEAR FECHAS
function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


// MOSTRAR ESTADOS EN ESPAÑOL
function nombreEstado(estado: EstadoPedido): string {
  const nombres: Record<EstadoPedido, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };

  return nombres[estado];
}


// COLORES SEGÚN EL ESTADO
function colorEstado(estado: EstadoPedido): string {
  const colores: Record<EstadoPedido, string> = {
    PENDIENTE: "bg-yellow-900 text-yellow-300",
    EN_PREPARACION: "bg-blue-900 text-blue-300",
    ENTREGADO: "bg-green-900 text-green-300",
    CANCELADO: "bg-red-900 text-red-300",
  };

  return colores[estado];
}


export default function MisPedidos() {
  const queryClient = useQueryClient();

  const [pagina, setPagina] = useState(1);
  const limite = 10;

  // USUARIO ACTUAL

  const {
    data: usuario,
    isPending: cargandoSesion,
    isError: errorSesion,
  } = useQuery({
    queryKey: ["usuarioActual"],
    queryFn: obtenerUsuarioActual,
    retry: false,
  });


  // CONSULTAR PEDIDOS

  const {
    data,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["pedidos", usuario?.id, pagina],
    queryFn: () =>
      obtenerPedidos((pagina - 1) * limite, limite),
    enabled: !!usuario,
  });


  // CANCELAR PEDIDO

  const cancelacion = useMutation({
    mutationFn: cancelarPedido,

    onSuccess: async () => {
      // Actualizar lista de pedidos
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pedidos"],
        }),

        // Actualizar stock del catálogo
        queryClient.invalidateQueries({
          queryKey: ["productos"],
        }),
      ]);
    },
  });


  // CONFIRMAR CANCELACIÓN
  function solicitarCancelacion(pedidoId: number) {
    const confirmar = window.confirm(
      `¿Querés cancelar el pedido #${pedidoId}?`
    );

    if (confirmar) {
      cancelacion.mutate(pedidoId);
    }
  }


  // MENSAJE DE ERROR
  function mensajeError(): string {
    if (axios.isAxiosError(cancelacion.error)) {
      const detalle = cancelacion.error.response?.data?.detail;

      if (typeof detalle === "string") {
        return detalle;
      }
    }

    return "No se pudo cancelar el pedido.";
  }


  // VERIFICAR SESIÓN

  if (cargandoSesion) {
    return (
      <p className="p-10 text-center text-slate-400">
        Verificando sesión...
      </p>
    );
  }

  if (errorSesion) {
    return (
      <p className="p-10 text-center text-red-400">
        No se pudo verificar tu sesión.
      </p>
    );
  }

  if (!usuario) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">
          Necesitás iniciar sesión
        </h1>

        <p className="mt-4 text-slate-400">
          Ingresá a tu cuenta para consultar tus pedidos.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold"
        >
          Iniciar sesión
        </Link>
      </main>
    );
  }


  // PANTALLA PRINCIPAL

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Mis pedidos
          </h1>

          <p className="mt-2 text-slate-400">
            Consultá el historial de tus compras.
          </p>
        </div>

        <Link
          to="/"
          className="rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600"
        >
          Volver al catálogo
        </Link>
      </div>


      {/* CARGANDO PEDIDOS */}

      {isPending && (
        <p className="text-slate-400">
          Cargando pedidos...
        </p>
      )}


      {/* ERROR DE CONSULTA */}

      {isError && (
        <p className="rounded-lg bg-red-950 p-4 text-red-300">
          No se pudieron cargar los pedidos.
        </p>
      )}


      {/* SIN PEDIDOS */}

      {data && data.total === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h2 className="text-xl font-semibold">
            Todavía no tenés pedidos
          </h2>

          <p className="mt-3 text-slate-400">
            Cuando realices una compra, aparecerá aquí.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block text-orange-400 hover:underline"
          >
            Explorar productos
          </Link>
        </div>
      )}


      {/* LISTADO DE PEDIDOS */}

      {data && data.total > 0 && (
        <>
          <p className="mb-6 text-sm text-slate-400">
            {data.total} pedidos encontrados
          </p>

          <div className="space-y-6">

            {data.items.map((pedido) => {

              const puedeCancelar =
                pedido.estado === "PENDIENTE" &&
                pedido.usuario_id === usuario.id;

              const cancelando =
                cancelacion.isPending &&
                cancelacion.variables === pedido.id;

              return (
                <article
                  key={pedido.id}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                >

                  {/* ENCABEZADO DEL PEDIDO */}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-6">

                    <div>
                      <h2 className="text-xl font-bold">
                        Pedido #{pedido.id}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatearFecha(pedido.created_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${colorEstado(pedido.estado)}`}
                    >
                      {nombreEstado(pedido.estado)}
                    </span>

                  </div>


                  {/* INFORMACIÓN DEL PEDIDO */}

                  <div className="p-6">

                    <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">

                      <div>
                        <p className="text-slate-400">
                          Forma de pago
                        </p>

                        <p className="mt-1 font-semibold">
                          {pedido.forma_pago}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">
                          Dirección de entrega
                        </p>

                        <p className="mt-1 font-semibold">
                          {pedido.direccion_entrega}
                        </p>
                      </div>

                    </div>


                    {/* DETALLES */}

                    <h3 className="mb-4 font-bold">
                      Productos comprados
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
                              {detalle.cantidad} x{" "}
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


                    {/* ERROR DE CANCELACIÓN */}

                    {cancelacion.isError &&
                      cancelacion.variables === pedido.id && (
                        <p
                          role="alert"
                          className="mt-4 rounded-lg bg-red-950 p-3 text-sm text-red-300"
                        >
                          {mensajeError()}
                        </p>
                      )}


                    {/* BOTÓN CANCELAR */}

                    {puedeCancelar && (
                      <button
                        onClick={() =>
                          solicitarCancelacion(pedido.id)
                        }
                        disabled={cancelacion.isPending}
                        className="mt-6 rounded-lg border border-red-700 px-5 py-3 font-semibold text-red-400 hover:bg-red-950 disabled:opacity-50"
                      >
                        {cancelando
                          ? "Cancelando..."
                          : "Cancelar pedido"}
                      </button>
                    )}

                  </div>

                </article>
              );
            })}

          </div>


          {/* PAGINACIÓN */}

          <div className="mt-8 flex items-center justify-center gap-4">

            <button
              onClick={() =>
                setPagina((actual) => Math.max(1, actual - 1))
              }
              disabled={pagina === 1}
              className="rounded-lg bg-slate-800 px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>

            <span className="text-slate-300">
              Página {pagina} de{" "}
              {Math.ceil(data.total / limite)}
            </span>

            <button
              onClick={() =>
                setPagina((actual) => actual + 1)
              }
              disabled={pagina * limite >= data.total}
              className="rounded-lg bg-slate-800 px-4 py-2 disabled:opacity-40"
            >
              Siguiente
            </button>

          </div>
        </>
      )}
    </main>
  );
}
