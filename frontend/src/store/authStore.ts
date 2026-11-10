
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { obtenerUsuarioActual } from "../services/auth";
import type { Usuario } from "../types/usuario";

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

      // VERIFICAR LA SESIÓN CON FASTAPI
      checkSession: async () => {
        set({
          comprobando: true,
          verificado: false,
        });

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

      // LOGIN EXITOSO
      setUsuario: (usuario) => {
        set({
          usuario,
          comprobando: false,
          verificado: true,
          sesionPrevia: true,
        });
      },

      // LOGOUT O SESIÓN INVÁLIDA
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

      // Persistir solo datos públicos del usuario.
      // Nunca el JWT ni la contraseña.
      partialize: (state) => ({
        usuario: state.usuario,
      }),
    }
  )
);
