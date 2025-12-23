import { useState, useEffect } from 'react';
import { Event } from '@/services/eventService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, User, Users, ShieldCheck, Mail, Phone, MapPin, School } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ParticipationDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ParticipationDialog = ({ event, open, onOpenChange }: ParticipationDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    // Section A
    name: '',
    email: '',
    phone: '',
    grade: '',
    schoolName: '',
    city: '',
    // Section B
    role: 'participant' as 'participant' | 'volunteer' | 'attendee',
    isTeam: false,
    teamName: '',
    teammateEmails: '', // Input as comma separated string
    tShirtSize: 'NA' as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'NA',
    dietaryRestrictions: '',
    // Section C
    parentalConsent: false,
    emergencyContact: '',
    schoolAuthorization: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        grade: user.grade || '',
        schoolName: (user as any).schoolName || '', // Accessing additional fields from user account
        city: user.location || '',
      }));
    }
  }, [open, user]);

  if (!event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await apiPost('/api/participation', {
        eventId: event.id,
        participant: {
          ...formData,
          teammateEmails: formData.teammateEmails.split(',').map(e => e.trim()).filter(e => e !== ''),
        },
      });

      if (error) {
        throw new Error(error);
      }

      toast.success('Registration successful! Check your email for confirmation.');
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        grade: user?.grade || '',
        schoolName: (user as any)?.schoolName || '',
        city: user?.location || '',
        role: 'participant',
        isTeam: false,
        teamName: '',
        teammateEmails: '',
        tShirtSize: 'NA',
        dietaryRestrictions: '',
        parentalConsent: false,
        emergencyContact: '',
        schoolAuthorization: false,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Participation submission error:', error);
      toast.error(error.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register for {event.title}</DialogTitle>
          <DialogDescription>
            Fill in your details to participate in this event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-3 py-1 custom-scrollbar">
          {/* Section A: Profile Data */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">A</span>
              Profile Details (Auto-filled)
            </h3>

            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <User className="w-3 h-3" /> Full Name
                </Label>
                <p className="text-sm font-medium">{formData.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <p className="text-sm font-medium truncate">{formData.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <School className="w-3 h-3" /> Grade & School
                </Label>
                <p className="text-sm font-medium">Grade {formData.grade}, {formData.schoolName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> City
                </Label>
                <p className="text-sm font-medium">{formData.city}</p>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              To update this info, please visit your account settings.
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Section B: Participation Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">B</span>
              Participation Info
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="attendee">Attendee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Participation Type</Label>
                <RadioGroup
                  value={formData.isTeam ? 'team' : 'individual'}
                  onValueChange={(value) => setFormData({ ...formData, isTeam: value === 'team' })}
                  className="flex gap-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="r-ind" />
                    <Label htmlFor="r-ind" className="text-xs font-normal cursor-pointer">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="team" id="r-team" />
                    <Label htmlFor="r-team" className="text-xs font-normal cursor-pointer">As a Team</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {formData.isTeam && (
              <div className="space-y-3 p-4 border rounded-lg bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="text-xs">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g. Cyber Guardians"
                    className="h-8 text-sm"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    required={formData.isTeam}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teammates" className="text-xs">Teammate Emails (Comma separated)</Label>
                  <Input
                    id="teammates"
                    placeholder="teammate@example.com, friend@example.com"
                    className="h-8 text-sm"
                    value={formData.teammateEmails}
                    onChange={(e) => setFormData({ ...formData, teammateEmails: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tshirt">T-Shirt Size (Optional)</Label>
                <Select
                  value={formData.tShirtSize}
                  onValueChange={(value: any) => setFormData({ ...formData, tShirtSize: value })}
                >
                  <SelectTrigger id="tshirt">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NA">Not Applicable</SelectItem>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                    <SelectItem value="XXL">XXL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietary">Dietary Restrictions</Label>
                <Input
                  id="dietary"
                  placeholder="e.g. Vegetarian, Nut Allergy"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section C: Safety & Consent */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">C</span>
              Trust & Safety
            </h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="emergency" className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-red-500" /> Emergency Contact Number
                </Label>
                <Input
                  id="emergency"
                  placeholder="Parent or Guardian's Active Number"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={formData.parentalConsent}
                    onCheckedChange={(checked) => setFormData({ ...formData, parentalConsent: !!checked })}
                    required
                  />
                  <Label htmlFor="consent" className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    I confirm my parent/guardian has approved my participation in this event.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="school"
                    checked={formData.schoolAuthorization}
                    onCheckedChange={(checked) => setFormData({ ...formData, schoolAuthorization: !!checked })}
                  />
                  <Label htmlFor="school" className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    I have informed my school coordinator about this registration.
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-background pb-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.parentalConsent} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Confirm Registry
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
