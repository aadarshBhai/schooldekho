import { useState, useEffect } from 'react';
import { fetchAnnouncements, trackAnnouncementClick, type Announcement } from '@/services/announcementService';
import { ExternalLink, TrendingUp, Calendar, AlertCircle, Info, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categoryIcons = {
  general: Info,
  feature: TrendingUp,
  update: AlertCircle,
  event: Calendar,
  deadline: Clock,
};

const categoryColors = {
  general: 'bg-blue-100 text-blue-800',
  feature: 'bg-green-100 text-green-800',
  update: 'bg-orange-100 text-orange-800',
  event: 'bg-purple-100 text-purple-800',
  deadline: 'bg-red-100 text-red-800',
};

export const Announcements = ({ limit = 5 }: { limit?: number }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await fetchAnnouncements(undefined, limit);
        setAnnouncements(data);
      } catch (err: any) {
        console.error('Failed to load announcements:', err);
        setError(err.message || 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [limit]);

  const handleAnnouncementClick = async (announcement: Announcement) => {
    if (announcement.link) {
      // Track the click
      await trackAnnouncementClick(announcement.id);
      // Open in new tab
      window.open(announcement.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg mb-3">EventDekho Announcements</h3>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 border rounded-lg animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg mb-3">EventDekho Announcements</h3>
        <div className="p-4 border rounded-lg text-center text-muted-foreground bg-muted/30">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Unable to load announcements</p>
          <p className="text-xs">Check your connection or try again later</p>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg mb-3">EventDekho Announcements</h3>
        <div className="p-4 border rounded-lg text-center text-muted-foreground bg-muted/30">
          <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">No announcements yet</p>
          <p className="text-xs">Admins can share updates and news here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg mb-3">EventDekho Announcements</h3>
      
      <div className="space-y-3">
        {announcements.map((announcement) => {
          const IconComponent = categoryIcons[announcement.category];
          const categoryColor = categoryColors[announcement.category];
          
          return (
            <div
              key={announcement.id}
              className={`p-3 border rounded-lg transition-all duration-200 ${
                announcement.link 
                  ? 'hover:bg-muted/50 cursor-pointer hover:shadow-sm' 
                  : ''
              }`}
              onClick={() => handleAnnouncementClick(announcement)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-0.5 border-none ${categoryColor}`}
                    >
                      {announcement.category}
                    </Badge>
                    
                    {announcement.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs px-2 py-0.5">
                        Important
                      </Badge>
                    )}
                    
                    {announcement.link && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  
                  <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                    {announcement.title}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {announcement.content}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{announcement.authorName}</span>
                    <span>•</span>
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    
                    {announcement.views > 0 && (
                      <>
                        <span>•</span>
                        <span>{announcement.views} views</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {announcements.length >= limit && (
        <div className="text-center pt-2">
          <button className="text-sm text-primary hover:underline">
            View all announcements
          </button>
        </div>
      )}
    </div>
  );
};
