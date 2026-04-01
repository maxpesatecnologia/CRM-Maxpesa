import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Contacts from './pages/Contacts';
import Fleet from './pages/Fleet';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/pipeline" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="frota" element={<Fleet />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="usuarios" element={<Users />} />
          <Route path="relatorios" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
