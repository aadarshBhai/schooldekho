import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { validateLocation } from '@/data/locationData';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

export const LocationInput = ({ value, onChange, onValidationChange }: LocationInputProps) => {
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [suggestedLocation, setSuggestedLocation] = useState('');

  useEffect(() => {
    if (!value) {
      setValidationStatus('idle');
      setSuggestedLocation('');
      onValidationChange(false);
      return;
    }

    const timer = setTimeout(() => {
      const result = validateLocation(value);
      
      if (result.isValid) {
        setValidationStatus('valid');
        setSuggestedLocation(result.location);
        onValidationChange(true);
        
        // Auto-fill if pincode was entered
        if (/^\d{6}$/.test(value) && result.location) {
          onChange(result.location);
        }
      } else {
        setValidationStatus('invalid');
        setSuggestedLocation('');
        onValidationChange(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onChange, onValidationChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="location">
        Location <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="location"
          placeholder="Enter pincode or city name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-10 ${
            validationStatus === 'valid' ? 'border-green-500' : 
            validationStatus === 'invalid' ? 'border-destructive' : ''
          }`}
          required
        />
        {validationStatus === 'valid' && (
          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
        )}
        {validationStatus === 'invalid' && (
          <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
        )}
      </div>
      {validationStatus === 'invalid' && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Location not found. Please enter a valid pincode or city name.
        </p>
      )}
      {suggestedLocation && value !== suggestedLocation && (
        <p className="text-xs text-muted-foreground">
          Suggested: {suggestedLocation}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Enter a 6-digit pincode or city name (e.g., 400001 or Mumbai)
      </p>
    </div>
  );
};
