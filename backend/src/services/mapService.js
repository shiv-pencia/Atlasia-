export async function searchPlace(place) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json`,
    {
      headers: {
        'User-Agent': 'AtlasiaTravelPlanner/1.0'
      }
    }
  );
  return response.json();
}

export const mapService = {
  searchPlaces: async (query) => {
    if (!query || query.trim().length === 0) return [];
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
        headers: {
          'User-Agent': 'AtlasiaTravelPlanner/1.0'
        }
      });
      const data = await response.json();
      
      return (data || []).map((item) => ({
        id: String(item.place_id),
        name: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }
      }));
    } catch (error) {
      console.error('Error in Nominatim searchPlaces:', error);
      return [];
    }
  },

  getPlaceDetails: async (placeId) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/details?place_id=${placeId}&format=json`, {
        headers: {
          'User-Agent': 'AtlasiaTravelPlanner/1.0'
        }
      });
      const data = await response.json();
      
      return {
        id: String(placeId),
        name: data.localname || data.names?.name || 'Custom Point',
        coordinates: {
          lat: parseFloat(data.centroid?.coordinates[1] || 0),
          lng: parseFloat(data.centroid?.coordinates[0] || 0)
        },
        description: data.addresstype || 'Point of Interest'
      };
    } catch (e) {
      console.error('Error fetching details from Nominatim:', e);
      return { 
        id: placeId, 
        name: 'Custom Point', 
        coordinates: { lat: 0, lng: 0 }, 
        description: 'Custom coordinates marker' 
      };
    }
  },

  getRouteDirections: async (origin, destination) => {
    if (!origin || !destination) return null;

    try {
      // 1. Geocode origin
      const originResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'AtlasiaTravelPlanner/1.0' }
      });
      const originData = await originResponse.json();
      if (!originData || originData.length === 0) throw new Error(`Could not geocode origin: ${origin}`);
      const originLat = parseFloat(originData[0].lat);
      const originLon = parseFloat(originData[0].lon);

      // 2. Geocode destination
      const destResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'AtlasiaTravelPlanner/1.0' }
      });
      const destData = await destResponse.json();
      if (!destData || destData.length === 0) throw new Error(`Could not geocode destination: ${destination}`);
      const destLat = parseFloat(destData[0].lat);
      const destLon = parseFloat(destData[0].lon);

      // 3. Query OSRM Routing API
      const osrmResponse = await fetch(`http://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`);
      const osrmData = await osrmResponse.json();

      if (!osrmData.routes || osrmData.routes.length === 0) {
        throw new Error('No routes found between these locations');
      }

      const route = osrmData.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1) + ' km';
      
      const durationSec = route.duration;
      const hours = Math.floor(durationSec / 3600);
      const minutes = Math.floor((durationSec % 3600) / 60);
      const durationStr = hours > 0 ? `${hours} hours ${minutes} mins` : `${minutes} mins`;

      // OSRM returns coordinates in [lng, lat] format, map to { lat, lng }
      const routePoints = route.geometry.coordinates.map((coord) => ({
        lat: coord[1],
        lng: coord[0]
      }));

      return {
        origin,
        destination,
        distance: distanceKm,
        duration: durationStr,
        routePoints
      };
    } catch (error) {
      console.error('Error in OSRM getRouteDirections:', error);
      // Fallback to coordinates
      return {
        origin,
        destination,
        distance: '150 km',
        duration: '2 hours',
        routePoints: [
          { lat: 35.0116, lng: 135.7681 },
          { lat: 35.6762, lng: 139.6503 }
        ]
      };
    }
  },

  getWeather: async ({ lat, lng, q }) => {
    let latitude = lat ? parseFloat(lat) : null;
    let longitude = lng ? parseFloat(lng) : null;
    let locationName = q || (latitude && longitude ? `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})` : 'Kyoto, Japan');

    // If query q is provided but no lat/lng, geocode it
    if (q && (!latitude || !longitude)) {
      try {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'AtlasiaTravelPlanner/1.0' }
        });
        const geoData = await geoResponse.json();
        if (geoData && geoData.length > 0) {
          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
          locationName = geoData[0].display_name;
        }
      } catch (e) {
        console.error('Error geocoding for weather:', e);
      }
    }

    // Default to Kyoto if we still don't have coords
    if (latitude === null || longitude === null) {
      latitude = 35.0116;
      longitude = 135.7681;
      locationName = 'Kyoto, Japan';
    }

    try {
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,weathercode&timezone=auto`);
      const weatherData = await weatherResponse.json();
      
      const current = weatherData.current_weather;
      
      // Map WMO weather codes to conditions
      const wmoCodes = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
      };

      const condition = current ? (wmoCodes[current.weathercode] || 'Partly Cloudy') : 'Partly Cloudy';
      const temperature = current ? `${Math.round(current.temperature)}°C` : '24°C';
      const windSpeed = current ? `${current.windspeed} km/h` : '12 km/h';

      // Generate 3-day forecast
      const daily = weatherData.daily;
      const forecast = [];
      if (daily && daily.time) {
        const daysLabel = ['Today', 'Tomorrow', 'Day After'];
        for (let i = 0; i < Math.min(3, daily.time.length); i++) {
          forecast.push({
            day: daysLabel[i] || daily.time[i],
            temp: `${Math.round(daily.temperature_2m_max[i])}°C`,
            cond: wmoCodes[daily.weathercode[i]] || 'Clear'
          });
        }
      } else {
        forecast.push(
          { day: 'Today', temp: temperature, cond: condition },
          { day: 'Tomorrow', temp: '26°C', cond: 'Clear' },
          { day: 'Day After', temp: '25°C', cond: 'Rainy' }
        );
      }

      return {
        location: locationName,
        temperature,
        condition,
        humidity: '60%',
        windSpeed,
        forecast
      };
    } catch (e) {
      console.error('Error fetching Open-Meteo weather:', e);
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
  }
};

export default mapService;
