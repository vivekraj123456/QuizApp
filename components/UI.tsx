
import React, { useState, useEffect } from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', isLoading?: boolean }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const baseStyles = "px-4 py-2.5 md:py-2 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-600",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-800"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">{label}</label>}
      <input 
        className={`px-4 py-3 md:py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 ${error ? 'border-red-500 dark:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-bold tracking-tight">{error}</span>}
    </div>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ${className}`} {...props}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'indigo' | 'green' | 'red' | 'gray' | 'yellow', className?: string }> = ({ children, variant = 'gray', className = '' }) => {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    gray: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
  };
  return (
    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/60 backdrop-blur-md transition-opacity">
      <div className={`bg-white dark:bg-slate-900 rounded-t-[2rem] md:rounded-[2rem] w-full ${maxWidth} shadow-2xl animate-in fade-in slide-in-from-bottom-10 md:zoom-in duration-300 flex flex-col max-h-[95vh] border-none dark:ring-1 dark:ring-slate-800`}>
        <div className="flex items-center justify-between p-6 md:p-8 border-b dark:border-slate-800 shrink-0">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all">
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Toaster: React.FC = () => {
  return (
    <div id="toaster-root" className="fixed bottom-4 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-[100] flex flex-col gap-3 pointer-events-none"></div>
  );
};

export const toast = {
  success: (msg: string) => {
    const root = document.getElementById('toaster-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = "px-5 py-3.5 bg-indigo-950 dark:bg-indigo-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-right-10 pointer-events-auto flex items-center gap-3 border border-indigo-700/50 backdrop-blur-md";
    el.innerHTML = `<svg class="w-5 h-5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> <span class="font-bold tracking-tight text-sm">${msg}</span>`;
    root.appendChild(el);
    setTimeout(() => {
      el.className += " animate-out fade-out slide-out-to-right-10 duration-500";
      setTimeout(() => el.remove(), 500);
    }, 4000);
  },
  error: (msg: string) => {
    const root = document.getElementById('toaster-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = "px-5 py-3.5 bg-red-600 text-white rounded-2xl shadow-2xl animate-in slide-in-from-right-10 pointer-events-auto flex items-center gap-3 backdrop-blur-md";
    el.innerHTML = `<svg class="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> <span class="font-bold tracking-tight text-sm">${msg}</span>`;
    root.appendChild(el);
    setTimeout(() => {
      el.className += " animate-out fade-out slide-out-to-right-10 duration-500";
      setTimeout(() => el.remove(), 500);
    }, 4000);
  }
};
