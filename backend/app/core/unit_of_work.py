
from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:

    def __init__(self):
        self.session: Session | None = None

    # Iniciar la transacción
    def __enter__(self):
        self.session = session_factory()
        return self

    # Finalizar la transacción
    def __exit__(self, exc_type, exc_value, traceback):

        if self.session is None:
            return False

        try:
            if exc_type is None:
                # Si todo salió bien, guardar cambios
                try:
                    self.session.commit()
                except Exception:
                    self.session.rollback()
                    raise
            else:
                # Si hubo un error, revertir cambios
                self.session.rollback()

        finally:
            # Cerrar siempre la sesión
            self.session.close()
            self.session = None

        return False
