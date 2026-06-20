import React from 'react';
import Card from '../ui/Card';
import { formatDate } from '../../utils/formatDate';

export const TripCard = ({ trip, onClick, onDelete, onToggleFavorite }) => {
  const spent = (trip.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const percent = trip.budget > 0 ? Math.min(100, Math.round((spent / trip.budget) * 100)) : 0;

  return (
    <Card 
      onClick={onClick}
      interactive
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '350px',
        padding: 0
      }}
    >
      {/* Cover image area */}
      <div style={{
        height: '140px',
        backgroundImage: `url(${trip.coverUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        {/* Favorite Heart Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite();
          }}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            backdropFilter: 'blur(4px)',
            color: trip.isFavorite ? 'red' : 'white',
            outline: 'none',
            transition: 'transform 0.15s ease'
          }}
        >
          {trip.isFavorite ? '❤️' : '🤍'}
        </button>

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
          📍 {trip.source ? `${trip.source} ➔ ` : ''}{trip.destination || trip.destinations?.[0] || 'Unknown'}
        </div>
      </div>

      {/* Card content */}
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{trip.title}</h3>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
            {trip.startDate ? formatDate(trip.startDate) : '...'} - {trip.endDate ? formatDate(trip.endDate) : '...'}
          </p>
        </div>

        {/* Progress bar budget indicator */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Budget Spent ({percent}%)</span>
            <span>₹{spent} / ₹{trip.budget}</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${percent}%`,
              height: '100%',
              background: percent > 90 
                ? 'hsl(var(--color-danger))' 
                : 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Action footer inside card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--secondary))', fontWeight: 600 }}>Configure details &rarr;</span>
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'hsla(var(--color-danger), 0.7)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--color-danger))'}
              onMouseLeave={(e) => e.target.style.color = 'hsla(var(--color-danger), 0.7)'}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TripCard;
