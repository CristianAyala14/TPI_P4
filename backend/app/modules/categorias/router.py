
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario

from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaRead
)

from app.modules.categorias.service import (
    CategoriaService,
    CategoriaNoEncontrada,
    NombreDuplicado,
    NombreInvalido
)


router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"]
)


# DEPENDENCIA DEL SERVICE
def get_categoria_service() -> CategoriaService:
    return CategoriaService()


# LISTAR CATEGORIAS

@router.get("", response_model=list[CategoriaRead])
def listar_categorias(
    service: CategoriaService = Depends(get_categoria_service)
):
    return service.listar()


# OBTENER CATEGORIA POR ID

@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(
    categoria_id: int,
    service: CategoriaService = Depends(get_categoria_service)
):
    try:
        return service.obtener(categoria_id)

    except CategoriaNoEncontrada as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error


# CREAR CATEGORIA (ADMIN)

@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED
)
def crear_categoria(
    datos: CategoriaCreate,
    service: CategoriaService = Depends(get_categoria_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.crear(datos)

    except NombreDuplicado as error:
        raise HTTPException(
            status_code=409,
            detail=str(error)
        ) from error

    except NombreInvalido as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# ACTUALIZAR CATEGORIA (ADMIN)

@router.put("/{categoria_id}", response_model=CategoriaRead)
def actualizar_categoria(
    categoria_id: int,
    datos: CategoriaUpdate,
    service: CategoriaService = Depends(get_categoria_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.actualizar(categoria_id, datos)

    except CategoriaNoEncontrada as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except NombreDuplicado as error:
        raise HTTPException(
            status_code=409,
            detail=str(error)
        ) from error

    except NombreInvalido as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# BAJA LOGICA DE CATEGORIA (ADMIN)

@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_categoria(
    categoria_id: int,
    service: CategoriaService = Depends(get_categoria_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        service.eliminar(categoria_id)
        return None

    except CategoriaNoEncontrada as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error
