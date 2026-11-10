
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import axios from "axios";

import { useAuthStore } from "../store/authStore";
import {
  iniciarSesion,
  obtenerUsuarioActual,
} from "../services/auth";


// COMPONENTE LOGIN


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const setUsuario = useAuthStore(
    (state) => state.setUsuario
  );

  const [error, setError] = useState("");

  const registroExitoso =
    location.state?.registroExitoso === true;

  
  // TANSTACK FORM
  

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },

    onSubmit: async ({ value }) => {
      setError("");

      try {
        // 1. Autenticarse en FastAPI
        await iniciarSesion(
          value.username.trim(),
          value.password
        );

        // 2. Obtener los datos del usuario autenticado
        const usuario = await obtenerUsuarioActual();

        if (!usuario) {
          throw new Error(
            "No se pudo verificar la sesión."
          );
        }

        // 3. Limpiar datos privados de sesiones anteriores
        queryClient.removeQueries({
          queryKey: ["pedidos"],
        });

        queryClient.removeQueries({
          queryKey: ["pedidos-admin"],
        });

        queryClient.removeQueries({
          queryKey: ["resumenPedidos"],
        });

        queryClient.removeQueries({
          queryKey: ["usuarios-admin"],
        });

        // 4. Guardar usuario en Zustand
        setUsuario(usuario);

        // 5. Actualizar el usuario en TanStack Query
        queryClient.setQueryData(
          ["usuarioActual"],
          usuario
        );

        // 6. Redirigir según el rol
        if (usuario.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }

      } catch (err) {
        if (axios.isAxiosError(err)) {
          const detalle = err.response?.data?.detail;

          setError(
            typeof detalle === "string"
              ? detalle
              : "No se pudo iniciar sesión."
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ocurrió un error inesperado.");
        }
      }
    },
  });

  
  // VISTA PRINCIPAL
  
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">

        {/* ENCABEZADO */}

        <h1 className="text-center text-3xl font-bold text-orange-500">
          Iniciar sesión
        </h1>

        <p className="mt-2 text-center text-slate-400">
          Ingresá a tu cuenta de Food Store
        </p>

        {/* REGISTRO EXITOSO */}

        {registroExitoso && (
          <p
            role="status"
            className="mt-5 rounded-lg bg-green-950 p-3 text-sm text-green-300"
          >
            Cuenta creada correctamente.
            Ya podés iniciar sesión.
          </p>
        )}

        {/* FORMULARIO */}

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            void form.handleSubmit();
          }}
          className="mt-8 space-y-5"
        >

          {/* 
              NOMBRE DE USUARIO
           */}

          <form.Field
            name="username"
            validators={{
              onBlur: ({ value }) =>
                value.trim().length === 0
                  ? "El nombre de usuario es obligatorio."
                  : undefined,

              onSubmit: ({ value }) =>
                value.trim().length === 0
                  ? "El nombre de usuario es obligatorio."
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm"
                >
                  Nombre de usuario
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="username"
                  placeholder="Tu usuario"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(evento) =>
                    field.handleChange(evento.target.value)
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
              CONTRASEÑA
           */}

          <form.Field
            name="password"
            validators={{
              onBlur: ({ value }) =>
                value.length === 0
                  ? "La contraseña es obligatoria."
                  : undefined,

              onSubmit: ({ value }) =>
                value.length === 0
                  ? "La contraseña es obligatoria."
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm"
                >
                  Contraseña
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(evento) =>
                    field.handleChange(evento.target.value)
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
              ERRORES DEL BACKEND
           */}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-950 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}


          {/* 
              BOTÓN INICIAR SESIÓN
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
                disabled={!canSubmit || isSubmitting}
                className="w-full rounded-lg bg-orange-500 py-3 font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Ingresando..."
                  : "Ingresar"}
              </button>
            )}
          </form.Subscribe>

        </form>


        {/* 
            REGISTRO
         */}

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tenés cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold text-orange-400 hover:underline"
          >
            Registrate
          </Link>
        </p>

      </div>
    </main>
  );
}
