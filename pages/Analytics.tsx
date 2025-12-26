
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { Quiz, QuizAttempt, Question, User } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] shadow-2xl ring-1 ring-gray-100 dark:ring-slate-700 border-none transition-all">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">{label}</p>
        <div className="space-y-1">
          <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{data.accuracy}% Mastery</p>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{data.correctCount} Correct Samples</p>
        </div>
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  useEffect(() => {
    if (id) {
      const q = quizService.getQuizById(id);
      if (q) {
        setQuiz(q);
        setAttempts(quizService.getQuizAttempts(id));
        setQuestions(quizService.getQuestionsForQuiz(id));
      }

      try {
        const usersJson = localStorage.getItem('quiz_users_db') || '[]';
        const users: User[] = JSON.parse(usersJson);
        const map: Record<string, User> = {};
        users.forEach(u => { map[u.id] = u; });
        setUserMap(map);
      } catch (err) {
        console.error("User sync error", err);
      }
    }
  }, [id]);

  const totalAttemptsCount = attempts.length;
  const maxScore = useMemo(() => questions.reduce((acc, curr) => acc + curr.points, 0), [questions]);
  const avgScore = useMemo(() => totalAttemptsCount ? attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttemptsCount : 0, [attempts, totalAttemptsCount]);
  
  const categoryStats = useMemo(() => {
    if (!questions.length) return [];
    const categories = Array.from(new Set(questions.map(q => q.category)));
    
    return categories.map(cat => {
      const catQuestions = questions.filter(q => q.category === cat);
      const catPoints = catQuestions.reduce((acc, curr) => acc + curr.points, 0);
      
      let earnedPoints = 0;
      let correctCount = 0;
      
      attempts.forEach(attempt => {
        catQuestions.forEach(q => {
          const studentAns = attempt.answers[q.id] || [];
          const correctAns = q.correctAnswerIds || [];
          if (studentAns.length === correctAns.length && 
              [...studentAns].sort().every((val, index) => val === [...correctAns].sort()[index])) {
            earnedPoints += q.points;
            correctCount++;
          }
        });
      });

      const accuracy = (totalAttemptsCount > 0 && catPoints > 0) 
        ? Math.round((earnedPoints / (catPoints * totalAttemptsCount)) * 100) 
        : 0;

      return { 
        name: cat, 
        accuracy, 
        correctCount, 
        totalQuestions: catQuestions.length * totalAttemptsCount 
      };
    }).sort((a, b) => b.accuracy - a.accuracy);
  }, [questions, attempts, totalAttemptsCount]);

  const formatTimeTaken = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownloadPDF = () => {
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (!quiz) return <div className="p-32 text-center font-black text-gray-200 dark:text-slate-800 animate-pulse text-3xl uppercase tracking-tighter italic">Synthesizing Analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700 font-inter transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 no-print">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="indigo" className="px-4 py-1.5 font-black">Performance Analytics Record</Badge>
            <span className="text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest border-l pl-3 border-gray-200 dark:border-slate-800 transition-colors">Access: {quiz.joinCode}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none transition-colors">{quiz.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium flex items-center gap-2 text-lg transition-colors">
             Educational insight synthesis for {totalAttemptsCount} registered attempts.
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button onClick={handleDownloadPDF} className="flex-1 md:flex-none rounded-2xl font-black bg-indigo-600 text-white shadow-2xl shadow-indigo-100 dark:shadow-none px-10 h-16 text-xl hover:scale-[1.02] transition-all">
            <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            PDF Report
          </Button>
          <Link to="/" className="flex-1 md:flex-none">
            <Button variant="ghost" className="w-full rounded-2xl font-bold px-10 h-16 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors">Exit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Participated', val: totalAttemptsCount, sub: 'Valid Candidates', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Avg Mastery', val: `${maxScore ? Math.round((avgScore / maxScore) * 100) : 0}%`, sub: 'Class Proficiency', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Avg Duration', val: `${totalAttemptsCount ? Math.round(attempts.reduce((a,c)=>a+c.timeTakenSeconds, 0)/totalAttemptsCount/60) : 0}m`, sub: 'Per Submission', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Domains', val: categoryStats.length, sub: 'Subject Areas', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
        ].map((stat, i) => (
          <Card key={i} className="p-10 border-none ring-1 ring-gray-100 dark:ring-slate-800 transition-all hover:ring-indigo-300 shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon}/></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">{stat.label}</span>
             </div>
             <div className="text-5xl font-black text-slate-900 dark:text-white mb-1 tabular-nums tracking-tighter leading-none">{stat.val}</div>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic mt-2">{stat.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-10 border-none ring-1 ring-gray-100 dark:ring-slate-800 shadow-sm rounded-[3rem] bg-white dark:bg-slate-900">
         <div className="flex justify-between items-center mb-10">
           <div>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Performance Matrix</h3>
             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Accuracy by Knowledge Domain</p>
           </div>
           <Badge variant="indigo">Instructional Health</Badge>
         </div>
         
         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} 
                    unit="%" 
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} />
                  <Bar dataKey="accuracy" radius={[12, 12, 0, 0]} barSize={40}>
                     {categoryStats.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.accuracy >= 75 ? '#10b981' : entry.accuracy >= 50 ? '#6366f1' : '#f43f5e'} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </Card>

      <Card className="overflow-hidden border-none shadow-2xl dark:shadow-none rounded-[3.5rem] ring-1 ring-gray-100 dark:ring-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="px-12 py-10 border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 flex justify-between items-center transition-colors">
          <div>
             <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">Gradebook Synthesis</h3>
             <p className="text-gray-400 dark:text-slate-500 font-bold text-sm italic mt-1 uppercase tracking-widest transition-colors">Validated Submission Feed</p>
          </div>
          <Badge variant="indigo" className="h-10 px-6 text-sm">{attempts.length} ENTRIES</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.25em] bg-gray-50/80 dark:bg-slate-800/40 border-b dark:border-slate-800 transition-colors">
                <th className="px-12 py-6">Rank</th>
                <th className="px-12 py-6">Candidate Identity</th>
                <th className="px-12 py-6 text-center">Raw Score</th>
                <th className="px-12 py-6 text-center">Time Taken</th>
                <th className="px-12 py-6 text-center">Proficiency</th>
                <th className="px-12 py-6 text-right">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
              {attempts
                .sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds)
                .map((a, idx) => {
                  const perc = Math.round((a.score/(maxScore||1))*100);
                  const student = userMap[a.studentId];
                  return (
                    <tr key={a.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-300 group">
                      <td className="px-12 py-8">
                         <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-110 ${idx === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : idx === 1 ? 'bg-slate-200 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300' : idx === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
                           {idx + 1}
                         </div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="font-black text-gray-900 dark:text-white text-xl tracking-tight leading-none mb-2 transition-colors">{student?.name || 'Anonymous Candidate'}</div>
                        <div className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest transition-colors italic">{student?.email || 'email@notfound.edu'}</div>
                      </td>
                      <td className="px-12 py-8 text-center">
                         <div className="font-mono font-black text-gray-600 dark:text-slate-400 text-2xl transition-colors">{a.score}</div>
                         <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">out of {maxScore}</div>
                      </td>
                      <td className="px-12 py-8 text-center">
                         <div className="font-black text-slate-900 dark:text-slate-200 text-lg tabular-nums">{formatTimeTaken(a.timeTakenSeconds)}</div>
                      </td>
                      <td className="px-12 py-8">
                        <div className="flex items-center justify-center gap-6">
                          <div className="flex-1 min-w-[120px] h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5 transition-colors">
                            <div 
                              className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${perc >= 80 ? 'bg-green-500' : perc >= 60 ? 'bg-indigo-600' : 'bg-red-500'}`} 
                              style={{ width: `${perc}%` }}
                            ></div>
                          </div>
                          <span className="text-lg font-black w-12 text-right text-gray-900 dark:text-white transition-colors">{perc}%</span>
                        </div>
                      </td>
                      <td className="px-12 py-8 text-right">
                         <Badge variant={perc >= 60 ? 'green' : 'red'} className="rounded-xl h-10 px-5 text-[10px] font-black">{perc >= 60 ? 'MASTERY' : 'REVIEW'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-12 py-40 text-center text-gray-300 dark:text-slate-700 font-black text-4xl uppercase tracking-tighter italic opacity-50">Null Dataset.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
