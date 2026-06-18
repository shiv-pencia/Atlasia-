import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../features/trip/store';
import { formatDate } from '../utils/formatDate';
import { calculateBudgetSummary } from '../utils/calculateBudget';
import { useDebounce } from '../hooks/useDebounce';
import { mapApi } from '../api/mapApi';
import { aiApi } from '../api/aiApi';

// Shared UI & Map Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MapView from '../components/map/MapView';
import Marker from '../components/map/Marker';
import RouteLayer from '../components/map/RouteLayer';
import SearchBox from '../components/map/SearchBox';

export const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedTrip, isLoading, error, fetchTripDetails, updateTrip, addItineraryItem, addExpense, deleteExpense, generateAiItinerary } = useTripStore();

  // Active tab state
  const [activeTab, setActiveTab] = useState('itinerary');

  // Chat/AI states
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [itineraryGenerating, setItineraryGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // Input states
  const [itineraryTitle, setItineraryTitle] = useState('');
  const [itineraryTime, setItineraryTime] = useState('');
  const [itineraryDesc, setItineraryDesc] = useState('');
  const [itineraryLoc, setItineraryLoc] = useState('');

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');

  // Notes state
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved');
  const debouncedNotes = useDebounce(notes, 1000);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    fetchTripDetails(id);
  }, [id, fetchTripDetails]);

  // Fallback to empty structure if no trip selected in store yet
  const activeTrip = selectedTrip?.id === id ? selectedTrip : {
    id,
    title: 'Loading Trip Details...',
    destination: '',
    startDate: '',
    endDate: '',
    budget: 0,
    expenses: [],
    itinerary: [],
    coverUrl: '',
    notes: ''
  };

  // Pre-fill custom prompt based on current trip parameters
  useEffect(() => {
    if (activeTrip && activeTrip.destination) {
      const days = Math.max(1, Math.ceil((new Date(activeTrip.endDate) - new Date(activeTrip.startDate)) / (1000 * 60 * 60 * 24))) || 3;
      setCustomPrompt(`Plan a ${days}-day trip to ${activeTrip.destination} with budget ₹${activeTrip.budget || 15000}`);
    }
  }, [activeTrip?.id, activeTrip?.destination]);

  // Sync notes from store on initial load
  useEffect(() => {
    if (selectedTrip && selectedTrip.id === id) {
      setNotes(selectedTrip.notes || '');
    }
  }, [selectedTrip, id]);

  // Auto-save notes on change
  useEffect(() => {
    const saveNotes = async () => {
      if (selectedTrip && selectedTrip.id === id && debouncedNotes !== (selectedTrip.notes || '')) {
        setSaveStatus('Saving...');
        try {
          await updateTrip(id, { notes: debouncedNotes });
          setSaveStatus('Saved');
        } catch (err) {
          setSaveStatus('Failed to save');
        }
      }
    };
    saveNotes();
  }, [debouncedNotes, id, selectedTrip, updateTrip]);

  // Fetch weather when destination is loaded
  useEffect(() => {
    const fetchWeather = async () => {
      const dest = activeTrip.destination || activeTrip.destinations?.[0];
      if (!dest) return;
      setWeatherLoading(true);
      try {
        const weatherData = await mapApi.getWeather({ q: dest });
        setWeather(weatherData);
      } catch (err) {
        console.error('Failed to load weather forecast', err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [activeTrip.destination, activeTrip.destinations]);

  const { totalBudget, totalSpent, remaining, percentSpent } = calculateBudgetSummary(
    activeTrip.budget,
    activeTrip.expenses
  );

  const handleAddItinerary = async (e) => {
    e.preventDefault();
    if (!itineraryTitle || !itineraryTime) return;

    const newItem = {
      time: itineraryTime,
      title: itineraryTitle,
      desc: itineraryDesc,
      loc: itineraryLoc
    };

    try {
      await addItineraryItem(activeTrip.id, newItem);
      setItineraryTitle('');
      setItineraryTime('');
      setItineraryDesc('');
      setItineraryLoc('');
    } catch (err) {
      alert(err.message || 'Failed to add event');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    const newExp = {
      title: expenseTitle,
      amount: Number(expenseAmount),
      category: expenseCategory
    };

    try {
      await addExpense(activeTrip.id, newExp);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseCategory('Food');
    } catch (err) {
      alert(err.message || 'Failed to log expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(activeTrip.id, expenseId);
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleSelectPlace = async (place) => {
    const newItem = {
      time: 'TBA',
      title: `Visit ${place.name}`,
      desc: place.description || 'Exploration point',
      loc: place.name
    };
    try {
      await addItineraryItem(activeTrip.id, newItem);
    } catch (err) {
      alert(err.message || 'Failed to pin location');
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const response = await aiApi.chat(activeTrip.id, userMessage, chatHistory);
      setChatHistory((prev) => [...prev, { sender: 'bot', text: response.text }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory((prev) => [...prev, { sender: 'bot', text: '⚠️ Failed to connect to Gemini API. Please make sure the server is online.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateAiItinerary = async () => {
    if (!customPrompt.trim()) return;
    setItineraryGenerating(true);
    setGeneratedPlan(null);
    try {
      const response = await aiApi.generateTripPlan(customPrompt);
      if (response && response.success) {
        let planData = response.data;
        if (typeof planData === 'string') {
          try {
            let cleanJson = planData.trim();
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }
            planData = JSON.parse(cleanJson);
          } catch (e) {
            console.error('Failed to parse AI response as JSON:', e);
            // Fallback structure: display raw response in day1 list
            planData = {
              day1: [planData],
              estimatedBudget: { Info: "Could not parse JSON. Shown raw reply." },
              packingList: []
            };
          }
        }
        setGeneratedPlan(planData);
      } else {
        throw new Error(response?.message || 'Failed to generate plan');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setItineraryGenerating(false);
    }
  };

  const handleApplyGeneratedPlan = async () => {
    if (!generatedPlan) return;

    const timelineEvents = [];
    Object.keys(generatedPlan).forEach(key => {
      if (key.toLowerCase().startsWith('day') && Array.isArray(generatedPlan[key])) {
        const dayNum = key.replace(/\D/g, '');
        generatedPlan[key].forEach((act, index) => {
          let title = 'Suggested Activity';
          let desc = 'AI suggested plan';
          let time = `Day ${dayNum} - Activity ${index + 1}`;

          if (act && typeof act === 'object') {
            title = act.title || act.activity || act.name || 'Suggested Activity';
            desc = act.desc || act.description || 'AI suggested plan';
            if (act.time) {
              time = `Day ${dayNum} - ${act.time}`;
            }
          } else if (act) {
            title = String(act);
          }

          timelineEvents.push({
            time,
            title,
            desc,
            loc: activeTrip.destination || 'Sightseeing'
          });
        });
      }
    });

    try {
      setItineraryGenerating(true);
      await updateTrip(activeTrip.id, { itinerary: timelineEvents });
      setGeneratedPlan(null);
      setActiveTab('itinerary'); // Switch back to see the updated timeline!
    } catch (err) {
      alert(err.message || 'Failed to apply plan to timeline');
    } finally {
      setItineraryGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <section style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '220px',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.85)), url(${activeTrip.coverUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: '0.5rem'
      }}>
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="secondary"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.5)',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}
        >
          &larr; Back to Dashboard
        </Button>

        <span style={{ fontSize: '0.9rem', color: 'hsl(var(--secondary))', fontWeight: 600 }}>
          ✈️ TRIP TO {activeTrip.destination?.toUpperCase() || activeTrip.destinations?.[0]?.toUpperCase() || '...'}
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {activeTrip.title}
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-secondary))' }}>
          📅 {activeTrip.startDate ? formatDate(activeTrip.startDate) : '...'} - {activeTrip.endDate ? formatDate(activeTrip.endDate) : '...'}
        </p>
      </section>

      {/* Main Split Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Mock Interactive Map Canvas */}
        <section className="glass-panel" style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          height: '550px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Map Route Plan</h2>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Interactive spatial routing</p>
            </div>
            <div style={{ width: '200px' }}>
              <SearchBox onSelectPlace={handleSelectPlace} placeholder="Pin route point..." />
            </div>
          </div>

          {/* Interactive map view component */}
          <MapView 
            center={{ lat: 35.0116, lng: 135.7681 }} 
            zoom={12}
          >
            {/* Visual Route Points */}
            {(activeTrip.itinerary || []).slice(0, 3).map((item, index) => (
              <Marker
                key={item.id || index}
                index={index + 1}
                title={item.title}
                position={{ lat: 35.0116 - index * 0.05, lng: 135.7681 + index * 0.05 }}
              />
            ))}

            <RouteLayer points={activeTrip.itinerary || []} />

            {(!activeTrip.itinerary || activeTrip.itinerary.length === 0) && (
              <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                📍 Search and pin a location to begin routing
              </div>
            )}
          </MapView>

          <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', textAlign: 'center' }}>
            🌍 Coordinates locked in: <span style={{ color: 'white', fontWeight: 600 }}>{activeTrip.destination || 'Destination'} center</span>
          </div>
        </section>

        {/* Right Side: Itinerary, Expenses, Notes & Weather Tabs */}
        <section className="glass-panel" style={{ padding: '2rem', height: '550px', display: 'flex', flexDirection: 'column' }}>
          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            gap: '1rem',
            overflowX: 'auto'
          }}>
            <button 
              onClick={() => setActiveTab('itinerary')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'itinerary' ? 'white' : 'hsl(var(--text-muted))',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'itinerary' ? 700 : 500,
                cursor: 'pointer',
                paddingBottom: '0.5rem',
                borderBottom: activeTab === 'itinerary' ? '2px solid hsl(var(--primary))' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              📅 Timeline
            </button>
            <button 
              onClick={() => setActiveTab('expenses')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'expenses' ? 'white' : 'hsl(var(--text-muted))',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'expenses' ? 700 : 500,
                cursor: 'pointer',
                paddingBottom: '0.5rem',
                borderBottom: activeTab === 'expenses' ? '2px solid hsl(var(--primary))' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              💰 Expenses
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'notes' ? 'white' : 'hsl(var(--text-muted))',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'notes' ? 700 : 500,
                cursor: 'pointer',
                paddingBottom: '0.5rem',
                borderBottom: activeTab === 'notes' ? '2px solid hsl(var(--primary))' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              📝 Notes
            </button>
            <button 
              onClick={() => setActiveTab('weather')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'weather' ? 'white' : 'hsl(var(--text-muted))',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'weather' ? 700 : 500,
                cursor: 'pointer',
                paddingBottom: '0.5rem',
                borderBottom: activeTab === 'weather' ? '2px solid hsl(var(--primary))' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              ⛅ Weather
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'ai' ? 'white' : 'hsl(var(--text-muted))',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'ai' ? 700 : 500,
                cursor: 'pointer',
                paddingBottom: '0.5rem',
                borderBottom: activeTab === 'ai' ? '2px solid hsl(var(--primary))' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              ✨ AI Copilot
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Timeline Tab */}
            {activeTab === 'itinerary' && (
              <>
                {/* Add Itinerary item */}
                <form onSubmit={handleAddItinerary} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input 
                      placeholder="Event Title" 
                      value={itineraryTitle}
                      onChange={e => setItineraryTitle(e.target.value)}
                      required 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <Input 
                      placeholder="Location" 
                      value={itineraryLoc}
                      onChange={e => setItineraryLoc(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <Input 
                      placeholder="Time (e.g. 10:00 AM)" 
                      value={itineraryTime}
                      onChange={e => setItineraryTime(e.target.value)}
                      required 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input 
                      placeholder="Short Description" 
                      value={itineraryDesc}
                      onChange={e => setItineraryDesc(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <Button type="submit" style={{ gridColumn: 'span 2', padding: '0.5rem' }}>
                    ➕ Add Event
                  </Button>
                </form>

                {/* Itinerary Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {(activeTrip.itinerary || []).map((item, index) => (
                    <div key={item.id || index} style={{
                      display: 'flex',
                      gap: '1rem',
                      position: 'relative',
                      paddingBottom: '0.5rem'
                    }}>
                      <div style={{
                        color: 'hsl(var(--secondary))',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        width: '70px',
                        paddingTop: '0.2rem'
                      }}>
                        {item.time}
                      </div>
                      
                      <div style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.title}</h4>
                        {item.loc && <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.1rem' }}>📍 {item.loc}</p>}
                        {item.desc && <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginTop: '0.4rem' }}>{item.desc}</p>}
                      </div>
                    </div>
                  ))}

                  {(!activeTrip.itinerary || activeTrip.itinerary.length === 0) && (
                    <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '2rem' }}>
                      No scheduled events yet. Fill out the form above to add one!
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 2. Expenses Tab */}
            {activeTab === 'expenses' && (
              <>
                {/* Budget Summary Bar */}
                <div className="glass-panel" style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>Budget Spent: {percentSpent.toFixed(0)}%</span>
                    <span>₹{totalSpent} spent / ₹{totalBudget} limit</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percentSpent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                      borderRadius: '3px'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.2rem' }}>
                    <span>Remaining: ₹{remaining}</span>
                    <span>Status: {remaining > 0 ? '🟢 Under Budget' : '🔴 Over Budget'}</span>
                  </div>
                </div>

                {/* Add Expense Form */}
                <form onSubmit={handleAddExpense} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--border-color)',
                  alignItems: 'end'
                }}>
                  <div>
                    <Input 
                      placeholder="Item / Flight" 
                      value={expenseTitle}
                      onChange={e => setExpenseTitle(e.target.value)}
                      required 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      placeholder="Cost (₹)" 
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(e.target.value)}
                      required 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.25)', color: 'white', height: '45px', border: '1px solid var(--border-color)', borderRadius: '10px' }}
                  >
                    <option value="Food">🍔 Food</option>
                    <option value="Transport">✈️ Transport</option>
                    <option value="Accommodation">🏨 Hotel</option>
                    <option value="Leisure">🎭 Entertainment</option>
                    <option value="Other">🛍️ Other</option>
                  </select>
                  <Button type="submit" style={{ gridColumn: 'span 3', padding: '0.5rem' }}>
                    ➕ Log Expense
                  </Button>
                </form>

                {/* Expenses Ledger Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(activeTrip.expenses || []).map((exp) => (
                    <div key={exp.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{exp.title}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.08)',
                          color: 'hsl(var(--text-muted))',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          marginLeft: '0.5rem'
                        }}>
                          {exp.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>₹{exp.amount}</span>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'hsla(var(--color-danger), 0.7)',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!activeTrip.expenses || activeTrip.expenses.length === 0) && (
                    <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '2rem' }}>
                      No expenses logged yet. Create one above to track budgets!
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 3. Notes Tab */}
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                    Type to edit. Auto-saves in background.
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: saveStatus === 'Saving...' ? 'hsl(var(--secondary))' : saveStatus === 'Saved' ? 'green' : 'red',
                    fontWeight: 600
                  }}>
                    {saveStatus === 'Saving...' ? '⏳ Saving...' : saveStatus === 'Saved' ? '✓ Saved' : '⚠️ Save Failed'}
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setSaveStatus('Saving...');
                  }}
                  placeholder="Outline packing checklists, flight details, restaurant bookmarks, or other notes here..."
                  style={{
                    flex: 1,
                    minHeight: '280px',
                    padding: '1rem',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    color: 'white',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            )}

            {/* 4. Weather Tab */}
            {activeTab === 'weather' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {weatherLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
                    ⏳ Fetching climate details for {activeTrip.destination || 'destination'}...
                  </div>
                ) : weather ? (
                  <>
                    {/* Current Weather Box */}
                    <div className="glass-panel" style={{
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(123, 97, 255, 0.05) 100%)',
                      border: '1px solid hsla(var(--secondary), 0.3)'
                    }}>
                      <div>
                        <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{weather.temperature}</h4>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', marginTop: '0.2rem' }}>
                          ⛅ {weather.condition}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>
                          Location: {weather.location}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>💧 Humidity: {weather.humidity}</span>
                        <span>💨 Wind: {weather.windSpeed}</span>
                      </div>
                    </div>

                    {/* 3-day forecast */}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>3-Day Route Forecast</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {weather.forecast?.map((day, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.8rem 1.2rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.9rem'
                          }}>
                            <span style={{ fontWeight: 600 }}>{day.day}</span>
                            <span style={{ color: 'hsl(var(--text-secondary))' }}>{day.cond}</span>
                            <span style={{ fontWeight: 700, color: 'hsl(var(--secondary))' }}>{day.temp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                    Weather forecast details unavailable for this destination.
                  </div>
                )}
              </div>
            )}

            {/* 5. AI Copilot Tab */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
                {/* AI Itinerary Card */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)',
                  border: '1px solid hsla(var(--primary), 0.3)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>✨</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Smart Timeline Generator</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.4 }}>
                    Ask Gemini to generate a travel plan. You can edit the prompt below:
                  </p>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="form-input"
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Button 
                    onClick={handleGenerateAiItinerary}
                    disabled={itineraryGenerating || !customPrompt.trim()}
                    style={{
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {itineraryGenerating ? '⏳ Generating Plan...' : '🚀 Generate Plan with Gemini'}
                  </Button>
                </div>

                {/* Preview Card */}
                {generatedPlan && (
                  <div className="glass-panel" style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid hsla(var(--secondary), 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      📋 Preview AI Generated Plan
                    </h4>

                    {/* Day-by-day preview timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {Object.keys(generatedPlan).filter(k => k.toLowerCase().startsWith('day')).map(dayKey => {
                        const dayNum = dayKey.replace(/\D/g, '');
                        return (
                          <div key={dayKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>Day {dayNum}</span>
                            <ul style={{ paddingLeft: '1.25rem', margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              {Array.isArray(generatedPlan[dayKey]) && generatedPlan[dayKey].map((act, i) => {
                                if (!act) return null;
                                if (typeof act === 'object') {
                                  const text = act.title || act.activity || act.name || act.desc || JSON.stringify(act);
                                  const time = act.time ? ` (${act.time})` : '';
                                  return <li key={i}>{text}{time}</li>;
                                }
                                return <li key={i}>{String(act)}</li>;
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    {/* Budget & packing summary split */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', display: 'block', marginBottom: '0.25rem' }}>💰 Budget</span>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                           {generatedPlan.estimatedBudget && typeof generatedPlan.estimatedBudget === 'object' ? (
                            Object.entries(generatedPlan.estimatedBudget).map(([item, cost]) => {
                              let costStr = '';
                              if (cost && typeof cost === 'object') {
                                costStr = JSON.stringify(cost);
                              } else {
                                costStr = String(cost);
                              }
                              const displayCost = costStr.startsWith('₹') ? costStr : `₹${costStr}`;
                              return (
                                <div key={item} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <span style={{ textTransform: 'capitalize' }}>{item}:</span>
                                  <span style={{ color: 'white', fontWeight: 600 }}>{displayCost}</span>
                                </div>
                              );
                            })
                          ) : (
                            <span>Not specified</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', display: 'block', marginBottom: '0.25rem' }}>🎒 Packing List</span>
                        <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                          <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            {Array.isArray(generatedPlan.packingList) ? (
                              generatedPlan.packingList.map((item, i) => {
                                if (!item) return null;
                                if (typeof item === 'object') {
                                  const text = item.item || item.name || JSON.stringify(item);
                                  return <li key={i}>{text}</li>;
                                }
                                return <li key={i}>{String(item)}</li>;
                              })
                            ) : (
                              <li>Not specified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Apply Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button 
                        onClick={handleApplyGeneratedPlan}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          fontSize: '0.8rem',
                          background: 'hsl(var(--primary))'
                        }}
                      >
                        ✅ Apply to Itinerary
                      </Button>
                      <Button 
                        onClick={() => setGeneratedPlan(null)}
                        variant="secondary"
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Chat Window */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  minHeight: '220px'
                }}>
                  {/* Chat Header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--secondary))' }}>
                      💬 Destination Copilot
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                      Powered by Gemini
                    </span>
                  </div>

                  {/* Message History */}
                  <div style={{
                    flex: 1,
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    {chatHistory.length === 0 && (
                      <div style={{
                        margin: 'auto',
                        textAlign: 'center',
                        color: 'hsl(var(--text-muted))',
                        padding: '1rem',
                        maxWidth: '280px',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🤖</span>
                        Ask anything about <strong>{activeTrip.destination || 'your destination'}</strong>! Try: "What should I pack?" or "Recommend top dinner spots."
                      </div>
                    )}

                    {chatHistory.map((msg, index) => (
                      <div 
                        key={index}
                        style={{
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          padding: '0.6rem 0.9rem',
                          borderRadius: '12px',
                          fontSize: '0.88rem',
                          lineHeight: 1.4,
                          background: msg.sender === 'user' ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.04)',
                          border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                          color: 'white',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.text}
                      </div>
                    ))}

                    {chatLoading && (
                      <div style={{
                        alignSelf: 'flex-start',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        color: 'hsl(var(--text-muted))',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)'
                      }}>
                        ⏳ Copilot is thinking...
                      </div>
                    )}
                  </div>

                  {/* Chat Input Area */}
                  <form onSubmit={handleSendChatMessage} style={{
                    display: 'flex',
                    borderTop: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the travel assistant..."
                      disabled={chatLoading}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'white',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.9rem'
                      }}
                    />
                    <Button 
                      type="submit" 
                      disabled={chatLoading || !chatInput.trim()}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    >
                      Send
                    </Button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
};

export default TripDetails;
