import { Home, Compass, Film, User, Map, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50">
      <div className="flex items-center justify-around h-14 xs:h-16">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Home className="h-5 w-5 xs:h-6 xs:w-6" />
          <span className="text-[10px] xs:text-xs font-medium">Home</span>
        </Link>

        <Link
          to="/map"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/map') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Map className="h-5 w-5 xs:h-6 xs:w-6" />
          <span className="text-[10px] xs:text-xs font-medium">Map</span>
        </Link>

        {user && (user.role === 'organizer' || user.role === 'admin') && (
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className="bg-primary text-primary-foreground rounded-lg p-1.5">
              <Plus className="h-4 w-4 xs:h-5 xs:w-5" />
            </div>
            <span className="text-[10px] xs:text-xs font-medium">Create</span>
          </Link>
        )}

        <Link
          to="/explore"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/explore') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Compass className="h-5 w-5 xs:h-6 xs:w-6" />
          <span className="text-[10px] xs:text-xs font-medium">Explore</span>
        </Link>

        {user?.id !== 'admin-env' && (
          <Link
            to={user ? `/profile/${user.id}` : '/login'}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive(`/profile/${user?.id}`) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <User className="h-5 w-5 xs:h-6 xs:w-6" />
            <span className="text-[10px] xs:text-xs font-medium">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
};
