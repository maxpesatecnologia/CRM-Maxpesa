import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Contacts from './pages/Contacts';
import Fleet from './pages/Fleet';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Campaigns from './pages/Campaigns';
import LeadSources from './pages/LeadSources';
import Segments from './pages/Segments';
import LossReasons from './pages/LossReasons';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Ou um componente de loading real
  
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/pipeline" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="frota" element={<Fleet />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="usuarios" element={<Users />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="campanhas" element={<Campaigns />} />
          <Route path="fontes" element={<LeadSources />} />
          <Route path="segmentos" element={<Segments />} />
          <Route path="motivos-perda" element={<LossReasons />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
