import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderRadius: '0 0 16px 16px',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white'
        }}>A</div>
        <Link to={ROUTES.HOME} style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          textDecoration: 'none',
          letterSpacing: '-0.02em'
        }} className="gradient-text">
          Atlasia
        </Link>
      </div>

      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <NavLink 
          to={ROUTES.HOME} 
          style={({ isActive }) => ({
            color: isActive ? 'hsl(var(--secondary))' : 'hsl(var(--text-secondary))',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            transition: 'color 0.2s'
          })}
        >
          Home
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink 
              to={ROUTES.DASHBOARD} 
              style={({ isActive }) => ({
                color: isActive ? 'hsl(var(--secondary))' : 'hsl(var(--text-secondary))',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'color 0.2s'
              })}
            >
              Dashboard
            </NavLink>
            <button 
              onClick={logout} 
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <NavLink 
              to={ROUTES.LOGIN} 
              style={({ isActive }) => ({
                color: isActive ? 'hsl(var(--secondary))' : 'hsl(var(--text-secondary))',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'color 0.2s'
              })}
            >
              Login
            </NavLink>
            <Link 
              to={ROUTES.REGISTER} 
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
