
from sqlmodel import SQLModel, Field

from app.modules.categorias.schemas import CategoriaRead


# Schema para crear productos
class ProductoCreate(SQLModel):
    categoria_id: int
    nombre: str
    descripcion: str | None = None
    precio_base: float = Field(ge=0)
    imagen_url: str | None = None
    stock: int = Field(default=0, ge=0)
    disponible: bool = True


# Schema para actualizar productos
class ProductoUpdate(SQLModel):
    categoria_id: int | None = None
    nombre: str | None = None
    descripcion: str | None = None
    precio_base: float | None = Field(default=None, ge=0)
    imagen_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None


# Schema para modificar stock y disponibilidad
class ProductoStockUpdate(SQLModel):
    stock: int = Field(ge=0)
    disponible: bool


# Schema para devolver un producto
class ProductoRead(SQLModel):
    id: int
    categoria_id: int
    nombre: str
    descripcion: str | None
    precio_base: float
    imagen_url: str | None
    stock: int
    disponible: bool
    activo: bool
    categoria: CategoriaRead


# Schema para el listado paginado
class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
