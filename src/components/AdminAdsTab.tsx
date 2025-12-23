import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Megaphone, Calendar, Globe, MapPin } from 'lucide-react';
import { fetchAllAds, deleteSponsorAd, type SponsorAd } from '@/services/eventService';
import { SponsorAdDialog } from './SponsorAdDialog';

interface AdminAdsTabProps {
    token: string | null;
}

export const AdminAdsTab = ({ token }: AdminAdsTabProps) => {
    const [ads, setAds] = useState<SponsorAd[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAds();
    }, [token]);

    const loadAds = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const allAds = await fetchAllAds(token);
            setAds(allAds);
        } catch (error) {
            toast.error('Failed to load ads');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to delete this ad?')) return;
        try {
            await deleteSponsorAd(id, token);
            setAds(prev => prev.filter(ad => ad.id !== id));
            toast.success('Ad deleted');
        } catch (error) {
            toast.error('Failed to delete ad');
        }
    };

    const getStatusBadge = (ad: SponsorAd) => {
        const now = new Date();
        const start = new Date(ad.startDate);
        const end = new Date(ad.endDate);

        if (now < start) return <Badge variant="outline" className="text-blue-500 border-blue-500">Scheduled</Badge>;
        if (now > end) return <Badge variant="destructive">Expired</Badge>;
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sponsor Ads</h2>
                    <p className="text-muted-foreground">Create and manage high-impact sponsored campaigns</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Create Ad
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Campaigns</CardTitle>
                    <CardDescription>Targeted content with brand presence</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad Detail</TableHead>
                                    <TableHead>Targeting</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.length > 0 ? ads.map((ad) => (
                                    <TableRow key={ad.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                                                    {ad.images?.[0] ? (
                                                        <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Megaphone className="w-6 h-6 m-3 opacity-20" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{ad.headline}</span>
                                                    <span className="text-xs text-muted-foreground">{ad.sponsorName}</span>
                                                    <Badge variant="outline" className="w-fit mt-1 text-[10px] h-4">
                                                        {ad.categoryLabel}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <MapPin className="w-3 h-3" />
                                                    {ad.targetCities.length > 0 ? ad.targetCities.join(', ') : 'All India'}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-blue-500 truncate max-w-[150px]">
                                                    <Globe className="w-3 h-3" />
                                                    {ad.websiteLink}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {new Date(ad.startDate).toLocaleDateString()}
                                                </span>
                                                <span>to {new Date(ad.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(ad)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(ad.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                            {loading ? 'Loading ads...' : 'No sponsored ads found. Create one to get started!'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <SponsorAdDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                token={token}
                onSuccess={loadAds}
            />
        </div>
    );
};
