
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { quizService } from '../services/quizService';
import { generateAIQuestions } from '../services/gemini';
import { Quiz, QuizAttempt, QuestionType } from '../types';
import { Button, Card, Input, toast, Badge, Modal } from '../components/UI';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [activeAttempts, setActiveAttempts] = useState<(QuizAttempt & { quizTitle: string })[]>([]);
  const [completedAttempts, setCompletedAttempts] = useState<(QuizAttempt & { quizTitle: string })[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  // Practice Mode State
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceCount, setPracticeCount] = useState(10); // Minimum 10
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [actives, completeds] = await Promise.all([
          quizService.getStudentActiveAttempts(user.id),
          quizService.getStudentAttempts(user.id)
        ]);

        const activesWithTitles = await Promise.all(actives.map(async (a) => {
          const quiz = await quizService.getQuizById(a.quizId);
          return { ...a, quizTitle: quiz?.title || 'Unknown Quiz' };
        }));
        setActiveAttempts(activesWithTitles);

        const completedsWithTitles = await Promise.all(completeds.map(async (a) => {
          const quiz = await quizService.getQuizById(a.quizId);
          return { ...a, quizTitle: quiz?.title || 'Unknown Quiz' };
        }));
        
        setCompletedAttempts(
          completedsWithTitles.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        );
      }
    };
    fetchData();
  }, [user]);

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    const quiz = await quizService.getQuizByCode(joinCode.toUpperCase());
    
    if (quiz) {
      navigate(`/attempt/${quiz.id}`);
    } else {
      toast.error('Invalid quiz code. Please check and try again.');
      setIsJoining(false);
    }
  };

  const handleStartPractice = async () => {
    if (!practiceTopic || !user) return;
    setIsGeneratingPractice(true);
    try {
      const aiQuestions = await generateAIQuestions(practiceTopic, practiceCount);
      
      const quiz = quizService.createQuiz(
        user.id, 
        `Practice: ${practiceTopic}`, 
        `Self-generated mock test on ${practiceTopic}. AI generated content.`, 
        { timeLimitMinutes: practiceCount * 2, attemptLimit: 1, randomizeQuestions: true, isPublic: false },
        true
      );

      aiQuestions.forEach(aq => {
        quizService.saveQuestion({
          quizId: quiz.id,
          text: aq.text,
          type: aq.type,
          category: practiceTopic,
          options: aq.options.map((o, idx) => ({ id: String(idx), text: o.text })),
          correctAnswerIds: aq.correctAnswerIndices.map(String),
          points: aq.points,
          explanation: aq.explanation
        });
      });

      toast.success('Practice session ready!');
      navigate(`/attempt/${quiz.id}`);
    } catch (err) {
      toast.error('Failed to generate mock test. Please try again.');
    } finally {
      setIsGeneratingPractice(false);
      setIsPracticeModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-in fade-in duration-500 font-inter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none transition-colors">Student Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-base md:text-lg italic transition-colors">Ready for your next challenge, {user?.name}?</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setIsPracticeModalOpen(true)}
            className="rounded-xl border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-sm transition-all hover:-translate-y-0.5"
          >
            ✨ Start AI Practice
          </Button>
          <Badge variant="indigo" className="px-3 md:px-5 py-2 text-[10px] md:text-xs font-black uppercase hidden sm:block">
            {completedAttempts.length} Assessments Complete
          </Badge>
        </div>
      </div>

      {/* Join Section */}
      <div className="mb-12 md:mb-20">
        <Card className="overflow-hidden border-none shadow-[0_35px_60px_-15px_rgba(79,70,229,0.3)] relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-[2rem] md:rounded-[3.5rem] p-1">
          <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
             <div className="absolute -top-32 -left-32 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-indigo-500 rounded-full blur-[80px] md:blur-[150px]"></div>
             <div className="absolute -bottom-32 -right-32 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-violet-600 rounded-full blur-[80px] md:blur-[150px]"></div>
          </div>
          
          <Card className="relative z-10 bg-indigo-900/40 dark:bg-slate-900/40 backdrop-blur-2xl border-none p-6 md:p-16 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-16 rounded-[1.9rem] md:rounded-[3.4rem]">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-400/20 px-4 md:px-5 py-1.5 md:py-2 rounded-full mb-6 md:mb-8 ring-1 ring-white/10 mx-auto lg:mx-0">
                <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-400 animate-pulse"></span>
                <span className="text-[10px] md:text-xs font-black text-indigo-100 uppercase tracking-widest">Portal Active & Secure</span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white mb-4 md:mb-8 leading-[1.1] tracking-tighter">
                Enter your <br className="hidden md:block"/><span className="text-indigo-400 dark:text-indigo-300">Class Code</span>
              </h2>
              <p className="text-indigo-100/80 dark:text-slate-300/80 text-base md:text-xl font-medium mb-0 max-w-sm leading-relaxed mx-auto lg:mx-0">
                Connect to your instructor's assessment by entering the unique 6-character code below.
              </p>
            </div>

            <div className="w-full max-w-lg">
              <form onSubmit={handleJoinQuiz} className="bg-white dark:bg-slate-800 p-2 md:p-3 rounded-[1.8rem] md:rounded-[2.8rem] shadow-2xl flex flex-col gap-2 md:gap-3 ring-[6px] md:ring-[12px] ring-white/10 dark:ring-slate-700/20 transition-transform hover:scale-[1.01]">
                <div className="p-4 md:p-8 pb-2 md:pb-4">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center block mb-4 md:mb-6 transition-colors">6-Digit Access Token</label>
                  <input
                    type="text"
                    placeholder="XYZ123"
                    className="w-full text-center font-black text-4xl md:text-6xl lg:text-7xl tracking-[0.1em] md:tracking-[0.15em] uppercase h-20 md:h-32 bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-0 rounded-[1.2rem] md:rounded-[2rem] transition-all text-indigo-950 dark:text-white placeholder-slate-200 dark:placeholder-slate-800"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-16 md:h-24 text-xl md:text-3xl font-black bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-[0_15px_50px_rgba(251,191,36,0.5)] dark:bg-amber-500 dark:text-amber-950 transition-all active:scale-[0.97] rounded-[1.4rem] md:rounded-[2.2rem] border-none shadow-xl" 
                  isLoading={isJoining}
                >
                  <svg className="w-6 h-6 md:w-10 md:h-10 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                  Launch Quiz
                </Button>
              </form>
            </div>
          </Card>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8 md:space-y-12">
          {activeAttempts.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 mb-2 md:mb-4">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-yellow-500 animate-ping"></div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Sessions</h3>
              </div>
              {activeAttempts.map((attempt) => (
                <Card key={attempt.id} className="p-6 md:p-8 border-none ring-1 ring-yellow-200 dark:ring-yellow-900/30 bg-white dark:bg-slate-900 hover:shadow-2xl transition-all group rounded-[1.8rem] md:rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1.5 md:w-2 h-full bg-yellow-500"></div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white leading-none mb-2 md:mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{attempt.quizTitle}</h4>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant={attempt.isPractice ? 'indigo' : 'yellow'}>{attempt.isPractice ? 'PRACTICE' : 'OFFICIAL'}</Badge>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                          Started at {new Date(attempt.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate(`/attempt/${attempt.quizId}`)} 
                      className={`shrink-0 h-12 w-12 md:h-16 md:w-16 rounded-[1.2rem] md:rounded-[1.5rem] text-white shadow-xl flex items-center justify-center p-0 ${attempt.isPractice ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-indigo-950/40' : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-100 dark:shadow-yellow-950/40'}`}
                    >
                      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
             <div className="p-8 md:p-10 bg-indigo-50/50 dark:bg-slate-900/30 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-indigo-100 dark:border-slate-800 text-center transition-colors">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 text-indigo-300 dark:text-slate-600 shadow-sm">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h4 className="font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-[0.2em] text-[10px] md:text-[11px] mb-1 md:mb-2 transition-colors">Schedule Clear</h4>
                <p className="text-xs md:text-sm text-indigo-400 dark:text-slate-500 font-bold max-w-[150px] mx-auto italic transition-colors">No active sessions requiring attention.</p>
             </div>
          )}

          <Card className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-900 text-white rounded-[2rem] md:rounded-[3rem] border-none shadow-2xl relative overflow-hidden transition-all duration-500">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 000 2h1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM6.464 14.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414z" /></svg>
             </div>
             <h3 className="text-xl font-black mb-2 tracking-tight">AI Practice Lab</h3>
             <p className="text-xs font-medium text-indigo-100/80 dark:text-slate-300/80 mb-6 leading-relaxed transition-colors">Harness Gemini 3 to create infinite mock tests on any academic subject.</p>
             <Button 
              variant="secondary"
              onClick={() => setIsPracticeModalOpen(true)}
              className="w-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border-none rounded-xl font-black text-xs uppercase h-12 transition-colors shadow-lg"
             >
                Explore Lab
             </Button>
          </Card>

          <Link to="/profile">
            <Card className="p-8 mt-8 bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-slate-800 rounded-[2rem] md:rounded-[3rem] transition-all hover:ring-indigo-300 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white transition-colors">Career Prep</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resume Analysis</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Analyze your resume with AI to generate specific practice questions for your next big interview.</p>
            </Card>
          </Link>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="flex justify-between items-end mb-2 md:mb-4">
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">Gradebook</h3>
            <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Latest Feedback</span>
          </div>
          
          {completedAttempts.length === 0 ? (
            <Card className="p-16 md:p-24 text-center bg-white dark:bg-slate-900 border-dashed border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] md:rounded-[3.5rem] transition-colors">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-10 text-slate-200 dark:text-slate-700 transition-colors">
                <svg className="w-10 h-10 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <p className="font-black text-2xl md:text-3xl text-slate-400 dark:text-slate-400 tracking-tight mb-2 md:mb-3 transition-colors">No Data Synthesized</p>
              <p className="text-slate-400 dark:text-slate-500 font-bold italic text-base md:text-lg transition-colors">Submit your first assessment to begin tracking.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {completedAttempts.map((attempt) => {
                const scorePerc = Math.round((attempt.score / (attempt.maxScore || 1)) * 100);
                const isPass = scorePerc >= 60;
                return (
                  <Link key={attempt.id} to={`/results/${attempt.id}`}>
                    <Card className="p-6 md:p-10 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all cursor-pointer group bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-slate-800 h-full flex flex-col justify-between rounded-[2rem] md:rounded-[3rem]">
                      <div>
                        <div className="flex justify-between items-start mb-6 md:mb-8">
                          <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-[1.1] pr-4 tracking-tighter transition-colors">{attempt.quizTitle}</h4>
                          <div className={`shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center font-black text-xl md:text-2xl shadow-xl transition-transform group-hover:scale-110 ${isPass ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-red-500 text-white dark:bg-red-600'}`}>
                            {scorePerc}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-8 md:mb-10">
                          <Badge variant={attempt.isPractice ? 'indigo' : (isPass ? 'green' : 'red')}>
                            {attempt.isPractice ? 'PRACTICE' : (isPass ? 'MASTERY' : 'REVIEW')}
                          </Badge>
                          <span className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                            {new Date(attempt.completedAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between border-t border-slate-50 dark:border-slate-800 pt-6 md:pt-8 transition-colors">
                        <div className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                          <span className="block text-indigo-600 dark:text-indigo-400 text-xl md:text-2xl font-black mb-1 transition-colors">{attempt.score} / {attempt.maxScore}</span>
                          Raw Points
                        </div>
                        <div className="flex items-center gap-1 font-black text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                          Feed <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Practice Modal */}
      <Modal 
        isOpen={isPracticeModalOpen} 
        onClose={() => setIsPracticeModalOpen(false)} 
        title="AI Practice Designer"
        maxWidth="max-w-xl"
      >
        <div className="space-y-8 py-4">
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] transition-colors">Subject Focus</label>
             <input 
              type="text" 
              placeholder="e.g., Photosynthesis, Organic Chemistry, World War II"
              className="w-full h-14 md:h-16 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-indigo-600 dark:focus:border-indigo-500 font-bold text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500"
              value={practiceTopic}
              onChange={(e) => setPracticeTopic(e.target.value)}
             />
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] transition-colors">Question Count ({practiceCount})</label>
             <input 
              type="range" 
              min="10" 
              max="25" 
              step="1"
              className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
              value={practiceCount}
              // Corrected: changed 'setCount' to 'setPracticeCount'
              onChange={(e) => setPracticeCount(Number(e.target.value))}
             />
             <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase transition-colors">
                <span>Core (10)</span>
                <span>Extended (25)</span>
             </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] border-none ring-1 ring-indigo-100 dark:ring-indigo-800 transition-colors">
             <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-black text-xs italic">i</div>
                <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed transition-colors">
                   AI-generated practice tests are for self-improvement. They include detailed logic explanations and do not impact your class standing.
                </p>
             </div>
          </div>

          <Button 
            onClick={handleStartPractice}
            isLoading={isGeneratingPractice}
            className="w-full h-16 md:h-20 rounded-2xl bg-indigo-600 text-white font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-200 dark:shadow-indigo-950/50"
          >
             {isGeneratingPractice ? 'Synthesizing...' : 'Generate Mock Test'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
