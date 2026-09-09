/**
 * API Client Utility
 * Provides helper functions for making authenticated API calls to the FastAPI backend
 * 
 * Usage:
 * const data = await apiClient.get('/employees');
 * const result = await apiClient.post('/employees', { name: 'John' });
 */

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://faze-soft-ems-backend.vercel.app/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 401 - Token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Session expired. Please login again.');
    }

    // Handle 403 - Forbidden
    if (response.status === 403) {
      throw new Error('You do not have permission to access this resource');
    }

    // Handle 500+ server errors
    if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    // Try to parse error message from response
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      try {
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { detail: 'An error occurred' };
        
        const errorMessage = errorData.detail || errorData.message || 'An error occurred';
        throw new Error(errorMessage);
      } catch (error) {
        throw error instanceof Error ? error : new Error('An error occurred');
      }
    }

    // Parse successful response
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Example Usage in Components:
 * 
 * // In a React component:
 * import { useEffect, useState } from 'react';
 * import { apiClient } from '@/utils/apiClient';
 * 
 * interface Employee {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * function EmployeesList() {
 *   const [employees, setEmployees] = useState<Employee[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 * 
 *   useEffect(() => {
 *     const fetchEmployees = async () => {
 *       try {
 *         const data = await apiClient.get<Employee[]>('/employees');
 *         setEmployees(data);
 *       } catch (err) {
 *         setError(err instanceof Error ? err.message : 'Failed to fetch employees');
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 * 
 *     fetchEmployees();
 *   }, []);
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return (
 *     <ul>
 *       {employees.map(emp => (
 *         <li key={emp.id}>{emp.name} - {emp.email}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
