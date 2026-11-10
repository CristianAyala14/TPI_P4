
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from app.core.deps import (
    get_current_active_user,
    require_role
)

from app.modules.usuarios.models import Usuario

from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    CambioEstado,
    EstadoPedido,
    ResumenPedidos
)

from app.modules.pedidos.service import (
    PedidoService,
    PedidoNoEncontrado,
    PedidoAjeno,
    ProductoNoEncontrado,
    ProductoNoDisponible,
    StockInsuficiente,
    ProductoRepetido,
    TransicionInvalida
)


router = APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"]
)


# DEPENDENCIA DEL SERVICE

def get_pedido_service() -> PedidoService:
    return PedidoService()


# CREAR PEDIDO

@router.post(
    "",
    response_model=PedidoRead,
    status_code=status.HTTP_201_CREATED
)
def crear_pedido(
    datos: PedidoCreate,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service)
):
    try:
        return service.crear(datos, usuario)

    except ProductoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except (
        ProductoNoDisponible,
        StockInsuficiente,
        ProductoRepetido
    ) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# LISTAR PEDIDOS

@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    estado: EstadoPedido | None = None,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service)
):
    return service.listar(
        usuario=usuario,
        skip=skip,
        limit=limit,
        estado=estado
    )


# RESUMEN DE PEDIDOS (ADMIN)

@router.get(
    "/resumen",
    response_model=ResumenPedidos
)
def obtener_resumen(
    admin: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service)
):
    return service.resumen()


# OBTENER PEDIDO POR ID

@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service)
):
    try:
        return service.obtener(pedido_id, usuario)

    except PedidoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except PedidoAjeno as error:
        raise HTTPException(
            status_code=403,
            detail=str(error)
        ) from error


# CAMBIAR ESTADO (ADMIN)

@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoRead
)
def cambiar_estado(
    pedido_id: int,
    datos: CambioEstado,
    admin: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service)
):
    try:
        return service.cambiar_estado(
            pedido_id,
            datos.estado
        )

    except PedidoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except ProductoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except TransicionInvalida as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error


# CANCELAR PEDIDO PROPIO

@router.patch(
    "/{pedido_id}/cancelar",
    response_model=PedidoRead
)
def cancelar_pedido(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service)
):
    try:
        return service.cancelar(pedido_id, usuario)

    except PedidoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except PedidoAjeno as error:
        raise HTTPException(
            status_code=403,
            detail=str(error)
        ) from error

    except ProductoNoEncontrado as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    except TransicionInvalida as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error
