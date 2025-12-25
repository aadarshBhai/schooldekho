import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Filter, SlidersHorizontal, X, MapPin, Globe, Briefcase, GraduationCap, Banknote, Calendar, Users } from 'lucide-react';
import { type EventFilters } from '@/services/eventService';

interface AdvancedFiltersProps {
    onFilterChange: (filters: EventFilters) => void;
    currentFilters: EventFilters;
}

export const AdvancedFilters = ({ onFilterChange, currentFilters }: AdvancedFiltersProps) => {
    const [localFilters, setLocalFilters] = useState<EventFilters>(currentFilters);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const applyFilters = () => {
        onFilterChange(localFilters);
        setIsSheetOpen(false);
    };

    const clearFilters = () => {
        const cleared = {
            query: currentFilters.query,
            category: currentFilters.category,
        };
        setLocalFilters(cleared);
        onFilterChange(cleared);
    };

    const updateFilter = (key: keyof EventFilters, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    };

    const getActiveFilterCount = () => {
        const list = Object.entries(currentFilters).filter(([key, val]) =>
            val && val !== 'all' && key !== 'query' && key !== 'category'
        );
        return list.length;
    };

    return (
        <div className="space-y-3 xs:space-y-4 mb-4 xs:mb-6">
            {/* Primary Filters Row */}
            <div className="flex flex-wrap items-center gap-2 xs:gap-3">
                <div className="flex-1 min-w-[100px] xs:min-w-[120px]">
                    <Select
                        value={currentFilters.mode || 'all'}
                        onValueChange={(val) => updateFilter('mode', val)}
                    >
                        <SelectTrigger className="h-8 xs:h-9 text-[10px] xs:text-xs">
                            <span className="flex items-center gap-1">
                                {currentFilters.mode ? <Globe className="w-3 h-3 text-primary" /> : <Filter className="w-3 h-3" />}
                                <SelectValue placeholder="Mode" />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Modes</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-[1.5] min-w-[120px] xs:min-w-[150px] relative">
                    <Input
                        placeholder="Search City..."
                        className="h-8 xs:h-9 text-[10px] xs:text-xs pl-7 xs:pl-8"
                        value={currentFilters.city || ''}
                        onChange={(e) => onFilterChange({ ...currentFilters, city: e.target.value || undefined })}
                    />
                    <MapPin className="absolute left-2 xs:left-2.5 top-2 xs:top-2.5 w-3 xs:w-3.5 h-3 xs:h-3.5 text-muted-foreground" />
                </div>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 xs:h-9 gap-1 xs:gap-2 text-[10px] xs:text-xs px-2 xs:px-3">
                            <SlidersHorizontal className="w-3 h-3" />
                            <span className="hidden xs:inline">More Filters</span>
                            <span className="xs:hidden">Filters</span>
                            {getActiveFilterCount() > 0 && (
                                <Badge variant="secondary" className="ml-1 h-3 xs:h-4 px-1 text-[8px] xs:text-[10px]">
                                    {getActiveFilterCount()}
                                </Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-4 xs:p-6">
                        <SheetHeader className="pb-3 xs:pb-4 border-b">
                            <SheetTitle className="flex items-center gap-2 text-primary text-lg xs:text-xl">
                                Advanced Filters
                            </SheetTitle>
                            <SheetDescription className="text-xs xs:text-sm">
                                Refine your discovery with granular details
                            </SheetDescription>
                        </SheetHeader>

                        <div className="py-4 xs:py-6 space-y-6 xs:space-y-8">
                            {/* B. Granular Filters */}
                            <div className="space-y-3 xs:space-y-4">
                                <h4 className="text-[10px] xs:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <GraduationCap className="w-3 xs:w-4 h-3 xs:h-4" /> Granular Filters
                                </h4>

                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] xs:text-xs">Eligibility</Label>
                                        <Select value={localFilters.eligibility || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, eligibility: v })}>
                                            <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue placeholder="Grade" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Grades</SelectItem>
                                                <SelectItem value="9">Grade 9</SelectItem>
                                                <SelectItem value="10">Grade 10</SelectItem>
                                                <SelectItem value="11">Grade 11</SelectItem>
                                                <SelectItem value="12">Grade 12</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] xs:text-xs flex items-center gap-1"><Banknote className="w-3 h-3" /> Price</Label>
                                        <Select value={localFilters.price || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, price: v })}>
                                            <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue placeholder="Free/Paid" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any Price</SelectItem>
                                                <SelectItem value="Free">Free</SelectItem>
                                                <SelectItem value="Paid">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] xs:text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Range</Label>
                                        <Select value={localFilters.dateRange || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, dateRange: v })}>
                                            <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue placeholder="When?" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Anytime</SelectItem>
                                                <SelectItem value="Today">Today</SelectItem>
                                                <SelectItem value="This Weekend">This Weekend</SelectItem>
                                                <SelectItem value="Next 30 Days">Next 30 Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] xs:text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Entry Type</Label>
                                        <Select value={localFilters.entryType || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, entryType: v })}>
                                            <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue placeholder="Team/Indiv" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any Entry</SelectItem>
                                                <SelectItem value="Individual">Individual</SelectItem>
                                                <SelectItem value="Team-based">Team-based</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* C. Professional Filters */}
                            <div className="space-y-3 xs:space-y-4 pt-3 xs:pt-4 border-t">
                                <h4 className="text-[10px] xs:text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                    <Briefcase className="w-3 xs:w-4 h-3 xs:h-4" /> Professional (Hiring)
                                </h4>

                                <div className="space-y-3 xs:space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] xs:text-xs">Subject Expertise</Label>
                                        <Select value={localFilters.subjectExpertise || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, subjectExpertise: v })}>
                                            <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any Subject</SelectItem>
                                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                                <SelectItem value="Science">Science</SelectItem>
                                                <SelectItem value="Arts">Arts</SelectItem>
                                                <SelectItem value="Sports Coach">Sports Coach</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] xs:text-xs">Experience</Label>
                                            <Select value={localFilters.experienceRequired || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, experienceRequired: v })}>
                                                <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Any Exp</SelectItem>
                                                    <SelectItem value="Fresher">Fresher</SelectItem>
                                                    <SelectItem value="1-3 Years">1-3 Years</SelectItem>
                                                    <SelectItem value="5+ Years">5+ Years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] xs:text-xs">Job Type</Label>
                                            <Select value={localFilters.jobType || 'all'} onValueChange={(v) => setLocalFilters({ ...localFilters, jobType: v })}>
                                                <SelectTrigger className="text-[10px] xs:text-xs h-8 xs:h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Any Type</SelectItem>
                                                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                                                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                                                    <SelectItem value="Visiting Faculty">Visiting Faculty</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 xs:p-6 bg-background border-t gap-2">
                            <Button variant="outline" className="flex-1 h-9 xs:h-10 text-xs xs:text-sm" onClick={clearFilters}>Reset</Button>
                            <Button className="flex-1 h-9 xs:h-10 text-xs xs:text-sm" onClick={applyFilters}>Show Results</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Active Filter Badges */}
            {getActiveFilterCount() > 0 && (
                <div className="flex flex-wrap gap-1.5 xs:gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {Object.entries(currentFilters).map(([key, value]) => {
                        if (!value || value === 'all' || key === 'query' || key === 'category') return null;
                        return (
                            <Badge key={key} variant="secondary" className="pl-1.5 xs:pl-2 pr-1 h-5 xs:h-6 flex items-center gap-1 text-[8px] xs:text-[10px]">
                                <span className="capitalize">{key}:</span> {value}
                                <button
                                    onClick={() => updateFilter(key as any, 'all')}
                                    className="hover:bg-muted p-0.5 rounded-full"
                                >
                                    <X className="w-2.5 xs:w-3 h-2.5 xs:h-3" />
                                </button>
                            </Badge>
                        );
                    })}
                    <Button variant="ghost" size="sm" className="h-5 xs:h-6 px-1.5 xs:px-2 text-[8px] xs:text-[10px] text-muted-foreground" onClick={clearFilters}>
                        Clear All
                    </Button>
                </div>
            )}
        </div>
    );
};
