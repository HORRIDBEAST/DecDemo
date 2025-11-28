import { Claim, ClaimStats, ClaimStatus, CreateClaimDTO, PaginatedResponse, User } from './types';

let authToken: string | null = null;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// This function is called by your AuthContext to keep the token in sync
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

// A helper function to handle API responses and errors
// lib/api.ts

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || `API Error: ${response.status}`);
    } catch (e) {
        throw new Error(`API Request Failed (${response.status}): ${text}`);
    }
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

export const api = {
  // === Auth ===
  login: async (supabaseToken: string): Promise<{ user: User }> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token: supabaseToken }),
    });
    return handleResponse(res);
  },
getAdminClaims: async (): Promise<Claim[]> => {
    const res = await fetch(`${API_URL}/claims/admin/pending`, { 
      headers: getHeaders() // ✅ FIX: Use getHeaders() instead of manual localStorage
    });
    if (!res.ok) throw new Error('Failed to fetch admin claims');
    return res.json();
  },
  getNotifications: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_URL}/users/notifications`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        console.error('Failed to fetch notifications');
        return []; // Return empty array on error
      }
      const data = await res.json();
      return Array.isArray(data) ? data : []; // Ensure it's always an array
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return empty array on exception
    }
  },
  verify: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  updateClaim: async (id: string, data: any): Promise<Claim> => {
    const res = await fetch(`${API_URL}/claims/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  // Add to api object
  createReview: async (data: { rating: number; comment: string; claimId?: string }) => {
    const res = await fetch(`${API_URL}/users/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ... existing methods
  getReviews: async (): Promise<any[]> => {
    // This endpoint needs to be public in your backend
    const res = await fetch(`${API_URL}/users/reviews/public`, {
      headers: { 'Content-Type': 'application/json' } // No Auth header needed for public route
    });
    return handleResponse(res);
  },
markNotificationRead: async (id: string) => {
    const res = await fetch(`${API_URL}/users/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  // === User ===
  getProfile: async (): Promise<User> => {
    const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateProfile: async (data: { displayName?: string; walletAddress?: string }): Promise<User> => {
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // === Claims (Get) ===
  getClaimStats: async (): Promise<ClaimStats> => {
    const res = await fetch(`${API_URL}/claims/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },
  
  getClaims: async (page = 1, limit = 10): Promise<PaginatedResponse<Claim>> => {
    const res = await fetch(`${API_URL}/claims?page=${page}&limit=${limit}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getClaimById: async (id: string): Promise<Claim> => {
    const res = await fetch(`${API_URL}/claims/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // === Claims (Mutate) ===
  createClaim: async (draft: Omit<CreateClaimDTO, 'documentUrls' | 'damagePhotoUrls'>): Promise<Claim> => {
    const res = await fetch(`${API_URL}/claims`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(draft),
    });
    return handleResponse(res);
  },
  
  submitClaimForProcessing: async (id: string): Promise<Claim> => {
    const res = await fetch(`${API_URL}/claims/${id}/submit`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  
  uploadFiles: async (claimId: string, files: File[], type: 'documents' | 'photos'): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append(type, file);
    });

    const res = await fetch(`${API_URL}/claims/${claimId}/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`, // No 'Content-Type', browser sets it for FormData
      },
      body: formData,
    });
    return handleResponse(res);
  },

  // === Admin ===
  approveClaim: async (id: string, approvedAmount: number): Promise<Claim> => {
    const res = await fetch(`${API_URL}/claims/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ approvedAmount }),
    });
    return handleResponse(res);
  },
  
  rejectClaim: async (id: string, reason: string): Promise<Claim> => {
    const res = await fetch(`${API_URL}/claims/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },
};