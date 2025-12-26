
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher'
}

export enum QuestionType {
  MCQ = 'mcq',
  MULTIPLE_CORRECT = 'multiple_correct',
  TRUE_FALSE = 'true_false'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options: Option[];
  correctAnswerIds: string[];
  points: number;
  category: string;
  explanation?: string;
}

export interface QuizSettings {
  timeLimitMinutes: number;
  attemptLimit: number;
  randomizeQuestions: boolean;
  isPublic: boolean;
  scheduledAt?: string;
  expiresAt?: string;
}

export interface Quiz {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  joinCode: string;
  settings: QuizSettings;
  createdAt: string;
  questionIds: string[];
  isPractice?: boolean; // New flag for self-generated mock tests
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  answers: Record<string, string[]>; 
  score: number;
  maxScore: number;
  timeTakenSeconds: number;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
  lastQuestionIdx: number;
  isPractice?: boolean; // New flag for self-generated mock tests
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export interface CategoryPerformance {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
}
