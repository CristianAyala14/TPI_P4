
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario

from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoUpdate,
    ProductoStockUpdate,
    ProductoRead,
    ProductosPaginados
)

from app.modules.productos.service import (
    ProductoService,
    ProductoNoEncontrado,
    CategoriaNoEncontrada,
    ProductoInvalido
)


router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)


# DEPENDENCIA DEL SERVICE
def get_producto_service() -> ProductoService:
    return ProductoService()


# LISTAR PRODUCTOS (PUBLICO)

@router.get("", response_model=ProductosPaginados)
def listar_productos(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    categoria_id: int | None = None,
    disponible: bool | None = None,
    service: ProductoService = Depends(get_producto_service)
):
    return service.listar(
        skip=skip,
        limit=limit,
        search=search,
        categoria_id=categoria_id,
        disponible=disponible
    )


# OBTENER PRODUCTO (PUBLICO)

@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(
    producto_id: int,
    service: ProductoService = Depends(get_producto_service)
):
    try:
        return service.obtener(producto_id)

    except ProductoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error


# CREAR PRODUCTO (ADMIN)

@router.post(
    "",
    response_model=ProductoRead,
    status_code=status.HTTP_201_CREATED
)
def crear_producto(
    datos: ProductoCreate,
    service: ProductoService = Depends(get_producto_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.crear(datos)

    except CategoriaNoEncontrada as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except ProductoInvalido as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# ACTUALIZAR PRODUCTO (ADMIN)

@router.put("/{producto_id}", response_model=ProductoRead)
def actualizar_producto(
    producto_id: int,
    datos: ProductoUpdate,
    service: ProductoService = Depends(get_producto_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.actualizar(producto_id, datos)

    except (ProductoNoEncontrado, CategoriaNoEncontrada) as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except ProductoInvalido as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# ACTUALIZAR STOCK (ADMIN)

@router.patch(
    "/{producto_id}/stock",
    response_model=ProductoRead
)
def actualizar_stock(
    producto_id: int,
    datos: ProductoStockUpdate,
    service: ProductoService = Depends(get_producto_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        return service.actualizar_stock(producto_id, datos)

    except ProductoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except ProductoInvalido as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# BAJA LOGICA (ADMIN)

@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar_producto(
    producto_id: int,
    service: ProductoService = Depends(get_producto_service),
    admin: Usuario = Depends(require_role(["admin"]))
):
    try:
        service.eliminar(producto_id)
        return None

    except ProductoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error
