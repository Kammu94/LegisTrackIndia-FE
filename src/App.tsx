import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MyCases from './pages/MyCases';
import CaseDetails from './pages/CaseDetails';
import Hearings from './pages/Hearings';
import ProtectedPath from './components/ProtectedPath';
import Loader from './components/Loader';
import { apiSlice } from './api/apiSlice';
import type { RootState } from './store/store';

function App() {
  const showLoader = useSelector((state: RootState) => {
    const apiState = state[apiSlice.reducerPath];
    const hasPendingQueries = Object.values(apiState.queries).some(
      (query) => query?.status === 'pending'
    );
    const hasPendingMutations = Object.values(apiState.mutations).some(
      (mutation) => mutation?.status === 'pending'
    );

    return hasPendingQueries || hasPendingMutations;
  });

  return (
    <>
      <Loader visible={showLoader} />
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
    </>
  );
}

export default App;
