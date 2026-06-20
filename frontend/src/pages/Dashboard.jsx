import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTripStore } from '../store/tripStore';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatDate';
import { aiApi } from '../api/aiApi';
import TravelVibeAnimation from '../components/TravelVibeAnimation';

// Shared Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import TripCard from '../components/cards/TripCard';

export const Dashboard = () => {
  const { trips, isLoading, error, fetchTrips, createTrip, deleteTrip, toggleFavorite, invitations, fetchInvitations, respondToInvitation } = useTripStore();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [source, setSource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [formError, setFormError] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchTrips();
    fetchInvitations();
  }, [fetchTrips, fetchInvitations]);

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

    if (!title || !destination || !source || !startDate || !endDate || !budget) {
      setFormError('Please fill in all fields.');
      return;
    }

    setIsPlanning(true);

    try {
      // 1. Calculate number of days
      const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))) || 3;
      
      // 2. Generate itinerary with Gemini AI
      const prompt = `Plan a ${days}-day trip to ${destination} starting from ${source} with a budget of ₹${budget}.`;
      let itineraryItems = [];

      try {
        const aiResponse = await aiApi.generateTripPlan(prompt);
        if (aiResponse && aiResponse.success) {
          let planData = aiResponse.data;
          if (typeof planData === 'string') {
            try {
              let cleanJson = planData.trim();
              const firstBrace = cleanJson.indexOf('{');
              const lastBrace = cleanJson.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
              }
              planData = JSON.parse(cleanJson);
            } catch (jsonErr) {
              console.error('Failed to parse AI response JSON in dashboard:', jsonErr);
              planData = null;
            }
          }

          if (planData && typeof planData === 'object') {
            // Process the AI plan into itinerary subdocuments
            Object.keys(planData).forEach(key => {
              if (key.toLowerCase().startsWith('day') && Array.isArray(planData[key])) {
                const dayNum = key.replace(/\D/g, '');
                planData[key].forEach((act, index) => {
                  let actTitle = 'Suggested Activity';
                  let desc = 'AI suggested plan';
                  let time = `Day ${dayNum} - Activity ${index + 1}`;

                  if (act && typeof act === 'object') {
                    actTitle = act.title || act.activity || act.name || 'Suggested Activity';
                    desc = act.desc || act.description || 'AI suggested plan';
                    if (act.time) {
                      time = `Day ${dayNum} - ${act.time}`;
                    }
                  } else if (act) {
                    actTitle = String(act);
                  }

                  itineraryItems.push({
                    time,
                    title: actTitle,
                    desc,
                    loc: destination,
                    isAiSuggested: true
                  });
                });
              }
            });
          }
        }
      } catch (aiErr) {
        console.warn('AI planning failed, fallback to empty itinerary:', aiErr);
      }

      // 3. Create trip with the itinerary and source
      const createdTrip = await createTrip({
        title,
        destination,
        source,
        startDate,
        endDate,
        budget: Number(budget),
        expenses: [],
        itinerary: itineraryItems
      });

      // Reset form
      setTitle('');
      setDestination('');
      setSource('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setShowCreateForm(false);
      
      // Navigate to the newly created trip details page!
      if (createdTrip && createdTrip.id) {
        navigate(`/trip/${createdTrip.id}`);
      } else {
        navigate(location.pathname, { replace: true });
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create trip.');
    } finally {
      setIsPlanning(false);
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
      
      {/* Travel Vibe Animation Banner */}
      <TravelVibeAnimation />
      
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
            disabled={isPlanning}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Origin (Starting Point)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Tokyo"
              required
              disabled={isPlanning}
            />
            <Input
              label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kyoto"
              required
              disabled={isPlanning}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isPlanning}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={isPlanning}
            />
          </div>
          <Input
            label="Budget (₹)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="50000"
            required
            disabled={isPlanning}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => {
              setShowCreateForm(false);
              if (location.search) navigate(location.pathname, { replace: true });
            }} disabled={isPlanning}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPlanning}>
              {isPlanning ? '🤖 AI is planning...' : '🚀 Create & Plan Trip'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 1. PENDING INVITATIONS SECTION */}
      {invitations && invitations.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📩 Pending Trip Invitations ({invitations.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {invitations.map((trip) => {
              const activeInvitation = (trip.invitations || []).find(inv => inv.email === user?.email && inv.status === 'pending');
              const invitationId = activeInvitation ? (activeInvitation.id || activeInvitation._id) : null;
              
              return (
                <div key={trip.id} className="glass-panel" style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%), rgba(26, 29, 38, 0.5)',
                  border: '1px solid hsla(var(--primary), 0.3)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--secondary))', fontWeight: 700 }}>
                      INVITED BY {trip.userId?.name ? trip.userId.name.toUpperCase() : 'A FRIEND'} ({trip.userId?.email || ''})
                    </span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.2rem 0' }}>{trip.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', margin: 0 }}>
                      📍 {trip.destination} | 📅 {trip.startDate ? formatDate(trip.startDate) : ''} - {trip.endDate ? formatDate(trip.endDate) : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Button 
                      onClick={() => respondToInvitation(invitationId, 'accepted')}
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem' }}
                    >
                      Accept
                    </Button>
                    <Button 
                      onClick={() => respondToInvitation(invitationId, 'declined')}
                      variant="secondary"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem', background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.2)', color: 'hsl(var(--color-danger))' }}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
