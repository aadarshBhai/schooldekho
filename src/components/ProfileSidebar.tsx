import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, logout } = useAuth();

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
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={user.verified ? "default" : "secondary"}>
                {user.verified ? "Verified" : "Unverified"}
              </Badge>
              <Badge variant="outline">
                {user.role}
              </Badge>
              {user.role === 'organizer' && user.verified && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  ✓ Verified Organizer
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bio */}
          {user.bio && (
            <div className="text-sm text-muted-foreground">
              <p>{user.bio}</p>
            </div>
          )}

          {/* User Info */}
          <div className="space-y-2">
            {user.type && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{user.type.replace('_', ' ')}</span>
              </div>
            )}
            
            {user.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{user.location}</span>
              </div>
            )}
            
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            
            {user.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.website}
                </a>
              </div>
            )}

            {user.grade && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>Grade: {user.grade}</span>
              </div>
            )}
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Interests</h4>
              <div className="flex flex-wrap gap-1">
                {user.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Organizer Specific Section */}
          {user.role === 'organizer' && (
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
              <Link to={`/profile/${user.id}`}>
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

            {user.role === 'organizer' && (
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

            {user.role === 'admin' && (
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
