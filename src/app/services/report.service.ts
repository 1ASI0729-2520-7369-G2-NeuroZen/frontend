import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Report, GenerateReportRequest } from '../models/report.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly API_URL = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.reports}`;

  constructor(private http: HttpClient) {}

  /**
   * Get all reports
   */
  getAllReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.API_URL).pipe(catchError(this.handleError));
  }

  /**
   * Get report by ID
   */
  getReportById(reportId: number): Observable<Report> {
    return this.http.get<Report>(`${this.API_URL}/${reportId}`).pipe(catchError(this.handleError));
  }

  /**
   * Get all reports by employee ID
   */
  getReportsByEmployeeId(employeeId: number): Observable<Report[]> {
    return this.http
      .get<Report[]>(`${this.API_URL}/employee/${employeeId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generate a new report
   */
  generateReport(request: GenerateReportRequest): Observable<Report> {
    return this.http.post<Report>(this.API_URL, request).pipe(catchError(this.handleError));
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

    console.error('ReportService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
