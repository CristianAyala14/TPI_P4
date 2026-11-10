
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoUpdate,
    ProductoStockUpdate,
    ProductoRead,
    ProductosPaginados
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


# EXCEPCIONES DE NEGOCIO

class ProductoNoEncontrado(Exception):
    pass


class CategoriaNoEncontrada(Exception):
    pass


class ProductoInvalido(Exception):
    pass


# SERVICE DE PRODUCTOS

class ProductoService:

    def __init__(self):
        self.uow = ProductoUnitOfWork()

    # LISTAR PRODUCTOS

    def listar(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None
    ) -> ProductosPaginados:

        with self.uow as uow:

            total, productos = uow.productos.search(
                skip=skip,
                limit=limit,
                search=search,
                categoria_id=categoria_id,
                disponible=disponible
            )

            return ProductosPaginados(
                total=total,
                items=[
                    ProductoRead.model_validate(producto)
                    for producto in productos
                ]
            )

    # OBTENER PRODUCTO POR ID

    def obtener(self, producto_id: int) -> ProductoRead:

        with self.uow as uow:

            producto = uow.productos.get_by_id(producto_id)

            if producto is None or not producto.activo:
                raise ProductoNoEncontrado(
                    "El producto no existe"
                )

            return ProductoRead.model_validate(producto)

    # CREAR PRODUCTO

    def crear(self, datos: ProductoCreate) -> ProductoRead:

        with self.uow as uow:

            categoria = uow.categorias.get_by_id(
                datos.categoria_id
            )

            if categoria is None or not categoria.activo:
                raise CategoriaNoEncontrada(
                    "La categoría no existe o está inactiva"
                )

            nombre = datos.nombre.strip()

            if not nombre:
                raise ProductoInvalido(
                    "El nombre del producto es obligatorio"
                )

            if datos.precio_base < 0 or datos.stock < 0:
                raise ProductoInvalido(
                    "El precio y el stock no pueden ser negativos"
                )

            producto = Producto(
                **datos.model_dump()
            )

            producto.nombre = nombre
            producto.categoria = categoria

            uow.productos.add(producto)

            return ProductoRead.model_validate(producto)

    # ACTUALIZAR PRODUCTO

    def actualizar(
        self,
        producto_id: int,
        datos: ProductoUpdate
    ) -> ProductoRead:

        with self.uow as uow:

            producto = uow.productos.get_by_id(producto_id)

            if producto is None or not producto.activo:
                raise ProductoNoEncontrado(
                    "El producto no existe"
                )

            cambios = datos.model_dump(exclude_unset=True)

            # Los campos obligatorios no admiten null
            campos_obligatorios = {
                "categoria_id",
                "nombre",
                "precio_base",
                "stock",
                "disponible"
            }

            for campo in campos_obligatorios:
                if campo in cambios and cambios[campo] is None:
                    raise ProductoInvalido(
                        f"El campo {campo} no puede ser nulo"
                    )

            # Validar nueva categoría
            if "categoria_id" in cambios:

                categoria = uow.categorias.get_by_id(
                    cambios["categoria_id"]
                )

                if categoria is None or not categoria.activo:
                    raise CategoriaNoEncontrada(
                        "La categoría no existe o está inactiva"
                    )

                producto.categoria = categoria

            # Validar nombre
            if "nombre" in cambios:
                cambios["nombre"] = cambios["nombre"].strip()

                if not cambios["nombre"]:
                    raise ProductoInvalido(
                        "El nombre no puede estar vacío"
                    )

            # Validar precio y stock
            if "precio_base" in cambios:
                if cambios["precio_base"] < 0:
                    raise ProductoInvalido(
                        "El precio no puede ser negativo"
                    )

            if "stock" in cambios:
                if cambios["stock"] < 0:
                    raise ProductoInvalido(
                        "El stock no puede ser negativo"
                    )

            # Aplicar los cambios
            for campo, valor in cambios.items():
                setattr(producto, campo, valor)

            return ProductoRead.model_validate(producto)

    # MODIFICAR STOCK Y DISPONIBILIDAD

    def actualizar_stock(
        self,
        producto_id: int,
        datos: ProductoStockUpdate
    ) -> ProductoRead:

        with self.uow as uow:

            producto = uow.productos.get_by_id(producto_id)

            if producto is None or not producto.activo:
                raise ProductoNoEncontrado(
                    "El producto no existe"
                )

            if datos.stock < 0:
                raise ProductoInvalido(
                    "El stock no puede ser negativo"
                )

            producto.stock = datos.stock
            producto.disponible = datos.disponible

            return ProductoRead.model_validate(producto)

    # BAJA LOGICA DE PRODUCTO

    def eliminar(self, producto_id: int) -> None:

        with self.uow as uow:

            producto = uow.productos.get_by_id(producto_id)

            if producto is None or not producto.activo:
                raise ProductoNoEncontrado(
                    "El producto no existe"
                )

            producto.activo = False
