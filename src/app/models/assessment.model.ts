// Assessment Models - Based on Backend API Contracts

export interface Assessment {
  id: number;
  employeeId: number;
  assessmentType: AssessmentType;
  emotionalState: EmotionalState;
  score: number;
  observations?: string;
  recommendations?: string;
}

export interface CreateAssessmentRequest {
  employeeId: number;
  assessmentType: AssessmentType;
  emotionalState: EmotionalState;
  score: number;
  observations?: string;
  recommendations?: string;
}

export interface UpdateAssessmentRequest {
  assessmentType?: AssessmentType;
  emotionalState?: EmotionalState;
  score?: number;
  observations?: string;
  recommendations?: string;
}

export type AssessmentType =
  | 'EMOTIONAL_STATE'
  | 'STRESS_LEVEL'
  | 'ANXIETY'
  | 'DEPRESSION'
  | 'GENERAL_WELLBEING';

export type EmotionalState = 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL';
