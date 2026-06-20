import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useTripStore } from '../../store/tripStore';

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { invitations, respondToInvitation } = useTripStore();
  const [isOpen, setIsOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResponse = async (invitationId, status) => {
    if (!invitationId) return;
    setRespondingId(invitationId);
    try {
      await respondToInvitation(invitationId, status);
    } catch (err) {
      console.error('Failed to respond to invitation:', err);
    } finally {
      setRespondingId(null);
    }
  };

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
                transition: 'color 0.2s',
                marginRight: '0.5rem'
              })}
            >
              Dashboard
            </NavLink>

            {/* Notification Bell Icon & Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative', marginRight: '0.5rem' }}>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                
                {invitations && invitations.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--color-danger))',
                    animation: 'pulse-ring 1.5s infinite'
                  }} />
                )}
              </button>

              {isOpen && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: '320px',
                  background: 'rgba(26, 29, 38, 0.95)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 1000
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.75rem'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Notifications</h4>
                    {invitations && invitations.length > 0 && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {invitations.length} New
                      </span>
                    )}
                  </div>

                  <div style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    paddingRight: '4px'
                  }}>
                    {!invitations || invitations.length === 0 ? (
                      <div style={{
                        padding: '1.5rem 0',
                        textAlign: 'center',
                        color: 'hsl(var(--text-muted))',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span style={{ fontSize: '0.85rem' }}>No new notifications</span>
                      </div>
                    ) : (
                      invitations.map((inv) => {
                        const myInvite = inv.invitations?.find(i => i.email === user?.email && i.status === 'pending');
                        const invitationId = myInvite?._id || myInvite?.id;
                        
                        return (
                          <div key={inv.id || inv._id} style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}>
                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-primary))', lineHeight: 1.4, textAlign: 'left' }}>
                              <strong className="gradient-text">{inv.userId?.name || 'Someone'}</strong> invited you to join the trip <strong style={{ color: 'white' }}>{inv.title}</strong>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                              <button
                                onClick={() => handleResponse(invitationId, 'accepted')}
                                disabled={respondingId !== null}
                                className="btn"
                                style={{
                                  flex: 1,
                                  padding: '0.4rem 0',
                                  fontSize: '0.8rem',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, hsl(142, 70%, 45%) 0%, hsl(142, 60%, 40%) 100%)',
                                  color: 'white',
                                  border: 'none',
                                  boxShadow: 'none',
                                  height: '28px',
                                  minHeight: '28px'
                                }}
                              >
                                {respondingId === invitationId ? '...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => handleResponse(invitationId, 'declined')}
                                disabled={respondingId !== null}
                                className="btn"
                                style={{
                                  flex: 1,
                                  padding: '0.4rem 0',
                                  fontSize: '0.8rem',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: 'hsl(350, 89%, 60%)',
                                  height: '28px',
                                  minHeight: '28px'
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

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
