export interface Announcement {
  _id: string;
  id: string;
  title: string;
  content: string;
  link?: string;
  category: 'general' | 'feature' | 'update' | 'event' | 'deadline';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  authorId: string;
  authorName: string;
  authorEmail: string;
  views: number;
  clicks: number;
  tags: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  link?: string;
  category?: 'general' | 'feature' | 'update' | 'event' | 'deadline';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  expiresAt?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const fetchAnnouncements = async (category?: string, limit?: number): Promise<Announcement[]> => {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (limit) params.append('limit', limit.toString());

  const res = await fetch(`${API_BASE}/announcements?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch announcements');
  const announcements = await res.json();
  return announcements.map((a: Announcement) => ({ ...a, id: a._id }));
};

export const fetchAnnouncementById = async (id: string): Promise<Announcement> => {
  const res = await fetch(`${API_BASE}/announcements/${id}`);
  if (!res.ok) throw new Error('Failed to fetch announcement');
  const announcement = await res.json();
  return { ...announcement, id: announcement._id };
};

export const createAnnouncement = async (data: CreateAnnouncementData, token: string): Promise<Announcement> => {
  const res = await fetch(`${API_BASE}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create announcement');
  }
  const announcement = await res.json();
  return { ...announcement, id: announcement._id };
};

export const updateAnnouncement = async (id: string, data: Partial<CreateAnnouncementData> & { isActive?: boolean }, token: string): Promise<Announcement> => {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update announcement');
  }
  const announcement = await res.json();
  return { ...announcement, id: announcement._id };
};

export const deleteAnnouncement = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete announcement');
};

export const trackAnnouncementClick = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/announcements/${id}/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to track click');
};

export const fetchAllAnnouncements = async (token: string): Promise<Announcement[]> => {
  const res = await fetch(`${API_BASE}/announcements/admin/all`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch all announcements');
  const announcements = await res.json();
  return announcements.map((a: Announcement) => ({ ...a, id: a._id }));
};
