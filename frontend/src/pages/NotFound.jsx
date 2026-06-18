import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const NotFound = () => {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 800 }} className="gradient-text">404</h1>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Lost in Transit?</h2>
      <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '400px' }}>
        The route you are looking for does not exist or has been relocated to another continent.
      </p>
      <Link to={ROUTES.HOME} className="btn btn-primary" style={{ marginTop: '1rem' }}>
        🗺️ Return Home
      </Link>
    </div>
  );
};

export default NotFound;
