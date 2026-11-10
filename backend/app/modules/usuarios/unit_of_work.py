
from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):

    def __enter__(self) -> "UsuarioUnitOfWork":

        # abre sesión de PostgreSQL
        super().__enter__()

        if self.session is None:
            raise RuntimeError(
                "No se pudo iniciar la sesión"
            )

        # crea repositorio usando la misma sesión
        self.usuarios = UsuarioRepository(self.session)

        return self
