import { Component, signal, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CreateAppointmentModalComponent,
  AppointmentData,
} from '../home/modals/create-appointment-modal/create-appointment-modal.component';
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

interface ForumTopic {
  id: number;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
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
  imports: [TranslateModule, CommonModule, FormsModule, CreateAppointmentModalComponent],
  templateUrl: './coaching.html',
  styleUrl: './coaching.css',
})
export class Coaching implements OnInit {
  activeTab = signal<'psychologists' | 'community' | 'appointments'>('psychologists');
  selectedFilter = signal('all');
  searchQuery = signal('');

  psychologists = signal<Psychologist[]>([]);

  forumTopics = signal<ForumTopic[]>([
    {
      id: 1,
      title: '¿Cómo manejan el estrés de las reuniones constantes?',
      category: 'workStress',
      author: 'Juan P.',
      replies: 23,
      views: 145,
      lastActivity: 'Hace 2 horas',
    },
    {
      id: 2,
      title: 'Mi rutina de respiración matutina que cambió todo',
      category: 'techniques',
      author: 'Laura M.',
      replies: 45,
      views: 312,
      lastActivity: 'Hace 5 horas',
    },
    {
      id: 3,
      title: 'Superé el burnout: mi historia',
      category: 'success',
      author: 'Roberto S.',
      replies: 67,
      views: 523,
      lastActivity: 'Hace 1 día',
    },
  ]);

  appointments = signal<Appointment[]>([]);

  showAppointmentModal = signal(false);
  selectedPsychologistForBooking = signal<Psychologist | null>(null);

  constructor(
    private appointmentService: AppointmentService,
    private psychologistService: PsychologistService
  ) {}

  ngOnInit(): void {
    this.loadPsychologists();
    this.loadAppointments();
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
          };

          const specialtiesMap: { [key: string]: string[] } = {
            'Dra. María González': ['Estrés laboral', 'Ansiedad', 'Burnout'],
            'Dr. Carlos Ruiz': ['Mindfulness', 'Meditación', 'Ansiedad'],
            'Dra. Ana Martínez': ['Burnout', 'Estrés laboral', 'Resiliencia'],
            'Dr. Sarah Martinez': ['Ansiedad', 'Depresión', 'Terapia Cognitiva'],
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
      },
      error: (error) => {
        console.error('Failed to load psychologists:', error);
      },
    });
  }

  loadAppointments(): void {
    // Get current user from localStorage
    const userData = localStorage.getItem('neurozen_user');
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

  setActiveTab(tab: 'psychologists' | 'community' | 'appointments') {
    this.activeTab.set(tab);
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
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

  get filteredPsychologists() {
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase();

    return this.psychologists().filter((p) => {
      const matchesFilter =
        filter === 'all' ||
        p.specialties.some((s) => s.toLowerCase().includes(filter.toLowerCase()));
      const matchesSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        p.specialty.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }

  get upcomingAppointments() {
    return this.appointments().filter((a) => a.status === 'upcoming');
  }

  get pastAppointments() {
    return this.appointments().filter((a) => a.status === 'past');
  }
}
