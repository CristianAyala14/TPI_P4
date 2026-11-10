
from typing import Generic, TypeVar

from sqlmodel import SQLModel, Session, select


# Tipo genérico que representa un modelo SQLModel
T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):

    def __init__(self, session: Session, model: type[T]):
        self.session = session
        self.model = model

    # Buscar un registro por ID
    def get_by_id(self, id: int) -> T | None:
        return self.session.get(self.model, id)

    # Obtener todos los registros
    def get_all(self) -> list[T]:
        statement = select(self.model)
        return list(self.session.exec(statement).all())

    # Agregar un registro
    def add(self, entity: T) -> T:
        self.session.add(entity)
        self.session.flush()
        return entity

    # Eliminar un registro
    def delete(self, entity: T) -> None:
        self.session.delete(entity)
