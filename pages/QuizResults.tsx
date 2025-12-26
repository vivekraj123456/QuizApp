
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { Quiz, QuizAttempt, Question, CategoryPerformance } from '../types';
import { Card, Button, Badge } from '../components/UI';

const Confetti: React.FC = () => {
  const pieces = Array.from({ length: 50 });
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((_, i) => (
        <div 
          key={i} 
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][Math.floor(Math.random() * 5)],
            animation: `confetti ${2 + Math.random() * 3}s linear infinite`,
            animationDelay: `${Math.random() * 3}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            width: `${5 + Math.random() * 10}px`,
            height: `${5 + Math.random() * 10}px`,
          }}
        />
      ))}
    </div>
  );
};

const Certificate: React.FC<{ studentName: string, quizTitle: string, score: number, date: string }> = ({ studentName, quizTitle, score, date }) => {
  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[100] p-16">
      <div className="w-full h-full border-[16px] border-double border-indigo-900 p-8 flex flex-col items-center justify-center text-center relative">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-indigo-600"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-indigo-600"></div>
        
        <div className="text-indigo-600 font-black text-2xl uppercase tracking-[0.4em] mb-12">Certificate of Excellence</div>
        <div className="text-gray-400 font-medium italic text-lg mb-4">This hereby certifies that</div>
        <div className="text-6xl font-black text-indigo-950 mb-8 tracking-tighter border-b-4 border-indigo-100 pb-4 px-12">{studentName}</div>
        <div className="text-gray-400 font-medium text-lg mb-8 italic">has successfully achieved mastery in the assessment</div>
        <div className="text-4xl font-black text-gray-900 mb-12 tracking-tight">"{quizTitle}"</div>
        <div className="flex gap-20 items-end mt-12">
           <div className="text-center">
             <div className="font-black text-4xl text-indigo-600 mb-1">{score}%</div>
             <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Final Proficiency</div>
           </div>
           <div className="text-center">
             <div className="font-black text-xl text-gray-900 mb-1">{date}</div>
             <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Date of Attainment</div>
           </div>
        </div>
        <div className="mt-20 opacity-30 flex items-center gap-4">
           <svg className="w-12 h-12 text-indigo-900" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" /></svg>
           <span className="font-black text-indigo-900 text-xl tracking-widest">QUIZPRO AI PLATFORM</span>
        </div>
      </div>
    </div>
  );
};

const QuizResults: React.FC = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [displayScore, setDisplayScore] = useState(0);
  const [classAverage, setClassAverage] = useState(0);
  const [studentName, setStudentName] = useState('Valued Scholar');

  useEffect(() => {
    if (attemptId) {
      const a = quizService.getAttemptById(attemptId);
      if (a) {
        setAttempt(a);
        const q = quizService.getQuizById(a.quizId);
        if (q) setQuiz(q);
        setQuestions(quizService.getQuestionsForQuiz(a.quizId));
        setClassAverage(quizService.getQuizClassAverage(a.quizId));

        const users = JSON.parse(localStorage.getItem('quiz_users_db') || '[]');
        const u = users.find((u: any) => u.id === a.studentId);
        if (u) setStudentName(u.name);

        const target = Math.round((a.score / (a.maxScore || 1)) * 100);
        let startTime: number | null = null;
        const duration = 1200;

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = timestamp - startTime;
          const current = Math.min(Math.floor((progress / duration) * target), target);
          setDisplayScore(current);
          if (progress < duration) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }
  }, [attemptId]);

  const categoryPerformance = useMemo(() => {
    if (!questions.length || !attempt) return [];
    const categories = Array.from(new Set(questions.map(q => q.category)));
    return categories.map(cat => {
      const catQuestions = questions.filter(q => q.category === cat);
      let catScore = 0;
      let catMax = 0;
      catQuestions.forEach(q => {
        catMax += q.points;
        const ans = attempt.answers[q.id] || [];
        if (JSON.stringify(ans.sort()) === JSON.stringify(q.correctAnswerIds.sort())) {
          catScore += q.points;
        }
      });
      return {
        category: cat,
        score: catScore,
        maxScore: catMax,
        percentage: Math.round((catScore / (catMax || 1)) * 100)
      };
    });
  }, [questions, attempt]);

  if (!attempt || !quiz) return <div className="p-12 text-center text-gray-400 font-bold animate-pulse">Synchronizing Results...</div>;

  const scorePercentage = Math.round((attempt.score / (attempt.maxScore || 1)) * 100);
  const isPass = scorePercentage >= 60;
  const isExcellence = scorePercentage >= 80;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {isPass && <Confetti />}
      <Certificate 
        studentName={studentName} 
        quizTitle={quiz.title} 
        score={scorePercentage} 
        date={new Date(attempt.completedAt!).toLocaleDateString()} 
      />
      
      <Card className={`p-10 text-center mb-8 border-none text-white shadow-2xl relative overflow-hidden no-print ${quiz.isPractice ? 'bg-gradient-to-br from-indigo-700 to-indigo-900' : (isPass ? 'bg-gradient-to-br from-indigo-600 to-violet-700' : 'bg-gradient-to-br from-gray-700 to-gray-900')}`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" /></svg>
        </div>
        
        <div className="relative z-10">
          <Badge variant="gray" className="mb-4 bg-white/20 text-white border-none backdrop-blur-md uppercase tracking-widest text-[10px] px-4 py-1.5 animate-bounce-subtle">
            {quiz.isPractice ? 'Practice Lab Analysis 🧪' : (isPass ? 'Victory! 🎉' : 'Needs Review 📚')}
          </Badge>
          <h1 className="text-5xl font-black mb-2 tracking-tighter italic uppercase">{quiz.isPractice ? 'Mock Complete' : (isPass ? 'Genius Level!' : 'Mission Logged')}</h1>
          <p className="opacity-80 font-medium mb-10 max-w-sm mx-auto text-sm">Assessment finished for "{quiz.title}".</p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-12">
             <div className="relative inline-flex items-center justify-center">
               <svg className="w-48 h-48 -rotate-90">
                  <circle cx="96" cy="96" r="86" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                  <circle cx="96" cy="96" r="86" fill="transparent" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 86} strokeDashoffset={2 * Math.PI * 86 * (1 - displayScore/100)} className="transition-all duration-300 ease-out" />
               </svg>
               <div className="absolute flex flex-col items-center">
                 <span className="text-6xl font-black leading-none tabular-nums tracking-tighter">{displayScore}%</span>
                 <span className="text-[9px] uppercase tracking-widest font-black opacity-60 mt-1">Overall proficiency</span>
               </div>
             </div>

             <div className="flex flex-col gap-4 text-left">
                {!quiz.isPractice && (
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/10 min-w-[220px]">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Comparative Benchmark</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black">{scorePercentage >= classAverage ? `+${scorePercentage - classAverage}%` : `-${classAverage - scorePercentage}%`}</span>
                      <span className="text-xs font-bold opacity-60">than class average ({classAverage}%)</span>
                    </div>
                  </div>
                )}
                {quiz.isPractice && (
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/10 min-w-[220px]">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Study Tip</p>
                    <p className="text-xs font-medium leading-relaxed italic">
                      Review the tutor insights below to strengthen your understanding of this topic.
                    </p>
                  </div>
                )}
                {isExcellence && !quiz.isPractice && (
                  <Button 
                    onClick={() => window.print()}
                    className="h-14 rounded-2xl bg-amber-400 text-amber-950 font-black text-sm uppercase tracking-widest hover:bg-amber-300 shadow-xl border-none"
                  >
                    Download Certificate 📜
                  </Button>
                )}
             </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6 no-print">
          <Card className="p-8 border-none ring-1 ring-gray-100 dark:ring-slate-800 shadow-sm">
             <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight transition-colors">Performance by Domain</h3>
             <div className="space-y-6">
               {categoryPerformance.map((perf, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{perf.category}</span>
                     <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 italic">{perf.percentage}%</span>
                   </div>
                   <div className="h-2 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-600 dark:bg-indigo-500" style={{ width: `${perf.percentage}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center no-print">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">Question Feedback</h3>
            <Link to="/">
              <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest">Return Home</Button>
            </Link>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const studentAns = attempt.answers[q.id] || [];
              const isCorrect = JSON.stringify(studentAns.sort()) === JSON.stringify(q.correctAnswerIds.sort());

              return (
                <Card key={q.id} className={`p-8 border-none ring-1 transition-all duration-500 ${isCorrect ? 'ring-green-100 dark:ring-green-900/30 hover:ring-green-300' : 'ring-red-100 dark:ring-red-900/30 shadow-sm hover:ring-red-300'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${isCorrect ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>{idx + 1}</span>
                        <Badge variant="indigo">{q.category}</Badge>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-tight transition-colors tracking-tight">{q.text}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map(opt => {
                      const isStudentPicked = studentAns.includes(opt.id);
                      const isTrulyCorrect = q.correctAnswerIds.includes(opt.id);
                      
                      let borderClass = 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 opacity-60';
                      if (isTrulyCorrect) borderClass = 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 ring-4 ring-green-100 dark:ring-green-900/10 opacity-100';
                      else if (isStudentPicked) borderClass = 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 ring-4 ring-red-100 dark:ring-red-900/10 opacity-100';

                      return (
                        <div key={opt.id} className={`p-4 rounded-xl text-sm font-bold flex justify-between items-center border-2 transition-all ${borderClass}`}>
                          <span>{opt.text}</span>
                          {isTrulyCorrect && <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-200">
                      <span className="font-black uppercase tracking-widest text-indigo-400 dark:text-indigo-500 block mb-1">Tutor Insight</span>
                      <p className="leading-relaxed font-medium">{q.explanation}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
