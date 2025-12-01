import { Component, signal, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CreateAppointmentModalComponent,
  AppointmentData,
} from '../home/modals/create-appointment-modal/create-appointment-modal.component';
import { PsychologistProfileModalComponent } from './modals/psychologist-profile-modal/psychologist-profile-modal.component';
import { AppointmentService } from '../services/appointment.service';
import { Appointment as BackendAppointment } from '../models/appointment.model';
import {
  PsychologistService,
  Psychologist as BackendPsychologist,
} from '../services/psychologist.service';

interface Psychologist {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  experience: number;
  languages: string[];
  nextAvailable: string;
  specialties: string[];
  about: string;
}

interface Appointment {
  id: number;
  psychologist: string;
  date: string;
  time: string;
  type: string;
  status: 'upcoming' | 'past' | 'cancelled';
}

@Component({
  selector: 'app-coaching',
  imports: [
    TranslateModule,
    CommonModule,
    FormsModule,
    CreateAppointmentModalComponent,
    PsychologistProfileModalComponent,
  ],
  templateUrl: './coaching.html',
  styleUrl: './coaching.css',
})
export class Coaching implements OnInit {
  activeTab = signal<'psychologists' | 'appointments'>('psychologists');
  selectedFilter = signal('all');
  searchQuery = signal('');

  psychologists = signal<Psychologist[]>([]);

  appointments = signal<Appointment[]>([]);

  showAppointmentModal = signal(false);
  selectedPsychologistForBooking = signal<Psychologist | null>(null);

  showProfileModal = signal(false);
  selectedPsychologistForProfile = signal<Psychologist | null>(null);

  constructor(
    private appointmentService: AppointmentService,
    private psychologistService: PsychologistService
  ) {}

  ngOnInit(): void {
    this.loadPsychologists();
  }

  loadPsychologists(): void {
    this.psychologistService.getAllPsychologists().subscribe({
      next: (backendPsychologists: BackendPsychologist[]) => {
        console.log('Loaded psychologists from backend:', backendPsychologists);

        // Convert backend psychologists to UI format
        const uiPsychologists: Psychologist[] = backendPsychologists.map((psy, index) => {
          // Map psychologist data to UI format with default values
          const specialtyMap: { [key: string]: string } = {
            'Dra. María González': 'Estrés laboral',
            'Dr. Carlos Ruiz': 'Mindfulness',
            'Dra. Ana Martínez': 'Burnout',
            'Dr. Sarah Martinez': 'Ansiedad',
            'Dr. David Chen': 'Ansiedad',
          };

          const specialtiesMap: { [key: string]: string[] } = {
            'Dra. María González': ['Estrés laboral', 'Ansiedad', 'Burnout'],
            'Dr. Carlos Ruiz': ['Mindfulness', 'Meditación', 'Ansiedad'],
            'Dra. Ana Martínez': ['Burnout', 'Estrés laboral', 'Resiliencia'],
            'Dr. Sarah Martinez': ['Ansiedad', 'Depresión', 'Terapia Cognitiva'],
            'Dr. David Chen': ['Ansiedad', 'Mindfulness', 'Terapia Cognitiva'],
          };

          return {
            id: psy.id,
            name: psy.name,
            specialty: specialtyMap[psy.name] || 'Psicología General',
            rating: 4.8 + Math.random() * 0.2,
            reviews: 80 + Math.floor(Math.random() * 100),
            price: 45 + index * 5,
            image: `https://i.pravatar.cc/150?img=${index + 1}`,
            experience: 8 + index * 2,
            languages: ['Español', 'Inglés'],
            nextAvailable: index % 2 === 0 ? 'Hoy, 3:00 PM' : 'Mañana, 10:00 AM',
            specialties: specialtiesMap[psy.name] || ['Psicología General'],
            about: psy.bio || 'Psicólogo profesional con experiencia en diversas áreas.',
          };
        });

        this.psychologists.set(uiPsychologists);

        // Load appointments AFTER psychologists are loaded
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Failed to load psychologists:', error);
      },
    });
  }

  loadAppointments(): void {
    // Get current user from localStorage
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      console.error('User not logged in');
      return;
    }
    const user = JSON.parse(userData);

