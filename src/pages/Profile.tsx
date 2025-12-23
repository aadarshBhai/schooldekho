import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Settings, Grid3X3, Bookmark, Heart, MessageSquare, Link as LinkIcon, Phone, Mail, Camera, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { fetchEvents, deleteAccount, fetchCommentsByUserId, fetchLikedEvents, fetchUserProfile, Comment as EventComment, Event, User as EventUser } from '@/services/eventService';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { SEOHead } from '@/components/SEOHead';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { id } = useParams();
  const { user, updateUser, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwnProfile = user?.id === id;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [displayedUser, setDisplayedUser] = useState<EventUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [likedEvents, setLikedEvents] = useState<Event[]>([]);
  const [userComments, setUserComments] = useState<EventComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    // Prevent access to virtual admin profile
    if (id === 'admin-env') {
      navigate('/');
      return;
    }

    const loadData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch target user profile
        const profile = await fetchUserProfile(id);
        if (!profile) {
          toast.error('User not found');
          navigate('/');
          return;
        }
        setDisplayedUser(profile);

        // Load events & likes & comments in parallel for performance
        setLoadingComments(true);
        const fetchResults = await Promise.allSettled([
          fetchEvents(),
          fetchLikedEvents(id),
          fetchCommentsByUserId(id)
        ]);

        const allEvents = fetchResults[0].status === 'fulfilled' ? fetchResults[0].value : [];
        const likedData = fetchResults[1].status === 'fulfilled' ? fetchResults[1].value : [];
        const commentsData = fetchResults[2].status === 'fulfilled' ? fetchResults[2].value : [];

        if (fetchResults.some(r => r.status === 'rejected')) {
          console.error('[Profile] Some data failed to load');
        }

        // Filter my events
        const myEvents = allEvents.filter(event => event.organizerId === id).slice(0, 9);
        setUserEvents(myEvents);

        // Set comments
        setUserComments(commentsData);

        // Set liked events
        setLikedEvents(likedData);

        // Saved events (still empty for now)
        setSavedEvents([]);
        setLoadingComments(false);
      } catch (error) {
        console.error('Failed to load profile data:', error);
        setLoadingComments(false);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);


  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await deleteAccount(token);
      toast.success('Your account and data have been permanently deleted.');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async (data: any) => {
    try {
      const success = await updateUser(data);
      if (success) {
        toast.success('Profile updated successfully');
        // Force refresh the displayed user data if it's the same user
        if (displayedUser && displayedUser.id === user?.id) {
          // Refresh the user profile data
          const updatedProfile = await fetchUserProfile(id);
          if (updatedProfile) {
            setDisplayedUser(updatedProfile);
          }
        }
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while saving profile');
    }
  };

  if (loading || !displayedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${displayedUser.name} - EventDekho Profile`}
        description={`View ${displayedUser.name}'s profile on EventDekho. See their events, activities, and community contributions.`}
      />
      <div className="min-h-screen pb-20 md:pb-0 bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Profile Header - Instagram Style */}
          <div className="bg-card rounded-2xl p-6 mb-6 feed-card-shadow">
            {/* Mobile Layout */}
            <div className="flex flex-col md:hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarImage src={displayedUser.avatar} alt={displayedUser.name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {displayedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <button
                      onClick={() => setEditDialogOpen(true)}
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold">{displayedUser.name}</h1>
                    {displayedUser.verified && (
                      <Badge variant="default" className="bg-primary text-xs">✓</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{displayedUser.name.toLowerCase().replace(/\s/g, '')}</p>
                </div>
              </div>

              {/* Stats Row - Mobile */}
              {displayedUser.role !== 'user' && (
                <div className="flex justify-around py-4 border-y border-border mb-4">
                  <div className="text-center">
                    <p className="font-bold text-lg">{userEvents.length}</p>
                    <p className="text-xs-readable text-muted-foreground font-medium">Posts</p>
                  </div>
                </div>
              )}

              {/* Bio Section - Mobile */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">{displayedUser.name}</p>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{displayedUser.bio || 'No bio yet.'}</p>
                {displayedUser.website && (
                  <a href={displayedUser.website} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                    <LinkIcon className="h-3 w-3" />
                    {displayedUser.website.replace('https://', '').replace('http://', '')}
                  </a>
                )}
              </div>

              {isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setEditDialogOpen(true)}>
                    Edit Profile
                  </Button>
                  {(displayedUser.role === 'organizer' || displayedUser.role === 'admin') && (
                    <Button className="w-full" onClick={() => navigate('/dashboard')}>
                      <Plus className="mr-2 h-4 w-4" /> Create Post
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex gap-8">
              <div className="relative group">
                <Avatar className="h-40 w-40 border-4 border-primary/20">
                  <AvatarImage src={displayedUser.avatar} alt={displayedUser.name} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {displayedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditDialogOpen(true)}
                    className="absolute bottom-4 right-4 bg-primary text-primary-foreground p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{displayedUser.name}</h1>
                    {displayedUser.verified && (
                      <Badge variant="default" className="bg-primary">✓ Verified</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{displayedUser.name.toLowerCase().replace(/\s/g, '')}</p>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditDialogOpen(true)}>
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </Button>
                      {(displayedUser.role === 'organizer' || displayedUser.role === 'admin') && (
                        <Button size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
                          <Plus className="h-4 w-4" /> Create Post
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Row - Desktop */}
                {displayedUser.role !== 'user' && (
                  <div className="flex gap-8 mb-4">
                    <div className="flex gap-1">
                      <span className="font-bold">{userEvents.length}</span>
                      <span className="text-muted-foreground">posts</span>
                    </div>
                  </div>
                )}

                {/* Bio Section - Desktop */}
                <div className="space-y-1">
                  <p className="font-medium">{displayedUser.name}</p>
                  {displayedUser.type && (
                    <Badge variant="secondary" className="text-xs capitalize">{displayedUser.type}</Badge>
                  )}
                  <p className="text-sm text-foreground/80 whitespace-pre-line max-w-md">{displayedUser.bio || 'No bio yet.'}</p>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{displayedUser.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{displayedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(displayedUser.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                  {displayedUser.website && (
                    <a href={displayedUser.website} className="flex items-center gap-1 text-primary hover:underline">
                      <LinkIcon className="h-4 w-4" />
                      <span>{displayedUser.website.replace('https://', '').replace('http://', '')}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs - Instagram Style */}
          <Tabs defaultValue={displayedUser.role === 'user' ? 'saved' : 'posts'} className="w-full">
            <TabsList className={`w-full grid ${displayedUser.role === 'user' ? 'grid-cols-3' : 'grid-cols-4'} bg-transparent border-b border-border rounded-none h-auto p-0`}>
              {displayedUser.role !== 'user' && (
                <TabsTrigger
                  value="posts"
                  className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Posts</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="saved"
                className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Saved</span>
              </TabsTrigger>
              <TabsTrigger
                value="liked"
                className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Liked</span>
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="flex items-center gap-2 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Comments</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              {userEvents.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {userEvents.map(event => (
                    <div
                      key={event.id}
                      className="aspect-square rounded-sm md:rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => navigate(`/post/${event.id}`)}
                    >
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-4 text-white">
                          <span className="flex items-center gap-1">
                            <Heart className="h-5 w-5 fill-white" />
                            {event.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground">When you create events, they'll appear here.</p>
                  {isOwnProfile && (displayedUser.role === 'organizer' || displayedUser.role === 'admin') && (
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
                      <Plus className="mr-2 h-4 w-4" /> Create Event
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-4">
              {savedEvents.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {savedEvents.map(event => (
                    <div
                      key={event.id}
                      className="aspect-square rounded-sm md:rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => navigate(`/post/${event.id}`)}
                    >
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Bookmark className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Events</h3>
                  <p className="text-muted-foreground">Save events to see them here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked" className="mt-4">
              {likedEvents.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {likedEvents.map(event => (
                    <div
                      key={event.id}
                      className="aspect-square rounded-sm md:rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => navigate(`/post/${event.id}`)}
                    >
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Heart className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Liked Events</h3>
                  <p className="text-muted-foreground">Like events to see them here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              {loadingComments ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground animate-pulse">Loading comments...</p>
                </div>
              ) : userComments.length > 0 ? (
                <div className="space-y-4">
                  {userComments.map(comment => (
                    <div
                      key={comment.id}
                      className="bg-card p-4 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/post/${comment.eventId}`)}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-primary">{comment.eventTitle}</p>
                        <p className="text-sm italic text-foreground/80">"{comment.text}"</p>
                        <p className="text-xs-readable text-muted-foreground mt-1 font-medium">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Comments Yet</h3>
                  <p className="text-muted-foreground">When you join conversations, they'll appear here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Danger Zone */}
          {isOwnProfile && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="bg-destructive/5 rounded-2xl p-6 border border-destructive/20">
                <div className="flex items-center gap-3 mb-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Danger Zone</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Permanently delete your account and all associated data. This includes your events, comments, and likes. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers, including all events
                        you've organized and comments you've made.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </main>

        <MobileNav />

        {/* Edit Profile Dialog */}
        {user && (
          <EditProfileDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            user={user}
            onSave={handleSaveProfile}
          />
        )}
      </div>
    </>
  );
};

export default Profile;
