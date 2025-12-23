// Demo location database for pincode validation
export const locationDatabase: Record<string, string> = {
  // Maharashtra
  "400001": "Mumbai, Maharashtra",
  "400002": "Mumbai, Maharashtra",
  "411001": "Pune, Maharashtra",
  "411014": "Pune, Maharashtra",
  "440001": "Nagpur, Maharashtra",
  
  // Delhi
  "110001": "Delhi",
  "110002": "Delhi",
  "110003": "Delhi",
  
  // Karnataka
  "560001": "Bangalore, Karnataka",
  "560002": "Bangalore, Karnataka",
  "560025": "Bangalore, Karnataka",
  
  // Tamil Nadu
  "600001": "Chennai, Tamil Nadu",
  "600002": "Chennai, Tamil Nadu",
  
  // Gujarat
  "380001": "Ahmedabad, Gujarat",
  "380009": "Ahmedabad, Gujarat",
  
  // West Bengal
  "700001": "Kolkata, West Bengal",
  "700016": "Kolkata, West Bengal",
  
  // Rajasthan
  "302001": "Jaipur, Rajasthan",
  "302015": "Jaipur, Rajasthan",
  
  // Uttar Pradesh
  "226001": "Lucknow, Uttar Pradesh",
  "282001": "Agra, Uttar Pradesh",
};

export const validateLocation = (input: string): { isValid: boolean; location: string } => {
  const trimmedInput = input.trim();
  
  // Check if it's a pincode (6 digits)
  const pincodeRegex = /^\d{6}$/;
  if (pincodeRegex.test(trimmedInput)) {
    const location = locationDatabase[trimmedInput];
    if (location) {
      return { isValid: true, location };
    }
    return { isValid: false, location: '' };
  }
  
  // Check if the location exists in our database (by name)
  const locationExists = Object.values(locationDatabase).some(
    loc => loc.toLowerCase().includes(trimmedInput.toLowerCase())
  );
  
  if (locationExists || trimmedInput.length > 3) {
    return { isValid: true, location: trimmedInput };
  }
  
  
  return { isValid: false, location: '' };
};

// Start of helper functions for bidirectional lookup
export const getLocationFromPincode = (pincode: string): string | null => {
  return locationDatabase[pincode] || null;
};

export const getPincodeFromLocation = (locationName: string): string | null => {
  // Simple reverse lookup - returns the first match
  const entry = Object.entries(locationDatabase).find(([_, loc]) => 
    loc.toLowerCase().includes(locationName.toLowerCase()) || 
    locationName.toLowerCase().includes(loc.toLowerCase())
  );
  return entry ? entry[0] : null;
};
