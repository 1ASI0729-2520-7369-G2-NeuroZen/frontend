// Appointment Models - Based on Backend API Contracts

export interface Appointment {
  id: number;
  employeeId: number;
  psychologistId: number;
  appointmentDateTime: string; // ISO 8601 date-time string
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
}

export interface CreateAppointmentRequest {
  employeeId: number;
  psychologistId: number;
  appointmentDateTime: string; // ISO 8601 date-time string
}

export interface RescheduleAppointmentRequest {
  appointmentDateTime: string; // ISO 8601 date-time string
}

export interface CancelAppointmentRequest {
  cancellationReason: string;
}

export interface CompleteAppointmentRequest {
  notes?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';
