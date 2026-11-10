
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

#routes
from app.modules.categorias.router import router as categorias_router
from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.productos.router import router as productos_router
from app.modules.pedidos.router import router as pedidos_router

app = FastAPI(
    title="Food Store API",
    description="API REST del sistema Food Store",
    version="1.0.0"
)

# Permite la comunicación con React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", tags=["Sistema"])
def health():
    return {
        "status": "ok",
        "message": "Food Store API funcionando"
    }

# Registrando las rutas 
app.include_router(
    categorias_router,
    prefix="/api/v1"
)

app.include_router(
    auth_router,
    prefix="/api/v1"
)

app.include_router(
    usuarios_router,
    prefix="/api/v1"
)

app.include_router(
    productos_router,
    prefix="/api/v1"
)

app.include_router(
    pedidos_router,
    prefix="/api/v1"
)