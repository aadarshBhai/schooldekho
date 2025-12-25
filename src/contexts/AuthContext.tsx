import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'user' | 'organizer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verified: boolean;
  type?: 'school' | 'ngo' | 'community';
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  userSubtype?: 'student' | 'parent';
  grade?: string;
  interests?: string[];
  parentalConsent?: boolean;
  childPhone?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (userData: Partial<User>) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('eventdekho_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('eventdekho_token');
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const authenticatedUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          verified: data.user.verified,
          type: data.user.type,
          avatar: data.user.avatar,
          userSubtype: data.user.userSubtype,
          grade: data.user.grade,
          interests: data.user.interests,
          parentalConsent: data.user.parentalConsent,
          childPhone: data.user.childPhone,
          bio: data.user.bio,
          location: data.user.location,
          website: data.user.website,
          phone: data.user.phone,
        };

        setUser(authenticatedUser);
        setToken(data.token);
        localStorage.setItem('eventdekho_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('eventdekho_token', data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (userData: Partial<User>): Promise<boolean> => {
    try {
      console.log('Sending signup request with data:', userData);
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Signup response:', { status: response.status, data });

      if (response.ok) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          verified: data.user.verified,
          type: data.user.type,
          avatar: data.user.avatar,
          userSubtype: data.user.userSubtype,
          grade: data.user.grade,
          interests: data.user.interests,
          parentalConsent: data.user.parentalConsent,
          childPhone: data.user.childPhone,
          bio: data.user.bio,
          location: data.user.location,
          website: data.user.website,
          phone: data.user.phone,
        };

        setUser(newUser);
        setToken(data.token);
        localStorage.setItem('eventdekho_user', JSON.stringify(newUser));
        localStorage.setItem('eventdekho_token', data.token);
        return true;
      }

      console.error('Signup failed with status:', response.status, 'Error:', data.message || 'Unknown error');
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return false;
    }
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const adminUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          verified: data.user.verified,
        };

        setUser(adminUser);
        setToken(data.token);
        localStorage.setItem('eventdekho_user', JSON.stringify(adminUser));
        localStorage.setItem('eventdekho_token', data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eventdekho_user');
    localStorage.removeItem('eventdekho_token');
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user || !token) return false;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem('eventdekho_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, adminLogin, logout, signup, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
