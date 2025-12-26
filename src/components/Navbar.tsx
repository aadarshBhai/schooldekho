import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Navbar = ({ searchQuery = '', onSearchChange }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-14 xs:h-16 items-center px-3 xs:px-4 sm:px-6 gap-2 xs:gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 xs:gap-2 font-bold text-lg xs:text-xl text-primary shrink-0">
          <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs xs:text-base">
            E
          </div>
          <span className="hidden xs:block">EventDekho</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xs xs:max-w-sm sm:max-w-md mx-1 xs:mx-2 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 h-3.5 xs:h-4 w-3.5 xs:w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-8 xs:pl-9 bg-background border-border h-8 xs:h-9 sm:h-10 text-xs xs:text-sm sm:text-base placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-1 xs:gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 xs:h-10 xs:w-10">
                  <Avatar className="h-6 w-6 xs:h-8 xs:w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs xs:text-sm">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 xs:w-56">
                <DropdownMenuItem asChild>
                  {user.id === 'admin-env' ? (
                    <Link to="/admin/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  ) : (
                    <Link to={`/profile/${user.id}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  )}
                </DropdownMenuItem>

                {(user.role === 'organizer' || user.role === 'admin') && (
                  <DropdownMenuItem asChild>
                    <Link to={user.role === 'admin' ? "/admin/dashboard" : "/profile/dashboard"} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="text-xs xs:text-sm px-2 xs:px-4">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
