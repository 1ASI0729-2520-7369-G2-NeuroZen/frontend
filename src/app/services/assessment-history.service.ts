import { Injectable, signal, inject } from '@angular/core';
import { AssessmentService } from './assessment.service';
import { AuthService } from './auth.service';
import {
  CreateAssessmentRequest,
  AssessmentType,
  EmotionalState,
} from '../models/assessment.model';

export interface AssessmentResult {
  id: string;
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high';
  recommendations: string[];
  timestamp: Date;
  categoryScores: {
    work: number; // 0-100
    sleep: number; // 0-100
    physical: number; // 0-100
    emotional: number; // 0-100
  };
  answers: Map<string, number>;
}

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customDays?: number;
  lastReminder?: Date;
  nextReminder?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AssessmentHistoryService {
  private assessmentService = inject(AssessmentService);
  private authService = inject(AuthService);

  // Assessment history stored in signal
  private assessmentHistory = signal<AssessmentResult[]>([]);

  // Reminder settings
  private reminderSettings = signal<ReminderSettings>({
    enabled: false,
    frequency: 'weekly',
  });

  constructor() {
    this.loadFromBackend();
    this.loadFromLocalStorage();
  }

  // Get all assessments
  getAssessments() {
    return this.assessmentHistory.asReadonly();
  }

  // Get assessments filtered by date range
  getAssessmentsByDateRange(startDate: Date, endDate: Date): AssessmentResult[] {
    return this.assessmentHistory().filter((assessment) => {
      const assessmentDate = new Date(assessment.timestamp);
      return assessmentDate >= startDate && assessmentDate <= endDate;
    });
  }

  // Get latest assessment
  getLatestAssessment(): AssessmentResult | null {
    const assessments = this.assessmentHistory();
    if (assessments.length === 0) return null;
    return assessments[assessments.length - 1];
  }

  // Add new assessment
  addAssessment(assessment: AssessmentResult): void {
    const newAssessment = {
      ...assessment,
      id: this.generateId(),
      timestamp: new Date(),
    };

    // Save to local state immediately for quick UI update
    this.assessmentHistory.update((history) => [...history, newAssessment]);
    this.saveToLocalStorage();

    // Save to backend
    this.saveToBackend(newAssessment);
  }

  // Save assessment to backend
  private saveToBackend(assessment: AssessmentResult): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.warn('No user logged in, skipping backend save');
      return;
    }

    // Map frontend assessment to backend format
    const backendRequest: CreateAssessmentRequest = {
      employeeId: currentUser.id,
      assessmentType: this.mapToAssessmentType(assessment.level),
      emotionalState: this.mapToEmotionalState(assessment.score),
      score: assessment.score,
      observations: this.formatCategoryScores(assessment.categoryScores),
      recommendations: assessment.recommendations.join('; '),
    };

    this.assessmentService.createAssessment(backendRequest).subscribe({
      next: (response) => {
        console.log('Assessment saved to backend:', response);
        // Update the local assessment with the backend ID
        this.assessmentHistory.update((history) =>
          history.map((a) => (a.id === assessment.id ? { ...a, id: response.id.toString() } : a))
        );
        this.saveToLocalStorage();
      },
      error: (error) => {
        console.error('Failed to save assessment to backend:', error);
      },
    });
  }

  // Map stress level to assessment type
  private mapToAssessmentType(level: 'low' | 'moderate' | 'high'): AssessmentType {
    // All stress assessments are STRESS_LEVEL type
    return 'STRESS_LEVEL';
  }

  // Map score to emotional state
  private mapToEmotionalState(score: number): EmotionalState {
    if (score >= 67) return 'CRITICAL';
    if (score >= 50) return 'POOR';
    if (score >= 34) return 'MODERATE';
    if (score >= 17) return 'GOOD';
    return 'EXCELLENT';
  }

  // Format category scores as observations
  private formatCategoryScores(categoryScores: {
    work: number;
    sleep: number;
    physical: number;
    emotional: number;
  }): string {
    return `Work: ${categoryScores.work}, Sleep: ${categoryScores.sleep}, Physical: ${categoryScores.physical}, Emotional: ${categoryScores.emotional}`;
  }

  // Delete assessment
  deleteAssessment(id: string): void {
    // Delete from backend first
    const assessmentId = parseInt(id, 10);
    if (!isNaN(assessmentId)) {
      this.assessmentService.deleteAssessment(assessmentId).subscribe({
        next: () => {
          console.log('Assessment deleted from backend:', id);
          // Update local state after successful backend deletion
          this.assessmentHistory.update((history) =>
            history.filter((assessment) => assessment.id !== id)
          );
          this.saveToLocalStorage();
        },
        error: (error) => {
          console.error('Failed to delete assessment from backend:', error);
          // Still delete from local storage even if backend fails
          this.assessmentHistory.update((history) =>
            history.filter((assessment) => assessment.id !== id)
          );
          this.saveToLocalStorage();
        },
      });
    } else {
      // If ID is not a number (old localStorage-only assessment), just delete locally
      this.assessmentHistory.update((history) =>
        history.filter((assessment) => assessment.id !== id)
      );
      this.saveToLocalStorage();
    }
  }

  // Get assessment by ID
  getAssessmentById(id: string): AssessmentResult | null {
    return this.assessmentHistory().find((a) => a.id === id) || null;
  }

  // Calculate trend (improving, stable, declining)
  getTrend(): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    const assessments = this.assessmentHistory();
    if (assessments.length < 2) return 'insufficient_data';

    const recent = assessments.slice(-3); // Last 3 assessments
    const scores = recent.map((a) => a.score);

    // Calculate average change
    let totalChange = 0;
    for (let i = 1; i < scores.length; i++) {
      totalChange += scores[i] - scores[i - 1];
    }
    const avgChange = totalChange / (scores.length - 1);

    if (avgChange < -5) return 'improving'; // Score decreasing = improving
    if (avgChange > 5) return 'declining'; // Score increasing = declining
    return 'stable';
  }

  // Get days since last assessment
  getDaysSinceLastAssessment(): number | null {
    const latest = this.getLatestAssessment();
    if (!latest) return null;

    const now = new Date();
    const lastAssessment = new Date(latest.timestamp);
    const diffTime = Math.abs(now.getTime() - lastAssessment.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get category averages over time
  getCategoryAverages(): {
    work: number;
    sleep: number;
    physical: number;
    emotional: number;
  } {
    const assessments = this.assessmentHistory();
    if (assessments.length === 0) {
      return { work: 0, sleep: 0, physical: 0, emotional: 0 };
    }

    const totals = { work: 0, sleep: 0, physical: 0, emotional: 0 };
    assessments.forEach((assessment) => {
      totals.work += assessment.categoryScores.work;
      totals.sleep += assessment.categoryScores.sleep;
      totals.physical += assessment.categoryScores.physical;
      totals.emotional += assessment.categoryScores.emotional;
    });

    const count = assessments.length;
    return {
      work: Math.round(totals.work / count),
      sleep: Math.round(totals.sleep / count),
      physical: Math.round(totals.physical / count),
      emotional: Math.round(totals.emotional / count),
    };
  }

  // Reminder settings methods
  getReminderSettings() {
    return this.reminderSettings.asReadonly();
  }

  updateReminderSettings(settings: Partial<ReminderSettings>): void {
    this.reminderSettings.update((current) => ({
      ...current,
      ...settings,
    }));
    this.saveToLocalStorage();
  }

  // Calculate next reminder date
  calculateNextReminder(): Date | null {
    const settings = this.reminderSettings();
    if (!settings.enabled) return null;

    const now = new Date();
    let daysToAdd = 7; // Default weekly

    switch (settings.frequency) {
      case 'weekly':
        daysToAdd = 7;
        break;
      case 'biweekly':
        daysToAdd = 14;
        break;
      case 'monthly':
        daysToAdd = 30;
        break;
      case 'custom':
        daysToAdd = settings.customDays || 7;
        break;
    }

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  }

  // Local storage methods
  private saveToLocalStorage(): void {
    try {
      const data = {
        assessments: this.assessmentHistory().map((a) => ({
          ...a,
          answers: Array.from(a.answers.entries()),
        })),
        reminderSettings: this.reminderSettings(),
      };
      localStorage.setItem('neurozen_assessments', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('neurozen_assessments');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.assessments) {
          const assessments = parsed.assessments.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
            answers: new Map(a.answers),
          }));
          this.assessmentHistory.set(assessments);
        }
        if (parsed.reminderSettings) {
          this.reminderSettings.set(parsed.reminderSettings);
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  private generateId(): string {
    return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load assessments from backend
  private loadFromBackend(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('No user logged in, skipping backend load');
      return;
    }

    this.assessmentService.getAssessmentsByEmployeeId(currentUser.id).subscribe({
      next: (assessments) => {
        console.log('Loaded assessments from backend:', assessments);
        // Map backend assessments to frontend format
        const mappedAssessments: AssessmentResult[] = assessments.map((a) => ({
          id: a.id.toString(),
          score: a.score,
          level: this.mapScoreToLevel(a.score),
          recommendations: a.recommendations ? a.recommendations.split('; ') : [],
          timestamp: new Date(), // Backend doesn't expose createdAt, use current time
          categoryScores: this.parseCategoryScores(a.observations || ''),
          answers: new Map(),
        }));

        this.assessmentHistory.set(mappedAssessments);
        this.saveToLocalStorage();
      },
      error: (error) => {
        console.error('Failed to load assessments from backend:', error);
      },
    });
  }

  // Map score to level
  private mapScoreToLevel(score: number): 'low' | 'moderate' | 'high' {
    if (score >= 67) return 'high';
    if (score >= 34) return 'moderate';
    return 'low';
  }

  // Parse category scores from observations string
  private parseCategoryScores(observations: string): {
    work: number;
    sleep: number;
    physical: number;
    emotional: number;
  } {
    const defaultScores = { work: 0, sleep: 0, physical: 0, emotional: 0 };

    if (!observations) return defaultScores;

    try {
      const parts = observations.split(', ');
      const scores: any = {};

      parts.forEach((part) => {
        const [key, value] = part.split(': ');
        if (key && value) {
          scores[key.toLowerCase()] = parseInt(value, 10);
        }
      });

      return {
        work: scores.work || 0,
        sleep: scores.sleep || 0,
        physical: scores.physical || 0,
        emotional: scores.emotional || 0,
      };
    } catch (error) {
      console.error('Error parsing category scores:', error);
      return defaultScores;
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    this.assessmentHistory.set([]);
    this.reminderSettings.set({
      enabled: false,
      frequency: 'weekly',
    });
    localStorage.removeItem('neurozen_assessments');
  }
}
