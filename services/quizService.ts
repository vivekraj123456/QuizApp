
import { Quiz, Question, QuizAttempt, QuizSettings, QuestionType, Notification } from '../types';

/**
 * PRODUCTION EDGE FUNCTION LOGIC (Conceptual for Supabase)
 * --------------------------------------------------------
 * To run this as a real background job:
 * 1. Enable pg_cron: 'create extension pg_cron;'
 * 2. Create a function that calls a Supabase Edge Function every minute.
 * 3. select cron.schedule('check-quizzes', '* * * * *', 'select net.http_post(...)');
 */

class QuizService {
  private getStorage<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  private setStorage<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Notifications ---
  getNotifications(userId: string): Notification[] {
    return this.getStorage<Notification>('notifications')
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addNotification(userId: string, title: string, message: string, type: 'info' | 'alert' | 'success' = 'info', link?: string) {
    const notifications = this.getStorage<Notification>('notifications');
    
    // Prevent spamming the same notification title/message in a short window
    const isDuplicate = notifications.some(n => 
      n.userId === userId && 
      n.title === title && 
      (new Date().getTime() - new Date(n.createdAt).getTime() < 3600000) // 1 hour window
    );

    if (isDuplicate) return;

    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      link
    };
    this.setStorage('notifications', [...notifications, newNotif]);
  }

  markNotificationRead(id: string) {
    const notifications = this.getStorage<Notification>('notifications');
    const idx = notifications.findIndex(n => n.id === id);
    if (idx > -1) {
      notifications[idx].isRead = true;
      this.setStorage('notifications', notifications);
    }
  }

