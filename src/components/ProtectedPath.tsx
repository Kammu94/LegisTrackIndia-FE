import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const ProtectedPath = () => {
  const { token } = useSelector((state: RootState) => state.auth);

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedPath;
