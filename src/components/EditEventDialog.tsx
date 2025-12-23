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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plus, X, Video, Image as ImageIcon } from 'lucide-react';
import { getLocationFromPincode, getPincodeFromLocation } from '@/data/locationData';

interface EditEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedEvent: Event) => void;
}

export const EditEventDialog = ({ event, open, onOpenChange, onSave }: EditEventDialogProps) => {
  const [formData, setFormData] = useState<Event | null>(event);
  // Separate states for granular control in the form, will merge into formData.location on save
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFormData(event);
    if (event?.location) {
      // Attempt to parse existing location or just set city
      // If the location string looks like "City - Pincode", we could split it, 
      // but for now let's assume it's just the city/location name.
      setCity(event.location);
      // Try to back-fill pincode?
      const foundPin = getPincodeFromLocation(event.location);
      if (foundPin) setPincode(foundPin);
      else setPincode('');
    }
  }, [event]);

  if (!event || !formData) return null;

  const handleSave = () => {
    if (!city || !pincode) {
      toast.error('Please enter both Pincode and Location');
      return;
    }

    if (formData) {
      // Validate Media Rules
      if (formData.mediaType === 'image') {
        if (!formData.images || formData.images.length === 0) {
          // Allow saving without images? Requirement says "upload up to 6", implying optional?
          // Usually creation requires media. Let's assume at least 1 provided if this is a real app,
          // but for now just warn if logic requires strictness.
        }
        if (formData.images && formData.images.length > 6) {
          toast.error('Maximum 6 images allowed');
          return;
        }
      } else if (formData.mediaType === 'video') {
        // validate video presence
      }

      onSave({
        ...formData,
        location: city // Just saving city as the main location string for now, could be `${city} - ${pincode}`
      });
      toast.success('Event updated successfully');
      onOpenChange(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    setPincode(value);

    // Auto-fetch Location
    const location = getLocationFromPincode(value);
    if (location) {
      setCity(location);
    }
  };

  const handleCityChange = (value: string) => {
    setCity(value);

    // Auto-fetch Pincode
    const foundPin = getPincodeFromLocation(value);
    if (foundPin) {
      setPincode(foundPin);
    }
  };

  // Media Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images && formData.images.length >= 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newImages = [...(formData.images || []), data.url];

      setFormData({
        ...formData,
        images: newImages,
        image: newImages[0] // Sync legacy
      });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input value to allow selecting same file again if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, images: newImages, image: newImages[0] || '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>{formData?.id ? 'Update event details' : 'Add a new event'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Event Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic_tech">Academic & Tech</SelectItem>
                  <SelectItem value="leadership_literary">Leadership & Literary</SelectItem>
                  <SelectItem value="sports_fitness">Sports & Fitness</SelectItem>
                  <SelectItem value="creative_arts">Creative Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Event Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Location Section - Split Fields */}
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <Label className="text-base font-semibold">Location Details</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pincode">Pincode</Label>
                <Input
                  id="edit-pincode"
                  placeholder="e.g. 400001"
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-location">City / Area</Label>
                <Input
                  id="edit-location"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter Pincode to auto-fetch City, or vice-versa.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {/* Media Selection Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <Label className="text-base font-semibold">Media Upload</Label>

            <RadioGroup
              value={formData.mediaType}
              onValueChange={(value: 'image' | 'video') => {
                setFormData({
                  ...formData,
                  mediaType: value,
                  // clear other fields when switching
                  images: value === 'image' ? [''] : [],
                  image: '', // clear legacy
                  video: ''
                });
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-accent">
                <RadioGroupItem value="image" id="r-image" />
                <Label htmlFor="r-image" className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon className="w-4 h-4" /> Images (Up to 6)
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-accent">
                <RadioGroupItem value="video" id="r-video" />
                <Label htmlFor="r-video" className="flex items-center gap-2 cursor-pointer">
                  <Video className="w-4 h-4" /> Video (Single)
                </Label>
              </div>
            </RadioGroup>

            {formData.mediaType === 'image' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Images ({formData.images?.length || 0}/6)</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={(formData.images?.length || 0) >= 6 || uploading}
                      className="relative cursor-pointer"
                      onClick={() => document.getElementById('image-upload-input')?.click()}
                    >
                      {uploading ? (
                        <span className="flex items-center gap-2">Uploading...</span>
                      ) : (
                        <><Plus className="w-4 h-4 mr-1" /> Add Image</>
                      )}
                    </Button>
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e)}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {formData.images?.map((img, i) => (
                    <div key={i} className="flex gap-2 items-center border p-2 rounded bg-card">
                      <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0 bg-muted">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm truncate text-muted-foreground px-2">
                        Image {i + 1}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(i)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {(!formData.images || formData.images.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                      No images added. Click "Add Image" to upload.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Video URL</Label>
                <div className="flex gap-2 items-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <Input
                    value={formData.video || ''}
                    onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Only one video allowed per event.</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
