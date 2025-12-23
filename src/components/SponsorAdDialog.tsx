import { useState } from 'react';
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
import { toast } from 'sonner';
import { Loader2, Plus, X, Megaphone, Link as LinkIcon, MapPin, Tag, Calendar, Database } from 'lucide-react';
import { createSponsorAd } from '@/services/eventService';

interface SponsorAdDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    token: string | null;
    onSuccess: () => void;
}

export const SponsorAdDialog = ({ open, onOpenChange, token, onSuccess }: SponsorAdDialogProps) => {
    const [uploading, setUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        sponsorName: '',
        websiteLink: '',
        images: [] as string[],
        headline: '',
        description: '',
        targetCities: '', // Input as comma separated
        categoryLabel: 'Brand Event' as any,
        internalAdId: '',
        startDate: '',
        endDate: '',
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setUploading(true);
        const form = new FormData();
        form.append('file', file);

        try {
            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form,
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, data.url]
            }));
            toast.success('Image uploaded');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (formData.images.length === 0) {
            toast.error('Add at least one image/poster');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                targetCities: formData.targetCities.split(',').map(c => c.trim()).filter(c => c !== ''),
                startDate: formData.startDate,
                endDate: formData.endDate,
            };

            await createSponsorAd(payload, token);
            toast.success('Sponsor Ad created successfully!');
            onSuccess();
            onOpenChange(false);
            setFormData({
                sponsorName: '',
                websiteLink: '',
                images: [],
                headline: '',
                description: '',
                targetCities: '',
                categoryLabel: 'Brand Event',
                internalAdId: '',
                startDate: '',
                endDate: '',
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to create ad');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" /> Create Sponsor Campaign
                    </DialogTitle>
                    <DialogDescription>
                        Deploy high-impact sponsored content to the student community.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 py-4">
                    {/* Section A: Brand Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">A</span>
                            The "Brand" Info
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sponsorName">Sponsor Name</Label>
                                <Input
                                    id="sponsorName"
                                    placeholder="e.g. Aakash Institute"
                                    value={formData.sponsorName}
                                    onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website" className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" /> Official Website/Link
                                </Label>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://example.com"
                                    value={formData.websiteLink}
                                    onChange={(e) => setFormData({ ...formData, websiteLink: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section B: Visuals */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">B</span>
                            High-Impact Visuals
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Ad Images/Posters ({formData.images.length}/6)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={formData.images.length >= 6 || uploading}
                                    onClick={() => document.getElementById('ad-image-upload')?.click()}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                                    Add Poster
                                </Button>
                                <input
                                    id="ad-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {i === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5">
                                                Main
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Tip: Ensure at least one image has a clear Call to Action (CTA).
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="headline">Catchy Headline</Label>
                                <span className="text-[10px] text-muted-foreground">{formData.headline.length}/50</span>
                            </div>
                            <Input
                                id="headline"
                                placeholder="e.g. Admissions Open for 2024-25!"
                                maxLength={50}
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ad-desc">Ad Description (Simple & Impactful)</Label>
                            <Textarea
                                id="ad-desc"
                                placeholder="Briefly explain the offer or opportunity..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Section C: Targeting */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">C</span>
                            Smart Targeting
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cities" className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Target Cities
                                </Label>
                                <Input
                                    id="cities"
                                    placeholder="e.g. Delhi, Mumbai (Leave empty for All India)"
                                    value={formData.targetCities}
                                    onChange={(e) => setFormData({ ...formData, targetCities: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cat-label" className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Category Label
                                </Label>
                                <Select
                                    value={formData.categoryLabel}
                                    onValueChange={(value) => setFormData({ ...formData, categoryLabel: value })}
                                >
                                    <SelectTrigger id="cat-label">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="School Admission">School Admission</SelectItem>
                                        <SelectItem value="Teacher Hiring">Teacher Hiring</SelectItem>
                                        <SelectItem value="Brand Event">Brand Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section D: Tracking */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">D</span>
                            MVP Tracking & Scheduling
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="adId" className="flex items-center gap-1">
                                    <Database className="w-3 h-3" /> Internal Ad ID
                                </Label>
                                <Input
                                    id="adId"
                                    placeholder="e.g. AA-SCH-001"
                                    value={formData.internalAdId}
                                    onChange={(e) => setFormData({ ...formData, internalAdId: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="start" className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Start Date
                                </Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end" className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> End Date
                                </Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || uploading} className="min-w-[120px]">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Launch Campaign'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
