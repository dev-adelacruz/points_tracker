// Authentication service for handling API calls
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    // Add other user fields as needed
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

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/users/validate_token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Token validation response status:', response.status);
      if (!response.ok) {
        console.log('Token validation failed with status:', response.status);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Helper method to set authorization header for future requests
  setAuthHeader(token: string): void {
    // This can be used to configure fetch defaults if needed
    // For now, we'll handle headers in each request
  }
}

export const authService = new AuthService();
