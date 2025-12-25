import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';

const Signup = () => {
  const [userType, setUserType] = useState<'student' | 'parent' | 'organizer'>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationType: 'school' as 'school' | 'ngo' | 'community',
    city: '',
    designation: '',
    phone: '',
    schoolName: '',
    schoolAddress: '',
    website: '',
    principalName: '',
    instagram: '',
    facebook: '',
    preferredCommunication: 'email' as 'whatsapp' | 'email',
    bio: '',
    verificationFile: '',
    // Student/Parent fields
    grade: '' as '9' | '10' | '11' | '12' | '',
    interests: [] as string[],
    parentalConsent: false,
    childPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/upload`, {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData({ ...formData, verificationFile: data.url });
      toast.success('Verification document uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload verification document');
    } finally {
      setUploading(false);
    }
  };
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const role: UserRole = userType === 'organizer' ? 'organizer' : 'user';

    if (userType === 'organizer' && !formData.verificationFile) {
      toast.error('Please upload a verification document (ID or Authorization Letter)');
      setLoading(false);
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role,
      type: userType === 'organizer' ? formData.organizationType : undefined,
      verified: false,
      // Organizer specific fields
      designation: userType === 'organizer' ? formData.designation : undefined,
      phone: (userType === 'organizer' || userType === 'student' || userType === 'parent') ? formData.phone : undefined,
      schoolName: (userType === 'organizer' || userType === 'student' || userType === 'parent') ? formData.schoolName : undefined,
      schoolAddress: userType === 'organizer' ? formData.schoolAddress : undefined,
      website: userType === 'organizer' ? formData.website : undefined,
      principalName: userType === 'organizer' ? formData.principalName : undefined,
      socialLinks: userType === 'organizer' ? {
        instagram: formData.instagram,
        facebook: formData.facebook
      } : undefined,
      preferredCommunication: userType === 'organizer' ? formData.preferredCommunication : undefined,
      bio: (userType === 'organizer' || userType === 'student' || userType === 'parent') ? formData.bio : undefined,
      verificationFile: userType === 'organizer' ? formData.verificationFile : undefined,
      // Student/Parent specific fields
      userSubtype: userType !== 'organizer' ? userType : undefined,
      grade: userType !== 'organizer' ? formData.grade : undefined,
      interests: userType !== 'organizer' ? formData.interests : undefined,
      parentalConsent: userType === 'student' ? formData.parentalConsent : undefined,
      childPhone: userType === 'parent' ? formData.childPhone : undefined,
      location: userType !== 'organizer' ? formData.city : undefined,
    };

    const success = await signup(userData);

    if (success) {
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } else {
      toast.error('Signup failed. Please try again.');
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
          <CardTitle className="text-xl xs:text-2xl">Join EventDekho</CardTitle>
          <CardDescription className="text-sm xs:text-base">Create your account and start connecting</CardDescription>
        </CardHeader>
        <CardContent className="p-6 xs:p-8 pt-0 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">I am a</Label>
              <Select value={userType} onValueChange={(value: 'student' | 'parent' | 'organizer') => setUserType(value)}>
                <SelectTrigger className="h-10 xs:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="organizer">Organizer (School/NGO/Comm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common Identity Fields - Section A for Students/Parents */}
            {(userType === 'student' || userType === 'parent') && (
              <div className="space-y-6 pt-4 border-t">
                {/* Section A: Basic Identity */}
                <div className="space-y-4">
                  <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">A</span>
                    Basic Identity
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name (As per school records)</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10 xs:h-11"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Mobile Number (For OTP)</Label>
                      <Input
                        id="phone"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-10 xs:h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10 xs:h-11"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Educational Context */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">B</span>
                    Educational Context
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
                      <Input
                        id="schoolName"
                        placeholder="Green Valley High"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        className="h-10 xs:h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="h-10 xs:h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium">Grade / Class</Label>
                    <Select value={formData.grade} onValueChange={(value: any) => setFormData({ ...formData, grade: value })}>
                      <SelectTrigger className="h-10 xs:h-11">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                        <SelectItem value="11">Grade 11</SelectItem>
                        <SelectItem value="12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Stream / Interests (Select Categories)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 p-3 border rounded-lg bg-muted/20">
                      {[
                        { id: 'academic_tech', label: 'Academic & Tech' },
                        { id: 'leadership_literary', label: 'Leadership & Literary' },
                        { id: 'sports_fitness', label: 'Sports & Fitness' },
                        { id: 'creative_arts', label: 'Creative Arts' },
                      ].map((interest) => (
                        <div key={interest.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={interest.id}
                            checked={formData.interests.includes(interest.id)}
                            onCheckedChange={(checked) => {
                              const newInterests = checked
                                ? [...formData.interests, interest.id]
                                : formData.interests.filter((i) => i !== interest.id);
                              setFormData({ ...formData, interests: newInterests });
                            }}
                          />
                          <label htmlFor={interest.id} className="text-xs xs:text-sm font-medium leading-none cursor-pointer">
                            {interest.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground italic">Helps power personalized discovery feature.</p>
                  </div>
                </div>

                {/* Section C: Security & Consent */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">C</span>
                    Security & Consent
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password (Min 8 characters)</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pr-10 h-10 xs:h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {userType === 'student' && (
                    <div className="flex items-start space-x-2 p-3 border rounded-lg bg-primary/5">
                      <Checkbox
                        id="parentalConsent"
                        checked={formData.parentalConsent}
                        onCheckedChange={(checked) => setFormData({ ...formData, parentalConsent: !!checked })}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="parentalConsent" className="text-xs xs:text-sm font-medium cursor-pointer">
                          Parental Consent
                        </label>
                        <p className="text-[10px] xs:text-xs text-muted-foreground">
                          I confirm that my parent/guardian is aware of this registration.
                        </p>
                      </div>
                    </div>
                  )}

                  {userType === 'parent' && (
                    <div className="space-y-2 p-3 border rounded-lg bg-primary/5">
                      <Label htmlFor="childPhone" className="text-sm font-medium">Student Link</Label>
                      <Input
                        id="childPhone"
                        placeholder="Enter your child's mobile number"
                        value={formData.childPhone}
                        onChange={(e) => setFormData({ ...formData, childPhone: e.target.value })}
                        className="h-10 xs:h-11"
                      />
                      <p className="text-[10px] xs:text-xs text-muted-foreground italic">Link accounts to stay updated with your child's interests.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">About You (Optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Short bio..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common Registration Details if Not Student/Parent (Organizer flow) */}
            {userType === 'organizer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="Green Valley School"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 xs:h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pr-10 h-10 xs:h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Organizer-specific Fields */}
            {userType === 'organizer' && (
              <div className="space-y-6 pt-4 border-t">
                {/* Section A: Professional Identity */}
                <div className="space-y-4">
                  <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">A</span>
                    Professional Identity
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation" className="text-sm font-medium">Official Designation</Label>
                      <Input
                        id="designation"
                        placeholder="e.g. Activity Coordinator"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="h-10 xs:h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Personal Phone (WhatsApp)</Label>
                      <Input
                        id="phone"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-10 xs:h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-sm font-medium">School / Organization Name</Label>
                    <Input
                      id="schoolName"
                      placeholder="Enter full official name"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="h-10 xs:h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolAddress" className="text-sm font-medium">School Address / City</Label>
                    <Input
                      id="schoolAddress"
                      placeholder="e.g. Bandra West, Mumbai"
                      value={formData.schoolAddress}
                      onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                      className="h-10 xs:h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Verification Upload (ID Card / Letter)</Label>
                    <div className="flex items-center gap-3 xs:gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full relative h-10 xs:h-11 text-xs xs:text-sm"
                        disabled={uploading}
                        onClick={() => document.getElementById('verification-upload')?.click()}
                      >
                        {uploading ? 'Uploading...' : formData.verificationFile ? 'Change File' : 'Upload Document'}
                      </Button>
                      <input
                        id="verification-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                      {formData.verificationFile && (
                        <div className="text-[10px] xs:text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                          Uploaded ✓
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground">Upload School ID or Authorization Letter signed by Principal.</p>
                  </div>
                </div>

                {/* Section B: Institutional Profile */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">B</span>
                    Institutional Profile
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium">School Website URL</Label>
                    <Input
                      id="website"
                      placeholder="https://www.school.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-10 xs:h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principalName" className="text-sm font-medium">Principal's Name</Label>
                    <Input
                      id="principalName"
                      placeholder="Enter Principal's full name"
                      value={formData.principalName}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      className="h-10 xs:h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-sm font-medium">Instagram link</Label>
                      <Input
                        id="instagram"
                        placeholder="instagram.com/school"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        className="h-10 xs:h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-sm font-medium">Facebook link</Label>
                      <Input
                        id="facebook"
                        placeholder="facebook.com/school"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        className="h-10 xs:h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Account Preferences */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-base xs:text-lg font-semibold flex items-center gap-2 text-primary">
                    <span className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary text-white text-[10px] xs:text-xs">C</span>
                    Account Preferences
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preferred Communication</Label>
                    <Select
                      value={formData.preferredCommunication}
                      onValueChange={(value: 'whatsapp' | 'email') =>
                        setFormData({ ...formData, preferredCommunication: value })
                      }
                    >
                      <SelectTrigger className="h-10 xs:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp & Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">User Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us why you are using EventDekho..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-10 xs:h-11 text-sm xs:text-base font-medium" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs xs:text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </div>

          {userType === 'organizer' && (
            <div className="p-3 xs:p-4 bg-secondary/50 rounded-lg text-[10px] xs:text-xs text-muted-foreground">
              Note: Organizer accounts require admin verification before you can create events.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
