import { useState, useMemo, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { FeedCard } from '@/components/FeedCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { Announcements } from '@/components/Announcements';
import { fetchEvents, type Event, type EventFilters } from '@/services/eventService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSchema, WebsiteSchema } from '@/components/StructuredData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PostDetail } from '@/components/PostDetail';
import { Calendar } from 'lucide-react';

const Index = () => {
  useEffect(() => {
    document.title = 'EventDekho - Discover Community Events Near You';
  }, []);

  const [filters, setFilters] = useState<EventFilters>({
    category: 'all',
    query: '',
  });

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventData, setSelectedEventData] = useState<Event | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query || '');
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Load events from backend whenever debounced filters change
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const searchFilters = { ...filters, query: debouncedQuery };
        const fetchedEvents = await fetchEvents(searchFilters);
        setEvents(fetchedEvents);
      } catch (err: any) {
        console.error('Failed to load feed data:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedQuery, filters.category]);

  const handleFilterChange = (newFilters: EventFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleEventClick = (event: Event) => {
    setSelectedEventData(event);
    setSelectedEventId(event.id);
    // Optional: Update URL history without navigation
    window.history.pushState({}, '', `/post/${event.id}`);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
    setSelectedEventData(null);
    window.history.pushState({}, '', '/');
  };

  const [activeCategory, setActiveCategory] = useState('all');
  
  // Client-side search with highlighting
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(event => event.category === activeCategory);
    }
    
    // Filter by search query (client-side)
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.organizerName.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [events, activeCategory, debouncedQuery]);

  // Function to highlight text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-300 text-black font-medium">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <div className="min-h-screen pb-20 md:pb-0 bg-background">
        <Navbar searchQuery={filters.query} onSearchChange={handleSearchChange} />

        <main className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-6 sm:py-8">
          <div className="flex gap-6 lg:gap-8">
            {/* Left Sidebar - Profile */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <ProfileSidebar />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-2xl mx-auto">
              <header className="mb-4 xs:mb-6 sm:mb-8">
                <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Discover Community Events</h1>
                <p className="text-xs xs:text-sm sm:text-base text-muted-foreground">Find and participate in events from schools, NGOs, and organizations near you</p>
              </header>

              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
                <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 p-1 h-11 xs:h-12 border">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs xs:text-sm whitespace-nowrap">All</TabsTrigger>
                  <TabsTrigger value="academic_tech" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs xs:text-sm whitespace-nowrap">Academic & Tech</TabsTrigger>
                  <TabsTrigger value="leadership_literary" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs xs:text-sm whitespace-nowrap">Leadership & Literary</TabsTrigger>
                  <TabsTrigger value="sports_fitness" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs xs:text-sm whitespace-nowrap">Sports & Fitness</TabsTrigger>
                  <TabsTrigger value="creative_arts" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs xs:text-sm whitespace-nowrap">Creative Arts</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Error Loading Events</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Events Feed - Instagram Style Single Column */}
              {!loading && !error && (
                <div className="space-y-6 xs:space-y-8 sm:space-y-10">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <FeedCard key={event.id} event={event} onEventClick={() => handleEventClick(event)} searchQuery={debouncedQuery} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No events found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters or check back later</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Sidebar - Announcements */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <Announcements limit={5} />
            </div>
          </div>
        </main>

        <FloatingActionButton />
        <MobileNav />

        {/* Post Detail Modal */}
        <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && handleCloseModal()}>
          <DialogContent className="max-w-[95vw] lg:max-w-[90rem] p-0 border-none bg-transparent shadow-none overflow-hidden h-[90vh] lg:h-auto">
            {selectedEventId && (
              <PostDetail
                eventId={selectedEventId}
                initialEvent={selectedEventData}
                isModal={true}
                onClose={handleCloseModal}
                className="h-full lg:h-[85vh]"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Index;
