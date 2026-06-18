import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';

export const DashboardLayout = () => {
  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace content */}
      <main className="main-content" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '3rem 2rem 5rem 2rem'
      }}>
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        color: 'hsl(var(--text-muted))',
        fontSize: '0.9rem',
        marginTop: 'auto'
      }}>
        <p>&copy; {new Date().getFullYear()} Atlasia. Travel Smart, Explore Beyond.</p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
