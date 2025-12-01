import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Assessment,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from '../models/assessment.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AssessmentService {
  private readonly API_URL = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.assessments}`;

  constructor(private http: HttpClient) {}

  /**
   * Get all assessments
   */
  getAllAssessments(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(this.API_URL).pipe(catchError(this.handleError));
  }

  /**
   * Get assessment by ID
   */
  getAssessmentById(assessmentId: number): Observable<Assessment> {
    return this.http
      .get<Assessment>(`${this.API_URL}/${assessmentId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all assessments by employee ID
   */
  getAssessmentsByEmployeeId(employeeId: number): Observable<Assessment[]> {
    return this.http
      .get<Assessment[]>(`${this.API_URL}/employee/${employeeId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new assessment
   */
  createAssessment(request: CreateAssessmentRequest): Observable<Assessment> {
    return this.http.post<Assessment>(this.API_URL, request).pipe(catchError(this.handleError));
  }

  /**
   * Update an existing assessment
   */
  updateAssessment(assessmentId: number, request: UpdateAssessmentRequest): Observable<Assessment> {
    return this.http
      .put<Assessment>(`${this.API_URL}/${assessmentId}`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete an assessment
   */
  deleteAssessment(assessmentId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/${assessmentId}`)
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

    console.error('AssessmentService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
