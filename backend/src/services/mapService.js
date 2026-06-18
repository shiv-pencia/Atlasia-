export const mapService = {
  searchPlaces: async (query) => {
    // Return a mock collection of popular travel cities matching query
    const results = [
      { id: 'p1', name: 'Kyoto, Japan', coordinates: { lat: 35.0116, lng: 135.7681 } },
      { id: 'p2', name: 'Tokyo, Japan', coordinates: { lat: 35.6762, lng: 139.6503 } },
      { id: 'p3', name: 'Zermatt, Switzerland', coordinates: { lat: 46.0207, lng: 7.7491 } },
      { id: 'p4', name: 'Paris, France', coordinates: { lat: 48.8566, lng: 2.3522 } },
      { id: 'p5', name: 'New York City, NY, USA', coordinates: { lat: 40.7128, lng: -74.0060 } }
    ];

    if (!query) return [];
    return results.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  },

  getPlaceDetails: async (placeId) => {
    const places = {
      p1: { id: 'p1', name: 'Kyoto, Japan', coordinates: { lat: 35.0116, lng: 135.7681 }, description: 'Historic temples and gardens' },
      p2: { id: 'p2', name: 'Tokyo, Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, description: 'Neon skyscrapers and pop culture hubs' },
      p3: { id: 'p3', name: 'Zermatt, Switzerland', coordinates: { lat: 46.0207, lng: 7.7491 }, description: 'Alpine wonderland and the Matterhorn' },
      p4: { id: 'p4', name: 'Paris, France', coordinates: { lat: 48.8566, lng: 2.3522 }, description: 'City of romance, art, and cafes' },
      p5: { id: 'p5', name: 'New York City, NY, USA', coordinates: { lat: 40.7128, lng: -74.0060 }, description: 'The Big Apple: Broadway and Central Park' }
    };

    return places[placeId] || { id: placeId, name: 'Custom Point', coordinates: { lat: 0, lng: 0 }, description: 'Custom coordinates marker' };
  },

  getRouteDirections: async (origin, destination) => {
    return {
      origin,
      destination,
      distance: '154 km',
      duration: '2 hours 15 mins',
      routePoints: [
        { lat: 35.0116, lng: 135.7681 },
        { lat: 35.3606, lng: 138.7274 },
        { lat: 35.6762, lng: 139.6503 }
      ]
    };
  },

  getWeather: async ({ lat, lng, q }) => {
    // Generate simple mock weather data based on coordinates or query
    const locationName = q || (lat && lng ? `Coords: ${lat}, ${lng}` : 'Kyoto, Japan');
    return {
      location: locationName,
      temperature: '24°C',
      condition: 'Partly Cloudy',
      humidity: '60%',
      windSpeed: '12 km/h',
      forecast: [
        { day: 'Today', temp: '24°C', cond: 'Cloudy' },
        { day: 'Tomorrow', temp: '26°C', cond: 'Sunny' },
        { day: 'Day After', temp: '25°C', cond: 'Rainy' }
      ]
    };
  }
};

export default mapService;
