
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import axios from "axios";

import { registrarUsuario } from "../services/auth";

export default function Registro() {
  const navigate = useNavigate();

  const [error, setError] = useState("");

  
  // TANSTACK FORM
  

  const form = useForm({
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      password: "",
    },

    onSubmit: async ({ value }) => {
      setError("");

      try {
        // Registrar usuario en FastAPI
        await registrarUsuario({
          full_name: value.full_name.trim(),
          username: value.username.trim(),
          email: value.email.trim(),
          password: value.password,
        });

        // Redirigir al login
        navigate("/login", {
          replace: true,
          state: {
            registroExitoso: true,
          },
        });
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const detalle = err.response?.data?.detail;

          if (typeof detalle === "string") {
            setError(detalle);
          } else if (err.response?.status === 409) {
            setError(
              "El usuario o correo electrónico ya está registrado."
            );
          } else {
            setError(
              "No se pudo completar el registro."
            );
          }
        } else {
          setError("Ocurrió un error inesperado.");
        }
      }
    },
  });

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">

        {/* ENCABEZADO */}

        <h1 className="text-center text-3xl font-bold text-orange-500">
          Crear cuenta
        </h1>

        <p className="mt-2 text-center text-slate-400">
          Registrate en Food Store
        </p>

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
              NOMBRE COMPLETO
         */}

          <form.Field
            name="full_name"
            validators={{
              onBlur: ({ value }) => {
                if (!value.trim()) {
                  return "El nombre completo es obligatorio.";
                }

                if (value.trim().length < 2) {
                  return "Ingresá al menos 2 caracteres.";
                }

                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm"
                >
                  Nombre completo
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
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
              NOMBRE DE USUARIO
          */}

          <form.Field
            name="username"
            validators={{
              onBlur: ({ value }) => {
                if (!value.trim()) {
                  return "El nombre de usuario es obligatorio.";
                }

                if (value.trim().length < 3) {
                  return "Ingresá al menos 3 caracteres.";
                }

                return undefined;
              },
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
                  placeholder="Ej: usuario123"
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
              CORREO ELECTRÓNICO
           */}

          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => {
                const email = value.trim();

                if (!email) {
                  return "El correo es obligatorio.";
                }

                const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!formatoEmail.test(email)) {
                  return "Ingresá un correo electrónico válido.";
                }

                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm"
                >
                  Correo electrónico
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@correo.com"
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
              onBlur: ({ value }) => {
                if (!value) {
                  return "La contraseña es obligatoria.";
                }

                if (value.length < 8) {
                  return "La contraseña debe tener al menos 8 caracteres.";
                }

                return undefined;
              },
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
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
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
              ERROR DEL BACKEND
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
              BOTÓN REGISTRAR
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
                  ? "Registrando..."
                  : "Crear cuenta"}
              </button>
            )}
          </form.Subscribe>

        </form>


        {/* ENLACE AL LOGIN */}

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tenés cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-orange-400 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>

      </div>
    </main>
  );
}
