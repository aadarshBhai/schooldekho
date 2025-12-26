import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProfile } from '@/services/eventService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar, 
  CalendarDays,
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  Award,
  Settings,
  LogOut,
  Building,
  TrendingUp,
  Star
} from 'lucide-react';

export const ProfileSidebar = () => {
  const { user, logout, updateUser } = useAuth();
  const [freshUserData, setFreshUserData] = useState(user);

  // Fetch fresh user data on component mount to get current verification status
  useEffect(() => {
    console.log('ProfileSidebar: Current user data:', user);
    console.log('ProfileSidebar: User verified status:', user?.verified);
    
    if (user && user.id) {
      console.log('ProfileSidebar: Fetching fresh user data...');
      fetchUserProfile(user.id).then(freshUser => {
        if (freshUser) {
          console.log('ProfileSidebar: Fresh user data:', freshUser);
          console.log('ProfileSidebar: Fresh user verified status:', freshUser.verified);
          setFreshUserData(freshUser);
          // Update the auth context with fresh data
          updateUser(freshUser);
        }
      }).catch(error => {
        console.error('ProfileSidebar: Failed to fetch fresh user data:', error);
      });
    }
  }, [user, updateUser]);

  const displayUser = freshUserData || user;

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="hidden lg:block w-80 flex-shrink-0">
      <Card className="sticky top-20">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={displayUser.avatar} />
              <AvatarFallback className="text-xl">{displayUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{displayUser.name}</h3>
              <p className="text-sm text-muted-foreground">{displayUser.email}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={displayUser.verified ? "default" : "secondary"}>
                {displayUser.verified ? "Verified" : "Unverified"}
              </Badge>
              <Badge variant="outline">
                {displayUser.role}
              </Badge>
              {displayUser.role === 'organizer' && displayUser.verified && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  ✓ Verified Organizer
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bio */}
          {displayUser.bio && (
            <div className="text-sm text-muted-foreground">
              <p>{displayUser.bio}</p>
            </div>
          )}

          {/* User Info */}
          <div className="space-y-2">
            {displayUser.type && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{displayUser.type.replace('_', ' ')}</span>
              </div>
            )}
            
            {displayUser.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{displayUser.location}</span>
              </div>
            )}
            
            {displayUser.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{displayUser.phone}</span>
              </div>
            )}
            
            {displayUser.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={displayUser.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {displayUser.website}
                </a>
              </div>
            )}

            {displayUser.grade && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>Grade: {displayUser.grade}</span>
              </div>
            )}
          </div>

          {/* Interests */}
          {displayUser.interests && displayUser.interests.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Interests</h4>
              <div className="flex flex-wrap gap-1">
                {displayUser.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Organizer Specific Section */}
          {displayUser.role === 'organizer' && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-3 flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Organizer Tools
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>Manage Events</span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <Users className="h-4 w-4 text-primary" />
                  <span>View Participants</span>
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Analytics</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to={`/profile/${displayUser.id}`}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/profile/dashboard">
                <Calendar className="mr-2 h-4 w-4" />
                My Events
              </Link>
            </Button>

            {displayUser.role === 'organizer' && (
              <>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/profile/dashboard">
                    <Settings className="mr-2 h-4 w-4" />
                    Create Event
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/profile/dashboard">
                    <Star className="mr-2 h-4 w-4" />
                    My Listings
                  </Link>
                </Button>
              </>
            )}

            {displayUser.role === 'admin' && (
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/dashboard">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            )}

            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
