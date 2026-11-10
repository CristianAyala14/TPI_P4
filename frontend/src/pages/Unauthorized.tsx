
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

        <p className="text-6xl font-bold text-orange-500">
          403
        </p>

        <h1 className="mt-5 text-2xl font-bold">
          Acceso no autorizado
        </h1>

        <p className="mt-4 text-slate-400">
          Tu cuenta no tiene permisos para acceder
          a esta sección de Food Store.
        </p>

        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600"
        >
          Volver al catálogo
        </Link>

      </section>
    </main>
  );
}
