import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

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

@Component({
  selector: 'app-psychologist-profile-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './psychologist-profile-modal.component.html',
  styleUrls: ['./psychologist-profile-modal.component.css'],
})
export class PsychologistProfileModalComponent {
  @Input() psychologist!: Psychologist;
  @Output() close = new EventEmitter<void>();
  @Output() bookAppointment = new EventEmitter<Psychologist>();

  onClose(): void {
    this.close.emit();
  }

  onBookAppointment(): void {
    this.bookAppointment.emit(this.psychologist);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}

