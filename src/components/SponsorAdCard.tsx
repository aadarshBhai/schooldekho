import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Megaphone, Globe } from 'lucide-react';
import { type SponsorAd } from '@/services/eventService';

interface SponsorAdCardProps {
    ad: SponsorAd;
}

export const SponsorAdCard = ({ ad }: SponsorAdCardProps) => {
    const handleAdClick = () => {
        window.open(ad.websiteLink, '_blank', 'noopener,noreferrer');
    };

    return (
        <Card
            className="overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl bg-card group"
            onClick={handleAdClick}
        >
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-none">{ad.sponsorName}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> {new URL(ad.websiteLink).hostname}
                        </span>
                    </div>
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider px-1.5 h-5">
                    Sponsored
                </Badge>
            </div>

            <div className="relative aspect-[4/5] sm:aspect-video overflow-hidden">
                {ad.images?.[0] ? (
                    <img
                        src={ad.images[0]}
                        alt={ad.headline}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Megaphone className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                )}

                {/* Category Overlay */}
                <div className="absolute top-3 left-3">
                    <Badge className="bg-black/60 backdrop-blur-md text-white border-none text-[10px] h-6">
                        {ad.categoryLabel}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {ad.headline}
                    </h3>
                    <ExternalLink className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                    {ad.description}
                </p>

                <div className="pt-2">
                    <div className="w-full h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm hover:brightness-110 transition-all">
                        Learn More
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
