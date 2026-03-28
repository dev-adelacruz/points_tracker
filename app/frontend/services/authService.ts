// Authentication service for handling API calls
export interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = "admin" | "emcee" | "host";

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
  expires_in?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

class AuthService {
  private baseURL = '/api/v1';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/users/sign_in`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: credentials }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }

      const token = response.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
      const body = await response.json();
      const user = body.status?.data?.user;

      return { token, user };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/users/sign_out`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, we should clear local auth state
      throw error;
    }
  }

  async validateToken(token: string): Promise<{ user: { id: number; email: string; role: UserRole } } | null> {
    try {
      const response = await fetch(`${this.baseURL}/users/validate_token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return { user: data.status.data.user };
    } catch (error) {
      return null;
    }
  }

  // Helper method to set authorization header for future requests
  setAuthHeader(token: string): void {
    // This can be used to configure fetch defaults if needed
    // For now, we'll handle headers in each request
  }
}

export const authService = new AuthService();
