
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserRole, Notification } from './types';
import { AuthProvider, useAuth } from './services/auth';
import { quizService } from './services/quizService';
import Login from './pages/Auth';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateQuiz from './pages/CreateQuiz';
import QuizAttemptPage from './pages/QuizAttempt';
import QuizResults from './pages/QuizResults';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import { Toaster, Badge } from './components/UI';

const NotificationCenter: React.FC<{ userId: string }> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifs = useCallback(() => {
    setNotifications(quizService.getNotifications(userId));
  }, [userId]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClearAll = () => {
    quizService.markAllNotificationsRead(userId);
    fetchNotifs();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">Feed</h4>
                <Badge variant="indigo">{notifications.length}</Badge>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                >
                  Read All
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-400 dark:text-slate-500 italic text-sm">No activity recorded</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors relative ${!n.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                    onClick={() => {
                      quizService.markNotificationRead(n.id);
                      fetchNotifs();
                    }}
                  >
                    {!n.isRead && (
                      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${n.type === 'alert' ? 'bg-red-500 animate-ping' : 'bg-indigo-600'}`}></div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                       {n.type === 'alert' && <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>}
                       <h5 className={`font-bold text-sm ${n.type === 'alert' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</h5>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 mt-2 block font-medium">{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const useNotificationEngine = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    // Simulate a background job checking for scheduled events
    const process = () => {
      quizService.processScheduledEvents(userId);
    };

    process(); // Run immediately
    const interval = setInterval(process, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);
};

const AppContent: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Activate Background Worker
  useNotificationEngine(user?.id);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {user && (
        <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                    <path d="M7.667 10.844l1.711.733a1 1 0 00.788 0l7-3v5a1 1 0 01-.553.894l-7 3.5a1 1 0 01-.894 0l-7-3.5a1 1 0 01-.553-.894v-5l4.833 2.072a1 1 0 00.356.126z" />
                  </svg>
                  QuizPro AI
                </Link>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
                  aria-label="Toggle Dark Mode"
                >
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                  )}
                </button>
                <NotificationCenter userId={user.id} />
                <Link to="/profile" className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">{user.name}</span>
                  <Badge variant="gray" className="ml-auto mt-0.5">{user.role}</Badge>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route 
            path="/" 
            element={
              user ? (
                user.role === UserRole.TEACHER ? <TeacherDashboard /> : <StudentDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="/create-quiz" element={user?.role === UserRole.TEACHER ? <CreateQuiz /> : <Navigate to="/" />} />
          <Route path="/quiz/:id/edit" element={user?.role === UserRole.TEACHER ? <CreateQuiz /> : <Navigate to="/" />} />
          <Route path="/quiz/:id/analytics" element={user?.role === UserRole.TEACHER ? <Analytics /> : <Navigate to="/" />} />
          <Route path="/attempt/:id" element={user?.role === UserRole.STUDENT ? <QuizAttemptPage /> : <Navigate to="/" />} />
          <Route path="/results/:attemptId" element={user ? <QuizResults /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
