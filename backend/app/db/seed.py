
from sqlmodel import select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password

from app.modules.usuarios.models import Usuario
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.pedidos.models import Pedido, DetallePedido


def ejecutar_seed():

    # Asegurar que existan las tablas
    create_all_tables()

    with session_factory() as session:

        # 1 CREAR ADMINISTRADOR

        admin = session.exec(
            select(Usuario).where(
                Usuario.username == "admin"
            )
        ).first()

        if admin is None:

            admin = Usuario(
                username="admin",
                full_name="Administrador Food Store",
                email="admin@foodstore.com",
                hashed_password=hash_password("Admin1234!"),
                role="admin",
                disabled=False
            )

            session.add(admin)
            print("Administrador creado")

        else:
            print("El administrador ya existe")

        # 2 CREAR CATEGORIAS

        categorias_datos = [
            ("Hamburguesas", "Hamburguesas artesanales"),
            ("Pizzas", "Pizzas recién horneadas"),
            ("Empanadas", "Empanadas caseras")
        ]

        categorias = {}

        for nombre, descripcion in categorias_datos:

            categoria = session.exec(
                select(Categoria).where(
                    Categoria.nombre == nombre
                )
            ).first()

            if categoria is None:
                categoria = Categoria(
                    nombre=nombre,
                    descripcion=descripcion
                )
                session.add(categoria)
                session.flush()
                print(f"Categoría creada: {nombre}")

            categorias[nombre] = categoria.id

        # 3 CREAR PRODUCTOS

        productos_datos = [
            ("Hamburguesa Clásica", "Hamburguesas", 8000, 20),
            ("Hamburguesa Doble", "Hamburguesas", 11000, 15),
            ("Hamburguesa Cheddar", "Hamburguesas", 9500, 18),

            ("Pizza Muzzarella", "Pizzas", 12000, 12),
            ("Pizza Napolitana", "Pizzas", 14000, 10),
            ("Pizza Fugazzeta", "Pizzas", 13500, 10),

            ("Empanada de Carne", "Empanadas", 1800, 40),
            ("Empanada de Pollo", "Empanadas", 1800, 35)
        ]

        for nombre, categoria_nombre, precio, stock in productos_datos:

            categoria_id = categorias[categoria_nombre]

            existente = session.exec(
                select(Producto).where(
                    Producto.nombre == nombre,
                    Producto.categoria_id == categoria_id
                )
            ).first()

            if existente is None:

                producto = Producto(
                    nombre=nombre,
                    descripcion=f"Deliciosa {nombre}",
                    precio_base=precio,
                    stock=stock,
                    categoria_id=categoria_id,
                    disponible=True,
                    activo=True,
                    imagen_url=None
                )

                session.add(producto)
                print(f"Producto creado: {nombre}")

        # Confirmar los cambios
        session.commit()

    print("Seed ejecutado correctamente")


if __name__ == "__main__":
    ejecutar_seed()
