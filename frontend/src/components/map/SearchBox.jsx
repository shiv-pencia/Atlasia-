import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { mapApi } from '../../api/mapApi';

export const SearchBox = ({ onSelectPlace, placeholder = 'Search location...' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const results = await mapApi.searchPlaces(debouncedQuery);
        setSuggestions(results);
      } catch (err) {
        console.error('Failed to load places', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelect = (place) => {
    setQuery(place.name);
    setSuggestions([]);
    setIsOpen(false);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="form-input"
        style={{ width: '100%', paddingRight: '2.5rem' }}
      />
      {isLoading && (
        <span style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.8rem',
          color: 'hsl(var(--text-muted))'
        }}>
          ⏳
        </span>
      )}
      
      {isOpen && suggestions.length > 0 && (
        <ul className="glass-panel" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          maxHeight: '200px',
          overflowY: 'auto',
          listStyle: 'none',
          padding: '0.5rem 0',
          zIndex: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          background: 'rgba(26, 29, 38, 0.95)'
        }}>
          {suggestions.map((place) => (
            <li
              key={place.id}
              onClick={() => handleSelect(place)}
              style={{
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              📍 {place.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