  markAllNotificationsRead(userId: string) {
    const notifications = this.getStorage<Notification>('notifications');
    const updated = notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n);
    this.setStorage('notifications', updated);
  }

  /**
   * MOCK CRON JOB: processScheduledEvents
   * This logic simulates a server-side process that checks for time-based triggers.
   */
  processScheduledEvents(userId: string) {
    const quizzes = this.getStorage<Quiz>('quiz_data');
    const now = new Date();

    quizzes.forEach(quiz => {
      if (quiz.isPractice) return;

      // 1. Check for Upcoming Quizzes (starts in next 15 mins)
      if (quiz.settings.scheduledAt) {
        const startTime = new Date(quiz.settings.scheduledAt);
        const diffMins = (startTime.getTime() - now.getTime()) / 60000;
        
        if (diffMins > 0 && diffMins <= 15) {
          this.addNotification(
            userId, 
            'Upcoming Assessment', 
            `"${quiz.title}" is starting in ${Math.round(diffMins)} minutes! Get ready.`,
            'info'
          );
        }
      }

      // 2. Check for Expiring Quizzes (expires in next 30 mins)
      if (quiz.settings.expiresAt) {
        const endTime = new Date(quiz.settings.expiresAt);
        const diffMins = (endTime.getTime() - now.getTime()) / 60000;

        if (diffMins > 0 && diffMins <= 30) {
          this.addNotification(
            userId, 
            'Urgent: Deadline Near', 
            `"${quiz.title}" expires in ${Math.round(diffMins)} minutes. Submit your attempt soon!`,
            'alert'
          );
        }
      }
    });
  }

  // --- Quiz Bank Methods ---
  getTeacherQuestionBank(): Question[] {
    return this.getStorage<Question>('question_bank');
  }

  addToQuestionBank(question: Question) {
    const bank = this.getTeacherQuestionBank();
    const isDuplicate = bank.some(q => q.text === question.text && q.category === question.category);
    if (!isDuplicate) {
      const bankItem = { ...question, id: `bank_${Math.random().toString(36).substr(2, 9)}`, quizId: 'bank' };
      this.setStorage('question_bank', [...bank, bankItem]);
    }
  }

  // --- Quiz CRUD ---
  createQuiz(teacherId: string, title: string, description: string, settings: QuizSettings, isPractice: boolean = false): Quiz {
    const quizzes = this.getStorage<Quiz>('quiz_data');
    const newQuiz: Quiz = {
      id: Math.random().toString(36).substr(2, 9),
      teacherId,
      title,
      description,
      joinCode: isPractice ? 'PRACTICE' : Math.random().toString(36).substr(2, 6).toUpperCase(),
      settings,
      createdAt: new Date().toISOString(),
      questionIds: [],
      isPractice
    };
    this.setStorage('quiz_data', [...quizzes, newQuiz]);

    if (!isPractice) {
      const users = JSON.parse(localStorage.getItem('quiz_users_db') || '[]');
      users.filter((u: any) => u.role === 'student').forEach((u: any) => {
        this.addNotification(u.id, 'New Assessment Released', `${title} is now available with code: ${newQuiz.joinCode}`, 'success');
      });
    }

    return newQuiz;
  }

  updateQuiz(id: string, data: Partial<Quiz>): Quiz | null {
    const quizzes = this.getStorage<Quiz>('quiz_data');
    const idx = quizzes.findIndex(q => q.id === id);
    if (idx === -1) return null;
    quizzes[idx] = { ...quizzes[idx], ...data };
    this.setStorage('quiz_data', quizzes);
    return quizzes[idx];
  }

  getTeacherQuizzes(teacherId: string): Quiz[] {
    return this.getStorage<Quiz>('quiz_data').filter(q => q.teacherId === teacherId && !q.isPractice);
  }

  getQuizByCode(code: string): Quiz | undefined {
    return this.getStorage<Quiz>('quiz_data').find(q => q.joinCode === code.toUpperCase() && !q.isPractice);
  }

  getQuizById(id: string): Quiz | undefined {
    return this.getStorage<Quiz>('quiz_data').find(q => q.id === id);
  }

  // --- Question Management ---
  getQuestionsForQuiz(quizId: string): Question[] {
    return this.getStorage<Question>('question_data').filter(q => q.quizId === quizId);
  }

  saveQuestion(question: Partial<Question> & { quizId: string }): Question {
    const questions = this.getStorage<Question>('question_data');
    const quizzes = this.getStorage<Quiz>('quiz_data');
    
    const newQuestion: Question = {
      id: question.id || Math.random().toString(36).substr(2, 9),
      quizId: question.quizId,
      text: question.text || '',
      type: question.type || QuestionType.MCQ,
      options: question.options || [],
      correctAnswerIds: question.correctAnswerIds || [],
      points: question.points || 1,
      category: question.category || 'General',
      explanation: question.explanation
    };

    const index = questions.findIndex(q => q.id === newQuestion.id);
    if (index > -1) {
      questions[index] = newQuestion;
    } else {
      questions.push(newQuestion);
      const quizIndex = quizzes.findIndex(q => q.id === question.quizId);
      if (quizIndex > -1 && !quizzes[quizIndex].questionIds.includes(newQuestion.id)) {
        quizzes[quizIndex].questionIds.push(newQuestion.id);
        this.setStorage('quiz_data', quizzes);
      }
    }

    this.setStorage('question_data', questions);
    return newQuestion;
  }

  // --- Analytics & Attempts ---
  getQuizClassAverage(quizId: string): number {
    const attempts = this.getQuizAttempts(quizId);
    if (attempts.length === 0) return 0;
    const total = attempts.reduce((acc, curr) => acc + (curr.score / (curr.maxScore || 1)), 0);
    return Math.round((total / attempts.length) * 100);
  }

  getStudentActiveAttempt(studentId: string, quizId: string): QuizAttempt | undefined {
    return this.getStorage<QuizAttempt>('attempt_data').find(
      a => a.studentId === studentId && a.quizId === quizId && !a.isCompleted
    );
  }

  getStudentActiveAttempts(studentId: string): QuizAttempt[] {
    return this.getStorage<QuizAttempt>('attempt_data').filter(
      a => a.studentId === studentId && !a.isCompleted
    );
  }

  savePartialAttempt(attempt: QuizAttempt) {
    const attempts = this.getStorage<QuizAttempt>('attempt_data');
    const idx = attempts.findIndex(a => a.id === attempt.id);
    if (idx > -1) {
      attempts[idx] = { ...attempt };
    } else {
      attempts.push(attempt);
    }
    this.setStorage('attempt_data', attempts);
  }

  submitAttempt(attemptId: string): QuizAttempt | null {
    const attempts = this.getStorage<QuizAttempt>('attempt_data');
    const idx = attempts.findIndex(a => a.id === attemptId);
    if (idx === -1) return null;

    const attempt = attempts[idx];
    const questions = this.getQuestionsForQuiz(attempt.quizId);
    const quiz = this.getQuizById(attempt.quizId);
    let score = 0;
    let maxScore = 0;

    questions.forEach(q => {
      maxScore += q.points;
      const studentAnswer = attempt.answers[q.id] || [];
      const correctAnswers = q.correctAnswerIds;

      if (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE) {
        if (studentAnswer.length === 1 && studentAnswer[0] === correctAnswers[0]) {
          score += q.points;
        }
      } else if (q.type === QuestionType.MULTIPLE_CORRECT) {
        const isCorrect = correctAnswers.length === studentAnswer.length &&
          correctAnswers.every(val => studentAnswer.includes(val));
        if (isCorrect) score += q.points;
      }
    });

    attempts[idx] = {
      ...attempt,
      score,
      maxScore,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      isPractice: quiz?.isPractice || false
    };

    this.setStorage('attempt_data', attempts);
    return attempts[idx];
  }

  getStudentAttempts(studentId: string): QuizAttempt[] {
    return this.getStorage<QuizAttempt>('attempt_data').filter(a => a.studentId === studentId && a.isCompleted);
  }

  getQuizAttempts(quizId: string): QuizAttempt[] {
    return this.getStorage<QuizAttempt>('attempt_data').filter(a => a.quizId === quizId && a.isCompleted && !a.isPractice);
  }

  getAttemptById(id: string): QuizAttempt | undefined {
    return this.getStorage<QuizAttempt>('attempt_data').find(a => a.id === id);
  }
}

export const quizService = new QuizService();
