
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { obtenerResumen } from "../services/admin";


// FORMATEAR PRECIOS

function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}


// DASHBOARD ADMINISTRATIVO

export default function DashboardAdmin() {

  // CONSULTAR RESUMEN DESDE FASTAPI
  const {
    data,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["resumenPedidos"],
    queryFn: obtenerResumen,
  });


  // CARGANDO

  if (isPending) {
    return (
      <main className="p-10 text-center text-slate-400">
        Cargando panel de administración...
      </main>
    );
  }


  // ERROR DE CONSULTA

  if (isError) {
    return (
      <main className="mx-auto max-w-6xl p-10">
        <p className="rounded-lg bg-red-950 p-4 text-red-300">
          No se pudo cargar el resumen del negocio.
        </p>

        <button
          onClick={() => void refetch()}
          className="mt-4 rounded-lg bg-orange-500 px-5 py-2 font-semibold hover:bg-orange-600"
        >
          Reintentar
        </button>
      </main>
    );
  }


  // INDICADORES
 

  const indicadores = [
    {
      titulo: "Pedidos pendientes",
      valor: data.pendientes,
      descripcion: "Esperando preparación",
      color: "text-yellow-400",
    },
    {
      titulo: "En preparación",
      valor: data.en_preparacion,
      descripcion: "Pedidos en proceso",
      color: "text-blue-400",
    },
    {
      titulo: "Entregados",
      valor: data.entregados,
      descripcion: "Pedidos finalizados",
      color: "text-green-400",
    },
    {
      titulo: "Cancelados",
      valor: data.cancelados,
      descripcion: "Pedidos cancelados",
      color: "text-red-400",
    },
  ];



  // VISTA PRINCIPAL
  

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* 
          ENCABEZADO
       */}

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-400">
            Administración
          </p>

          <h1 className="text-3xl font-bold">
            Panel de control
          </h1>

          <p className="mt-2 text-slate-400">
            Estado general de Food Store
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          {isFetching
            ? "Actualizando..."
            : "Actualizar datos"}
        </button>

      </div>


      {/* 
          INDICADORES DE PEDIDOS
      */}

      <h2 className="mb-5 text-xl font-semibold">
        Estado de los pedidos
      </h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {indicadores.map((indicador) => (
          <article
            key={indicador.titulo}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >

            <h3 className="text-sm text-slate-400">
              {indicador.titulo}
            </h3>

            <p
              className={`mt-4 text-4xl font-bold ${indicador.color}`}
            >
              {indicador.valor}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              {indicador.descripcion}
            </p>

          </article>
        ))}

      </div>


      {/* 
          RESUMEN GENERAL DEL NEGOCIO
      */}

      <h2 className="mb-5 mt-10 text-xl font-semibold">
        Resumen del negocio
      </h2>

      <div className="grid gap-5 md:grid-cols-2">

        {/* PEDIDOS DEL DÍA */}

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-sm text-slate-400">
            Pedidos realizados hoy
          </h3>

          <p className="mt-4 text-4xl font-bold">
            {data.pedidos_hoy}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Cantidad de pedidos registrados durante el día
          </p>

        </article>


        {/* INGRESOS */}

        <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-sm text-slate-400">
            Ingresos por pedidos entregados
          </h3>

          <p className="mt-4 text-3xl font-bold text-green-400">
            {formatearPrecio(data.ingresos_entregados)}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Total acumulado de pedidos entregados
          </p>

        </article>

      </div>


      {/* 
          ACCESOS RÁPIDOS
    */}

      <h2 className="mb-5 mt-10 text-xl font-semibold">
        Administración
      </h2>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

        {/* CATÁLOGO */}

        <Link
          to="/"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-orange-500"
        >
          <h3 className="text-lg font-bold">
            Catálogo
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Consultar los productos disponibles.
          </p>
        </Link>


        {/* GESTIÓN DE PEDIDOS */}

        <Link
          to="/admin/pedidos"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-orange-500"
        >
          <h3 className="text-lg font-bold">
            Gestión de pedidos
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Consultar pedidos de todos los clientes,
            actualizar estados y cancelar compras.
          </p>
        </Link>


        {/* GESTIÓN DE PRODUCTOS */}

        <Link
          to="/admin/productos"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-orange-500"
        >
          <h3 className="text-lg font-bold">
            Gestión de productos
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Crear, editar, actualizar stock y dar de baja productos.
          </p>
        </Link>


        {/* GESTIÓN DE CATEGORÍAS */}

        <Link
          to="/admin/categorias"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-orange-500"
        >
          <h3 className="text-lg font-bold">
            Gestión de categorías
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Crear, editar y dar de baja categorías.
          </p>
        </Link>

        {/* GESTIÓN DE USUARIOS */}

        <Link
          to="/admin/usuarios"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-orange-500"
        >
          <h3 className="text-lg font-bold">
            Gestión de usuarios
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Consultar usuarios registrados, activar y desactivar cuentas.
          </p>
        </Link>

      </div>
        
        


    </main>
  );
}
