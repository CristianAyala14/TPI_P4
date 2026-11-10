
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Producto } from "../types/producto";

// Cada elemento del carrito contiene
// un producto y la cantidad seleccionada
export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface CarritoState {
  items: ItemCarrito[];

  agregarProducto: (producto: Producto) => void;
  quitarUnidad: (productoId: number) => void;
  eliminarProducto: (productoId: number) => void;
  vaciarCarrito: () => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set) => ({
      items: [],

      // AGREGAR PRODUCTO
      agregarProducto: (producto) => {
        if (
          !producto.activo ||
          !producto.disponible ||
          producto.stock <= 0
        ) {
          return;
        }

        set((state) => {
          const existente = state.items.find(
            (item) => item.producto.id === producto.id
          );

          if (existente) {
            if (existente.cantidad >= producto.stock) {
              return state;
            }

            return {
              items: state.items.map((item) =>
                item.producto.id === producto.id
                  ? {
                      producto,
                      cantidad: item.cantidad + 1,
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                producto,
                cantidad: 1,
              },
            ],
          };
        });
      },

      // QUITAR UNA UNIDAD
      quitarUnidad: (productoId) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.producto.id === productoId
                ? {
                    ...item,
                    cantidad: item.cantidad - 1,
                  }
                : item
            )
            .filter((item) => item.cantidad > 0),
        }));
      },

      // ELIMINAR PRODUCTO COMPLETO
      eliminarProducto: (productoId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.producto.id !== productoId
          ),
        }));
      },

      // VACIAR CARRITO
      vaciarCarrito: () => {
        set({ items: [] });
      },
    }),
    {
      name: "food-store-carrito",
    }
  )
);
