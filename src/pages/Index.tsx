import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { FeedCard } from '@/components/FeedCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { fetchEvents, fetchActiveAds, type Event, type SponsorAd, type EventFilters } from '@/services/eventService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSchema, WebsiteSchema } from '@/components/StructuredData';
import { SponsorAdCard } from '@/components/SponsorAdCard';
import { AdvancedFilters } from '@/components/AdvancedFilters';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PostDetail } from '@/components/PostDetail';

const Index = () => {
  useEffect(() => {
    document.title = 'EventDekho - Discover Community Events Near You';
  }, []);

  const [filters, setFilters] = useState<EventFilters>({
    category: 'all',
    query: '',
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [ads, setAds] = useState<SponsorAd[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventData, setSelectedEventData] = useState<Event | null>(null);

  // Load events and ads from backend whenever filters change
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [fetchedEvents, fetchedAds] = await Promise.all([
          fetchEvents(filters),
          fetchActiveAds()
        ]);
        setEvents(fetchedEvents);
        setAds(fetchedAds);
      } catch (err: any) {
        console.error('Failed to load feed data:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const handleFilterChange = (newFilters: EventFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const interleavedFeed = useMemo(() => {
    const feed: Array<{ type: 'event'; data: Event } | { type: 'ad'; data: SponsorAd }> = [];
    const adInterval = 4; // Place an ad every 4 events
    let adPointer = 0;

    for (let i = 0; i < events.length; i++) {
      feed.push({ type: 'event', data: events[i] });
      if ((i + 1) % adInterval === 0 && adPointer < ads.length) {
        feed.push({ type: 'ad', data: ads[adPointer] });
        adPointer++;
      }
    }

    // Append remaining ads if they haven't been shown
    while (adPointer < ads.length) {
      feed.push({ type: 'ad', data: ads[adPointer] });
      adPointer++;
    }

    return feed;
  }, [events, ads]);

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

  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <div className="min-h-screen pb-20 md:pb-0">
        <Navbar searchQuery={filters.query || ''} onSearchChange={handleSearchChange} />

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <header className="mb-6">
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Discover Community Events</h1>
            <p className="text-sm md:text-base text-muted-foreground">Find and participate in events from schools, NGOs, and organizations near you</p>
          </header>

          <AdvancedFilters onFilterChange={handleFilterChange} currentFilters={filters} />

          {/* Category Filters */}
          <Tabs
            value={filters.category || 'all'}
            onValueChange={(val) => handleFilterChange({ category: val })}
            className="mb-8"
          >
            <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 p-1 h-11 border">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="academic_tech" className="data-[state=active]:bg-primary data-[state=active]:text-white">Academic & Tech</TabsTrigger>
              <TabsTrigger value="leadership_literary" className="data-[state=active]:bg-primary data-[state=active]:text-white">Leadership & Literary</TabsTrigger>
              <TabsTrigger value="sports_fitness" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sports & Fitness</TabsTrigger>
              <TabsTrigger value="creative_arts" className="data-[state=active]:bg-primary data-[state=active]:text-white">Creative Arts</TabsTrigger>
            </TabsList>
          </Tabs>

          <section aria-label="Event feed" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>Error loading events: {error}</p>
              </div>
            ) : interleavedFeed.length > 0 ? (
              interleavedFeed.map((item, index) => (
                <article key={item.type === 'event' ? item.data.id : `ad-${item.data.id}-${index}`}>
                  {item.type === 'event' ? (
                    <FeedCard
                      event={item.data}
                      onEventClick={handleEventClick}
                    />
                  ) : (
                    <SponsorAdCard ad={item.data} />
                  )}
                </article>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No events found matching your search</p>
              </div>
            )}
          </section>
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
