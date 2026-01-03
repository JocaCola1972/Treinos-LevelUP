
import { User, Role, Shift, TrainingSession } from './types';

export const MOCK_USERS: User[] = [
  { 
    id: 'admin1', 
    name: 'Administrador Geral', 
    role: Role.ADMIN, 
    avatar: 'https://i.pravatar.cc/150?u=admin',
    phone: '917772010',
    password: 'admin'
  },
  { 
    id: 'u1', 
    name: 'Treinador Ricardo', 
    role: Role.COACH, 
    avatar: 'https://i.pravatar.cc/150?u=u1',
    phone: '912345678',
    password: 'admin'
  },
  { 
    id: 'u2', 
    name: 'João Silva', 
    role: Role.STUDENT, 
    avatar: 'https://i.pravatar.cc/150?u=u2',
    phone: '911111111',
    password: '123'
  },
  { 
    id: 'u3', 
    name: 'Maria Santos', 
    role: Role.STUDENT, 
    avatar: 'https://i.pravatar.cc/150?u=u3',
    phone: '922222222' 
  },
  { 
    id: 'u4', 
    name: 'Pedro Lima', 
    role: Role.STUDENT, 
    avatar: 'https://i.pravatar.cc/150?u=u4',
    phone: '933333333'
  },
  { 
    id: 'u5', 
    name: 'Ana Costa', 
    role: Role.STUDENT, 
    avatar: 'https://i.pravatar.cc/150?u=u5',
    phone: '944444444'
  },
];

export const MOCK_SHIFTS: Shift[] = [
  { id: 's1', dayOfWeek: 'Segunda-feira', startDate: '2024-03-25', startTime: '18:00', durationMinutes: 60, studentIds: ['u2', 'u4'], recurrence: 'SEMANAL' },
  { id: 's2', dayOfWeek: 'Quarta-feira', startDate: '2024-03-27', startTime: '19:30', durationMinutes: 90, studentIds: ['u3', 'u5'], recurrence: 'SEMANAL' },
  { id: 's3', dayOfWeek: 'Sexta-feira', startDate: '2024-03-29', startTime: '17:00', durationMinutes: 60, studentIds: ['u2', 'u3'], recurrence: 'SEMANAL' },
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
