# Food Store - Trabajo Práctico Integrador

**Materia:** Programación IV - Tecnicatura Universitaria en Programación (UTN)

## Link al repositorio: 
https://github.com/CristianAyala14/TPI_P4.git

## Link al video: 


## Descripción

Food Store es una aplicación web para la gestión de pedidos de comida. Permite registrar usuarios, consultar productos, administrar un carrito y realizar pedidos. Incluye un panel administrativo para gestionar productos, categorías, stock, pedidos y usuarios.

## Tecnologías utilizadas

**Backend:** Python, FastAPI, SQLModel, PostgreSQL, JWT y arquitectura en capas con Repository y Unit of Work.

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Axios, TanStack Query, TanStack Form, TanStack Table, Zustand y React Router.

## Requisitos previos

- Python 3.12 o superior
- Node.js 20.19 o superior
- pnpm 9 o superior
- PostgreSQL

## Instalación y ejecución

### 1. Backend

Desde la carpeta `backend`:

1. Crear el entorno virtual: `python -m venv .venv`
2. Activarlo en Windows: `.\.venv\Scripts\Activate.ps1`
3. Instalar dependencias: `pip install -r requirements.txt`
4. Copiar `.env.example` a `.env` y configurar la conexión a PostgreSQL.
5. Crear la base de datos indicada en `DATABASE_URL`.
6. Cargar los datos iniciales: `python -m app.db.seed`
7. Iniciar el servidor: `python -m uvicorn app.main:app --reload`

**API:** http://localhost:8000

**Documentación Swagger:** http://localhost:8000/docs

### 2. Frontend

Desde la carpeta `frontend`:

1. Instalar dependencias: `pnpm install`
2. Copiar `.env.example` a `.env`.
3. Verificar la compilación: `pnpm build`
4. Ejecutar: `pnpm dev`

**Aplicación:** http://localhost:5173

## Variables de entorno

**Backend (`backend/.env`):**

- `DATABASE_URL`: conexión a PostgreSQL.
- `SECRET_KEY`: clave secreta para firmar JWT, de al menos 32 caracteres.
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- `FRONTEND_ORIGIN=http://localhost:5173`

**Frontend (`frontend/.env`):**

`VITE_API_URL=http://localhost:8000/api/v1`

Los archivos `.env` contienen configuración local y no deben subirse al repositorio. Se incluyen archivos `.env.example` como referencia.

## Usuario administrador inicial

El comando de seed genera una cuenta administrativa:

- **Usuario:** `admin`
- **Contraseña:** `Admin1234!`

También carga categorías y productos de ejemplo.

*Estas credenciales son únicamente para desarrollo y demostración.*

## Funcionalidades principales

- Registro e inicio de sesión con JWT en cookie HttpOnly.
- Catálogo con búsqueda, filtros y paginación.
- Carrito de compras persistente.
- Confirmación y consulta de pedidos.
- Descuento automático de stock y restitución al cancelar.
- Administración de productos y categorías.
- Gestión de estados de pedidos.
- Activación y desactivación de usuarios.
- Panel administrativo con indicadores.

## Repositorio y demostración

**GitHub:** [Agregar enlace al repositorio público]

**Video de demostración (10 a 15 minutos):** [Agregar enlace público]

El video presenta el registro, la compra de un cliente, la administración del sistema y la cancelación de un pedido con restitución del stock.

## Entrega

El proyecto incluye las carpetas `backend/` y `frontend/`, los archivos de configuración de ejemplo y este README.

Se excluyen del ZIP las dependencias instaladas, los entornos virtuales y los archivos `.env`.