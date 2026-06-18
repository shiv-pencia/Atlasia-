import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Clear global auth errors when mount/unmount
  useEffect(() => {
    clearError();
    return () => clearError();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register({ name, email, password });
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 160px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '3rem 2.5rem',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text">Create Account</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Join Atlasia and start mapping your adventures
          </p>
        </div>

        {(localError || error) && (
          <div style={{
            background: 'rgba(255, 75, 75, 0.15)',
            border: '1px solid hsl(var(--color-danger))',
            color: 'white',
            padding: '0.8rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: 1.4
          }}>
            ⚠️ {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. wanderer@atlasia.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: 'hsl(var(--text-secondary))',
          fontSize: '0.9rem'
        }}>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} style={{
            color: 'hsl(var(--secondary))',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
