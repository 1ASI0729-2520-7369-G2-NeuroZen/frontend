import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  id: number;
  email: string;
  name: string;
  token: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth}`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check if there's a saved user in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  /**
   * Login user with backend API
   * @param credentials Login credentials
   * @returns Observable with authentication response
   */
  login(credentials: LoginCredentials): Observable<AuthenticationResponse | null> {
    return this.http.post<AuthenticationResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response) {
          const userData: User = {
            id: response.id,
            email: response.email,
            name: response.name,
            role: response.role,
          };
          this.currentUserSubject.next(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('authToken', response.token);
        }
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Register new user with backend API
   * @param credentials Registration credentials
   * @returns Observable with authentication response
   */
  register(credentials: RegisterCredentials): Observable<AuthenticationResponse | null> {
    return this.http.post<AuthenticationResponse>(`${this.API_URL}/register`, credentials).pipe(
      tap((response) => {
        if (response) {
          const userData: User = {
            id: response.id,
            email: response.email,
            name: response.name,
          };
          this.currentUserSubject.next(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('authToken', response.token);
        }
      }),
      catchError((error) => {
        console.error('Registration failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  /**
   * Check if user is authenticated
   * @returns True if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get current user
   * @returns Current user or null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication token
   * @returns Auth token or null
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
