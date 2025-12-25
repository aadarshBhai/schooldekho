import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Edit, Trash2, BarChart3, AlertCircle, Loader2, Plus, X, Image as ImageIcon, Video } from 'lucide-react';
import { fetchEvents, Event, createEvent, deleteEvent } from '@/services/eventService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LocationInput } from '@/components/LocationInput';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    teaser: '',
    category: 'academic_tech' as any,
    subCategoryTags: '' as string,
    mode: 'offline' as 'online' | 'offline' | 'hybrid',
    eligibility: [] as string[],
    mediaType: 'image' as any,
    location: '',
    venueLink: '',
    date: '',
    startTime: '',
    endTime: '',
    registrationFee: 'Free',
    prizePool: '',
    description: '',
    images: [] as string[],
    video: '',
    entryType: 'Individual' as 'Individual' | 'Team-based',
    subjectExpertise: 'NA' as any,
    experienceRequired: 'NA' as any,
    jobType: 'NA' as any,
  });

  useEffect(() => {
    const loadUserEvents = async () => {
      if (user) {
        try {
          const allEvents = await fetchEvents();
          const userEvents = allEvents.filter(event => event.organizerId === user.id);
          setMyEvents(userEvents);
        } catch (error) {
          console.error('Failed to load events:', error);
        }
      }
    };
    loadUserEvents();
  }, [user]);

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    navigate('/');
    return null;
  }

  const isAdmin = user.role === 'admin';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (eventForm.mediaType === 'image' && eventForm.images.length >= 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      if (eventForm.mediaType === 'video') {
        setEventForm({ ...eventForm, video: data.url });
        toast.success('Video uploaded successfully');
      } else {
        const newImages = [...eventForm.images, data.url];
        setEventForm({ ...eventForm, images: newImages });
        toast.success(`Image ${newImages.length}/6 uploaded`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = eventForm.images.filter((_, i) => i !== index);
    setEventForm({ ...eventForm, images: newImages });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLocationValid) {
      toast.error('Please enter a valid location before creating the event');
      return;
    }

    if (!token || !user) {
      toast.error('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...eventForm,
        subCategoryTags: eventForm.subCategoryTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        organizerId: user.id,
        organizerName: user.name,
        organizerEmail: user.email,
        organizerAvatar: user.avatar || '',
        image: eventForm.images[0] || '',
      };

      const created = await createEvent(eventData as any, token);
      setMyEvents(prev => [created, ...prev]);

      if (user.role === 'admin') {
        toast.success('Sponsored post created and published!');
      } else {
        toast.success('Event created and is now LIVE!');
      }

      setEventForm({
        title: '',
        teaser: '',
        category: 'academic_tech',
        subCategoryTags: '',
        mode: 'offline',
        eligibility: [],
        mediaType: 'image',
        location: '',
        venueLink: '',
        date: '',
        startTime: '',
        endTime: '',
        registrationFee: 'Free',
        prizePool: '',
        description: '',
        images: [],
        video: '',
        entryType: 'Individual',
        subjectExpertise: 'NA',
        experienceRequired: 'NA',
        jobType: 'NA',
      });
      setIsLocationValid(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    if (event.approved) {
      toast.error('Cannot edit approved events. Contact admin for changes.');
      return;
    }
    toast.info('Edit functionality coming soon');
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(event.id, token);
      setMyEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success('Event deleted');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-6 sm:py-8">
        <div className="mb-4 xs:mb-6">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold">{isAdmin ? 'Admin Dashboard' : 'Organizer Dashboard'}</h1>
          <p className="text-xs xs:text-sm text-muted-foreground">Welcome back, {user.name}</p>
          {isAdmin && (
            <Badge className="mt-1 xs:mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] xs:text-xs">
              Admin - Posts will be marked as Sponsored
            </Badge>
          )}
        </div>

        <Tabs defaultValue="create" className="space-y-4 xs:space-y-6">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="create" className="text-xs xs:text-sm whitespace-nowrap">Create Event</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs xs:text-sm whitespace-nowrap">My Posts</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs xs:text-sm whitespace-nowrap">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>{isAdmin ? 'Create Sponsored Post' : 'Create New Event'}</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Create promotional content that will be marked as sponsored'
                    : 'Share your upcoming event with the community'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-6 xs:space-y-8">
                  {/* Section A: Visuals */}
                  <div className="space-y-3 xs:space-y-4">
                    <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                      <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">A</span>
                      <span className="text-sm xs:text-base">Visuals (The "Instagram" Element)</span>
                    </h3>

                    <div className="space-y-3 xs:space-y-4 p-3 xs:p-4 border rounded-lg bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                        <Label className="text-sm xs:text-base font-semibold">Media Gallery ({eventForm.images.length}/6)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={eventForm.images.length >= 6 || uploading}
                          onClick={() => document.getElementById('dash-image-upload')?.click()}
                          className="text-xs xs:text-sm"
                        >
                          {uploading ? <Loader2 className="w-3 h-3 xs:w-4 xs:h-4 animate-spin mr-1" /> : <Plus className="w-3 h-3 xs:w-4 xs:h-4 mr-1" />}
                          Add Image
                        </Button>
                        <input
                          id="dash-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {eventForm.images.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            {i === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] xs:text-[10px] text-white text-center py-0.5 font-medium">
                                MAIN POSTER
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(i)}
                              className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                            </button>
                          </div>
                        ))}
                        {eventForm.images.length === 0 && (
                          <div className="col-span-full py-3 xs:py-4 text-center text-[10px] xs:text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                            Upload up to 6 images. First image will be the main cover.
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] xs:text-xs text-muted-foreground italic">Pro-tip: Use 1:1 or 4:5 ratio for the Main Poster for a clean feed.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="teaser" className="text-sm xs:text-base">Short Teaser (Catchy Headline)</Label>
                        <span className="text-[10px] xs:text-xs text-muted-foreground">{eventForm.teaser.length}/150</span>
                      </div>
                      <Input
                        id="teaser"
                        placeholder="e.g. India's Biggest Inter-School Hackathon!"
                        maxLength={150}
                        value={eventForm.teaser}
                        onChange={(e) => setEventForm({ ...eventForm, teaser: e.target.value })}
                        required
                        className="text-xs xs:text-sm"
                      />
                    </div>
                  </div>

                  {/* Section B: Core Details */}
                  <div className="space-y-3 xs:space-y-4 pt-4 border-t">
                    <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                      <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">B</span>
                      <span className="text-sm xs:text-base">Core Details</span>
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm xs:text-base">Event Name (Full Title)</Label>
                      <Input
                        id="title"
                        placeholder="e.g. National Youth Science & Tech Excellence Summit"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        required
                        className="text-xs xs:text-sm"
                      />
                    </div>

                    <div className="grid xs:grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm xs:text-base">Category</Label>
                        <Select
                          value={eventForm.category}
                          onValueChange={(value) => setEventForm({ ...eventForm, category: value })}
                        >
                          <SelectTrigger className="text-xs xs:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="academic_tech" className="text-xs xs:text-sm">Academic & Tech</SelectItem>
                            <SelectItem value="leadership_literary" className="text-xs xs:text-sm">Leadership & Literary</SelectItem>
                            <SelectItem value="sports_fitness" className="text-xs xs:text-sm">Sports & Fitness</SelectItem>
                            <SelectItem value="creative_arts" className="text-xs xs:text-sm">Creative Arts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags" className="text-sm xs:text-base">Sub-Category Tags</Label>
                        <Input
                          id="tags"
                          placeholder="e.g. #Coding, #Football, #MUN"
                          value={eventForm.subCategoryTags}
                          onChange={(e) => setEventForm({ ...eventForm, subCategoryTags: e.target.value })}
                          className="text-xs xs:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid xs:grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mode" className="text-sm xs:text-base">Mode</Label>
                        <Select
                          value={eventForm.mode}
                          onValueChange={(value: any) => setEventForm({ ...eventForm, mode: value })}
                        >
                          <SelectTrigger className="text-xs xs:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online" className="text-xs xs:text-sm">Online</SelectItem>
                            <SelectItem value="offline" className="text-xs xs:text-sm">Offline</SelectItem>
                            <SelectItem value="hybrid" className="text-xs xs:text-sm">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm xs:text-base">Eligibility</Label>
                        <div className="flex flex-wrap gap-2 xs:gap-4 p-2 border rounded-md">
                          {['9', '10', '11', '12'].map((grade) => (
                            <div key={grade} className="flex items-center space-x-2">
                              <Checkbox
                                id={`grade-${grade}`}
                                checked={eventForm.eligibility.includes(grade)}
                                onCheckedChange={(checked) => {
                                  const newEligibility = checked
                                    ? [...eventForm.eligibility, grade]
                                    : eventForm.eligibility.filter((g) => g !== grade);
                                  setEventForm({ ...eventForm, eligibility: newEligibility });
                                }}
                              />
                              <Label htmlFor={`grade-${grade}`} className="text-xs xs:text-sm cursor-pointer">Grade {grade}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="entryType" className="text-sm xs:text-base">Entry Type</Label>
                      <Select
                        value={eventForm.entryType}
                        onValueChange={(value: any) => setEventForm({ ...eventForm, entryType: value })}
                      >
                        <SelectTrigger className="text-xs xs:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual" className="text-xs xs:text-sm">Individual</SelectItem>
                          <SelectItem value="Team-based" className="text-xs xs:text-sm">Team-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Section C: Professional / Hiring Details (Optional) */}
                  <div className="space-y-3 xs:space-y-4 pt-4 border-t">
                    <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                      <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">C</span>
                      <span className="text-sm xs:text-base">Professional / Hiring (If applicable)</span>
                    </h3>

                    <div className="grid xs:grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm xs:text-base">Subject Expertise</Label>
                        <Select
                          value={eventForm.subjectExpertise}
                          onValueChange={(value: any) => setEventForm({ ...eventForm, subjectExpertise: value })}
                        >
                          <SelectTrigger className="text-xs xs:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NA" className="text-xs xs:text-sm">Not Applicable</SelectItem>
                            <SelectItem value="Mathematics" className="text-xs xs:text-sm">Mathematics</SelectItem>
                            <SelectItem value="Science" className="text-xs xs:text-sm">Science</SelectItem>
                            <SelectItem value="Arts" className="text-xs xs:text-sm">Arts</SelectItem>
                            <SelectItem value="Sports Coach" className="text-xs xs:text-sm">Sports Coach</SelectItem>
                            <SelectItem value="Admin" className="text-xs xs:text-sm">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience" className="text-sm xs:text-base">Experience Required</Label>
                        <Select
                          value={eventForm.experienceRequired}
                          onValueChange={(value: any) => setEventForm({ ...eventForm, experienceRequired: value })}
                        >
                          <SelectTrigger className="text-xs xs:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NA" className="text-xs xs:text-sm">Not Applicable</SelectItem>
                            <SelectItem value="Fresher" className="text-xs xs:text-sm">Fresher</SelectItem>
                            <SelectItem value="1-3 Years" className="text-xs xs:text-sm">1-3 Years</SelectItem>
                            <SelectItem value="5+ Years" className="text-xs xs:text-sm">5+ Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobType" className="text-sm xs:text-base">Job Type</Label>
                      <Select
                        value={eventForm.jobType}
                        onValueChange={(value: any) => setEventForm({ ...eventForm, jobType: value })}
                      >
                        <SelectTrigger className="text-xs xs:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NA" className="text-xs xs:text-sm">Not Applicable</SelectItem>
                          <SelectItem value="Full-Time" className="text-xs xs:text-sm">Full-Time</SelectItem>
                          <SelectItem value="Part-Time" className="text-xs xs:text-sm">Part-Time</SelectItem>
                          <SelectItem value="Visiting Faculty" className="text-xs xs:text-sm">Visiting Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Section D: Logistics & Trust */}
                  <div className="space-y-3 xs:space-y-4 pt-4 border-t">
                    <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                      <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">D</span>
                      <span className="text-sm xs:text-base">Logistics & Trust</span>
                    </h3>

                    <div className="grid xs:grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm xs:text-base">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                          required
                          className="text-xs xs:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime" className="text-sm xs:text-base">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={eventForm.startTime}
                          onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                          className="text-xs xs:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime" className="text-sm xs:text-base">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={eventForm.endTime}
                          onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                          className="text-xs xs:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venueLink" className="text-sm xs:text-base">Venue / Meeting Link</Label>
                      <Input
                        id="venueLink"
                        placeholder={eventForm.mode === 'online' ? 'https://zoom.us/j/...' : 'Google Maps Pin or Room Number'}
                        value={eventForm.venueLink}
                        onChange={(e) => setEventForm({ ...eventForm, venueLink: e.target.value })}
                        className="text-xs xs:text-sm"
                      />
                    </div>

                    <LocationInput
                      value={eventForm.location}
                      onChange={(value) => setEventForm({ ...eventForm, location: value })}
                      onValidationChange={setIsLocationValid}
                    />

                    <div className="grid xs:grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fee" className="text-sm xs:text-base">Registration Fee</Label>
                        <Input
                          id="fee"
                          placeholder="e.g. ₹500 or Free"
                          value={eventForm.registrationFee}
                          onChange={(e) => setEventForm({ ...eventForm, registrationFee: e.target.value })}
                          className="text-xs xs:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prize" className="text-sm xs:text-base">Prize Pool / Certificates</Label>
                        <Input
                          id="prize"
                          placeholder="e.g. ₹10,000 + Merit Certificates"
                          value={eventForm.prizePool}
                          onChange={(e) => setEventForm({ ...eventForm, prizePool: e.target.value })}
                          className="text-xs xs:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm xs:text-base">Detailed Description (Rules, Schedule, Judging)</Label>
                      <Textarea
                        id="description"
                        placeholder="Use markdown for formatting..."
                        rows={4}
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        required
                        className="text-xs xs:text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full text-sm xs:text-base ${isAdmin ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''}`}
                    disabled={!isLocationValid || loading || uploading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-3 w-3 xs:h-4 xs:w-4 animate-spin" /> Creating...</>
                    ) : (
                      isAdmin ? 'Create Sponsored Post' : 'Create Event'
                    )}
                  </Button>
                  {!isLocationValid && eventForm.location && (
                    <p className="text-[10px] xs:text-xs text-destructive text-center font-medium">
                      Please enter a valid location to create the event
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>My Events</CardTitle>
                <CardDescription>Manage your published events</CardDescription>
              </CardHeader>
              <CardContent>
                {myEvents.length > 0 ? (
                  <div className="space-y-4">
                    {myEvents.map((event) => (
                      <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full sm:w-20 h-40 sm:h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1 w-full">
                          <h3 className="font-semibold text-lg sm:text-base">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.likes} likes • {event.comments} comments
                          </p>
                          <Badge
                            variant={event.approved ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {event.approved ? 'Approved' : 'Pending Approval'}
                          </Badge>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {myEvents.some(e => e.approved) && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Approved events cannot be edited or deleted. Contact admin for changes.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No events created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Event Analytics</CardTitle>
                <CardDescription>Track your event performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">2,456</p>
                          <p className="text-sm text-muted-foreground">Total Views</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-accent" />
                        <div>
                          <p className="text-2xl font-bold">892</p>
                          <p className="text-sm text-muted-foreground">Total Likes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">156</p>
                          <p className="text-sm text-muted-foreground">Interested Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
