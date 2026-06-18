import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';

export const MainLayout = () => {
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <Outlet />
      </main>

      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        color: 'hsl(var(--text-muted))',
        fontSize: '0.9rem'
      }}>
        <p>&copy; {new Date().getFullYear()} Atlasia. Travel Smart, Explore Beyond.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
