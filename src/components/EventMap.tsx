import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeLocation, GeocodingResult } from '@/lib/geocoding';
import { Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EventMapProps {
  location: string;
  eventName: string;
  eventDate: string;
}

function MapUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  
  return null;
}

export const EventMap = ({ location, eventName, eventDate }: EventMapProps) => {
  const [coordinates, setCoordinates] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      setError(null);
      
      const result = await geocodeLocation(location);
      
      if (result) {
        setCoordinates(result);
      } else {
        setError('Location not found. Please verify the address or PIN code.');
      }
      
      setLoading(false);
    };

    if (location) {
      fetchCoordinates();
    }
  }, [location]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center p-4">
          <MapPin className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error || 'Unable to load map'}</p>
          <p className="text-xs text-muted-foreground">Location: {location}</p>
        </div>
      </div>
    );
  }

  const position: LatLngExpression = [coordinates.lat, coordinates.lon];

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={position} />
        <Marker position={position}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm mb-1">{eventName}</h3>
              <p className="text-xs text-muted-foreground mb-1">{coordinates.display_name}</p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date(eventDate).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
