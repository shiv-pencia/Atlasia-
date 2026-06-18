import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, fetchCurrentUser } = useAuth();

  useEffect(() => {
    // Attempt to fetch current user profile if token is present
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, fetchCurrentUser]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
