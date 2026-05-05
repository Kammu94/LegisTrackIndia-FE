import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MyCases from './pages/MyCases';
import CaseDetails from './pages/CaseDetails';
import Hearings from './pages/Hearings';
import ProtectedPath from './components/ProtectedPath';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedPath />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<MyCases />} />
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/hearings" element={<Hearings />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
