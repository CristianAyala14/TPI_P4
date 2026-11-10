
import { Link } from "react-router-dom";
import { useCarritoStore } from "../store/carrito";

function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function Carrito() {
  const items = useCarritoStore(
    (state) => state.items
  );

  const agregarProducto = useCarritoStore(
    (state) => state.agregarProducto
  );

  const quitarUnidad = useCarritoStore(
    (state) => state.quitarUnidad
  );

  const eliminarProducto = useCarritoStore(
    (state) => state.eliminarProducto
  );

  const vaciarCarrito = useCarritoStore(
    (state) => state.vaciarCarrito
  );

  const cantidadTotal = items.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const totalEstimado = items.reduce(
    (total, item) =>
      total + item.producto.precio_base * item.cantidad,
    0
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Mi carrito
        </h1>

        <p className="mt-2 text-slate-400">
          Revisá los productos antes de confirmar tu compra.
        </p>
      </div>

      {items.length === 0 ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">

          <h2 className="text-xl font-semibold">
            Tu carrito está vacío
          </h2>

          <p className="mt-3 text-slate-400">
            Todavía no agregaste productos.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600"
          >
            Explorar catálogo
          </Link>

        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">

          {/* LISTADO DE PRODUCTOS */}

          <section className="space-y-4 lg:col-span-2">

            {items.map((item) => {
              const producto = item.producto;

              const puedeAgregar =
                producto.activo &&
                producto.disponible &&
                item.cantidad < producto.stock;

              return (
                <article
                  key={producto.id}
                  className="flex flex-col gap-5 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:flex-row"
                >

                  {/* IMAGEN */}

                  <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-slate-800 sm:w-32">
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* INFORMACIÓN */}

                  <div className="flex-1">

                    <h2 className="text-lg font-bold">
                      {producto.nombre}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Precio unitario:{" "}
                      {formatearPrecio(producto.precio_base)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          quitarUnidad(producto.id)
                        }
                        className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600"
                        aria-label={`Quitar una unidad de ${producto.nombre}`}
                      >
                        −
                      </button>

                      <span className="font-semibold">
                        {item.cantidad}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          agregarProducto(producto)
                        }
                        disabled={!puedeAgregar}
                        className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600 disabled:opacity-40"
                        aria-label={`Agregar una unidad de ${producto.nombre}`}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarProducto(producto.id)
                        }
                        className="text-sm font-medium text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </button>

                    </div>

                    <p className="mt-5 font-bold text-orange-400">
                      Subtotal:{" "}
                      {formatearPrecio(
                        producto.precio_base * item.cantidad
                      )}
                    </p>

                  </div>

                </article>
              );
            })}

          </section>

          {/* RESUMEN */}

          <aside>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

              <h2 className="text-xl font-bold">
                Resumen de compra
              </h2>

              <p className="mt-5 text-sm text-slate-400">
                Productos: {cantidadTotal}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-5">

                <span className="font-semibold">
                  Total estimado
                </span>

                <span className="text-xl font-bold text-orange-400">
                  {formatearPrecio(totalEstimado)}
                </span>

              </div>

              <Link
                to="/checkout"
                className="mt-6 block rounded-lg bg-orange-500 px-5 py-3 text-center font-semibold hover:bg-orange-600"
              >
                Finalizar compra
              </Link>

              <Link
                to="/"
                className="mt-4 block text-center text-sm text-slate-400 hover:text-white"
              >
                Seguir comprando
              </Link>

              <button
                type="button"
                onClick={vaciarCarrito}
                className="mt-5 w-full rounded-lg border border-red-900 px-4 py-3 text-sm text-red-400 hover:bg-red-950"
              >
                Vaciar carrito
              </button>

            </div>
          </aside>

        </div>
      )}

    </main>
  );
}
