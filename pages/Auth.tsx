
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import { UserRole } from '../types';
import { Button, toast } from '../components/UI';

const Login: React.FC = () => {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  
  // View States
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  
  // Validation States
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; name?: boolean }>({});

  // Real-time Validation Logic
  useEffect(() => {
    const newErrors: any = {};
    
    if (touched.email && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) newErrors.email = 'Enter a valid academic email address.';
    }

    if (touched.password && password && (view === 'register')) {
      if (password.length < 8) newErrors.password = 'Security key must be at least 8 characters.';
      else if (!/[A-Z]/.test(password)) newErrors.password = 'Include at least one uppercase letter.';
      else if (!/[0-9]/.test(password)) newErrors.password = 'Include at least one number.';
    }

    if (touched.name && name && view === 'register') {
      if (name.trim().split(' ').length < 1) newErrors.name = 'Full identity is required.';
    }

    setErrors(newErrors);
  }, [email, password, name, touched, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all as touched for immediate feedback
    setTouched({ email: true, password: true, name: true });

    if (Object.keys(errors).length > 0) {
      toast.error('Please refine the highlighted fields.');
      return;
    }

    if (!email || (view === 'register' && (!name || !password))) {
      toast.error('All required credentials must be provided.');
      return;
    }

    setIsLoading(true);
    try {
      if (view === 'forgot') {
        await resetPassword(email);
        toast.success('Recovery link transmitted. Check your inbox.');
        setView('login');
      } else {
        await login(email, role, name || email.split('@')[0], password);
        toast.success(view === 'register' ? 'Identity synthesized successfully!' : 'Authentication handshake complete.');
      }
    } catch (err) {
      toast.error('Authentication rejected. Please check your keys.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSocialLoading(true);
    try {
      await loginWithGoogle(role);
      toast.success('Secure OAuth 2.0 connection established.');
    } catch (err) {
      toast.error('Social authentication failed.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white dark:bg-slate-950 font-inter transition-colors duration-500 overflow-hidden">
      {/* Hero Section - Animated & Thematic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-600 dark:bg-indigo-900 items-center justify-center p-20 select-none">
        <div className="absolute inset-0">
          {/* Animated Background Grids */}
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 animate-pulse"></div>
        </div>
        
        <div className="relative z-10 text-white space-y-10 max-w-xl">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl ring-8 ring-white/5 animate-bounce-subtle">
            <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              <path d="M7.667 10.844l1.711.733a1 1 0 00.788 0l7-3v5a1 1 0 01-.553.894l-7 3.5a1 1 0 01-.894 0l-7-3.5a1 1 0 01-.553-.894v-5l4.833 2.072a1 1 0 00.356.126z" />
            </svg>
          </div>
          <div>
            <h1 className="text-7xl font-black tracking-tighter leading-none mb-6">
              Empowering <br /> The Future of <br /> <span className="text-indigo-200">Knowledge.</span>
            </h1>
            <p className="text-2xl font-medium text-indigo-50 leading-relaxed italic opacity-80 max-w-md">
              "The beautiful thing about learning is that no one can take it away from you."
            </p>
          </div>
          
          <div className="flex gap-4 pt-4">
             <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-black uppercase tracking-widest">10k+ Learners</div>
             <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-black uppercase tracking-widest">AI Insights</div>
          </div>
        </div>
      </div>

      {/* Authentication Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 relative overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-right-20 duration-1000">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">
              {view === 'forgot' ? 'Reset Key' : view === 'register' ? 'New Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
              {view === 'forgot' ? 'Transmitting recovery sequence.' : view === 'register' ? 'Synthesize your academic identity.' : 'Enter your credentials to continue.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {view !== 'forgot' && (
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] ml-1">Select Access Protocol</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: UserRole.STUDENT, icon: 'M12 14l9-5-9-5-9 5 9 5z', label: 'Student', desc: 'Join Quizzes' },
                    { id: UserRole.TEACHER, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16', label: 'Teacher', desc: 'Create & Manage' }
                  ].map((r) => (
                    <div 
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`group cursor-pointer p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-3 ${role === r.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 ring-4 ring-indigo-500/10' : 'border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900 hover:border-indigo-200 hover:bg-slate-50'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${role === r.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={r.icon}/></svg>
                      </div>
                      <div>
                         <span className={`block text-xs font-black uppercase tracking-widest ${role === r.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{r.label}</span>
                         <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">{r.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {view === 'register' && (
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Full Legal Name"
                      className={`w-full pl-14 pr-5 py-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 outline-none font-black text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-700 ${errors.name ? 'border-red-500' : 'border-slate-50 dark:border-transparent focus:border-indigo-600'}`}
                      value={name}
                      onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-5">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Academic Email"
                    className={`w-full pl-14 pr-5 py-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 outline-none font-black text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-700 ${errors.email ? 'border-red-500' : 'border-slate-50 dark:border-transparent focus:border-indigo-600'}`}
                    value={email}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-5">{errors.email}</p>}
              </div>

              {view !== 'forgot' && (
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Security Access Key"
                      className={`w-full pl-14 pr-14 py-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 outline-none font-black text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-700 ${errors.password ? 'border-red-500' : 'border-slate-50 dark:border-transparent focus:border-indigo-600'}`}
                      value={password}
                      onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.888 9.888L3 3m18 18l-6.888-6.888m4.346-4.346a10.05 10.05 0 011.542 4.234c-1.275 4.057-5.065 7-9.542 7a9.97 9.97 0 01-1.563-.125M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-5">{errors.password}</p>}
                </div>
              )}

              {view === 'login' && (
                <div className="flex justify-end pr-2">
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline hover:text-indigo-700"
                  >
                    Recover Password
                  </button>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-20 rounded-[2rem] text-xl font-black bg-indigo-600 text-white shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98]" isLoading={isLoading}>
              {view === 'forgot' ? 'Send Reset Link' : view === 'register' ? 'Synthesize Account' : 'Secure Login'}
            </Button>
          </form>

          {view !== 'forgot' && (
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-900"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-950 px-4">Social Access</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleGoogleAuth}
                  disabled={isSocialLoading}
                  className="flex items-center justify-center h-16 rounded-3xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all gap-4 group"
                >
                  <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-300 tracking-widest">Google</span>
                </button>
                <button 
                  disabled={isSocialLoading}
                  className="flex items-center justify-center h-16 rounded-3xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all gap-4 group"
                >
                  <svg className="w-6 h-6 dark:text-white transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-300 tracking-widest">GitHub</span>
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="text-base font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {view === 'forgot' ? (
                <span onClick={() => setView('login')} className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest underline underline-offset-8">Return to Secure Entry</span>
              ) : view === 'register' ? (
                <>Already have an identity? <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest underline underline-offset-8">Login</span></>
              ) : (
                <>New researcher? <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest underline underline-offset-8">Create Account</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
