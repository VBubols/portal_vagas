import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import RotaAdmin from './components/RotaAdmin.jsx';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Vagas from './pages/Vagas.jsx';
import VagaDetalhe from './pages/VagaDetalhe.jsx';
import Curriculo from './pages/Curriculo.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Exigem login */}
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/vagas" element={<Vagas />} />
          <Route path="/vagas/:id" element={<VagaDetalhe />} />
          <Route path="/curriculo" element={<Curriculo />} />

          {/* Exigem login de admin */}
          <Route element={<RotaAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/vagas" replace />} />
    </Routes>
  );
}
