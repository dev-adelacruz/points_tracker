// Token storage service with encryption and security features

export interface TokenStorageOptions {
  encrypt?: boolean;
  storageType: 'local' | 'session';
}

class TokenStorage {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly STORAGE_TYPE_KEY = 'auth_storage_type';
  private encryptionKey: CryptoKey | null = null;

  // Initialize encryption if needed
  async initializeEncryption(): Promise<void> {
    if (typeof window !== 'undefined' && window.crypto) {
      try {
        this.encryptionKey = await crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256,
          },
          true,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Web Crypto API not available, falling back to plain text storage');
        this.encryptionKey = null;
      }
    }
  }

  // Encrypt token using Web Crypto API
  private async encryptToken(token: string): Promise<string> {
    if (!this.encryptionKey) {
      return token; // Fallback to plain text if encryption is not available
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        data
      );

      // Combine IV and encrypted data for storage
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return token; // Fallback to plain text
    }
  }

  // Decrypt token using Web Crypto API
  private async decryptToken(encryptedToken: string): Promise<string> {
    if (!this.encryptionKey) {
      return encryptedToken; // Return as is if encryption was not used
    }

    try {
      const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedToken; // Return as is if decryption fails
    }
  }

  // Store token with specified storage type
  async storeToken(token: string, options: TokenStorageOptions): Promise<void> {
    await this.initializeEncryption();
    
    let tokenToStore = token;
    if (options.encrypt && this.encryptionKey) {
      tokenToStore = await this.encryptToken(token);
    }

    const storage = options.storageType === 'local' ? localStorage : sessionStorage;
    
    storage.setItem(this.TOKEN_KEY, tokenToStore);
    localStorage.setItem(this.STORAGE_TYPE_KEY, options.storageType);
  }

  // Retrieve token from storage
  async getToken(): Promise<string | null> {
    await this.initializeEncryption();
    
    // Check both storage locations
    let encryptedToken = localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    
    if (!encryptedToken) {
      return null;
    }

    // Get storage type to determine if encryption was used
    const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY) as 'local' | 'session' | null;
    
    if (storageType && this.encryptionKey) {
      try {
        return await this.decryptToken(encryptedToken);
      } catch (error) {
        console.error('Failed to decrypt token:', error);
        return encryptedToken; // Return encrypted token as fallback
      }
    }

    return encryptedToken;
  }

  // Clear token from all storage locations
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.STORAGE_TYPE_KEY);
  }

  // Get the storage type used for the current token
  getStorageType(): 'local' | 'session' | null {
    return localStorage.getItem(this.STORAGE_TYPE_KEY) as 'local' | 'session' | null;
  }

  // Check if a token exists
  hasToken(): boolean {
    return !!(localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY));
  }
}

export const tokenStorage = new TokenStorage();
