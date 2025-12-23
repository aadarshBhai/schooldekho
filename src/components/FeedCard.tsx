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
    setLikes(wasLiked ? prevLikes - 1 : prevLikes + 1);
    setIsLiking(true);

    try {
      const result = await likeEvent(event.id, user.id);
      setIsLiked(result.liked);
      setLikes(result.likes);
      toast.success(result.liked ? 'Post liked!' : 'Like removed');
    } catch (error) {
      // Rollback on error
      setIsLiked(wasLiked);
      setLikes(prevLikes);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    // If onEventClick provided, open modal. Else, let link handling work or toast.
    if (onEventClick) {
      onEventClick(event);
    } else if (!user) {
      toast.error('Please login to comment');
      return;
    }
  };

  const handleShare = async () => {
    // Copy link to clipboard
    const url = `${window.location.origin}/post/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');

      // Increment share count in backend
      const result = await shareEvent(event.id);
      setShares(result.shares);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const categoryColors = {
    school: 'bg-blue-500',
    ngo: 'bg-green-500',
    community: 'bg-purple-500',
    festival: 'bg-orange-500',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onEventClick) {
      e.preventDefault();
      onEventClick(event);
    }
  };

  return (
    <Card className={`feed-card-shadow transition-smooth overflow-hidden ${event.isSponsored ? 'ring-1 ring-amber-500/30' : ''}`}>
      {/* Sponsored Banner */}
      {event.isSponsored && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 flex items-center gap-2 border-b border-amber-500/20">
          <Megaphone className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Sponsored</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        {event.organizerId === 'admin-env' ? (
          <Avatar className={event.isSponsored ? 'ring-2 ring-amber-500' : ''}>
            <AvatarImage src={event.organizerAvatar} />
            <AvatarFallback>{event.organizerName.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <Link to={`/profile/${event.organizerId}`}>
            <Avatar className={event.isSponsored ? 'ring-2 ring-amber-500' : ''}>
              <AvatarImage src={event.organizerAvatar} />
              <AvatarFallback>{event.organizerName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{event.organizerName}</p>
            {event.isSponsored && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600">
                Ad
              </Badge>
            )}
          </div>
          <p className="text-xs text-small-readable">
            {event.isSponsored ? 'Promoted' : new Date(event.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="secondary" className={`${categoryColors[event.category]} text-white`}>
          {event.category}
        </Badge>
      </div>

      {/* Media */}
      <div onClick={handleCardClick} className="cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {event.mediaType === 'video' ? (
            <>
              {event.image ? (
                <img
                  src={event.image}
                  alt={`${event.title}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/10">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={event.image || '/placeholder.svg'}
              alt={`${event.title}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop';
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 p-2 h-auto hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={handleLike}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`h-6 w-6 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-foreground hover:text-red-500'
                }`}
            />
            <span className="text-sm font-medium">{likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 p-2 h-auto hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={handleComment}
            aria-label="View comments"
          >
            <MessageCircle className="h-6 w-6 hover:text-blue-500 transition-colors" />
            <span className="text-sm font-medium">{event.comments}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 p-2 h-auto hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={handleShare}
            aria-label="Share post"
          >
            <Share2 className="h-6 w-6 hover:text-green-500 transition-colors" />
            <span className="text-sm font-medium">{shares}</span>
          </Button>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="font-bold text-lg mb-1 cursor-pointer hover:text-primary transition-colors" onClick={handleCardClick}>
            {event.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{event.description}</p>
        </div>

        {/* Location & Date */}
        <div className="flex items-center gap-4 text-sm text-small-readable">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{event.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full"
          variant="default"
          onClick={() => {
            if (!user) {
              toast.error('Please login to participate');
              return;
            }
            setShowParticipationDialog(true);
          }}
        >
          I'm Interested
        </Button>
      </CardContent>

      <ParticipationDialog
        event={event}
        open={showParticipationDialog}
        onOpenChange={setShowParticipationDialog}
      />
    </Card>
  );
};
