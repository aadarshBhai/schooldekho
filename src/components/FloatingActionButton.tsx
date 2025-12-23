import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const FloatingActionButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      toast.error('Please login to create posts');
      navigate('/login');
      return;
    }

    if (user.role !== 'organizer') {
      toast.error('Only organizers can create events');
      return;
    }

    if (!user.verified) {
      toast.error('Please wait for admin verification');
      return;
    }

    navigate('/dashboard');
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="fixed bottom-20 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};
