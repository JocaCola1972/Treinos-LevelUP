
export enum Role {
  COACH = 'COACH',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum SkillLevel {
  BEGINNER = 'Iniciante',
  INTERMEDIATE = 'Intermédio',
  ADVANCED = 'Avançado',
  PRO = 'Pro'
}

export type RecurrenceType = 'PONTUAL' | 'SEMANAL' | 'QUINZENAL';

export interface User {
  id: string;
  name: string;
  role: Role;
  level: SkillLevel;
  avatar: string;
  phone: string;
  password?: string;
}

export interface Shift {
  id: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  studentIds: string[];
  level: SkillLevel;
  recurrence: RecurrenceType;
  startDate?: string;
}

export interface TrainingSession {
  id: string;
  shiftId: string;
  date: string;
  isActive: boolean;
  completed: boolean;
  attendeeIds: string[];
  youtubeUrl?: string;
  notes?: string;
  aiInsights?: string;
}

export const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];
