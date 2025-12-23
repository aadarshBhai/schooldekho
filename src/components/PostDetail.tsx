import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, MapPin, Calendar, ArrowLeft, Send, Loader2, Edit2, Trash2, X, Check, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EventMap } from '@/components/EventMap';
import { fetchEventById, fetchCommentsForEvent, likeEvent, shareEvent, checkLikeStatus, editComment, deleteComment } from '@/services/eventService';
import { apiPost } from '@/lib/api';
import { ParticipationDialog } from '@/components/ParticipationDialog';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface PostDetailProps {
    eventId: string;
    initialEvent?: any;
    isModal?: boolean;
    onClose?: () => void;
    className?: string;
}

export const PostDetail = ({ eventId, initialEvent, isModal, onClose, className }: PostDetailProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<any>(initialEvent || null);
    const [likes, setLikes] = useState(initialEvent?.likes || 0);
    const [shares, setShares] = useState(initialEvent?.shares || 0);
    const [isLiked, setIsLiked] = useState(initialEvent?.isLiked || false);
    const [isLiking, setIsLiking] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(!initialEvent);
    const [newComment, setNewComment] = useState('');
    const [showParticipationDialog, setShowParticipationDialog] = useState(false);

    useEffect(() => {
        const loadEventAndComments = async () => {
            // If no initialEvent, we must fetch it.
            // If initialEvent exists, we might want to refresh it or just use it.
            // For now, if missing, fetch.
            if (!initialEvent) {
                setLoading(true);
                try {
                    // Fetch event
                    const eventData = await fetchEventById(eventId);
                    setEvent(eventData);
                    setLikes(eventData.likes);
                    setShares(eventData.shares);
                } catch (e) {
                    console.error(e);
                    toast.error('Failed to load event');
                } finally {
                    setLoading(false);
                }
            }

            // Always fetch comments
            try {
                const commentsData = await fetchCommentsForEvent(eventId);
                setComments(commentsData);
            } catch (e) { console.error(e); }

            // Check like status if user
            if (user) {
                try {
                    const liked = await checkLikeStatus(eventId, user.id);
                    setIsLiked(liked);
                } catch (e) { console.error(e); }
            }
        };

        if (eventId) {
            loadEventAndComments();
        }
    }, [eventId, user?.id, initialEvent]);

    const handleLike = async () => {
        if (!user) {
            toast.error('Please login to like');
            return;
        }
        if (isLiking) return;

        const wasLiked = isLiked;
        const prevLikes = likes;
        setIsLiked(!wasLiked);
        setLikes(wasLiked ? prevLikes - 1 : prevLikes + 1);
        setIsLiking(true);

        try {
            const result = await likeEvent(event.id, user.id);
            setIsLiked(result.liked);
            setLikes(result.likes);
        } catch (error) {
            setIsLiked(wasLiked);
            setLikes(prevLikes);
            toast.error('Failed to update like');
        } finally {
            setIsLiking(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${event.id}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
            const result = await shareEvent(event.id);
            setShares(result.shares);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to comment');
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const { data: newCommentData, error } = await apiPost('/api/comments', {
                text: newComment,
                eventId: event.id,
                userName: user.name,
                userAvatar: user.avatar,
            });

            if (error) throw new Error(error);

            if (newCommentData) {
                setComments(prev => [{
                    ...newCommentData,
                    id: newCommentData._id || newCommentData.id,
                    user: user.id,
                    userName: user.name,
                    userAvatar: user.avatar,
                    eventId: event.id,
                    createdAt: new Date().toISOString(),
                }, ...prev]);
                setNewComment('');
                toast.success('Comment posted!');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to post comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Editing logic same as PostView...
    const startEditing = (comment: any) => {
        setEditingCommentId(comment.id);
        setEditCommentText(comment.text);
    };
    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditCommentText('');
    };
    const saveEditComment = async (commentId: string) => {
        // ... logic
        try {
            const token = localStorage.getItem('eventdekho_token');
            if (!token) throw new Error('Auth');
            const updated = await editComment(commentId, editCommentText, token);
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: updated.text } : c));
            setEditingCommentId(null);
        } catch (e) { toast.error('Failed'); }
    };
    const handleDeleteComment = async (commentId: string) => {
        // ... logic
        if (!confirm('Delete?')) return;
        try {
            const token = localStorage.getItem('eventdekho_token');
            if (!token) throw new Error('Auth');
            await deleteComment(commentId, token);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (e) { toast.error('Failed'); }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 w-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center h-full p-10 text-center">
                <div>
                    <h2 className="text-xl font-semibold">Event not found</h2>
                </div>
            </div>
        );
    }

    const categoryColors: Record<string, string> = {
        academic_tech: 'bg-blue-500',
        leadership_literary: 'bg-green-500',
        sports_fitness: 'bg-purple-500',
        creative_arts: 'bg-orange-500',
    };

    const handleClose = () => {
        if (isModal && onClose) onClose();
        else navigate(-1); // Or navigate('/')
    };

    return (
        <article
            className={`w-full bg-white lg:rounded-xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-auto lg:h-[85vh] border-none mx-auto ${className}`}
        >

            {/* Left Column: Visuals */}
            <div className="lg:w-[65%] bg-black relative flex items-center justify-center group h-[50vh] md:h-[60vh] lg:h-full lg:min-h-full overflow-hidden shrink-0">
                <div
                    className="absolute inset-0 opacity-20 blur-3xl scale-125 pointer-events-none"
                    style={{
                        backgroundImage: `url(${event.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {event.mediaType === 'video' && event.video ? (
                        <video
                            src={event.video}
                            controls
                            className="w-full h-full object-contain max-h-full"
                        />
                    ) : event.images && event.images.length > 0 ? (
                        <Carousel className="w-full h-full flex items-center justify-center">
                            <CarouselContent className="h-full">
                                {event.images.map((img: string, index: number) => (
                                    <CarouselItem key={index} className="h-full flex items-center justify-center p-0">
                                        <img
                                            src={img}
                                            alt={`${event.title} - view ${index + 1}`}
                                            className="w-full h-full object-contain max-h-full"
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-4 bg-black/50 hover:bg-black text-white border-none h-10 w-10" />
                            <CarouselNext className="right-4 bg-black/50 hover:bg-black text-white border-none h-10 w-10" />
                        </Carousel>
                    ) : (
                        <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-contain max-h-full"
                        />
                    )}
                </div>

                <div className="absolute top-4 left-4 lg:hidden z-20">
                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full bg-black/40 text-white hover:bg-black/60">
                        {isModal ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                    </Button>
                </div>

                <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                    <Badge className={`${categoryColors[event.category] || 'bg-slate-700'} text-white border-none backdrop-blur-md px-3 py-1`}>
                        {event.category?.replace('_', ' & ')}
                    </Badge>
                    {event.isSponsored && (
                        <Badge className="bg-amber-500 text-white">Sponsored</Badge>
                    )}
                </div>
            </div>

            {/* Right Column: Details */}
            <div className="flex-1 flex flex-col h-auto lg:h-full bg-white relative w-full lg:w-[35%] overflow-hidden lg:overflow-y-hidden">

                <div className="p-4 border-b flex items-center gap-3 shrink-0 bg-white sticky top-0 z-30 w-full shadow-sm lg:shadow-none">
                    <Avatar className="h-10 w-10 ring-1 ring-slate-100">
                        <AvatarImage src={event.organizerAvatar} />
                        <AvatarFallback>{event.organizerName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-sm font-bold truncate leading-none text-slate-900">{event.organizerName}</p>
                            <Check className="w-3 h-3 text-white bg-blue-500 rounded-full p-[1px]" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="hidden lg:flex text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-visible lg:overflow-y-auto custom-scrollbar p-5 space-y-6 pb-24 lg:pb-5">
                    <div className="space-y-3">
                        <h1 className="text-xl font-bold leading-snug">{event.title}</h1>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {event.subCategoryTags?.map((tag: string) => (
                                <span key={tag} className="text-blue-600 text-sm hover:underline cursor-pointer">
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2">
                        <div className="bg-slate-50 p-3 rounded-lg border text-center">
                            <Calendar className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                            <p className="text-xs uppercase font-bold text-muted-foreground">Date</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border text-center">
                            <Briefcase className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                            <p className="text-xs uppercase font-bold text-muted-foreground">Entry</p>
                            <p className="text-sm font-semibold text-green-600">{event.registrationFee || 'Free'}</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Location</h3>
                        <div className="rounded-lg overflow-hidden border h-32 relative">
                            <EventMap location={event.location} eventName={event.title} eventDate={event.date} />
                            <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-lg" />
                        </div>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground">Comments ({comments.length})</h3>
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                No comments yet.<br />Start the conversation!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2.5 group text-sm">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage src={comment.userAvatar} />
                                            <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-bold text-slate-900 mr-2">{comment.userName}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {editingCommentId === comment.id ? (
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                        className="h-8 text-sm"
                                                        autoFocus
                                                    />
                                                    <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => saveEditComment(comment.id)}><Check className="w-3 h-3" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEditing}><X className="w-3 h-3" /></Button>
                                                </div>
                                            ) : (
                                                <p className="text-slate-600 leading-snug">{comment.text}</p>
                                            )}

                                            {user?.id === comment.user && !editingCommentId && (
                                                <div className="flex gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEditing(comment)} className="text-xs font-medium text-slate-400 hover:text-blue-600">Edit</button>
                                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-xs font-medium text-slate-400 hover:text-red-600">Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 lg:static p-4 border-t bg-white shrink-0 space-y-3 z-50 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.1)] lg:shadow-none">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={handleLike} className="group flex items-center gap-1.5 focus:outline-none translate-y-0.5">
                                <Heart className={`w-7 h-7 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-900 group-hover:text-slate-600'}`} />
                            </button>
                            <button className="focus:outline-none translate-y-0.5">
                                <MessageCircle className="w-7 h-7 text-slate-900 hover:text-slate-600 -rotate-12" />
                            </button>
                            <button onClick={handleShare} className="focus:outline-none translate-y-0.5">
                                <Share2 className="w-7 h-7 text-slate-900 hover:text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <div className="font-bold text-sm text-slate-900">
                        {likes} likes
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        POSTED {new Date(event.createdAt || event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    <div className="flex gap-2 pt-2 border-t mt-2">
                        <Input
                            placeholder="Add a comment..."
                            className="border-none shadow-none focus-visible:ring-0 px-0 h-auto py-2 text-sm"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleComment}
                            disabled={!newComment.trim() || isSubmitting}
                            className="text-blue-500 font-bold hover:text-blue-700 px-2 shrink-0"
                        >
                            Post
                        </Button>
                    </div>

                    <Button
                        className="w-full rounded-lg font-bold h-11 text-base mt-2"
                        onClick={() => setShowParticipationDialog(true)}
                    >
                        I'm Interested
                    </Button>
                    <ParticipationDialog
                        event={event}
                        open={showParticipationDialog}
                        onOpenChange={setShowParticipationDialog}
                    />
                </div>

            </div>
        </article>
    );
};
