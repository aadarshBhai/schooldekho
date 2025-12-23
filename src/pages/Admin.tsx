import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, CheckCircle, XCircle, Edit, Trash2, Users, FileText, Play, Megaphone } from 'lucide-react';
import { fetchEvents, createEvent, updateEvent, deleteEvent, approveEvent, fetchPendingUsers, verifyUser, deleteUser, type Event, type User, type AdminStats } from '@/services/eventService';
import { EditEventDialog } from '@/components/EditEventDialog';
import { AdminAdsTab } from '@/components/AdminAdsTab';


const Admin = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const loadStats = async (authToken: string) => {
    try {
      const { fetchAdminStats } = await import('@/services/eventService');
      const data = await fetchAdminStats(authToken);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadEvents();
    if (token) {
      loadPendingUsers(token);
      loadAllUsers(token);
      loadStats(token);
    }
  }, [user, navigate, token]);

  const loadEvents = async () => {
    try {
      const allEvents = await fetchEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load events');
    }
  };

  const loadPendingUsers = async (authToken: string) => {
    try {
      const pendingUsers = await fetchPendingUsers(authToken);
      setVerifications(pendingUsers);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Token expired') || errorMessage.includes('Token is invalid')) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
      } else {
        toast.error('Failed to load pending verifications');
      }
    }
  };

  const loadAllUsers = async (authToken: string) => {
    try {
      const { fetchAllUsers } = await import('@/services/eventService');
      const users = await fetchAllUsers(authToken);
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to fetch all users:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleVerify = async (id: string) => {
    if (!token) return;
    try {
      await verifyUser(id, true, token);
      setVerifications(prev => prev.filter(u => u.id !== id));
      loadAllUsers(token); // Refresh all users as well
      toast.success('User verified successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to verify user');
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to reject this organizer? This will unverify them.')) return;
    try {
      await verifyUser(id, false, token);
      setVerifications(prev => prev.filter(u => u.id !== id));
      loadAllUsers(token); // Refresh all users as well
      toast.success('User verification rejected');
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject user');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also permanently delete all their created events. This action cannot be undone.`)) return;
    try {
      await deleteUser(id, token);
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setVerifications(prev => prev.filter(u => u.id !== id)); // Also remove from pending if present
      toast.success('User and associated events deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleApproveEvent = async (id: string) => {
    if (!token) return;
    try {
      const updated = await approveEvent(id, true, token);
      setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
      toast.success('Event approved');
    } catch (error) {
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (id: string) => {
    if (!token) return;
    try {
      const updated = await approveEvent(id, false, token);
      setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
      toast.success('Event unapproved');
    } catch (error) {
      toast.error('Failed to unapprove event');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleSaveEvent = async (updatedEvent: Event) => {
    try {
      const isNew = updatedEvent.id.startsWith('temp-');
      const { id, ...dataToSave } = updatedEvent;

      // Ensure all required fields are included
      const eventData = {
        // Required fields
        title: dataToSave.title || 'Untitled Event',
        description: dataToSave.description || 'No description provided',
        category: dataToSave.category || 'academic_tech',
        location: dataToSave.location || 'Location not specified',
        date: dataToSave.date || new Date().toISOString(),
        organizerId: user?.id || 'admin',
        organizerName: user?.name || 'Admin',
        organizerAvatar: user?.avatar || '',

        // Media handling
        images: dataToSave.images || [],
        video: dataToSave.video || '',
        image: dataToSave.images?.[0] || '',
        mediaType: dataToSave.mediaType || 'image',

        // Default values
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        approved: true,
        isSponsored: false,

        // Timestamps
        createdAt: isNew ? new Date().toISOString() : dataToSave.createdAt,
        updatedAt: new Date().toISOString(),
      };

      if (token) {
        if (isNew) {
          // Create new event with all the required fields
          console.log('Creating event with data:', eventData);
          const created = await createEvent(eventData, token);
          setEvents(prev => [created, ...prev]);
          toast.success('Event created successfully');
        } else {
          console.log('Updating event with ID:', id, 'data:', eventData);
          const updated = await updateEvent(id, eventData, token);
          setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
          toast.success('Event updated successfully');
        }
      }
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id, token);
      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Event deleted');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="verify" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="verify" className="rounded-lg">Verify Organizers</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg">All Users</TabsTrigger>
            <TabsTrigger value="posts" className="rounded-lg">Manage Posts</TabsTrigger>
            <TabsTrigger value="ads" className="rounded-lg">Sponsor Ads</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>Review and approve organizer accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifications.length > 0 ? verifications.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground">{item.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.type || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleVerify(item.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(item.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No pending verifications
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all registered users and organizers on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.length > 0 ? allUsers.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>
                            <Badge variant={item.role === 'admin' ? 'destructive' : item.role === 'organizer' ? 'default' : 'secondary'} className="capitalize">
                              {item.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.role === 'organizer' ? (
                              item.verified ? (
                                <Badge variant="default" className="bg-green-500">Verified</Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>
                              )
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(item.id, item.name)}
                              title="Delete User"
                              disabled={item.role === 'admin'} // Prevent deleting admins
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No users registered yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setEditingEvent({
                  _id: 'temp-' + Date.now(), // Temporary ID that will be replaced by the server
                  id: 'temp-' + Date.now(),   // Also set id for consistency
                  title: '',
                  description: '',
                  category: 'academic_tech',
                  organizerId: user?.id || '',
                  organizerName: user?.name || 'Admin',
                  organizerAvatar: user?.avatar || '',
                  image: '',
                  images: [],
                  video: '',
                  location: '',
                  date: new Date().toISOString().split('T')[0],
                  likes: 0,
                  comments: 0,
                  shares: 0,
                  isLiked: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  approved: true,
                  mediaType: 'image',
                  isSponsored: false
                });
                setIsEditDialogOpen(true);
              }}>
                Create Event
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>All Event Posts</CardTitle>
                <CardDescription>Monitor and manage community events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.length > 0 ? events.map((event) => (
                    <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                      <div className="relative w-full sm:w-auto">
                        <img
                          src={event.image || '/placeholder.svg'}
                          alt={event.title}
                          className="w-full sm:w-20 h-40 sm:h-20 rounded-lg object-cover"
                        />
                        {event.mediaType === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white drop-shadow-lg" fill="white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <h3 className="font-semibold text-lg sm:text-base">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{event.organizerName}</p>
                        <div className="flex flex-wrap gap-2 mt-2 sm:mt-1">
                          <Badge variant="secondary">
                            {event.category}
                          </Badge>
                          <Badge variant={event.approved ? 'default' : 'destructive'}>
                            {event.approved ? 'Approved' : 'Pending'}
                          </Badge>
                          {event.isSponsored && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                              Sponsored
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                        {!event.approved && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveEvent(event.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {event.approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectEvent(event.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Unapprove
                          </Button>
                        )}
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
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No events found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <AdminAdsTab token={token} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats?.verifiedOrgs || 0}</p>
                      <p className="text-sm text-muted-foreground">Verified Orgs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">{stats?.eventsPosted || 0}</p>
                      <p className="text-sm text-muted-foreground">Events Posted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Platform engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Registrations (This Month)</span>
                    <span className="font-semibold text-green-600">+{stats?.registrationsGrowth || 23}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Event Creation Rate</span>
                    <span className="font-semibold text-green-600">+{stats?.eventCreationGrowth || 18}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement (Likes/Comments)</span>
                    <span className="font-semibold text-green-600">+{stats?.engagementGrowth || 31}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <EditEventDialog
        event={editingEvent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEvent}
      />
    </div>
  );
};


export default Admin;
