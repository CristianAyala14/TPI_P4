
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  obtenerProductos,
  obtenerCategorias,
} from "../services/productos";

import { useCarritoStore } from "../store/carrito";

const LIMITE = 8;

// FORMATEAR PRECIOS
function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default function Catalogo() {
  // 
  // ESTADO DE BÚSQUEDA Y FILTROS
  // 

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] =
    useState<number | null>(null);
  const [pagina, setPagina] = useState(1);

  // 
  // CONSULTAR CATEGORÍAS
  // 

  const {
    data: categorias = [],
    isError: errorCategorias,
  } = useQuery({
    queryKey: ["categorias"],
    queryFn: obtenerCategorias,
  });

  // 
  // CONSULTAR PRODUCTOS
  // 

  const {
    data,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "productos",
      pagina,
      busqueda,
      categoriaId,
    ],
    queryFn: () =>
      obtenerProductos({
        pagina,
        limite: LIMITE,
        search: busqueda,
        categoriaId,
      }),
  });

  // 
  // CARRITO CON ZUSTAND
  // 

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

  // 
  // CÁLCULOS DEL CARRITO
  // 

  const cantidadTotal = items.reduce(
    (acumulado, item) =>
      acumulado + item.cantidad,
    0
  );

  const totalEstimado = items.reduce(
    (acumulado, item) =>
      acumulado +
      item.producto.precio_base * item.cantidad,
    0
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / LIMITE)
  );

  // 
  // ACCIONES DE BÚSQUEDA
  // 

  function buscarProductos() {
    setBusqueda(textoBusqueda.trim());
    setPagina(1);
  }

  function limpiarFiltros() {
    setTextoBusqueda("");
    setBusqueda("");
    setCategoriaId(null);
    setPagina(1);
  }

  // 
  // VISTA PRINCIPAL
  // 

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ENCABEZADO */}

      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          Nuestro catálogo
        </h1>

        <p className="mt-2 text-slate-400">
          Elegí tus productos favoritos y armá tu pedido.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* 
            SECCIÓN DE PRODUCTOS
         */}

        <section className="lg:col-span-2">

          {/* FILTROS */}

          <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="mb-4 text-lg font-bold">
              Buscar productos
            </h2>

            <form
              onSubmit={(evento) => {
                evento.preventDefault();
                buscarProductos();
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="search"
                value={textoBusqueda}
                onChange={(evento) =>
                  setTextoBusqueda(evento.target.value)
                }
                placeholder="Ej: Pizza, hamburguesa..."
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-orange-500"
              />

              <button
                type="submit"
                className="rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600"
              >
                Buscar
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-end gap-3">

              {/* FILTRO POR CATEGORÍA */}

              <label className="flex-1 text-sm">
                Categoría

                <select
                  value={categoriaId ?? ""}
                  onChange={(evento) => {
                    const valor = evento.target.value;

                    setCategoriaId(
                      valor === ""
                        ? null
                        : Number(valor)
                    );

                    setPagina(1);
                  }}
                  className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                >
                  <option value="">
                    Todas las categorías
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
              </label>

              {/* LIMPIAR */}

              <button
                type="button"
                onClick={limpiarFiltros}
                className="rounded-lg border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800"
              >
                Limpiar filtros
              </button>

            </div>

            {errorCategorias && (
              <p className="mt-3 text-sm text-red-400">
                No se pudieron cargar las categorías.
              </p>
            )}
          </div>

          {/* ENCABEZADO DE RESULTADOS */}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              Productos disponibles
            </h2>

            {data && (
              <span className="text-sm text-slate-400">
                {data.total} productos encontrados
              </span>
            )}
          </div>

          {/* 
              SKELETON DE CARGA
           */}

          {isPending && (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, indice) => (
                <div
                  key={indice}
                  className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="mb-4 h-5 w-24 rounded bg-slate-700" />
                  <div className="mb-4 h-7 w-3/4 rounded bg-slate-700" />
                  <div className="mb-3 h-4 rounded bg-slate-800" />
                  <div className="mb-6 h-4 w-2/3 rounded bg-slate-800" />
                  <div className="mb-5 h-8 w-1/2 rounded bg-slate-700" />
                  <div className="h-11 rounded bg-slate-700" />
                </div>
              ))}
            </div>
          )}

          {/* ERROR */}

          {isError && (
            <div className="rounded-xl border border-red-900 bg-red-950 p-6">
              <p className="text-red-300">
                No se pudieron cargar los productos.
                Verificá que FastAPI esté funcionando.
              </p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 rounded-lg bg-red-800 px-5 py-2 font-semibold hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* SIN RESULTADOS */}

          {data && data.items.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">

              <h3 className="text-xl font-bold">
                No encontramos productos
              </h3>

              <p className="mt-3 text-slate-400">
                Probá con otra búsqueda o categoría.
              </p>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-6 rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600"
              >
                Ver todo el catálogo
              </button>
            </div>
          )}

          {/* 
              GRILLA DE PRODUCTOS
           */}

          {data && data.items.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">

                {data.items.map((producto) => {

                  const enCarrito = items.find(
                    (item) =>
                      item.producto.id === producto.id
                  );

                  const cantidadEnCarrito =
                    enCarrito?.cantidad ?? 0;

                  const sinStock =
                    !producto.activo ||
                    !producto.disponible ||
                    producto.stock <= 0;

                  const maximoAlcanzado =
                    cantidadEnCarrito >= producto.stock;

                  const deshabilitado =
                    sinStock || maximoAlcanzado;

                  return (
                    <article
                      key={producto.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                    >

                      {/* IMAGEN */}

                      <div className="flex h-40 items-center justify-center bg-slate-800">

                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-slate-500">
                            Sin imagen
                          </span>
                        )}

                      </div>

                      {/* INFORMACIÓN */}

                      <div className="flex flex-1 flex-col p-5">

                        <span className="text-sm font-medium text-orange-400">
                          {producto.categoria.nombre}
                        </span>

                        <h3 className="mt-2 text-xl font-bold">
                          {producto.nombre}
                        </h3>

                        <p className="mt-3 flex-1 text-sm text-slate-400">
                          {producto.descripcion ||
                            "Sin descripción disponible"}
                        </p>

                        <p className="mt-5 text-2xl font-bold">
                          {formatearPrecio(
                            producto.precio_base
                          )}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          Stock disponible: {producto.stock}
                        </p>

                        {/* AGREGAR AL CARRITO */}

                        <button
                          type="button"
                          onClick={() =>
                            agregarProducto(producto)
                          }
                          disabled={deshabilitado}
                          className="mt-5 w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {sinStock
                            ? "Sin stock"
                            : maximoAlcanzado
                              ? "Máximo disponible"
                              : "Agregar al carrito"}
                        </button>

                      </div>
                    </article>
                  );
                })}

              </div>

              {/* 
                  PAGINACIÓN
               */}

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
                    className="rounded-lg border border-slate-700 px-5 py-3 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPagina((actual) => actual + 1)
                    }
                    disabled={pagina >= totalPaginas}
                    className="rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>

                </div>
              </div>
            </>
          )}

        </section>

        {/* 
            CARRITO DE COMPRAS
         */}

        <aside>
          <div className="sticky top-6 rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                Mi carrito
              </h2>

              <span className="rounded-lg bg-orange-500 px-3 py-1 text-sm font-bold">
                {cantidadTotal}
              </span>

            </div>

            {/* CARRITO VACÍO */}

            {items.length === 0 ? (
              <p className="text-slate-400">
                Tu carrito está vacío.
                Agregá productos para comenzar.
              </p>
            ) : (
              <>

                {/* PRODUCTOS DEL CARRITO */}

                <div className="space-y-5">

                  {items.map((item) => {

                    // Usar datos actuales si el producto
                    // aparece en la página consultada.
                    const productoActual =
                      data?.items.find(
                        (producto) =>
                          producto.id === item.producto.id
                      ) ?? item.producto;

                    const puedeAgregar =
                      productoActual.activo &&
                      productoActual.disponible &&
                      item.cantidad < productoActual.stock;

                    return (
                      <div
                        key={item.producto.id}
                        className="border-b border-slate-700 pb-4"
                      >

                        <h3 className="font-semibold">
                          {item.producto.nombre}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {formatearPrecio(
                            item.producto.precio_base
                          )} por unidad
                        </p>

                        {/* CANTIDADES */}

                        <div className="mt-4 flex items-center gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              quitarUnidad(item.producto.id)
                            }
                            className="rounded-lg bg-slate-700 px-3 py-1 hover:bg-slate-600"
                          >
                            -
                          </button>

                          <span className="font-semibold">
                            {item.cantidad}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              agregarProducto(productoActual)
                            }
                            disabled={!puedeAgregar}
                            className="rounded-lg bg-slate-700 px-3 py-1 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarProducto(item.producto.id)
                            }
                            className="ml-auto text-sm text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>

                        </div>

                        {/* SUBTOTAL */}

                        <p className="mt-4 text-right font-semibold">
                          {formatearPrecio(
                            item.producto.precio_base *
                              item.cantidad
                          )}
                        </p>

                      </div>
                    );
                  })}

                </div>

                {/* TOTAL */}

                <div className="mt-6 flex justify-between text-xl font-bold">

                  <span>Total estimado:</span>

                  <span className="text-orange-400">
                    {formatearPrecio(totalEstimado)}
                  </span>

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  El total definitivo se calculará al confirmar la compra.
                </p>

                {/* CHECKOUT */}

                <Link
                  to="/checkout"
                  className="mt-6 block w-full rounded-lg bg-orange-500 px-4 py-3 text-center font-semibold hover:bg-orange-600"
                >
                  Finalizar compra
                </Link>

                {/* VACIAR */}

                <button
                  type="button"
                  onClick={vaciarCarrito}
                  className="mt-3 w-full rounded-lg border border-slate-700 px-4 py-3 text-slate-300 transition hover:bg-slate-800"
                >
                  Vaciar carrito
                </button>

              </>
            )}

          </div>
        </aside>

      </div>
    </main>
  );
}
