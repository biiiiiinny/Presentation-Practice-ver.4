import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export function ProtectedRoute() {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
