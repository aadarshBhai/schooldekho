/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export interface Comment {
  id: string;
  text: string;
  user: string;
  userName: string;
  userAvatar: string;
  eventId: string;
  eventTitle?: string;
  createdAt: string;
}

export interface Event {
  _id: string;
  id: string; // always present after mapping
  title: string;
  description: string;
  category: 'academic_tech' | 'leadership_literary' | 'sports_fitness' | 'creative_arts';
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  image: string; // legacy single image
  images?: string[]; // array of image URLs
  video?: string; // video URL
  location: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  approved: boolean;
  mediaType: 'image' | 'video';
  isSponsored?: boolean;
  teaser?: string;
  subCategoryTags?: string[];
  mode?: 'online' | 'offline' | 'hybrid';
  eligibility?: string[];
  registrationFee?: string;
  prizePool?: string;
  startTime?: string;
  endTime?: string;
  venueLink?: string;
  // Professional/Granular
  subjectExpertise?: 'Mathematics' | 'Science' | 'Arts' | 'Sports Coach' | 'Admin' | 'NA';
  experienceRequired?: 'Fresher' | '1-3 Years' | '5+ Years' | 'NA';
  jobType?: 'Full-Time' | 'Part-Time' | 'Visiting Faculty' | 'NA';
  entryType?: 'Individual' | 'Team-based';
}

export interface SponsorAd {
  _id: string;
  id: string;
  sponsorName: string;
  websiteLink: string;
  images: string[];
  headline: string;
  description: string;
  targetCities: string[];
  categoryLabel: 'School Admission' | 'Teacher Hiring' | 'Brand Event';
  internalAdId: string;
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string;
}

export interface EventFilters {
  query?: string;
  category?: string;
  mode?: string;
  city?: string;
  eligibility?: string;
  price?: string;
  dateRange?: string;
  entryType?: string;
  subjectExpertise?: string;
  experienceRequired?: string;
  jobType?: string;
}

export const fetchEvents = async (filters: EventFilters = {}): Promise<Event[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.append(key, value);
    }
  });

  const res = await fetch(`${API_BASE}/events?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  const events = await res.json();
  // Ensure each event has an `id` field for UI compatibility
  return events.map((e: Event) => ({ ...e, id: e._id }));
};

export const fetchEventById = async (id: string): Promise<Event> => {
  const res = await fetch(`${API_BASE}/events/${id}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Event not found');
  }
  const event = await res.json();
  return { ...event, id: event._id }; // Ensure consistent ID field
};

export const fetchCommentsForEvent = async (eventId: string): Promise<Comment[]> => {
  const res = await fetch(`${API_BASE}/comments?eventId=${eventId}`);
  if (!res.ok) return [];
  const comments = await res.json();
  return comments.map((c: any) => ({
    ...c,
    id: c._id || c.id,
  }));
};

// ... existing methods ...

export const createEvent = async (eventData: Partial<Event>, token: string): Promise<Event> => {
  const res = await fetch(`${API_BASE}/events/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create event');
  }
  const event = await res.json();
  return { ...event, id: event._id };
};

export const updateEvent = async (id: string, eventData: Partial<Event>, token: string): Promise<Event> => {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update event');
  }
  const event = await res.json();
  return { ...event, id: event._id };
};

export const deleteEvent = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete event');
};

export const approveEvent = async (id: string, approved: boolean, token: string): Promise<Event> => {
  return updateEvent(id, { approved }, token);
};

// Like/Unlike an event
export const likeEvent = async (eventId: string, userId: string): Promise<{ liked: boolean; likes: number }> => {
  const res = await fetch(`${API_BASE}/events/${eventId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to toggle like');
  return res.json();
};

// Check if user liked an event
export const checkLikeStatus = async (eventId: string, userId: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE}/events/${eventId}/like-status?userId=${userId}`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.liked;
};

// Share an event (increment share count)
export const shareEvent = async (eventId: string): Promise<{ shares: number }> => {
  const res = await fetch(`${API_BASE}/events/${eventId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to share event');
  return res.json();
};

// Edit a comment
export const editComment = async (commentId: string, text: string, token: string): Promise<Comment> => {
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to edit comment');
  }
  const comment = await res.json();
  return { ...comment, id: comment._id || comment.id };
};

// Delete a comment
export const deleteComment = async (commentId: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete comment');
  }
};

// Permanent account deletion
export const deleteAccount = async (token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete account');
  }
};

// --- Admin Functions ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'admin';
  verified: boolean;
  type?: 'school' | 'ngo' | 'community';
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  createdAt: string;
}

// Fetch all users (admin only)
export const fetchAllUsers = async (token: string): Promise<User[]> => {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch all users');
  }
  const users = await res.json();
  return users.map((u: any) => ({ ...u, id: u._id }));
};

// Fetch pending users (organizers awaiting verification)
export const fetchPendingUsers = async (token: string): Promise<User[]> => {
  const res = await fetch(`${API_BASE}/admin/users?status=pending`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch pending users');
  }
  const users = await res.json();
  return users.map((u: any) => ({ ...u, id: u._id }));
};

// Verify or Reject a user
export const verifyUser = async (userId: string, verified: boolean, token: string): Promise<User> => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ verified }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update verification status');
  }

  const data = await res.json();
  return data.user;
};

// Admin: Delete a user and all their events
export const deleteUser = async (userId: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete user');
  }
};

// Fetch all comments made by a user
export const fetchCommentsByUserId = async (userId: string): Promise<Comment[]> => {
  const res = await fetch(`${API_BASE}/comments/user/${userId}`);
  if (!res.ok) return [];
  const comments = await res.json();
  return comments.map((c: any) => ({
    ...c,
    id: c._id || c.id,
  }));
};

// Fetch any user's profile info
export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  const res = await fetch(`${API_BASE}/auth/profile/${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return { ...data, id: data._id || data.id };
};

// Fetch all events liked by a user
export const fetchLikedEvents = async (userId: string): Promise<Event[]> => {
  const res = await fetch(`${API_BASE}/events/user/liked/${userId}`);
  if (!res.ok) return [];
  const events = await res.json();
  return events.map((e: any) => ({ ...e, id: e._id || e.id }));
};

// --- Sponsor Ad Functions ---

export const fetchActiveAds = async (): Promise<SponsorAd[]> => {
  const res = await fetch(`${API_BASE}/ads/active`);
  if (!res.ok) return [];
  const ads = await res.json();
  return ads.map((ad: any) => ({ ...ad, id: ad._id }));
};

export const fetchAllAds = async (token: string): Promise<SponsorAd[]> => {
  const res = await fetch(`${API_BASE}/ads`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const ads = await res.json();
  return ads.map((ad: any) => ({ ...ad, id: ad._id }));
};

export const createSponsorAd = async (adData: Partial<SponsorAd>, token: string): Promise<SponsorAd> => {
  const res = await fetch(`${API_BASE}/ads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(adData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create ad');
  }
  const ad = await res.json();
  return { ...ad, id: ad._id };
};

export const deleteSponsorAd = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/ads/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete ad');
};
export interface AdminStats {
  totalUsers: number;
  verifiedOrgs: number;
  eventsPosted: number;
  registrationsGrowth: number;
  eventCreationGrowth: number;
  engagementGrowth: number;
}

export const fetchAdminStats = async (token: string): Promise<AdminStats> => {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }
  return res.json();
};
