
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: ReactNode;
}

export default function RutaAdmin({ children }: Props) {
  const usuario = useAuthStore(
    (state) => state.usuario
  );

  const verificado = useAuthStore(
    (state) => state.verificado
  );

  const comprobando = useAuthStore(
    (state) => state.comprobando
  );

  // ESPERAR VERIFICACIÓN DE SESIÓN
  if (!verificado || comprobando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-orange-500" />

          <p className="text-slate-400">
            Verificando permisos...
          </p>
        </div>
      </main>
    );
  }

  // SIN AUTENTICACIÓN
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // AUTENTICADO, PERO SIN ROL ADMIN
  if (usuario.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  // ADMINISTRADOR AUTORIZADO
  return <>{children}</>;
}
