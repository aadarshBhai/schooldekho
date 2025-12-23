// API utility to handle authenticated requests

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    return {
      error: data.message || 'An error occurred',
      status: response.status
    };
  }

  return { data, status: response.status };
}

export async function api<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('eventdekho_token');
  
  // Set up headers
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies if needed
    });

    return handleResponse<T>(response);
  } catch (error) {
    console.error('API call failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0
    };
  }
}

// Helper methods for common HTTP methods
export const apiGet = <T = any>(endpoint: string) => api<T>(endpoint);

export const apiPost = <T = any>(endpoint: string, data: any) => 
  api<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiPut = <T = any>(endpoint: string, data: any) =>
  api<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiDelete = <T = any>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });
