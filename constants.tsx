
import React from 'react';
import { User, Role, SkillLevel, Shift, TrainingSession } from './types';

export const MOCK_USERS: User[] = [
  { 
    id: 'admin1', 
    name: 'Administrador Geral', 
    role: Role.ADMIN, 
    level: SkillLevel.PRO, 
    avatar: 'https://i.pravatar.cc/150?u=admin',
    phone: '917772010',
    password: 'admin'
  },
  { 
    id: 'u1', 
    name: 'Treinador Ricardo', 
    role: Role.COACH, 
    level: SkillLevel.PRO, 
    avatar: 'https://i.pravatar.cc/150?u=u1',
    phone: '912345678',
    password: 'admin'
  },
  { 
    id: 'u2', 
    name: 'João Silva', 
    role: Role.STUDENT, 
    level: SkillLevel.BEGINNER, 
    avatar: 'https://i.pravatar.cc/150?u=u2',
    phone: '911111111',
    password: '123'
  },
  { 
    id: 'u3', 
    name: 'Maria Santos', 
    role: Role.STUDENT, 
    level: SkillLevel.INTERMEDIATE, 
    avatar: 'https://i.pravatar.cc/150?u=u3',
    phone: '922222222' // No password = first login flow
  },
  { 
    id: 'u4', 
    name: 'Pedro Lima', 
    role: Role.STUDENT, 
    level: SkillLevel.BEGINNER, 
    avatar: 'https://i.pravatar.cc/150?u=u4',
    phone: '933333333'
  },
  { 
    id: 'u5', 
    name: 'Ana Costa', 
    role: Role.STUDENT, 
    level: SkillLevel.ADVANCED, 
    avatar: 'https://i.pravatar.cc/150?u=u5',
    phone: '944444444'
  },
];

export const MOCK_SHIFTS: Shift[] = [
  // Corrected: Using 'recurrence: "SEMANAL"' instead of 'isRecurring: true' to satisfy Shift interface
  { id: 's1', dayOfWeek: 'Segunda-feira', startTime: '18:00', durationMinutes: 60, studentIds: ['u2', 'u4'], level: SkillLevel.BEGINNER, recurrence: 'SEMANAL' },
  // Corrected: Using 'recurrence: "SEMANAL"' instead of 'isRecurring: true' to satisfy Shift interface
  { id: 's2', dayOfWeek: 'Quarta-feira', startTime: '19:30', durationMinutes: 90, studentIds: ['u3', 'u5'], level: SkillLevel.INTERMEDIATE, recurrence: 'SEMANAL' },
  // Corrected: Using 'recurrence: "SEMANAL"' instead of 'isRecurring: true' to satisfy Shift interface
  { id: 's3', dayOfWeek: 'Sexta-feira', startTime: '17:00', durationMinutes: 60, studentIds: ['u2', 'u3'], level: SkillLevel.BEGINNER, recurrence: 'SEMANAL' },
];

export const MOCK_SESSIONS: TrainingSession[] = [
  { 
    id: 'ts1', 
    shiftId: 's1', 
    date: '2023-10-23', 
    isActive: false, 
    completed: true, 
    attendeeIds: ['u2', 'u4'], 
    youtubeUrl: 'https://www.youtube.com/watch?v=k5q4y-6X6-Y',
    notes: 'Foco em batidas de fundo e posicionamento de rede.',
    aiInsights: 'Os alunos demonstraram progresso na técnica de bandeja.'
  }
];
