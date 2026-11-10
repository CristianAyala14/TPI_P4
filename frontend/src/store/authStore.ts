
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Usuario } from "../types/usuario";
import { obtenerUsuarioActual } from "../services/auth";

interface AuthState {
  usuario: Usuario | null;
  comprobando: boolean;
  verificado: boolean;
  sesionPrevia: boolean;

  checkSession: () => Promise<void>;
  setUsuario: (usuario: Usuario) => void;
  limpiarSesion: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      comprobando: true,
      verificado: false,
      sesionPrevia: false,

      // VERIFICAR COOKIE CON FASTAPI
      checkSession: async () => {
        set({ comprobando: true });

        try {
          const usuario = await obtenerUsuarioActual();

          set({
            usuario,
            comprobando: false,
            verificado: true,
            sesionPrevia: usuario !== null,
          });
        } catch {
          set({
            usuario: null,
            comprobando: false,
            verificado: true,
            sesionPrevia: false,
          });
        }
      },

      // GUARDAR USUARIO AUTENTICADO
      setUsuario: (usuario) => {
        set({
          usuario,
          comprobando: false,
          verificado: true,
          sesionPrevia: true,
        });
      },

      // LIMPIAR SESIÓN LOCAL
      limpiarSesion: () => {
        set({
          usuario: null,
          comprobando: false,
          verificado: true,
          sesionPrevia: false,
        });
      },
    }),
    {
      name: "food-store-auth",

      // No persistir JWT ni datos personales.
      // Solo recordamos si existió una sesión.
      partialize: (state) => ({
        sesionPrevia: state.sesionPrevia,
      }),
    }
  )
);
