import { Home, Compass, Film, User, Map } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex items-center justify-around h-16">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          to="/map"
          className={`flex flex-col items-center gap-1 p-2 ${isActive('/map') ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <Map className="h-6 w-6" />
          <span className="text-xs">Map</span>
        </Link>

        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 ${isActive('/reels') ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <Film className="h-6 w-6" />
          <span className="text-xs">Reels</span>
        </Link>

        {user?.id !== 'admin-env' && (
          <Link
            to={user ? `/profile/${user.id}` : '/login'}
            className={`flex flex-col items-center gap-1 p-2 ${isActive(`/profile/${user?.id}`) ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
};
