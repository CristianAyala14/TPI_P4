
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { ColumnDef } from "@tanstack/react-table";

// PROPIEDADES DE LA TABLA


interface TablaAdminProps<TDato> {
  datos: TDato[];
  columnas: ColumnDef<TDato>[];
  tamanoPagina?: number;
}


// TABLA REUTILIZABLE - TANSTACK V8


export default function TablaAdmin<TDato>({
  datos,
  columnas,
  tamanoPagina = 10,
}: TablaAdminProps<TDato>) {

  // CONFIGURACIÓN DE TANSTACK TABLE V8
  const tabla = useReactTable({
    data: datos,
    columns: columnas,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: tamanoPagina,
      },
    },
  });

  const filas = tabla.getRowModel().rows;

  const paginaActual =
    tabla.getState().pagination.pageIndex + 1;

  const totalPaginas = Math.max(
    1,
    tabla.getPageCount()
  );

  return (
    <div className="space-y-5">

      {/* TABLA */}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">

        <table className="w-full text-left text-sm">

          {/* ENCABEZADOS */}

          <thead className="bg-slate-800 text-slate-300">

            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>

                {grupo.headers.map((encabezado) => (
                  <th
                    key={encabezado.id}
                    colSpan={encabezado.colSpan}
                    className="whitespace-nowrap px-5 py-4 font-semibold"
                  >
                    {encabezado.isPlaceholder
                      ? null
                      : flexRender(
                          encabezado.column.columnDef.header,
                          encabezado.getContext()
                        )}
                  </th>
                ))}

              </tr>
            ))}

          </thead>

          {/* FILAS */}

          <tbody>

            {filas.map((fila) => (
              <tr
                key={fila.id}
                className="border-t border-slate-800 transition hover:bg-slate-800/50"
              >

                {fila.getVisibleCells().map((celda) => (
                  <td
                    key={celda.id}
                    className="px-5 py-4"
                  >
                    {flexRender(
                      celda.column.columnDef.cell,
                      celda.getContext()
                    )}
                  </td>
                ))}

              </tr>
            ))}

            {/* ESTADO VACÍO */}

            {filas.length === 0 && (
              <tr>
                <td
                  colSpan={columnas.length}
                  className="px-5 py-12 text-center text-slate-400"
                >
                  No hay registros para mostrar.
                </td>
              </tr>
            )}

          </tbody>

        </table>
      </div>

      {/* PAGINACIÓN */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <p className="text-sm text-slate-400">
          Mostrando {filas.length} de{" "}
          {tabla.getPrePaginationRowModel().rows.length} registros
        </p>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => tabla.previousPage()}
            disabled={!tabla.getCanPreviousPage()}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-sm text-slate-300">
            {paginaActual} / {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() => tabla.nextPage()}
            disabled={!tabla.getCanNextPage()}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>

        </div>
      </div>

    </div>
  );
}
