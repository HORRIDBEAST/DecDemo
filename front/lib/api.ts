// // lib/api.ts
// import { Claim, ClaimStats, CreateClaimDTO, PaginatedResponse } from './types';

// // We'll set the token from our AuthContext
// let authToken: string | null = null;

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// export const setAuthToken = (token: string | null) => {
//   authToken = token;
// };

// const getHeaders = () => {
//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//   };
//   if (authToken) {
//     headers['Authorization'] = `Bearer ${authToken}`;
//   }
//   return headers;
// };

// // Helper for handling API responses
// async function handleResponse<T>(response: Response): Promise<T> {
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'API request failed');
//   }
//   return response.json();
// }

// // --- API Client Object ---
// export const api = {
//   // 1. Auth (called by AuthContext)
//   login: async (supabaseToken: string): Promise<{ user: any }> => {
//     const res = await fetch(`${API_URL}/auth/login`, {
//       method: 'POST',
//       headers: getHeaders(),
//       body: JSON.stringify({ token: supabaseToken }),
//     });
//     return handleResponse(res);
//   },

//   verify: async (): Promise<{ user: any }> => {
//     const res = await fetch(`${API_URL}/auth/verify`, {
//       method: 'POST',
//       headers: getHeaders(),
//     });
//     return handleResponse(res);
//   },

//   // 2. Claims (for the dashboard)
//   getClaimStats: async (): Promise<ClaimStats> => {
//     const res = await fetch(`${API_URL}/claims/stats`, { headers: getHeaders() });
//     return handleResponse(res);
//   },
  
//   getClaims: async (page = 1, limit = 10): Promise<PaginatedResponse<Claim>> => {
//     const res = await fetch(`${API_URL}/claims?page=${page}&limit=${limit}`, { headers: getHeaders() });
//     return handleResponse(res);
//   },

//   getClaimById: async (id: string): Promise<Claim> => {
//     const res = await fetch(`${API_URL}/claims/${id}`, { headers: getHeaders() });
//     return handleResponse(res);
//   },

//   // 3. New Claim Flow
//   createClaim: async (draft: Omit<CreateClaimDTO, 'documentUrls' | 'damagePhotoUrls'>): Promise<Claim> => {
//     const res = await fetch(`${API_URL}/claims`, {
//       method: 'POST',
//       headers: getHeaders(),
//       body: JSON.stringify(draft),
//     });
//     return handleResponse(res);
//   },
  
//   submitClaimForProcessing: async (id: string): Promise<Claim> => {
//     const res = await fetch(`${API_URL}/claims/${id}/submit`, {
//       method: 'POST',
//       headers: getHeaders(),
//     });
//     return handleResponse(res);
//   },
  
//   // 4. File Upload
//   // Note: This is handled differently since it's multipart/form-data
//   uploadFiles: async (claimId: string, files: File[], type: 'documents' | 'photos'): Promise<string[]> => {
//     const formData = new FormData();
//     files.forEach(file => {
//       formData.append(type, file);
//     });

//     const res = await fetch(`${API_URL}/claims/${claimId}/${type}`, {
//       method: 'POST',
//       headers: {
//         // No 'Content-Type', browser sets it for FormData
//         'Authorization': `Bearer ${authToken}`,
//       },
//       body: formData,
//     });
//     return handleResponse(res);
//   }
  
//   // 5. Admin Actions (we'll use these later)
//   // approveClaim...
//   // rejectClaim...
// };

// lib/api.ts
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
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
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

  verify: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
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