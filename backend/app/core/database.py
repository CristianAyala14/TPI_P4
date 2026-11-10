
from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings

# Importando los modelos para registrar sus relaciones
from app.modules.usuarios.models import Usuario
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.pedidos.models import Pedido, DetallePedido


# Motor de conexión con PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)


# Crear sesiones de base de datos
def session_factory() -> Session:
    return Session(engine)


# Crear las tablas
def create_all_tables():
    SQLModel.metadata.create_all(engine)
