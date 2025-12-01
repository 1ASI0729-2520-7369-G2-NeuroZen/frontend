import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface Psychologist {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  district: string | null;
  bio: string | null;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class PsychologistService {
  private API_URL = `${API_CONFIG.baseUrl}/api/v1/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Get all psychologists from the backend
   * @returns Observable with list of psychologists
   */
  getAllPsychologists(): Observable<Psychologist[]> {
    return this.http.get<Psychologist[]>(`${this.API_URL}/psychologists`);
  }

  /**
   * Get psychologist by ID
   * @param id Psychologist ID
   * @returns Observable with psychologist details
   */
  getPsychologistById(id: number): Observable<Psychologist> {
    return this.http.get<Psychologist>(`${this.API_URL}/me/${id}`);
  }
}

