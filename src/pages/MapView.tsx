import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchEvents, Event } from '@/services/eventService';
import { geocodeLocation, GeocodingResult } from '@/lib/geocoding';
import { Loader2, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { SEOHead } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EventWithCoordinates {
  event: Event;
  coordinates: GeocodingResult;
}

const MapView = () => {
  const navigate = useNavigate();
  const [eventsWithCoords, setEventsWithCoords] = useState<EventWithCoordinates[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCoordinates | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20.5937, 78.9629]); // India center

  useEffect(() => {
    const loadEventsWithCoordinates = async () => {
      setLoading(true);
      try {
        const events = await fetchEvents();
        const approvedEvents = events.filter(event => event.approved);

        const coordsPromises = approvedEvents.map(async (event) => {
          const coords = await geocodeLocation(event.location);
          return coords ? { event, coordinates: coords } : null;
        });

        const results = await Promise.all(coordsPromises);
        const validEvents = results.filter((item): item is EventWithCoordinates => item !== null);

        setEventsWithCoords(validEvents);

        // Set initial center to first event
        if (validEvents.length > 0) {
          setMapCenter([validEvents[0].coordinates.lat, validEvents[0].coordinates.lon]);
          setSelectedEvent(validEvents[0]);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventsWithCoordinates();
  }, []);

  const handleEventClick = (eventWithCoords: EventWithCoordinates) => {
    setSelectedEvent(eventWithCoords);
    setMapCenter([eventWithCoords.coordinates.lat, eventWithCoords.coordinates.lon]);
  };

  const categoryColors: Record<string, string> = {
    academic_tech: 'bg-blue-500',
    leadership_literary: 'bg-green-500',
    sports_fitness: 'bg-purple-500',
    creative_arts: 'bg-orange-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading event locations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Event Map - Find Events Near You | EventDekho"
        description="Explore community events on an interactive map. Discover schools, NGOs, and local organization events happening near your location across India."
        keywords="event map, find events near me, event locations, community events map, India events"
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-6">
          <Breadcrumb
            items={[
              { label: 'Event Map', href: '/map' }
            ]}
          />

          <header className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Explore Events on Map</h1>
            <p className="text-muted-foreground">
              Discover community events happening across India with our interactive map
            </p>
          </header>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Event List Sidebar */}
            <Card className="lg:col-span-1 p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Events ({eventsWithCoords.length})
              </h2>

              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {eventsWithCoords.map(({ event, coordinates }) => (
                    <Card
                      key={event.id}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md ${selectedEvent?.event.id === event.id ? 'ring-2 ring-primary' : ''
                        }`}
                      onClick={() => handleEventClick({ event, coordinates })}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={event.organizerAvatar} />
                          <AvatarFallback>{event.organizerName.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {event.organizerName}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`${categoryColors[event.category]} text-white mt-1 text-xs`}
                          >
                            {event.category}
                          </Badge>

                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>

                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Map */}
            <Card className="lg:col-span-2 p-0 overflow-hidden">
              <div className="h-[650px]">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {eventsWithCoords.map(({ event, coordinates }) => (
                    <Marker
                      key={event.id}
                      position={[coordinates.lat, coordinates.lon]}
                      eventHandlers={{
                        click: () => handleEventClick({ event, coordinates })
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            {event.organizerName}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`${categoryColors[event.category]} text-white text-xs mb-2`}
                          >
                            {event.category}
                          </Badge>
                          <p className="text-xs text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {coordinates.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => navigate(`/post/${event.id}`)}
                            className="text-xs text-primary hover:underline"
                          >
                            View Details →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default MapView;
