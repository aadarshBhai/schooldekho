import { Heart, MessageCircle, Share2, MapPin, Calendar, Play, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type Event, likeEvent, shareEvent, checkLikeStatus } from '@/services/eventService';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ParticipationDialog } from '@/components/ParticipationDialog';

interface FeedCardProps {
  event: Event;
  onEventClick?: (event: Event) => void;
}

export const FeedCard = ({ event, onEventClick }: FeedCardProps) => {
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [likes, setLikes] = useState(event.likes);
  const [shares, setShares] = useState(event.shares);
  const [showParticipationDialog, setShowParticipationDialog] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();

  // Check if user has liked this event on mount
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (user?.id && event.id) {
        try {
          const liked = await checkLikeStatus(event.id, user.id);
          setIsLiked(liked);
        } catch (error) {
          console.error('Failed to check like status:', error);
        }
      }
    };
    loadLikeStatus();
  }, [user?.id, event.id]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    if (isLiking) return;

    // Optimistic update
    const wasLiked = isLiked;
    const prevLikes = likes;
    setIsLiked(!wasLiked);
    setLikes(prevLikes + (wasLiked ? -1 : 1));
    setIsLiking(true);

    try {
      await likeEvent(event.id, user.id);
    } catch (error) {
      // Rollback on error
      setIsLiked(wasLiked);
      setLikes(prevLikes);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await shareEvent(event.id);
      setShares(prev => prev + 1);
      toast.success('Event shared successfully!');
    } catch (error) {
      toast.error('Failed to share post');
    }
  };

  const handleCardClick = () => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <Card className={`feed-card-shadow transition-all duration-300 overflow-hidden hover:shadow-2xl hover:scale-[1.02] cursor-pointer group max-w-2xl mx-auto ${event.isSponsored ? 'ring-1 ring-amber-500/30' : ''}`}>
      {/* Header */}
      <div className="p-4 xs:p-5 sm:p-6 flex items-center gap-3 xs:gap-4">
        <Avatar className="h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14 group-hover:scale-110 transition-transform duration-200">
          <AvatarImage src={event.organizerAvatar} alt={event.organizerName} />
          <AvatarFallback className="text-xs xs:text-sm sm:text-base">{event.organizerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm xs:text-base sm:text-lg truncate">{event.organizerName}</h3>
            {event.isSponsored && (
              <Badge variant="secondary" className="hidden xs:flex items-center gap-1 text-[10px] xs:text-xs px-2 py-1 bg-amber-100 text-amber-800 border-amber-200">
                <Megaphone className="w-3 h-3" />
                Sponsored
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs xs:text-sm sm:text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
            <span className="hidden sm:inline">•</span>
            <Calendar className="h-3 w-3 flex-shrink-0 hidden sm:inline" />
            <span className="hidden sm:inline truncate">{new Date(event.date).toLocaleDateString()}</span>
          </div>
        </div>
        {event.isSponsored && (
          <Badge variant="secondary" className="xs:hidden flex items-center gap-1 text-[10px] px-2 py-1 bg-amber-100 text-amber-800 border-amber-200">
            <Megaphone className="w-3 h-3" />
          </Badge>
        )}
      </div>

      {/* Media Section */}
      <div className="relative aspect-[4/3] xs:aspect-[16/9] sm:aspect-[3/2] bg-muted overflow-hidden group">
        {event.mediaType === 'video' ? (
          <>
            <video
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              poster={event.image}
              onClick={handleCardClick}
            >
              <source src={event.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Play className="h-12 w-12 xs:h-16 xs:w-16 text-white drop-shadow-lg" />
            </div>
          </>
        ) : (
          <div 
            className="w-full h-full overflow-hidden cursor-pointer"
            onClick={handleCardClick}
          >
            {event.images && event.images.length > 0 ? (
              <img
                src={event.images[0]}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </div>
        )}
        
        {/* Category Badge Overlay */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-[10px] xs:text-xs sm:text-sm bg-black/70 text-white backdrop-blur-sm border-none px-2 py-1">
            {event.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
        
        {/* Mode Badge */}
        {event.mode && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="text-[10px] xs:text-xs sm:text-sm bg-white/90 backdrop-blur-sm border-white/20">
              {event.mode}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 xs:p-5 sm:p-6 space-y-3 xs:space-y-4">
        {/* Event Title */}
        <h2 
          className="font-bold text-lg xs:text-xl sm:text-2xl mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-2 leading-tight"
          onClick={handleCardClick}
        >
          {event.title}
        </h2>

        {/* Event Description */}
        <p 
          className="text-sm xs:text-base sm:text-lg text-muted-foreground line-clamp-2 xs:line-clamp-3 leading-relaxed cursor-pointer"
          onClick={handleCardClick}
        >
          {event.teaser || event.description}
        </p>

        {/* Event Details */}
        <div className="flex flex-wrap items-center gap-3 xs:gap-4 text-xs xs:text-sm sm:text-base text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 xs:h-4 xs:w-4" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          {event.registrationFee && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{event.registrationFee}</span>
            </div>
          )}
          {event.mode && (
            <Badge variant="outline" className="text-[10px] xs:text-xs">
              {event.mode}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {event.subCategoryTags && event.subCategoryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 xs:gap-2">
            {event.subCategoryTags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] xs:text-xs px-2 py-1">
                #{tag}
              </Badge>
            ))}
            {event.subCategoryTags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] xs:text-xs px-2 py-1">
                +{event.subCategoryTags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 xs:pt-3 border-t">
          <div className="flex items-center gap-2 xs:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 xs:gap-2 text-xs xs:text-sm sm:text-base transition-all duration-200 hover:scale-110 ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm sm:text-base text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
              onClick={handleCardClick}
            >
              <MessageCircle className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
              <span className="font-medium">{event.comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm sm:text-base text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
              <span className="font-medium">{shares}</span>
            </Button>
          </div>

          <Button
            size="sm"
            className="text-xs xs:text-sm sm:text-base px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 transition-all duration-200 hover:scale-105"
            onClick={() => setShowParticipationDialog(true)}
          >
            Participate
          </Button>
        </div>
      </CardContent>

      {/* Participation Dialog */}
      <ParticipationDialog
        open={showParticipationDialog}
        onOpenChange={setShowParticipationDialog}
        event={event}
      />
    </Card>
  );
};
