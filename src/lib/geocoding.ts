export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

// Add a small delay to respect rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodeLocation = async (
  location: string
): Promise<GeocodingResult | null> => {
  // Basic validation
  const trimmed = location?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    // Check if it's a PIN code (6 digits)
    const isPincode = /^\d{6}$/.test(trimmed);
    const query = isPincode ? `postalcode=${trimmed}` : `q=${encodeURIComponent(trimmed)}`;
    
    // Add rate limiting
    await delay(1000); // Respect Nominatim's rate limit of 1 request per second

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    
    if (isPincode) {
      // For pincode search, use postalcode parameter
      url.searchParams.set('postalcode', trimmed);
      url.searchParams.set('country', 'India');
      url.searchParams.set('addressdetails', '1');
    } else {
      // For location search, use q parameter with location name
      url.searchParams.set('q', `${trimmed}, India`);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'EventDekho/1.0 (contact: admin@eventdekho.com)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://eventdekho.com'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geocoding API error:', response.status, errorText);
      // Return null instead of throwing to prevent unhandled promise rejections
      console.warn(`Geocoding failed for "${trimmed}" (${isPincode ? 'pincode' : 'location'}):`, errorText);
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      return {
        lat: parseFloat(first.lat),
        lon: parseFloat(first.lon),
        display_name: first.display_name
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
