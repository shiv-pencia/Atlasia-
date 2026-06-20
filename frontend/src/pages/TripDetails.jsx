import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/tripStore';
import { formatDate } from '../utils/formatDate';
import { calculateBudgetSummary } from '../utils/calculateBudget';
import { useDebounce } from '../hooks/useDebounce';
import { mapApi } from '../api/mapApi';
import { aiApi } from '../api/aiApi';
import { useAuth } from '../hooks/useAuth';
import { getSocket } from '../services/socket';

// Shared UI Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedTrip, isLoading, error, fetchTripDetails, updateTrip, addItineraryItem, addExpense, deleteExpense, inviteUser } = useTripStore();
  const { user } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState('itinerary');

  // Chat/AI states
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [itineraryGenerating, setItineraryGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [newPlaces, setNewPlaces] = useState({}); // Text inputs for adding custom places per day
  const [customPlacesInput, setCustomPlacesInput] = useState('');

  // Input states
  const [itineraryTitle, setItineraryTitle] = useState('');
  const [itineraryTime, setItineraryTime] = useState('');
  const [itineraryDesc, setItineraryDesc] = useState('');
  const [itineraryLoc, setItineraryLoc] = useState('');

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseSpentBy, setExpenseSpentBy] = useState('');

  // Editing Itinerary Item states
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [editItineraryTitle, setEditItineraryTitle] = useState('');
  const [editItineraryTime, setEditItineraryTime] = useState('');
  const [editItineraryLoc, setEditItineraryLoc] = useState('');
  const [editItineraryDesc, setEditItineraryDesc] = useState('');

  // Invite Collaborator states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Notes state
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved');
  const debouncedNotes = useDebounce(notes, 1000);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Live Location states
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveLocations, setLiveLocations] = useState({});
  const geoWatchIdRef = React.useRef(null);
  const simIntervalRef = React.useRef(null);

  // Helper mapping common destination keywords to coordinates
  const getDestinationCoords = (dest) => {
    const d = dest?.toLowerCase() || '';
    if (d.includes('kyoto')) return { lat: 35.0116, lng: 135.7681 };
    if (d.includes('tokyo')) return { lat: 35.6762, lng: 139.6503 };
    if (d.includes('paris')) return { lat: 48.8566, lng: 2.3522 };
    if (d.includes('delhi')) return { lat: 28.6139, lng: 77.2090 };
    if (d.includes('mumbai')) return { lat: 19.0760, lng: 72.8777 };
    if (d.includes('bangalore') || d.includes('bengaluru')) return { lat: 12.9716, lng: 77.5946 };
    if (d.includes('goa')) return { lat: 15.2993, lng: 74.1240 };
    return { lat: 28.6139, lng: 77.2090 }; // Default fallback Delhi coordinates
  };

  // Start geolocation tracking
  const startSharing = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsSharingLocation(true);
    setIsSimulating(false);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const socketInstance = getSocket();
        if (socketInstance) {
          socketInstance.emit('update_location', {
            tripId: id,
            latitude,
            longitude
          });
        }
      },
      (error) => {
        console.error('🔴 Geolocation error:', error);
        // Only stop sharing if permission is denied, as other errors (like timeout) are transient
        if (error.code === error.PERMISSION_DENIED) {
          const msg = 'Location permission was denied. Please allow location access in your browser settings.';
          alert(msg);
          stopSharing();
        } else {
          console.warn('⚠️ Transient geolocation error:', error.message || error);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000
      }
    );

    geoWatchIdRef.current = watchId;
  };

  // Unified stop sharing for both real GPS and simulator
  const stopSharing = () => {
    if (navigator.geolocation && geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
    if (simIntervalRef.current !== null) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSharingLocation(false);
    setIsSimulating(false);

    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.emit('stop_location', { tripId: id });
    }
  };

  // Start location simulator (fallback for HTTP connections)
  const startSimulation = () => {
    setIsSharingLocation(true);
    setIsSimulating(true);

    const destCoords = getDestinationCoords(activeTrip.destination);
    let currentLat = destCoords.lat;
    let currentLng = destCoords.lng;

    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.emit('update_location', {
        tripId: id,
        latitude: currentLat,
        longitude: currentLng
      });
    }

    const intervalId = setInterval(() => {
      // Small random shifts to simulate movement
      currentLat += (Math.random() - 0.5) * 0.0003;
      currentLng += (Math.random() - 0.5) * 0.0003;

      if (socketInstance) {
        socketInstance.emit('update_location', {
          tripId: id,
          latitude: currentLat,
          longitude: currentLng
        });
      }
    }, 4000);

    simIntervalRef.current = intervalId;
  };

  // Listen to socket location events & handle reconnection sync
  useEffect(() => {
    const socketInstance = getSocket();
    if (!socketInstance || !id) return;

    const handleConnect = () => {
      console.log(`🔌 Socket connected/reconnected, joining trip: ${id}`);
      socketInstance.emit('join_trip', id);
      socketInstance.emit('request_locations', id);
      
      // If we were sharing location (either GPS or Simulation), force an immediate coordinate re-emit
      // so the server re-registers our location after a connection drop
      if (isSharingLocation && !isSimulating) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              socketInstance.emit('update_location', {
                tripId: id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              });
            },
            null,
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      }
    };

    socketInstance.on('connect', handleConnect);
    if (socketInstance.connected) {
      handleConnect();
    }

    const handleInitialLocations = (locationsArray) => {
      const locs = {};
      locationsArray.forEach(loc => {
        if (loc.userId !== user?.id) {
          locs[loc.userId] = loc;
        }
      });
      setLiveLocations(locs);
    };

    const handleLocationUpdated = (data) => {
      if (data.userId !== user?.id) {
        setLiveLocations(prev => ({
          ...prev,
          [data.userId]: data
        }));
      }
    };

    const handleLocationStopped = (data) => {
      setLiveLocations(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    socketInstance.on('initial_locations', handleInitialLocations);
    socketInstance.on('location_updated', handleLocationUpdated);
    socketInstance.on('location_stopped', handleLocationStopped);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('initial_locations', handleInitialLocations);
      socketInstance.off('location_updated', handleLocationUpdated);
      socketInstance.off('location_stopped', handleLocationStopped);
      socketInstance.emit('leave_trip', id);
    };
  }, [id, user?.id, isSharingLocation, isSimulating]);

  // Clean up sharing state on unmount
  useEffect(() => {
    return () => {
      if (navigator.geolocation && geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
      }
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.emit('stop_location', { tripId: id });
      }
    };
  }, [id]);

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

  // Fetch weather when destination changes
  useEffect(() => {
    if (!activeTrip) return;

    // 1. Fetch Weather
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
  }, [activeTrip.destination]);

  const { totalBudget, totalSpent, remaining, percentSpent } = calculateBudgetSummary(
    activeTrip.budget,
    activeTrip.expenses
  );

  const spentByBreakdown = (activeTrip.expenses || []).reduce((acc, exp) => {
    const person = (exp.spentBy || 'Me').trim();
    acc[person] = (acc[person] || 0) + (Number(exp.amount) || 0);
    return acc;
  }, {});

  const uniquePeople = Object.keys(spentByBreakdown);
  const numPeople = uniquePeople.length;
  const equalShare = numPeople > 0 ? totalSpent / numPeople : 0;

  // Calculate balances (positive means owed, negative means owes)
  const balances = {};
  uniquePeople.forEach(person => {
    balances[person] = spentByBreakdown[person] - equalShare;
  });

  // Calculate transactions to settle debts
  const transactions = [];
  if (numPeople > 1) {
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([name, bal]) => {
      if (bal < -0.01) {
        debtors.push({ name, amount: Math.abs(bal) });
      } else if (bal > 0.01) {
        creditors.push({ name, amount: bal });
      }
    });

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const minAmount = Math.min(debtor.amount, creditor.amount);
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(minAmount)
      });

      debtor.amount -= minAmount;
      creditor.amount -= minAmount;

      if (debtor.amount < 0.01) {
        dIdx++;
      }
      if (creditor.amount < 0.01) {
        cIdx++;
      }
    }
  }

  const handleAddItinerary = async (e) => {
    e.preventDefault();
    if (!itineraryTitle || !itineraryTime) return;

    const newItem = {
      time: itineraryTime,
      title: itineraryTitle,
      desc: itineraryDesc,
      loc: itineraryLoc,
      isAiSuggested: false // User Added
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

  const handleStartEditItinerary = (item) => {
    setEditingItineraryId(item.id || item._id);
    setEditItineraryTitle(item.title || '');
    setEditItineraryTime(item.time || '');
    setEditItineraryLoc(item.loc || '');
    setEditItineraryDesc(item.desc || '');
  };

  const handleCancelEditItinerary = () => {
    setEditingItineraryId(null);
  };

  const handleSaveEditItinerary = async (itemId) => {
    if (!editItineraryTitle.trim() || !editItineraryTime.trim()) return;

    const updatedItinerary = (activeTrip.itinerary || []).map((item) => {
      if ((item.id || item._id) === itemId) {
        return {
          ...item,
          title: editItineraryTitle.trim(),
          time: editItineraryTime.trim(),
          loc: editItineraryLoc.trim(),
          desc: editItineraryDesc.trim()
        };
      }
      return item;
    });

    try {
      await updateTrip(activeTrip.id, { itinerary: updatedItinerary });
      setEditingItineraryId(null);
    } catch (err) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount) return;

    const categoryEmojis = {
      Food: '🍔 Food',
      Transport: '✈️ Transport',
      Accommodation: '🏨 Accommodation',
      Leisure: '🎭 Entertainment',
      Other: '🛍️ Other'
    };

    const newExp = {
      title: categoryEmojis[expenseCategory] || expenseCategory,
      amount: Number(expenseAmount),
      category: expenseCategory,
      spentBy: expenseSpentBy.trim() || 'Me'
    };

    try {
      await addExpense(activeTrip.id, newExp);
      setExpenseAmount('');
      setExpenseCategory('Food');
      setExpenseSpentBy('');
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

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    if (!inviteEmail.trim()) return;

    try {
      await inviteUser(activeTrip.id, inviteEmail.trim());
      setInviteSuccess(`Invitation successfully sent to ${inviteEmail.trim()}!`);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    }
  };

  const handleDeleteItineraryItem = async (itemIdOrIndex) => {
    const updatedItinerary = (activeTrip.itinerary || []).filter((item, idx) => {
      if (typeof itemIdOrIndex === 'number') {
        return idx !== itemIdOrIndex;
      }
      return item.id !== itemIdOrIndex && item._id !== itemIdOrIndex;
    });

    try {
      await updateTrip(activeTrip.id, { itinerary: updatedItinerary });
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleDeleteDayPlan = (dayKey) => {
    if (!generatedPlan) return;
    const newPlan = { ...generatedPlan };
    delete newPlan[dayKey];
    setGeneratedPlan(newPlan);
  };

  const handleDeleteSuggestedPlace = (dayKey, index) => {
    if (!generatedPlan) return;
    const newPlan = { ...generatedPlan };
    if (Array.isArray(newPlan[dayKey])) {
      newPlan[dayKey] = newPlan[dayKey].filter((_, idx) => idx !== index);
      setGeneratedPlan(newPlan);
    }
  };

  const handleAddSuggestedPlace = (dayKey) => {
    const text = newPlaces[dayKey]?.trim();
    if (!text) return;
    if (!generatedPlan) return;

    const newPlan = { ...generatedPlan };
    if (!Array.isArray(newPlan[dayKey])) {
      newPlan[dayKey] = [];
    }
    newPlan[dayKey] = [...newPlan[dayKey], { title: text, desc: 'Custom added place', time: 'Flexible', isAiSuggested: false }];
    setGeneratedPlan(newPlan);
    setNewPlaces({ ...newPlaces, [dayKey]: '' });
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

  const handleGenerateCustomPlacesItinerary = async () => {
    if (!customPlacesInput.trim()) return;
    setItineraryGenerating(true);
    setGeneratedPlan(null);
    try {
      const days = Math.max(1, Math.ceil((new Date(activeTrip.endDate) - new Date(activeTrip.startDate)) / (1000 * 60 * 60 * 24))) || 3;
      const prompt = `Plan a ${days}-day trip to ${activeTrip.destination} starting from ${activeTrip.source || 'origin'} specifically including these places: ${customPlacesInput}.`;
      
      const response = await aiApi.generateTripPlan(prompt);
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
      alert(err.message || 'Failed to generate custom itinerary. Please try again.');
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
          let isAiSuggested = true;

          if (act && typeof act === 'object') {
            title = act.title || act.activity || act.name || 'Suggested Activity';
            desc = act.desc || act.description || 'AI suggested plan';
            if (act.time) {
              time = `Day ${dayNum} - ${act.time}`;
            }
            if (act.isAiSuggested === false) {
              isAiSuggested = false;
            }
          } else if (act) {
            title = String(act);
          }

          timelineEvents.push({
            time,
            title,
            desc,
            loc: activeTrip.destination || 'Sightseeing',
            isAiSuggested
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

  const tripOwnerId = activeTrip.userId?.id || activeTrip.userId?._id || activeTrip.userId;
  const isOwner = tripOwnerId && user?.id && tripOwnerId.toString() === user.id.toString();

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
          ✈️ TRIP FROM {activeTrip.source ? activeTrip.source.toUpperCase() : '...'} TO {activeTrip.destination?.toUpperCase() || activeTrip.destinations?.[0]?.toUpperCase() || '...'}
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {activeTrip.title}
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-secondary))' }}>
          📅 {activeTrip.startDate ? formatDate(activeTrip.startDate) : '...'} - {activeTrip.endDate ? formatDate(activeTrip.endDate) : '...'}
        </p>
      </section>

      {/* Collaboration and Members Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginTop: '-1rem'
      }}>
        {/* Members List */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            👥 Trip Collaborators
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Owner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeTrip.userId?.name || 'Owner'}</span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block' }}>{activeTrip.userId?.email || ''}</span>
              </div>
              <span style={{ fontSize: '0.7rem', background: 'rgba(0, 242, 254, 0.1)', color: 'hsl(var(--secondary))', border: '1px solid rgba(0,242,254,0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>OWNER</span>
            </div>

            {/* Members */}
            {(activeTrip.members || []).map((member) => (
              <div key={member.id || member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{member.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block' }}>{member.email}</span>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(123, 97, 255, 0.1)', color: 'hsl(var(--primary))', border: '1px solid rgba(123,97,255,0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>MEMBER</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Form (only visible to owner) */}
        {isOwner ? (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'white' }}>
              ✉️ Invite to Trip
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
              Share this trip workspace with another traveler by their registered email address.
            </p>
            <form onSubmit={handleInviteUser} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="email"
                placeholder="traveler@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="form-input"
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <Button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Invite
              </Button>
            </form>
            {inviteError && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-danger))' }}>⚠️ {inviteError}</span>}
            {inviteSuccess && <span style={{ fontSize: '0.75rem', color: 'green' }}>✓ {inviteSuccess}</span>}

            {/* Pending Invitations list */}
            {activeTrip.invitations && activeTrip.invitations.filter(i => i.status === 'pending').length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Pending Invites:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {activeTrip.invitations.filter(i => i.status === 'pending').map((inv, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'hsl(var(--text-secondary))', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      {inv.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '0.5rem', color: 'hsl(var(--text-muted))' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <span style={{ fontSize: '0.85rem' }}>Only the trip owner can invite other travelers.</span>
          </div>
        )}

        {/* Live Location Sharing Widget */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📍 Live Locations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!navigator.geolocation && (
              <div style={{
                fontSize: '0.75rem',
                color: 'hsl(38, 92%, 60%)',
                background: 'rgba(255, 152, 0, 0.08)',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                textAlign: 'left',
                lineHeight: '1.4'
              }}>
                ⚠️ Real-time GPS is restricted on insecure HTTP connections. Please use <strong>Simulate</strong> to test location updates on your device.
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              padding: '0.75rem',
              background: isSharingLocation ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: isSharingLocation ? '1px solid hsla(190, 95%, 50%, 0.3)' : '1px solid var(--border-color)',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', color: 'white' }}>
                    {isSharingLocation 
                      ? (isSimulating ? '🔵 Sharing: Simulated' : '🟢 Sharing: Real GPS')
                      : '⚪ Location Inactive'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>
                    {isSharingLocation ? 'Sharing with collaborators' : 'Location sharing offline'}
                  </span>
                </div>
                
                {isSharingLocation && (
                  <button
                    onClick={stopSharing}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, hsl(350, 89%, 60%) 0%, hsla(350, 89%, 60%, 0.8) 100%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      height: '32px',
                      minHeight: '32px'
                    }}
                  >
                    Stop
                  </button>
                )}
              </div>

              {!isSharingLocation && (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <button
                    disabled={!navigator.geolocation}
                    onClick={startSharing}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      height: '32px',
                      opacity: navigator.geolocation ? 1 : 0.4,
                      cursor: navigator.geolocation ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Share GPS
                  </button>
                  <button
                    onClick={startSimulation}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      border: '1px solid var(--border-color)',
                      fontWeight: 700,
                      height: '32px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    Simulate
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Collaborators Sharing ({Object.keys(liveLocations).length})
              </span>
              
              {Object.keys(liveLocations).length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.8rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                  No active live locations.
                </div>
              ) : (
                Object.values(liveLocations).map((loc) => (
                  <div key={loc.userId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'hsl(var(--secondary))',
                        animation: 'pulse-ring 1.5s infinite'
                      }} />
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', color: 'white' }}>{loc.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                          Lat: {loc.latitude?.toFixed(4)}, Lng: {loc.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'hsl(var(--secondary))',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        height: '28px',
                        minHeight: '28px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      🗺️ GMaps
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '2rem'
      }}>
        
        {/* Itinerary, Expenses, Notes & Weather Tabs */}
        <section className="glass-panel" style={{ padding: '2rem', minHeight: '550px', width: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <button 
              onClick={() => setActiveTab('custom-places')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'custom-places' ? 'white' : 'hsl(var(--text-muted))',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'custom-places' ? 700 : 500,
                cursor: 'pointer',
                paddingBottom: '0.5rem',
                borderBottom: activeTab === 'custom-places' ? '2px solid hsl(var(--primary))' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              🎯 Trip according to you
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
                      
                      {editingItineraryId === (item.id || item._id) ? (
                        <div style={{
                          flex: 1,
                          padding: '1rem',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid hsl(var(--primary))',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '0.2rem' }}>Title</label>
                              <Input 
                                placeholder="Event Title" 
                                value={editItineraryTitle}
                                onChange={e => setEditItineraryTitle(e.target.value)}
                                style={{ marginBottom: 0 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '0.2rem' }}>Time</label>
                              <Input 
                                placeholder="Time (e.g. 10:00 AM)" 
                                value={editItineraryTime}
                                onChange={e => setEditItineraryTime(e.target.value)}
                                style={{ marginBottom: 0 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '0.2rem' }}>Location</label>
                              <Input 
                                placeholder="Location" 
                                value={editItineraryLoc}
                                onChange={e => setEditItineraryLoc(e.target.value)}
                                style={{ marginBottom: 0 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '0.2rem' }}>Description</label>
                              <Input 
                                placeholder="Description" 
                                value={editItineraryDesc}
                                onChange={e => setEditItineraryDesc(e.target.value)}
                                style={{ marginBottom: 0 }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                            <Button 
                              onClick={() => handleSaveEditItinerary(item.id || item._id)}
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                            >
                              💾 Save
                            </Button>
                            <Button 
                              onClick={handleCancelEditItinerary}
                              variant="secondary"
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          flex: 1,
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{item.title}</h4>
                              {item.isAiSuggested ? (
                                <span style={{
                                  fontSize: '0.65rem',
                                  background: 'rgba(247, 85%, 60%, 0.15)',
                                  color: 'hsl(var(--primary))',
                                  border: '1px solid rgba(247, 85%, 60%, 0.3)',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  ✨ AI Suggested
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.65rem',
                                  background: 'rgba(190, 95%, 50%, 0.15)',
                                  color: 'hsl(var(--secondary))',
                                  border: '1px solid rgba(190, 95%, 50%, 0.3)',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  👤 User Added
                                </span>
                              )}
                            </div>
                            {item.loc && <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.1rem' }}>📍 {item.loc}</p>}
                            {item.desc && <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginTop: '0.4rem' }}>{item.desc}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              onClick={() => handleStartEditItinerary(item)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                padding: '0 4px',
                                marginTop: '0.1rem',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--secondary))'}
                              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                              title="Edit Event"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteItineraryItem(item.id || item._id || index)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                padding: '0 4px',
                                marginTop: '0.1rem',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--color-danger))'}
                              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                              title="Delete Event"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
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

                {/* Spending by Person Breakdown */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    👥 Spending Breakdown by Person
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {Object.entries(spentByBreakdown).map(([person, amount]) => {
                      const sharePercent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                      return (
                        <div key={person} style={{
                          flex: '1 1 150px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{person}</span>
                            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                              {sharePercent.toFixed(0)}%
                            </span>
                          </div>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--secondary))' }}>₹{amount.toLocaleString('en-IN')}</span>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem' }}>
                            <div style={{
                              width: `${sharePercent}%`,
                              height: '100%',
                              backgroundColor: 'hsl(var(--secondary))',
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(spentByBreakdown).length === 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', textAlign: 'center', width: '100%', padding: '0.5rem 0' }}>
                        No spending breakdown available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Splitwise Settlements Widget */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      🤝 Splitwise Settlements
                    </h4>
                    {numPeople > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                        Equal Share: <strong>₹{Math.round(equalShare).toLocaleString('en-IN')}</strong> per person
                      </span>
                    )}
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: numPeople > 1 ? '1fr 1fr' : '1fr', 
                    gap: '1rem', 
                    marginTop: '0.25rem' 
                  }}>
                    {/* Left Column: Balances list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRight: numPeople > 1 ? '1px solid var(--border-color)' : 'none', paddingRight: numPeople > 1 ? '1rem' : 0 }}>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase' }}>Individual Balances</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {Object.entries(balances).map(([person, bal]) => {
                          const isCreditor = bal > 0.01;
                          const isDebtor = bal < -0.01;
                          const formattedBal = Math.abs(Math.round(bal)).toLocaleString('en-IN');
                          
                          let badgeBg = 'rgba(255, 255, 255, 0.05)';
                          let badgeColor = 'hsl(var(--text-muted))';
                          let text = 'Settled';

                          if (isCreditor) {
                            badgeBg = 'rgba(0, 242, 254, 0.1)';
                            badgeColor = 'hsl(var(--secondary))';
                            text = `gets back ₹${formattedBal}`;
                          } else if (isDebtor) {
                            badgeBg = 'rgba(247, 85, 60, 0.1)';
                            badgeColor = 'hsl(var(--primary))';
                            text = `owes ₹${formattedBal}`;
                          }

                          return (
                            <div key={person} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(0,0,0,0.15)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.8rem'
                            }}>
                              <span style={{ fontWeight: 600, color: 'white' }}>{person}</span>
                              <span style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                background: badgeBg,
                                color: badgeColor,
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}>
                                {text}
                              </span>
                            </div>
                          );
                        })}
                        {numPeople === 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                            No balances calculated yet.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Settlement transactions */}
                    {numPeople > 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase' }}>How to Settle Debts</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
                          {transactions.map((tx, idx) => (
                            <div key={idx} style={{
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              color: 'white',
                              lineHeight: 1.4
                            }}>
                              👤 <strong style={{ color: 'hsl(var(--primary))' }}>{tx.from}</strong> pays <strong style={{ color: 'hsl(var(--secondary))' }}>{tx.to}</strong>: <span style={{ fontWeight: 800, color: 'white' }}>₹{tx.amount.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          {transactions.length === 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              fontSize: '0.8rem',
                              color: 'green',
                              fontWeight: 600,
                              fontStyle: 'italic',
                              padding: '1rem 0'
                            }}>
                              🎉 Everyone is perfectly settled!
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Expense Form */}
                <form onSubmit={handleAddExpense} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.2fr 1.5fr',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--border-color)',
                  alignItems: 'end'
                }}>
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
                  <div>
                    <Input 
                      placeholder="Who spent (e.g. John)" 
                      value={expenseSpentBy}
                      onChange={e => setExpenseSpentBy(e.target.value)}
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.25)', color: 'white', height: '45px', border: '1px solid var(--border-color)', borderRadius: '10px', width: '100%' }}
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
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'rgba(0, 242, 254, 0.08)',
                          color: 'hsl(var(--secondary))',
                          border: '1px solid rgba(0, 242, 254, 0.15)',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          marginLeft: '0.5rem',
                          fontWeight: 500
                        }}>
                          👤 {exp.spentBy || 'Me'}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              </div>
            )}

            {/* 6. Trip according to you Tab */}
            {activeTab === 'custom-places' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(123, 97, 255, 0.05) 100%)',
                  border: '1px solid hsla(var(--secondary), 0.3)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>🎯</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Trip according to you</h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.4 }}>
                    Specify the landmarks or places you absolutely want to visit, and Gemini will plan your trip around them. Enter them below (comma-separated):
                  </p>
                  <textarea
                    value={customPlacesInput}
                    onChange={(e) => setCustomPlacesInput(e.target.value)}
                    placeholder="e.g. Eiffel Tower, Louvre Museum, Notre Dame, Palace of Versailles"
                    className="form-input"
                    disabled={itineraryGenerating}
                    style={{
                      minHeight: '80px',
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '0.88rem',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                  <Button 
                    onClick={handleGenerateCustomPlacesItinerary}
                    disabled={itineraryGenerating || !customPlacesInput.trim()}
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
                    {itineraryGenerating ? '⏳ Customizing Plan...' : '🚀 Plan Trip with My Places'}
                  </Button>
                </div>
              </div>
            )}

            {/* Shared Preview Card (underneath either planning tab) */}
            {(activeTab === 'ai' || activeTab === 'custom-places') && generatedPlan && (
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {Object.keys(generatedPlan).filter(k => k.toLowerCase().startsWith('day')).map(dayKey => {
                    const dayNum = dayKey.replace(/\D/g, '');
                    return (
                      <div key={dayKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>Day {dayNum}</span>
                          <button 
                            onClick={() => handleDeleteDayPlan(dayKey)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255, 75, 75, 0.8)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,75,75,0.1)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            🗑️ Delete Day Plan
                          </button>
                        </div>

                        {/* List of suggested places */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                          {Array.isArray(generatedPlan[dayKey]) && generatedPlan[dayKey].map((act, i) => {
                            if (!act) return null;
                            let text = '';
                            let time = '';
                            let isAi = true;
                            if (typeof act === 'object') {
                              text = act.title || act.activity || act.name || act.desc || JSON.stringify(act);
                              time = act.time ? ` (${act.time})` : '';
                              if (act.isAiSuggested === false) {
                                isAi = false;
                              }
                            } else {
                              text = String(act);
                            }
                            return (
                              <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '6px',
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.8rem',
                                color: 'hsl(var(--text-secondary))'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span>• {text}{time}</span>
                                  {isAi ? (
                                    <span style={{ fontSize: '0.6rem', color: 'hsl(var(--primary))', background: 'rgba(247, 85%, 60%, 0.12)', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>AI</span>
                                  ) : (
                                    <span style={{ fontSize: '0.6rem', color: 'hsl(var(--secondary))', background: 'rgba(190, 95%, 50%, 0.12)', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>User</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteSuggestedPlace(dayKey, i)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    padding: '0 4px',
                                    transition: 'color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.color = 'hsl(var(--color-danger))'}
                                  onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                          
                          {(!Array.isArray(generatedPlan[dayKey]) || generatedPlan[dayKey].length === 0) && (
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', paddingLeft: '0.2rem' }}>
                              No activities for this day.
                            </div>
                          )}
                        </div>

                        {/* Add Place Inline Form */}
                        <div style={{ display: 'flex', gap: '0.4rem', paddingLeft: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Add custom place..."
                            value={newPlaces[dayKey] || ''}
                            onChange={(e) => setNewPlaces({ ...newPlaces, [dayKey]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSuggestedPlace(dayKey);
                              }
                            }}
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={() => handleAddSuggestedPlace(dayKey)}
                            style={{
                              background: 'hsl(var(--secondary))',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.25rem 0.6rem',
                              cursor: 'pointer',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            Add
                          </button>
                        </div>

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
            {activeTab === 'ai' && (
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
            )}

          </div>
        </section>

      </div>
    </div>
  );
};

export default TripDetails;
