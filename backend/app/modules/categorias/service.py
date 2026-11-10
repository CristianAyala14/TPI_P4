
from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaRead
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


# EXCEPCIONES DE NEGOCIO

class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class NombreInvalido(Exception):
    pass


class CategoriaService:

    def __init__(self):
        self.uow = CategoriaUnitOfWork()

    # Validar nombre de categoría
    def validar_nombre(self, nombre: str) -> str:
        nombre = nombre.strip()

        if not 2 <= len(nombre) <= 100:
            raise NombreInvalido(
                "El nombre debe tener entre 2 y 100 caracteres"
            )

        return nombre

    # LISTAR CATEGORIAS ACTIVAS
    def listar(self) -> list[CategoriaRead]:

        with self.uow as uow:
            categorias = uow.categorias.get_all()

            return [
                CategoriaRead.model_validate(categoria)
                for categoria in categorias
                if categoria.activo
            ]

    # BUSCAR CATEGORIA POR ID
    def obtener(self, categoria_id: int) -> CategoriaRead:

        with self.uow as uow:
            categoria = uow.categorias.get_by_id(categoria_id)

            if categoria is None or not categoria.activo:
                raise CategoriaNoEncontrada(
                    "La categoría no existe"
                )

            return CategoriaRead.model_validate(categoria)

    # CREAR CATEGORIA
    def crear(self, datos: CategoriaCreate) -> CategoriaRead:

        nombre = self.validar_nombre(datos.nombre)

        with self.uow as uow:

            existente = uow.categorias.get_by_nombre(nombre)

            if existente is not None:
                raise NombreDuplicado(
                    "Ya existe una categoría con ese nombre"
                )

            categoria = Categoria(
                nombre=nombre,
                descripcion=datos.descripcion
            )

            uow.categorias.add(categoria)

            return CategoriaRead.model_validate(categoria)

    # ACTUALIZAR CATEGORIA
    def actualizar(
        self,
        categoria_id: int,
        datos: CategoriaUpdate
    ) -> CategoriaRead:

        with self.uow as uow:

            categoria = uow.categorias.get_by_id(categoria_id)

            if categoria is None or not categoria.activo:
                raise CategoriaNoEncontrada(
                    "La categoría no existe"
                )

            cambios = datos.model_dump(exclude_unset=True)

            if "nombre" in cambios:

                if cambios["nombre"] is None:
                    raise NombreInvalido(
                        "El nombre no puede ser nulo"
                    )

                nombre = self.validar_nombre(cambios["nombre"])

                existente = uow.categorias.get_by_nombre(nombre)

                if existente is not None and existente.id != categoria.id:
                    raise NombreDuplicado(
                        "Ya existe una categoría con ese nombre"
                    )

                categoria.nombre = nombre

            if "descripcion" in cambios:
                categoria.descripcion = cambios["descripcion"]

            return CategoriaRead.model_validate(categoria)

    # BAJA LOGICA DE CATEGORIA
    def eliminar(self, categoria_id: int) -> None:

        with self.uow as uow:

            categoria = uow.categorias.get_by_id(categoria_id)

            if categoria is None or not categoria.activo:
                raise CategoriaNoEncontrada(
                    "La categoría no existe"
                )

            categoria.activo = False
