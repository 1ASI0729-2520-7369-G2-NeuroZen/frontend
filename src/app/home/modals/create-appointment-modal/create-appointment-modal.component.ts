import { Component, signal, computed, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AppointmentService } from '../../../services/appointment.service';
import { CreateAppointmentRequest, Appointment } from '../../../models/appointment.model';
import {
  PsychologistService,
  Psychologist as BackendPsychologist,
} from '../../../services/psychologist.service';

export interface AppointmentData {
  psychologistId: number;
  psychologistName: string;
  date: string;
  time: string;
  type: 'video' | 'in-person' | 'phone';
  reason: string;
  notes?: string;
}

export interface Psychologist {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  nextAvailable: string;
}

@Component({
  selector: 'app-create-appointment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-appointment-modal.component.html',
  styleUrl: './create-appointment-modal.component.css',
})
export class CreateAppointmentModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<AppointmentData>();

  appointmentForm!: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  // Available psychologists (loaded from backend)
  psychologists = signal<Psychologist[]>([]);

  // Appointment types
  appointmentTypes = [
    { value: 'video', label: 'Video Call', icon: 'fa-video' },
    { value: 'in-person', label: 'In-Person', icon: 'fa-user' },
    { value: 'phone', label: 'Phone Call', icon: 'fa-phone' },
  ];

  // Common reasons for appointment
  commonReasons = [
    'Initial Consultation',
    'Follow-up Session',
    'Anxiety Management',
    'Stress Management',
    'Depression Support',
    'Relationship Issues',
    'Work-related Stress',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private psychologistService: PsychologistService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPsychologists();
  }

  loadPsychologists(): void {
    this.psychologistService.getAllPsychologists().subscribe({
      next: (backendPsychologists: BackendPsychologist[]) => {
        console.log('Loaded psychologists for modal:', backendPsychologists);

        // Convert backend psychologists to UI format
        const uiPsychologists: Psychologist[] = backendPsychologists.map((psy) => {
          const specialtyMap: { [key: string]: string } = {
            'Dra. María González': 'Estrés laboral',
            'Dr. Carlos Ruiz': 'Mindfulness',
            'Dra. Ana Martínez': 'Burnout',
            'Dr. Sarah Martinez': 'Ansiedad',
          };

          return {
            id: psy.id,
            name: psy.name,
            specialty: specialtyMap[psy.name] || 'Psicología General',
            rating: 4.8 + Math.random() * 0.2,
            nextAvailable: new Date().toISOString().split('T')[0],
          };
        });

        this.psychologists.set(uiPsychologists);
      },
      error: (error) => {
        console.error('Failed to load psychologists:', error);
      },
    });
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.appointmentForm = this.fb.group({
      psychologistId: ['', Validators.required],
      date: ['', [Validators.required, this.futureDateValidator]],
      time: ['', Validators.required],
      type: ['video', Validators.required],
      reason: ['', Validators.required],
      notes: ['', Validators.maxLength(500)],
    });
  }

  // Custom validator for future dates
  private futureDateValidator(control: any) {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }

    return null;
  }

  // Get minimum date (today)
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get selected psychologist
  getSelectedPsychologist = computed(() => {
    const id = this.appointmentForm?.get('psychologistId')?.value;
    if (!id) return null;
    return this.psychologists().find((p) => p.id === parseInt(id)) || null;
  });

  // Check if form field has error
  hasError(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Get error message for field
  getErrorMessage(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (!field?.errors || !field?.touched) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['pastDate']) return 'Please select a future date';
    if (field.errors['maxlength'])
      return `Maximum ${field.errors['maxlength'].requiredLength} characters`;

    return 'Invalid value';
  }

  // Select appointment type
  selectType(type: string): void {
    this.appointmentForm.patchValue({ type });
  }

  // Select reason
  selectReason(reason: string): void {
    this.appointmentForm.patchValue({ reason });
  }

  // Submit form
  submitAppointment(): void {
    console.log('=== SUBMIT APPOINTMENT DEBUG ===');
    console.log('Form valid:', this.appointmentForm.valid);
    console.log('Form value:', this.appointmentForm.value);
    console.log('Form errors:', this.appointmentForm.errors);
    console.log('Psychologists loaded:', this.psychologists().length);
    console.log('Psychologists:', this.psychologists());

    if (this.appointmentForm.invalid) {
      console.error('Form is invalid!');
      Object.keys(this.appointmentForm.controls).forEach((key) => {
        const control = this.appointmentForm.get(key);
        if (control?.invalid) {
          console.error(`Field ${key} is invalid:`, control.errors);
        }
      });
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const formValue = this.appointmentForm.value;
      const selectedPsychologist = this.psychologists().find(
        (p) => p.id === parseInt(formValue.psychologistId)
      );

      console.log('Selected psychologist:', selectedPsychologist);

      // Get current user from localStorage
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        console.error('User not logged in!');
        throw new Error('User not logged in');
      }
      const user = JSON.parse(userData);
      console.log('Current user:', user);

      // Combine date and time into ISO 8601 format
      const appointmentDateTime = `${formValue.date}T${formValue.time}:00`;
      console.log('Appointment date time:', appointmentDateTime);

      // Create appointment request for backend
      const createRequest: CreateAppointmentRequest = {
        employeeId: user.id,
        psychologistId: parseInt(formValue.psychologistId),
        appointmentDateTime: appointmentDateTime,
      };

      console.log('Create request:', createRequest);

      // Call backend API
      this.appointmentService.createAppointment(createRequest).subscribe({
        next: (appointment: Appointment) => {
          console.log('✅ Appointment created in backend:', appointment);

          // Create appointment data for UI
          const appointmentData: AppointmentData = {
            psychologistId: parseInt(formValue.psychologistId),
            psychologistName: selectedPsychologist?.name || '',
            date: formValue.date,
            time: formValue.time,
            type: formValue.type,
            reason: formValue.reason,
            notes: formValue.notes,
          };

          this.submitSuccess.set(true);
          this.isSubmitting.set(false);

          // Emit created event
          this.created.emit(appointmentData);

          // Close modal after 2 seconds
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Failed to create appointment:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
          });
          this.submitError.set('Failed to create appointment. Please try again.');
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      console.error('❌ Exception creating appointment:', error);
      this.submitError.set('Failed to create appointment. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Close modal
  closeModal(): void {
    this.close.emit();
  }

  // Prevent backdrop click from closing during submission
  onBackdropClick(): void {
    if (!this.isSubmitting()) {
      this.closeModal();
    }
  }
}
