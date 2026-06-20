import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TripDetails from '../pages/TripDetails';
import NotFound from '../pages/NotFound';

// Real-time hooks & UI
import { useSocketEvents } from '../hooks/useSocketEvents';
import ToastContainer from '../components/ui/ToastContainer';

export const AppRoutes = () => {
  useSocketEvents();

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
        </Route>

        {/* Private Workspace Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.TRIP_DETAILS} element={<TripDetails />} />
        </Route>

        {/* Fallback 404 Route */}
        <Route element={<MainLayout />}>
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
};

export default AppRoutes;
