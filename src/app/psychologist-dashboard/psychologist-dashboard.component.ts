import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { AppointmentService } from '../services/appointment.service';
import { API_CONFIG } from '../config/api.config';

interface Appointment {
  id: number;
  employeeId: number;
  psychologistId: number;
  appointmentDateTime: string;
  status: string;
  notes?: string;
  cancellationReason?: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
  appointmentCount: number;
  lastAppointment?: string;
}

@Component({
  selector: 'app-psychologist-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './psychologist-dashboard.component.html',
  styleUrls: ['./psychologist-dashboard.component.css'],
})
export class PsychologistDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);

  appointments: Appointment[] = [];
  patients: Patient[] = [];
  loading = true;
  activeTab: 'appointments' | 'patients' = 'appointments';

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.loading = true;

    this.appointmentService.getAppointmentsByPsychologistId(currentUser.id).subscribe({
      next: (appointments) => {
        this.appointments = appointments.sort(
          (a, b) =>
            new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
        );
        this.extractPatients(appointments);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      },
    });
  }

  extractPatients(appointments: Appointment[]) {
    const patientMap = new Map<number, Patient>();

    appointments.forEach((appointment) => {
      const existing = patientMap.get(appointment.employeeId);
      if (existing) {
        existing.appointmentCount++;
        const appointmentDate = new Date(appointment.appointmentDateTime);
        const lastDate = existing.lastAppointment ? new Date(existing.lastAppointment) : null;
        if (!lastDate || appointmentDate > lastDate) {
          existing.lastAppointment = appointment.appointmentDateTime;
        }
      } else {
        patientMap.set(appointment.employeeId, {
          id: appointment.employeeId,
          name: `Patient ${appointment.employeeId}`, // Will be replaced with actual name
          email: '',
          appointmentCount: 1,
          lastAppointment: appointment.appointmentDateTime,
        });
      }
    });

    this.patients = Array.from(patientMap.values());
    this.loadPatientDetails();
  }

  loadPatientDetails() {
    // Load patient details from users endpoint
    this.patients.forEach((patient) => {
      const url = `${API_CONFIG.baseUrl}/api/v1/auth/me/${patient.id}`;
      this.http.get<any>(url).subscribe({
        next: (user) => {
          patient.name = user.name;
          patient.email = user.email;
        },
        error: (error) => {
          console.error(`Error loading patient ${patient.id}:`, error);
        },
      });
    });
  }

  // Get patient name by ID
  getPatientName(employeeId: number): string {
    const patient = this.patients.find((p) => p.id === employeeId);
    return patient?.name || `Paciente #${employeeId}`;
  }

  setActiveTab(tab: 'appointments' | 'patients') {
    this.activeTab = tab;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'in_progress':
        return 'status-in-progress';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  confirmAppointment(appointmentId: number) {
    this.appointmentService.confirmAppointment(appointmentId).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
      },
    });
  }

  startAppointment(appointmentId: number) {
    this.appointmentService.startAppointment(appointmentId).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error starting appointment:', error);
      },
    });
  }

  completeAppointment(appointmentId: number) {
    const notes = prompt('Enter session notes (optional):');

    this.appointmentService
      .completeAppointment(appointmentId, { notes: notes || undefined })
      .subscribe({
        next: () => {
          this.loadAppointments();
        },
        error: (error) => {
          console.error('Error completing appointment:', error);
        },
      });
  }
}
