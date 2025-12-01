# Angular HTTP Services Usage Guide

This guide explains how to use the newly created HTTP services to interact with the backend API.

---

## 📁 File Structure

```
frontend/src/app/
├── config/
│   └── api.config.ts          # Centralized API configuration
├── models/
│   ├── appointment.model.ts   # Appointment interfaces
│   ├── assessment.model.ts    # Assessment interfaces
│   ├── report.model.ts        # Report interfaces
│   └── index.ts               # Barrel export
└── services/
    ├── appointment.service.ts # Appointment HTTP service
    ├── assessment.service.ts  # Assessment HTTP service
    └── report.service.ts      # Report HTTP service
```

---

## 🚀 Quick Start

### 1. Import the Service

```typescript
import { Component, OnInit } from '@angular/core';
import { AppointmentService } from './services/appointment.service';
import { Appointment } from './models';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [/* ... */],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = false;
  error: string | null = null;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading = true;
    this.error = null;

    this.appointmentService.getAllAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
```

---

## 📚 Service Examples

### Appointment Service

#### Get All Appointments
```typescript
this.appointmentService.getAllAppointments().subscribe({
  next: (appointments) => console.log(appointments),
  error: (err) => console.error(err)
});
```

#### Create New Appointment
```typescript
const newAppointment: CreateAppointmentRequest = {
  employeeId: 1,
  psychologistId: 2,
  appointmentDateTime: '2025-11-30T10:00:00Z'
};

this.appointmentService.createAppointment(newAppointment).subscribe({
  next: (appointment) => console.log('Created:', appointment),
  error: (err) => console.error(err)
});
```

#### Confirm Appointment
```typescript
this.appointmentService.confirmAppointment(appointmentId).subscribe({
  next: (appointment) => console.log('Confirmed:', appointment),
  error: (err) => console.error(err)
});
```

#### Cancel Appointment
```typescript
const cancelRequest: CancelAppointmentRequest = {
  cancellationReason: 'Employee unavailable'
};

this.appointmentService.cancelAppointment(appointmentId, cancelRequest).subscribe({
  next: (appointment) => console.log('Cancelled:', appointment),
  error: (err) => console.error(err)
});
```

---

### Assessment Service

#### Get All Assessments
```typescript
this.assessmentService.getAllAssessments().subscribe({
  next: (assessments) => console.log(assessments),
  error: (err) => console.error(err)
});
```

#### Create New Assessment
```typescript
const newAssessment: CreateAssessmentRequest = {
  employeeId: 1,
  assessmentType: 'INITIAL',
  emotionalState: 'GOOD',
  score: 75,
  observations: 'Employee shows positive engagement',
  recommendations: 'Continue regular check-ins'
};

this.assessmentService.createAssessment(newAssessment).subscribe({
  next: (assessment) => console.log('Created:', assessment),
  error: (err) => console.error(err)
});
```

#### Update Assessment
```typescript
const updateRequest: UpdateAssessmentRequest = {
  score: 80,
  observations: 'Improved emotional state'
};

this.assessmentService.updateAssessment(assessmentId, updateRequest).subscribe({
  next: (assessment) => console.log('Updated:', assessment),
  error: (err) => console.error(err)
});
```

---

### Report Service

#### Generate Report
```typescript
const reportRequest: GenerateReportRequest = {
  employeeId: 1,
  reportType: 'MONTHLY'
};

this.reportService.generateReport(reportRequest).subscribe({
  next: (report) => console.log('Generated:', report),
  error: (err) => console.error(err)
});
```

#### Get Reports by Employee
```typescript
this.reportService.getReportsByEmployeeId(employeeId).subscribe({
  next: (reports) => console.log(reports),
  error: (err) => console.error(err)
});
```

---

## 🎯 Best Practices

### 1. Use Signals for Reactive State (Angular 20+)
```typescript
import { signal } from '@angular/core';

export class AppointmentsComponent {
  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  loadAppointments() {
    this.loading.set(true);
    this.appointmentService.getAllAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
```

### 2. Unsubscribe from Observables
```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class AppointmentsComponent {
  private destroyRef = inject(DestroyRef);

  loadAppointments() {
    this.appointmentService.getAllAppointments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => console.log(data)
      });
  }
}
```

### 3. Handle Loading States
```typescript
loadAppointments() {
  this.loading.set(true);
  this.error.set(null);

  this.appointmentService.getAllAppointments()
    .pipe(
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: (data) => this.appointments.set(data),
      error: (err) => this.error.set(err.message)
    });
}
```

---

## ⚙️ Configuration

### Change API Base URL

Edit `frontend/src/app/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  baseUrl: 'https://api.production.com', // Change this
  endpoints: {
    appointments: '/api/v1/appointments',
    assessments: '/api/v1/assessments',
    reports: '/api/v1/reports'
  }
};
```

---

## 🔒 Authentication (Future Implementation)

When IAM bounded context is implemented, you'll need to add HTTP interceptors:

```typescript
// http.interceptor.ts (Future)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

---

## 📝 Next Steps

1. ✅ Services are ready to use
2. ⏳ Integrate services into UI components
3. ⏳ Add loading spinners and error messages to UI
4. ⏳ Implement authentication when IAM is available
5. ⏳ Add unit tests for services

---

**Note**: The backend must be running on `http://localhost:8081` for these services to work.

