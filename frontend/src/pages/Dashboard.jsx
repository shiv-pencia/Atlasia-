import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTripStore } from '../features/trip/store';
import { formatDate } from '../utils/formatDate';

// Shared Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import TripCard from '../components/cards/TripCard';

export const Dashboard = () => {
  const { trips, isLoading, error, fetchTrips, createTrip, deleteTrip, toggleFavorite } = useTripStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [formError, setFormError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Pre-fill destination if arriving from Home search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    if (searchQuery) {
      setDestination(decodeURIComponent(searchQuery));
      setShowCreateForm(true);
    }
  }, [location.search]);

  const activeTrips = trips;

  // Split trips based on favorites and date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const favoriteTrips = activeTrips.filter((t) => t.isFavorite);
  const upcomingTrips = activeTrips.filter((t) => !t.isFavorite && (!t.endDate || new Date(t.endDate) >= today));
  const pastTrips = activeTrips.filter((t) => !t.isFavorite && t.endDate && new Date(t.endDate) < today);

  const totalBudget = activeTrips.reduce((acc, t) => acc + (Number(t.budget) || 0), 0);
  const totalSpent = activeTrips.reduce((acc, t) => {
    const tripSpent = (t.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return acc + tripSpent;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !destination || !startDate || !endDate || !budget) {
      setFormError('Please fill in all fields.');
      return;
    }

    try {
      await createTrip({
        title,
        destination,
        startDate,
        endDate,
        budget: Number(budget),
        expenses: [],
        itinerary: []
      });
      // Reset form
      setTitle('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setShowCreateForm(false);
      // Strip out query params after successful creation
      navigate(location.pathname, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Failed to create trip.');
    }
  };

  const handleDelete = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteTrip(tripId);
      } catch (err) {
        setFormError(err.message || 'Failed to delete trip.');
      }
    }
  };

  const handleToggleFavorite = async (tripId) => {
    try {
      await toggleFavorite(tripId);
    } catch (err) {
      setFormError(err.message || 'Failed to toggle favorite.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Analytics Banner */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, uppercase: true }}>Total Trips</span>
          <span style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text">{activeTrips.length}</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, uppercase: true }}>Total Budgeted</span>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>₹{totalBudget.toLocaleString()}</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, uppercase: true }}>Total Expenses</span>
          <span style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text-alt">₹{totalSpent.toLocaleString()}</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, uppercase: true }}>Avg. Trip Budget</span>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>
            ₹{activeTrips.length ? Math.round(totalBudget / activeTrips.length).toLocaleString() : 0}
          </span>
        </div>
      </section>

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Workspace Dashboard</h2>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
        >
          ➕ Plan New Trip
        </Button>
      </div>

      {/* Creation Modal form */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          if (location.search) navigate(location.pathname, { replace: true });
        }}
        title="Plan a New Adventure"
        maxWidth="600px"
      >
        {formError && (
          <div style={{ color: 'white', background: 'rgba(255, 75, 75, 0.15)', border: '1px solid red', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Input
            label="Trip Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kyoto Escapade"
            required
          />
          <Input
            label="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Japan"
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <Input
            label="Budget (₹)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="50000"
            required
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => {
              setShowCreateForm(false);
              if (location.search) navigate(location.pathname, { replace: true });
            }}>
              Cancel
            </Button>
            <Button type="submit">
              🚀 Create Route
            </Button>
          </div>
        </form>
      </Modal>

      {/* 1. FAVORITES SECTION */}
      {favoriteTrips.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>❤️ Favorites</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {favoriteTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => navigate(`/trip/${trip.id}`)}
                onDelete={() => handleDelete(trip.id)}
                onToggleFavorite={() => handleToggleFavorite(trip.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. UPCOMING TRIPS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--secondary))' }}>✈️ Upcoming Adventures</h3>
        {upcomingTrips.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {upcomingTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => navigate(`/trip/${trip.id}`)}
                onDelete={() => handleDelete(trip.id)}
                onToggleFavorite={() => handleToggleFavorite(trip.id)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            No upcoming trips planned. Click "Plan New Trip" to schedule an adventure!
          </div>
        )}
      </section>

      {/* 3. PAST JOURNEYS */}
      {pastTrips.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>🕰️ Past Journeys</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem',
            opacity: 0.8
          }}>
            {pastTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => navigate(`/trip/${trip.id}`)}
                onDelete={() => handleDelete(trip.id)}
                onToggleFavorite={() => handleToggleFavorite(trip.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State Fallback (when total trips is 0) */}
      {activeTrips.length === 0 && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🗺️</span>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Your travel canvas is empty</p>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
            Create a trip outline above to get started with routes, budgets, and schedules.
          </p>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
