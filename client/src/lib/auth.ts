import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  displayName: string;
  profilePicture?: string;
  statusMessage?: string;
  status: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_KEY = "chatflow_token";

export class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    if (this.token) {
      this.setAuthHeader();
    }
  }

  private setAuthHeader() {
    if (this.token) {
      // Set default header for all requests
      (globalThis as any).fetch = new Proxy((globalThis as any).fetch, {
        apply: (target, thisArg, argumentsList) => {
          const [url, options = {}] = argumentsList;
          if (typeof url === 'string' && url.startsWith('/api')) {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${this.token}`,
            };
          }
          return target.apply(thisArg, [url, options]);
        },
      });
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password,
    });

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem(TOKEN_KEY, this.token);
    this.setAuthHeader();

    return data;
  }

  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register", {
      email,
      password,
      displayName,
    });

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem(TOKEN_KEY, this.token);
    this.setAuthHeader();

    return data;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch (error) {
        // Ignore logout errors
      }
    }

    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService();
