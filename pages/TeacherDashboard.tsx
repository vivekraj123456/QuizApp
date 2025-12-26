
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { quizService } from '../services/quizService';
import { Quiz, Question } from '../types';
import { Button, Card, toast, Badge, Modal } from '../components/UI';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showBank, setShowBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [qList, bList] = await Promise.all([
          quizService.getTeacherQuizzes(user.id),
          quizService.getTeacherQuestionBank()
        ]);
        setQuizzes(qList);
        setBankQuestions(bList);
      }
    };
    fetchData();
  }, [user]);

  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date();
    if (quiz.settings.scheduledAt && new Date(quiz.settings.scheduledAt) > now) {
      return { label: 'Scheduled', variant: 'yellow' as const };
    }
    if (quiz.settings.expiresAt && new Date(quiz.settings.expiresAt) < now) {
      return { label: 'Expired', variant: 'red' as const };
    }
    return { label: 'Live', variant: 'green' as const };
  };

  const handleEditClick = (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsEditModalOpen(true);
  };

  const confirmEdit = () => {
    if (selectedQuizId) {
      navigate(`/quiz/${selectedQuizId}/edit`);
    }
  };

  const shareInvitation = (quiz: Quiz) => {
    const message = `
Hi Students! 🎓

You're invited to take the quiz: "${quiz.title}"

📌 Quiz Code: ${quiz.joinCode}
⏱️ Duration: ${quiz.settings.timeLimitMinutes} minutes
📅 Access starts: ${quiz.settings.scheduledAt ? new Date(quiz.settings.scheduledAt).toLocaleString() : 'Now'}

Open QuizPro AI and enter the join code to begin!
    `.trim();
    
    navigator.clipboard.writeText(message);
    toast.success('Invitation template copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-500 font-inter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white transition-colors tracking-tight">Teacher Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base transition-colors font-medium">Welcome back, {user?.name}. Manage your curriculum.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setShowBank(true)} className="flex-1 sm:flex-none h-12">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Question Bank
          </Button>
          <Link to="/create-quiz" className="flex-1 sm:flex-none">
            <Button className="w-full h-12 shadow-lg shadow-indigo-100 dark:shadow-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Quiz
            </Button>
          </Link>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <Card className="p-10 md:p-24 text-center border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-800 rounded-2xl md:rounded-[3rem] transition-colors duration-500">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-10 text-indigo-400 dark:text-indigo-600 transition-colors">
            <svg className="w-10 h-10 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white transition-colors tracking-tight">No quizzes created yet</h3>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mt-3 mb-10 max-w-sm mx-auto font-medium leading-relaxed transition-colors italic">Design educational challenges and track your students' progress in real-time.</p>
          <Link to="/create-quiz">
            <Button className="px-12 h-16 text-lg shadow-2xl shadow-indigo-100 dark:shadow-none rounded-2xl">Create your first quiz</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            return (
              <Card key={quiz.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-6">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 tracking-tight">{quiz.title}</h3>
                  <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 h-12 transition-colors font-medium italic opacity-80">{quiz.description}</p>
                  
                  <div className="bg-indigo-50 dark:bg-slate-800/50 p-6 rounded-[1.8rem] flex items-center justify-between mb-8 group-hover:bg-indigo-100 dark:group-hover:bg-slate-800 transition-all border border-transparent dark:border-slate-700/50">
                    <div>
                      <span className="text-[10px] text-indigo-400 dark:text-indigo-300 font-black uppercase tracking-[0.2em] block mb-2 transition-colors">Invite Code</span>
                      <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter transition-colors">{quiz.joinCode}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(quiz.joinCode);
                          toast.success('Code copied!');
                        }}
                        className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm transition-all text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-100 dark:border-slate-600 active:scale-90"
                        title="Copy Code"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                      </button>
                      <button 
                        onClick={() => shareInvitation(quiz)}
                        className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm transition-all text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-100 dark:border-slate-600 active:scale-90"
                        title="Share Invite"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link to={`/quiz/${quiz.id}/analytics`} className="flex-1">
                      <Button className="w-full h-12 text-sm font-black uppercase tracking-widest transition-all">
                        Analytics
                      </Button>
                    </Link>
                    <Button variant="secondary" className="px-4 h-12 border-slate-200 dark:border-slate-700" onClick={() => handleEditClick(quiz.id)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Confirm Edit">
        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
            Are you sure you want to modify this assessment? Disrupting a live quiz may invalidate active student data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" className="flex-1 h-14 rounded-2xl" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1 h-14 rounded-2xl shadow-lg shadow-red-100 dark:shadow-none" onClick={confirmEdit}>Yes, Edit Quiz</Button>
          </div>
        </div>
      </Modal>

      {/* Question Bank Modal */}
      <Modal isOpen={showBank} onClose={() => setShowBank(false)} title="Master Question Bank" maxWidth="max-w-4xl">
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 italic transition-colors">Curated academic asset collection.</p>
            <Badge variant="indigo" className="h-8 px-6">{bankQuestions.length} Items</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bankQuestions.map((q, idx) => (
              <Card key={q.id} className="p-6 bg-slate-50 dark:bg-slate-800/40 border-none ring-1 ring-slate-100 dark:ring-slate-700 rounded-2xl group transition-all hover:ring-indigo-300 dark:hover:ring-indigo-500">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="gray" className="text-[9px] bg-white dark:bg-slate-700">{q.category}</Badge>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase transition-colors">ITEM #{idx+1}</span>
                </div>
                <p className="text-base font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug transition-colors tracking-tight">{q.text}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-indigo-500 dark:text-indigo-400 tracking-[0.15em] transition-colors">{q.type} • {q.points} pts</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 002-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
          {bankQuestions.length === 0 && (
            <div className="text-center py-20 text-slate-300 dark:text-slate-700 italic font-black text-2xl uppercase tracking-tighter transition-colors">
              Bank is empty.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
