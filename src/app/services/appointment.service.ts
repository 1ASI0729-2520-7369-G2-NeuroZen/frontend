import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Appointment,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
  CancelAppointmentRequest,
  CompleteAppointmentRequest,
} from '../models/appointment.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly API_URL = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointments}`;

  constructor(private http: HttpClient) {}

  /**
   * Get all appointments
   */
  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.API_URL).pipe(catchError(this.handleError));
  }

  /**
   * Get appointment by ID
   */
  getAppointmentById(appointmentId: number): Observable<Appointment> {
    return this.http
      .get<Appointment>(`${this.API_URL}/${appointmentId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all appointments by employee ID
   */
  getAppointmentsByEmployeeId(employeeId: number): Observable<Appointment[]> {
    return this.http
      .get<Appointment[]>(`${this.API_URL}/employee/${employeeId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all appointments by psychologist ID
   */
  getAppointmentsByPsychologistId(psychologistId: number): Observable<Appointment[]> {
    return this.http
      .get<Appointment[]>(`${this.API_URL}/psychologist/${psychologistId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new appointment
   */
  createAppointment(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.API_URL, request).pipe(catchError(this.handleError));
  }

  /**
   * Confirm an appointment
   */
  confirmAppointment(appointmentId: number): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${this.API_URL}/${appointmentId}/confirm`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Start an appointment
   */
  startAppointment(appointmentId: number): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${this.API_URL}/${appointmentId}/start`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Complete an appointment
   */
  completeAppointment(
    appointmentId: number,
    request: CompleteAppointmentRequest
  ): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${this.API_URL}/${appointmentId}/complete`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Cancel an appointment
   */
  cancelAppointment(
    appointmentId: number,
    request: CancelAppointmentRequest
  ): Observable<Appointment> {
    return this.http
      .post<Appointment>(`${this.API_URL}/${appointmentId}/cancel`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Reschedule an appointment
   */
  rescheduleAppointment(
    appointmentId: number,
    request: RescheduleAppointmentRequest
  ): Observable<Appointment> {
    return this.http
      .put<Appointment>(`${this.API_URL}/${appointmentId}/reschedule`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('AppointmentService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
