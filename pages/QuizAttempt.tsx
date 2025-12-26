
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { quizService } from '../services/quizService';
import { Quiz, Question, QuestionType, QuizAttempt } from '../types';
import { Button, Card, toast, Badge } from '../components/UI';

const QuizAttemptPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const persistState = useCallback(async () => {
    if (isStarted && activeAttemptId && quiz && user) {
      const existing = await quizService.getAttemptById(activeAttemptId);
      const attempt: QuizAttempt = {
        id: activeAttemptId,
        studentId: user.id,
        quizId: quiz.id,
        answers,
        score: 0,
        maxScore: 0,
        timeTakenSeconds: (quiz.settings.timeLimitMinutes * 60) - timeLeft,
        startedAt: existing?.startedAt || new Date().toISOString(),
        isCompleted: false,
        lastQuestionIdx: currentIdx
      };
      await quizService.savePartialAttempt(attempt);
    }
  }, [answers, currentIdx, isStarted, activeAttemptId, quiz, timeLeft, user]);

  useEffect(() => {
    const init = async () => {
      if (id && user) {
        const q = await quizService.getQuizById(id);
        if (!q) {
          setError("This assessment does not exist or has been removed.");
          return;
        }

        const completeds = await quizService.getStudentAttempts(user.id);
        const studentCompletedAttempts = completeds.filter(a => a.quizId === id);
        const activeAttempt = await quizService.getStudentActiveAttempt(user.id, id);
        
        if (studentCompletedAttempts.length >= (q.settings.attemptLimit || 1) && !activeAttempt) {
          setError(`Maximum attempts reached (${q.settings.attemptLimit}).`);
          return;
        }

        const now = new Date();
        if (q.settings.scheduledAt && new Date(q.settings.scheduledAt) > now) {
          setError(`Locked until ${new Date(q.settings.scheduledAt).toLocaleString()}`);
          return;
        }
        if (q.settings.expiresAt && new Date(q.settings.expiresAt) < now) {
          setError(`Assessment window closed.`);
          return;
        }

        setQuiz(q);
        const qList = await quizService.getQuestionsForQuiz(id);
        setQuestions(qList);

        if (activeAttempt) {
          setAnswers(activeAttempt.answers);
          setCurrentIdx(activeAttempt.lastQuestionIdx);
          setActiveAttemptId(activeAttempt.id);
          const timeElapsed = Math.floor((Date.now() - new Date(activeAttempt.startedAt).getTime()) / 1000);
          const remaining = (q.settings.timeLimitMinutes * 60) - timeElapsed;
          if (remaining <= 0) {
            handleSubmitInternal(activeAttempt.id);
          } else {
            setTimeLeft(remaining);
            setIsStarted(true);
          }
        } else {
          setTimeLeft(q.settings.timeLimitMinutes * 60);
        }
      }
    };
    init();
  }, [id, user]);

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted]);

  useEffect(() => {
    persistState();
  }, [answers, currentIdx]);

  const handleStart = async () => {
    if (!quiz || !user) return;
    const newAttemptId = Math.random().toString(36).substr(2, 9);
    setActiveAttemptId(newAttemptId);
    
    const initialAttempt: QuizAttempt = {
      id: newAttemptId,
      studentId: user.id,
      quizId: quiz.id,
      answers: {},
      score: 0,
      maxScore: 0,
      timeTakenSeconds: 0,
      startedAt: new Date().toISOString(),
      isCompleted: false,
      lastQuestionIdx: 0
    };
    await quizService.savePartialAttempt(initialAttempt);
    setIsStarted(true);
  };

  const handleOptionSelect = (qId: string, optId: string) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;
    if (q.type === QuestionType.MULTIPLE_CORRECT) {
      const current = answers[qId] || [];
      const next = current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId];
      setAnswers(prev => ({ ...prev, [qId]: next }));
    } else {
      setAnswers(prev => ({ ...prev, [qId]: [optId] }));
    }
  };

  const handleSubmitInternal = async (attemptId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const savedAttempt = await quizService.submitAttempt(attemptId);
    if (savedAttempt) {
      toast.success('Assessment complete!');
      setTimeout(() => navigate(`/results/${savedAttempt.id}`), 800);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !activeAttemptId) return;
    await persistState();
    await handleSubmitInternal(activeAttemptId);
  };

  const handleSaveAndExit = async () => {
    await persistState();
    toast.success('Progress saved.');
    navigate('/');
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-32 text-center animate-in fade-in duration-300">
        <Card className="p-8 md:p-16 shadow-2xl border-none ring-1 ring-slate-100 dark:ring-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 font-black text-3xl md:text-4xl">!</div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 transition-colors tracking-tight">Access Restricted</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-12 leading-relaxed italic transition-colors">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full sm:w-auto h-16 px-12 rounded-2xl font-black text-lg shadow-xl shadow-slate-100 dark:shadow-none">Go Back</Button>
        </Card>
      </div>
    );
  }

  if (!quiz) return <div className="p-20 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse text-xl md:text-2xl uppercase tracking-tighter italic">Initializing...</div>;

  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-24 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <Card className="p-8 md:p-16 text-center shadow-2xl border-none ring-1 ring-slate-100 dark:ring-slate-800 rounded-[2.5rem] md:rounded-[3.5rem] bg-white dark:bg-slate-900 transition-colors">
          <Badge variant="indigo" className="mb-8 h-8 px-8 text-[10px] uppercase tracking-[0.3em] font-black rounded-full">Entry Confirmed</Badge>
          <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter text-slate-900 dark:text-white leading-tight transition-colors">{quiz.title}</h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 font-medium leading-relaxed italic opacity-90 transition-colors">{quiz.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10 mb-12 md:mb-16">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 md:p-10 rounded-[2rem] ring-1 ring-slate-100 dark:ring-slate-700 transition-colors">
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.25em] mb-3 transition-colors">Duration</span>
              <span className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums transition-colors tracking-tighter">{quiz.settings.timeLimitMinutes}m</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 md:p-10 rounded-[2rem] ring-1 ring-slate-100 dark:ring-slate-700 transition-colors">
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.25em] mb-3 transition-colors">Attempts</span>
              <span className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums transition-colors tracking-tighter">{quiz.settings.attemptLimit}</span>
            </div>
          </div>

          <Button 
            onClick={handleStart} 
            className="w-full h-24 text-2xl md:text-3xl font-black rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-indigo-100 dark:shadow-none bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all flex items-center justify-center gap-6"
          >
            Launch Assessment
          </Button>
          <p className="mt-8 text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] italic transition-colors">The timer begins immediately.</p>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-inter transition-colors duration-500">
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-40 p-4 md:px-10 flex justify-between items-center shadow-sm transition-colors">
        <div className="flex items-center gap-4 md:gap-12">
          <div className="hidden lg:flex flex-col">
            <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-0.5 transition-colors">Session Active</h4>
            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px] leading-none transition-colors tracking-tight">{quiz.title}</h4>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-0.5 text-center transition-colors">Prog.</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums italic transition-colors">{currentIdx + 1} / {questions.length}</span>
            </div>
            <div className="w-24 md:w-48 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5 transition-colors">
              <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-700 ease-out rounded-full" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-5 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-[1.5rem] font-mono text-xl md:text-2xl font-black tracking-tighter shadow-lg transition-all ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-slate-800 text-white'}`}>
          <svg className="w-6 h-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-grow max-w-5xl mx-auto w-full px-4 py-8 md:py-20">
        <div className="animate-in fade-in slide-in-from-right-10 duration-500" key={currentIdx}>
          <Card className="p-8 md:p-16 shadow-2xl border-none ring-1 ring-slate-100 dark:ring-slate-800 rounded-[2.5rem] md:rounded-[3.5rem] bg-white dark:bg-slate-900 transition-colors">
            <Badge variant="indigo" className="mb-6 h-7 px-6 text-[10px] uppercase tracking-[0.25em] font-black">{currentQ.category}</Badge>
            <h2 className="text-2xl md:text-4xl font-black mb-12 md:mb-16 text-slate-900 dark:text-white leading-tight transition-colors tracking-tight">{currentQ.text}</h2>
            
            <div className="space-y-4 md:space-y-6">
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id]?.includes(opt.id);
                const letter = String.fromCharCode(65 + i);
                return (
                  <div 
                    key={opt.id}
                    onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                    className={`group p-5 md:p-8 border-2 md:border-3 rounded-[1.8rem] md:rounded-[2.5rem] cursor-pointer transition-all duration-300 flex items-center gap-6 md:gap-8 ${isSelected ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 scale-[1.01] shadow-xl shadow-indigo-100/50 dark:shadow-none' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-indigo-200 dark:hover:border-indigo-800 active:scale-95'}`}
                  >
                    <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl md:rounded-3xl border-2 md:border-4 flex items-center justify-center font-black text-xl md:text-2xl transition-all duration-300 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'}`}>
                      {letter}
                    </div>
                    <span className={`text-xl md:text-2xl leading-tight transition-colors transition-colors ${isSelected ? 'font-black text-indigo-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>{opt.text}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t dark:border-slate-800 p-6 md:p-8 sticky bottom-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-none no-print transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between gap-6">
          <Button 
            variant="ghost" 
            className="px-8 h-16 text-lg font-black tracking-tight rounded-2xl hidden sm:flex"
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            Previous
          </Button>
          <div className="flex gap-4 flex-1 justify-end">
             <Button variant="secondary" onClick={handleSaveAndExit} className="rounded-2xl h-16 px-10 font-black border-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-base transition-colors">
              Save Progress
            </Button>
            {currentIdx === questions.length - 1 ? (
              <Button onClick={handleSubmit} isLoading={isSubmitting} className="flex-1 sm:flex-none px-12 md:px-24 h-16 md:h-20 rounded-2xl md:rounded-[1.5rem] text-xl md:text-2xl font-black bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xl shadow-indigo-100 dark:shadow-none">
                Submit Test
              </Button>
            ) : (
              <Button onClick={() => setCurrentIdx(prev => prev + 1)} className="flex-1 sm:flex-none px-12 md:px-24 h-16 md:h-20 rounded-2xl md:rounded-[1.5rem] text-xl md:text-2xl font-black bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xl shadow-indigo-100 dark:shadow-none">
                Next Item
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptPage;