    // Load appointments from backend
    this.appointmentService.getAppointmentsByEmployeeId(user.id).subscribe({
      next: (backendAppointments: BackendAppointment[]) => {
        console.log('Loaded appointments from backend:', backendAppointments);

        // Convert backend appointments to UI format
        const uiAppointments: Appointment[] = backendAppointments.map((apt) => {
          const dateTime = new Date(apt.appointmentDateTime);
          const date = dateTime.toISOString().split('T')[0];
          const time = dateTime.toTimeString().slice(0, 5);

          // Find psychologist name from loaded psychologists
          const psychologist = this.psychologists().find((p) => p.id === apt.psychologistId);
          const psychologistName = psychologist?.name || `Psychologist ${apt.psychologistId}`;

          return {
            id: apt.id,
            psychologist: psychologistName,
            date: date,
            time: time,
            type: 'Videollamada',
            status: this.mapStatus(apt.status),
          };
        });

        this.appointments.set(uiAppointments);
      },
      error: (error) => {
        console.error('Failed to load appointments:', error);
      },
    });
  }

  private mapStatus(backendStatus: string): 'upcoming' | 'past' | 'cancelled' {
    if (backendStatus === 'CANCELLED') {
      return 'cancelled';
    }

    // For now, treat all non-cancelled appointments as upcoming
    // TODO: Implement proper date comparison
    return 'upcoming';
  }

  setActiveTab(tab: 'psychologists' | 'appointments') {
    this.activeTab.set(tab);
  }

  setFilter(filter: string) {
    console.log('Setting filter to:', filter);
    this.selectedFilter.set(filter);
    console.log('Current filter:', this.selectedFilter());
    console.log('Total psychologists:', this.psychologists().length);

    // Log which psychologists match
    this.psychologists().forEach((p) => {
      const matches = this.matchesFilter(p);
      console.log(`${p.name} - Specialties: ${p.specialties.join(', ')} - Matches: ${matches}`);
    });
  }

  openAppointmentModal(psychologist?: Psychologist) {
    if (psychologist) {
      this.selectedPsychologistForBooking.set(psychologist);
    }
    this.showAppointmentModal.set(true);
  }

  closeAppointmentModal() {
    this.showAppointmentModal.set(false);
    this.selectedPsychologistForBooking.set(null);
  }

  onAppointmentCreated(appointmentData: AppointmentData) {
    console.log('Appointment created:', appointmentData);
    const newAppointment: Appointment = {
      id: this.appointments().length + 1,
      psychologist: appointmentData.psychologistName,
      date: appointmentData.date,
      time: appointmentData.time,
      type: appointmentData.type === 'video' ? 'Videollamada' : appointmentData.type,
      status: 'upcoming',
    };
    this.appointments.update((apps) => [...apps, newAppointment]);
  }

  // Method to check if psychologist matches current filter AND search query
  matchesFilter(psychologist: Psychologist): boolean {
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase().trim();

    console.log(`Checking ${psychologist.name}:`, {
      filter,
      query,
      specialties: psychologist.specialties,
    });

    // Check filter match
    let matchesFilterCriteria = true;
    if (filter !== 'all') {
      // Map filter keys to Spanish specialty names (case-insensitive)
      const filterMap: { [key: string]: string[] } = {
        workStress: ['estrés laboral', 'estres laboral', 'burnout'],
        anxiety: ['ansiedad'],
        burnout: ['burnout'],
        mindfulness: ['mindfulness', 'meditación', 'meditacion'],
      };

      if (filterMap[filter]) {
        matchesFilterCriteria = psychologist.specialties.some((s) => {
          const specialty = s.toLowerCase();
          const matches = filterMap[filter].some((f) => specialty.includes(f));
          console.log(`  Specialty "${s}" (${specialty}) matches filter "${filter}":`, matches);
          return matches;
        });
        console.log(`  Overall filter match:`, matchesFilterCriteria);
      }
    }

    // Check search query match
    let matchesSearchQuery = true;
    if (query !== '') {
      matchesSearchQuery =
        psychologist.name.toLowerCase().includes(query) ||
        psychologist.specialty.toLowerCase().includes(query) ||
        psychologist.specialties.some((s) => s.toLowerCase().includes(query));
      console.log(`  Search query match:`, matchesSearchQuery);
    }

    const finalResult = matchesFilterCriteria && matchesSearchQuery;
    console.log(`  Final result for ${psychologist.name}:`, finalResult);
    return finalResult;
  }

  // Get specialty tags for data attribute
  getSpecialtyTags(psychologist: Psychologist): string {
    return psychologist.specialties.map((s) => s.toLowerCase()).join(',');
  }

  get upcomingAppointments() {
    return this.appointments().filter((a) => a.status === 'upcoming');
  }

  get pastAppointments() {
    return this.appointments().filter((a) => a.status === 'past');
  }

  openProfileModal(psychologist: Psychologist): void {
    this.selectedPsychologistForProfile.set(psychologist);
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
    this.selectedPsychologistForProfile.set(null);
  }

  onBookFromProfile(psychologist: Psychologist): void {
    this.closeProfileModal();
    this.openAppointmentModal(psychologist);
  }
}
