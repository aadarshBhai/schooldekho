import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      toast.success('Login successful!');
      // Navigation will happen via redirect above
      window.location.href = '/';
    } else {
      toast.error('Invalid credentials');
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-3 xs:p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="w-full max-w-md border-0 shadow-xl sm:shadow-2xl">
        <CardHeader className="text-center p-6 xs:p-8">
          <div className="w-12 h-12 xs:w-16 xs:h-16 mx-auto mb-3 xs:mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-lg xs:text-2xl font-bold">
            E
          </div>
          <CardTitle className="text-xl xs:text-2xl">Welcome to EventDekho</CardTitle>
          <CardDescription className="text-sm xs:text-base">Login to discover and create amazing events</CardDescription>
        </CardHeader>
        <CardContent className="p-6 xs:p-8 pt-0 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 xs:h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-10 xs:h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-10 xs:h-11 text-sm xs:text-base font-medium" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs xs:text-sm space-y-2">
            <div>
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div>
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
