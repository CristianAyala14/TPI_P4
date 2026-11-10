
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

  // ESPERAR VERIFICACIÓN DE SESIÓN
  if (!verificado) {
    return (
      <p className="p-10 text-center text-slate-400">
        Verificando permisos...
      </p>
    );
  }

  // SIN SESIÓN
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // SIN PERMISOS ADMIN
  if (usuario.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
