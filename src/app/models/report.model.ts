// Report Models - Based on Backend API Contracts

export interface Report {
  id: number;
  employeeId: number;
  reportType: ReportType;
  reportDate: string; // ISO 8601 date string
  summary?: string;
  content?: string;
  totalAppointments?: number;
  completedAppointments?: number;
  totalAssessments?: number;
  averageScore?: number;
}

export interface GenerateReportRequest {
  employeeId: number;
  reportType: ReportType;
}

export type ReportType =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'CUSTOM';

