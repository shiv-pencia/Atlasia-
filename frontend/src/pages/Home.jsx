import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';

// Shared UI Components
import Button from '../components/ui/Button';

const POPULAR_TRIPS = [
  {
    id: 'pop1',
    title: 'Kyoto Temples & Tea Houses',
    destination: 'Kyoto, Japan',
    description: 'Immerse in historic shrines, bamboo groves, and traditional tea ceremonies.',
    coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'pop2',
    title: 'Swiss Alpine Trails',
    destination: 'Zermatt, Switzerland',
    description: 'Hike across specular glaciers, reflection lakes, and the iconic Matterhorn path.',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'pop3',
    title: 'Paris Art & Cafes Tour',
    destination: 'Paris, France',
    description: 'Walk through Louvre museums, historic quarters, and fine French bistros.',
    coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop'
  }
];

export const Home = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const targetPath = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER;
    navigate(`${targetPath}?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '4rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '6rem',
      alignItems: 'center'
    }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        maxWidth: '850px',
        padding: '2rem 0'
      }}>
        <div className="glass-panel" style={{
          padding: '0.5rem 1rem',
          borderRadius: '50px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'hsl(var(--secondary))',
          border: '1px solid hsla(var(--secondary), 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(0, 242, 254, 0.05)',
          marginBottom: '1rem'
        }}>
          ✨ Plan Your Travel Roadmap Effortlessly
        </div>
        <h1 style={{
          fontSize: '4.2rem',
          lineHeight: 1.15,
          fontWeight: 800,
          letterSpacing: '-0.03em'
        }}>
          Plan Your Next Adventure <br />
          With <span className="gradient-text">Atlasia</span>
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'hsl(var(--text-secondary))',
          lineHeight: 1.6,
          maxWidth: '650px'
        }}>
          Create collaborative itineraries, map out your routes in real time, and manage budgets seamlessly. All in one unified canvas.
        </p>

        {/* Search Destination Bar */}
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '550px',
          marginTop: '1rem',
          padding: '0.5rem',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          backdropFilter: 'blur(8px)'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Where would you like to explore? (e.g. Kyoto, Zermatt)"
            className="form-input"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0.5rem 1rem'
            }}
          />
          <Button type="submit" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
            Search
          </Button>
        </form>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
          <Link 
            to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER} 
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
          </Link>
          <a 
            href="#popular" 
            className="btn btn-secondary"
            style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}
          >
            Curated Routes
          </a>
        </div>
      </section>

      {/* Curated Popular Trips Section */}
      <section id="popular" style={{ width: '100%' }}>
        <h2 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '3rem',
          letterSpacing: '-0.02em'
        }}>
          Popular <span className="gradient-text">Explorations</span>
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {POPULAR_TRIPS.map((pt) => (
            <div 
              key={pt.id}
              className="glass-panel glass-panel-interactive"
              onClick={() => {
                const target = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER;
                navigate(`${target}?search=${encodeURIComponent(pt.destination)}`);
              }}
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '350px'
              }}
            >
              <div style={{
                height: '180px',
                backgroundImage: `url(${pt.coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)'
                }}>
                  📍 {pt.destination}
                </div>
              </div>

              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{pt.title}</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineLength: 1.4 }}>
                    {pt.description}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--secondary))', fontWeight: 600 }}>Create route &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Call To Action */}
      <section className="glass-panel" style={{
        width: '100%',
        padding: '4rem',
        borderRadius: '24px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(123, 97, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%), rgba(26, 29, 38, 0.5)',
        border: '1px solid hsla(var(--primary), 0.2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
          {isAuthenticated ? 'Start mapping your next adventure' : 'Ready to map out your adventure?'}
        </h3>
        <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '500px' }}>
          {isAuthenticated 
            ? 'Open your workspace dashboard to configure route points, event calendars, and ledger details.' 
            : 'Create an account and set up your first trip dashboard in under a minute.'}
        </p>
        <Link 
          to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER} 
          className="btn btn-primary"
          style={{ marginTop: '1rem', padding: '0.8rem 2.2rem' }}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Sign Up Now'}
        </Link>
      </section>
    </div>
  );
};

export default Home;
