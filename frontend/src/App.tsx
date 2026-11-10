
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import Catalogo from "./pages/Catalogo";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import BarraNavegacion from "./components/BarraNavegacion";
import Checkout from "./pages/CheckOut";
import MisPedidos from "./pages/MisPedidos";
import DashboardAdmin from "./pages/DashboardAdmin";
import RutaAdmin from "./components/RutaAdmin";
import AdminCategorias from "./pages/AdminCategorias";
import AdminPedidos from "./pages/AdminPedidos";
import AdminUsuarios from "./pages/AdminUsuarios";


function App() {

  useEffect(() => {
    void useAuthStore.getState().checkSession();
  }, []);
  
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <BarraNavegacion />

        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route
            path="/admin"
            element={
              <RutaAdmin>
                <DashboardAdmin />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <RutaAdmin>
                <AdminCategorias />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/pedidos"
            element={
              <RutaAdmin>
                <AdminPedidos />
              </RutaAdmin>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RutaAdmin>
                <AdminUsuarios />
              </RutaAdmin>
            }
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
