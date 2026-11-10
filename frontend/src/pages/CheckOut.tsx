
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import { crearPedido } from "../services/pedidos";
import { obtenerUsuarioActual } from "../services/auth";
import { useCarritoStore } from "../store/carrito";

import type {
  FormaPago,
  PedidoCreado,
} from "../types/pedido";


// FUNCIONES AUXILIARES

function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function validarDireccion(valor: string): string | undefined {
  const direccion = valor.trim();

  if (!direccion) {
    return "La dirección de entrega es obligatoria.";
  }

  if (direccion.length < 5) {
    return "La dirección debe tener al menos 5 caracteres.";
  }

  if (direccion.length > 200) {
    return "La dirección no puede superar los 200 caracteres.";
  }

  return undefined;
}

function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Tu sesión expiró. Iniciá sesión nuevamente.";
    }

    if (error.response?.status === 422) {
      return "Revisá los datos ingresados.";
    }

    const detalle = error.response?.data?.detail;

    if (typeof detalle === "string") {
      return detalle;
    }
  }

  return "No se pudo realizar el pedido.";
}


// COMPONENTE CHECKOUT

export default function Checkout() {
  const queryClient = useQueryClient();

  // CARRITO DE ZUSTAND

  const items = useCarritoStore(
    (state) => state.items
  );

  const vaciarCarrito = useCarritoStore(
    (state) => state.vaciarCarrito
  );

  // USUARIO AUTENTICADO

  const {
    data: usuario,
    isPending: cargandoSesion,
    isError: errorSesion,
  } = useQuery({
    queryKey: ["usuarioActual"],
    queryFn: obtenerUsuarioActual,
    retry: false,
  });

  // PEDIDO CONFIRMADO

  const [pedidoCreado, setPedidoCreado] =
    useState<PedidoCreado | null>(null);

  // TOTAL ESTIMADO

  const totalEstimado = items.reduce(
    (total, item) =>
      total +
      item.producto.precio_base * item.cantidad,
    0
  );

  // TANSTACK QUERY - CREAR PEDIDO

  const crearPedidoMutation = useMutation({
    mutationFn: crearPedido,

    onSuccess: (pedido) => {
      // Guardar el pedido confirmado
      setPedidoCreado(pedido);

      // Vaciar carrito solamente si la compra fue exitosa
      vaciarCarrito();

      // Actualizar datos del servidor
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["productos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["pedidos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["pedidos-admin"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["resumenPedidos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-productos"],
        }),
      ]);
    },
  });

  // TANSTACK FORM

  const form = useForm({
    defaultValues: {
      direccion_entrega: "",
      forma_pago: "EFECTIVO" as FormaPago,
      notas: "",
    },

    onSubmit: async ({ value }) => {
      // Verificar que haya un usuario y productos
      if (!usuario || items.length === 0) {
        return;
      }

      try {
        // Enviamos IDs y cantidades.
        // FastAPI calcula precios y total.
        await crearPedidoMutation.mutateAsync({
          items: items.map((item) => ({
            producto_id: item.producto.id,
            cantidad: item.cantidad,
          })),

          direccion_entrega:
            value.direccion_entrega.trim(),

          forma_pago: value.forma_pago,

          notas: value.notas.trim() || null,
        });
      } catch {
        // El error se muestra mediante TanStack Query.
        // No vaciamos el carrito si el pedido falla.
      }
    },
  });


  // PANTALLA: PEDIDO CONFIRMADO

  if (pedidoCreado) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-green-800 bg-slate-900 p-8 text-center">

          <h1 className="text-3xl font-bold text-green-400">
            ¡Pedido confirmado!
          </h1>

          <p className="mt-4 text-slate-300">
            Tu compra se registró correctamente.
          </p>

          <p className="mt-6 text-lg">
            Número de pedido:
            <strong> #{pedidoCreado.id}</strong>
          </p>

          <p className="mt-2 text-slate-300">
            Estado: {pedidoCreado.estado}
          </p>

          <p className="mt-5 text-3xl font-bold text-orange-400">
            {formatearPrecio(pedidoCreado.total)}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">

            <Link
              to="/mis-pedidos"
              className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600"
            >
              Ver mis pedidos
            </Link>

            <Link
              to="/"
              className="rounded-lg border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800"
            >
              Volver al catálogo
            </Link>

          </div>

        </div>
      </main>
    );
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


  // USUARIO NO AUTENTICADO

  if (!usuario) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">

        <h1 className="text-2xl font-bold">
          Necesitás iniciar sesión
        </h1>

        <p className="mt-4 text-slate-400">
          Para confirmar tu compra, ingresá a tu cuenta.
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


  
  // CARRITO VACÍO
  
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">

        <h1 className="text-2xl font-bold">
          Tu carrito está vacío
        </h1>

        <p className="mt-4 text-slate-400">
          Agregá productos antes de confirmar tu compra.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold"
        >
          Volver al catálogo
        </Link>

      </main>
    );
  }


  // 
  // PANTALLA PRINCIPAL
  // 

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">

      <h1 className="mb-8 text-3xl font-bold">
        Finalizar compra
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* 
            FORMULARIO DE CHECKOUT
         */}

        <section className="lg:col-span-2">

          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              evento.stopPropagation();

              void form.handleSubmit();
            }}
            className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >

            <h2 className="text-xl font-bold">
              Datos de entrega
            </h2>


            {/* 
                DIRECCIÓN DE ENTREGA
             */}

            <form.Field
              name="direccion_entrega"
              validators={{
                onBlur: ({ value }) =>
                  validarDireccion(value),
                onSubmit: ({ value }) =>
                  validarDireccion(value),
              }}
            >
              {(field) => (
                <div>

                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    Dirección de entrega
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type="text"
                    placeholder="Ej: Av. San Martín 1234"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(evento) =>
                      field.handleChange(
                        evento.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-orange-500"
                  />

                  {field.state.meta.isTouched &&
                    !field.state.meta.isValid && (
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


            {/* 
                FORMA DE PAGO
             */}

            <form.Field name="forma_pago">
              {(field) => (
                <div>

                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    Forma de pago
                  </label>

                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(evento) =>
                      field.handleChange(
                        evento.target.value as FormaPago
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3"
                  >
                    <option value="EFECTIVO">
                      Efectivo
                    </option>

                    <option value="TRANSFERENCIA">
                      Transferencia
                    </option>
                  </select>

                </div>
              )}
            </form.Field>


            {/* 
                NOTAS ADICIONALES
           */}

            <form.Field name="notas">
              {(field) => (
                <div>

                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    Notas adicionales (opcional)
                  </label>

                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={3}
                    placeholder="Indicaciones para la entrega"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(evento) =>
                      field.handleChange(
                        evento.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-orange-500"
                  />

                </div>
              )}
            </form.Field>


            {/* 
                ERROR DEL BACKEND
          */}

            {crearPedidoMutation.isError && (
              <p
                role="alert"
                className="rounded-lg bg-red-950 p-4 text-sm text-red-300"
              >
                {obtenerMensajeError(
                  crearPedidoMutation.error
                )}
              </p>
            )}


            {/* 
                CONFIRMAR COMPRA
            */}

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
                    crearPedidoMutation.isPending
                  }
                  className="w-full rounded-lg bg-orange-500 py-3 font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ||
                  crearPedidoMutation.isPending
                    ? "Procesando pedido..."
                    : "Confirmar pedido"}
                </button>
              )}
            </form.Subscribe>

          </form>

        </section>


        {/* 
            RESUMEN DE COMPRA
   */}

        <aside>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="mb-6 text-xl font-bold">
              Resumen de compra
            </h2>

            <div className="space-y-4">

              {items.map((item) => (
                <div
                  key={item.producto.id}
                  className="flex justify-between gap-4 border-b border-slate-800 pb-3"
                >

                  <div>

                    <p className="font-semibold">
                      {item.producto.nombre}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Cantidad: {item.cantidad}
                    </p>

                  </div>

                  <p className="font-semibold">
                    {formatearPrecio(
                      item.producto.precio_base *
                        item.cantidad
                    )}
                  </p>

                </div>
              ))}

            </div>


            {/* TOTAL */}

            <div className="mt-6 flex justify-between text-xl font-bold">

              <span>Total estimado:</span>

              <span className="text-orange-400">
                {formatearPrecio(totalEstimado)}
              </span>

            </div>


            <p className="mt-3 text-xs text-slate-400">
              El precio final y el stock se validan
              nuevamente en FastAPI al confirmar.
            </p>


            {/* VOLVER */}

            <Link
              to="/"
              className="mt-6 block text-center text-sm font-semibold text-orange-400 hover:underline"
            >
              Volver al carrito
            </Link>

          </div>

        </aside>

      </div>
    </main>
  );
}
