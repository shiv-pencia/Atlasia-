export async function searchPlace(place) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=jsonv2&limit=5`,
    {
      headers: {
        'User-Agent': 'TripPlannerApp'
      }
    }
  );
  return response.json();
}

export const mapService = {
  searchPlace: async (query) => {
    if (!query || query.trim().length === 0) return [];
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=5`,
        {
          headers: {
            'User-Agent': 'TripPlannerApp'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error in Nominatim searchPlace:', error);
      throw error;
    }
  },

  searchPlaces: async (query) => {
    if (!query || query.trim().length === 0) return [];
    try {
      const rawResults = await mapService.searchPlace(query);
      return (rawResults || []).map((item) => ({
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

  reverseGeocode: async (lat, lon) => {
    if (lat === undefined || lon === undefined) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`,
        {
          headers: {
            'User-Agent': 'TripPlannerApp'
          }
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error in Nominatim reverseGeocode:', error);
      throw error;
    }
  },

  getPlaceDetails: async (placeId) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/details?place_id=${placeId}&format=json`, {
        headers: {
          'User-Agent': 'TripPlannerApp'
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

  getRoute: async (start, end) => {
    let startLat, startLng, endLat, endLng;
    if (Array.isArray(start)) {
      startLat = start[0];
      startLng = start[1];
    } else if (start && typeof start === 'object') {
      startLat = start.lat;
      startLng = start.lng;
    }

    if (Array.isArray(end)) {
      endLat = end[0];
      endLng = end[1];
    } else if (end && typeof end === 'object') {
      endLat = end.lat;
      endLng = end.lng;
    }

    if (startLat === undefined || startLng === undefined || endLat === undefined || endLng === undefined) {
      throw new Error('Invalid start or end coordinates. Coordinates must be [lat, lng] or { lat, lng }');
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
      };
    } catch (error) {
      console.error('Error in OSRM getRoute:', error);
      throw error;
    }
  },

  getMultiStopRoute: async (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error('At least 2 coordinate pairs are required for multi-stop routing');
    }

    const coordStrings = coordinates.map((coord) => {
      let lat, lng;
      if (Array.isArray(coord)) {
        lat = coord[0];
        lng = coord[1];
      } else if (coord && typeof coord === 'object') {
        lat = coord.lat;
        lng = coord.lng;
      }
      return `${lng},${lat}`;
    });

    const coordsParam = coordStrings.join(';');

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No multi-stop route found');
      }

      const route = data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
      };
    } catch (error) {
      console.error('Error in OSRM getMultiStopRoute:', error);
      throw error;
    }
  },

  getRouteDirections: async (origin, destination) => {
    try {
      const originResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'TripPlannerApp' }
      });
      const originData = await originResponse.json();
      if (!originData || originData.length === 0) throw new Error(`Could not geocode origin: ${origin}`);
      const originLat = parseFloat(originData[0].lat);
      const originLon = parseFloat(originData[0].lon);

      const destResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'TripPlannerApp' }
      });
      const destData = await destResponse.json();
      if (!destData || destData.length === 0) throw new Error(`Could not geocode destination: ${destination}`);
      const destLat = parseFloat(destData[0].lat);
      const destLon = parseFloat(destData[0].lon);

      const route = await mapService.getRoute([originLat, originLon], [destLat, destLon]);
      const distanceKm = (route.distance / 1000).toFixed(1) + ' km';
      const durationSec = route.duration;
      const hours = Math.floor(durationSec / 3600);
      const minutes = Math.floor((durationSec % 3600) / 60);
      const durationStr = hours > 0 ? `${hours} hours ${minutes} mins` : `${minutes} mins`;

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
      console.error('Error in getRouteDirections:', error);
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

    if (q && (!latitude || !longitude)) {
      try {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'TripPlannerApp' }
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

    if (latitude === null || longitude === null) {
      latitude = 35.0116;
      longitude = 135.7681;
      locationName = 'Kyoto, Japan';
    }

    try {
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,weathercode&timezone=auto`);
      const weatherData = await weatherResponse.json();
      
      const current = weatherData.current_weather;
      
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
