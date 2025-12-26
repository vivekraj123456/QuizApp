
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import { Card, Button, toast, Badge } from '../components/UI';
import { generateQuestionsFromResume } from '../services/gemini';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js to use an external CDN for efficiency
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

const Profile: React.FC = () => {
  const { user } = useAuth();
  
  // Resume States
  const [resumeText, setResumeText] = useState(() => localStorage.getItem(`resume_${user?.id}`) || '');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsingPDF, setIsParsingPDF] = useState(false);

  const handleResumeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setResumeText(text);
    if (user) localStorage.setItem(`resume_${user.id}`, text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF document.');
      return;
    }

    setIsParsingPDF(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      const cleanText = fullText.trim();
      if (!cleanText) {
        throw new Error('Could not extract readable text from PDF.');
      }

      setResumeText(cleanText);
      if (user) localStorage.setItem(`resume_${user.id}`, cleanText);
      toast.success('Resume PDF ingested and parsed.');
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      toast.error(err.message || 'Failed to parse PDF contents.');
    } finally {
      setIsParsingPDF(false);
      // Clear input so same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleGenerateQuestions = async () => {
    if (!resumeText.trim()) {
      toast.error('Please provide resume content first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const questions = await generateQuestionsFromResume(resumeText);
      setAiQuestions(questions);
      toast.success('AI Analysis Complete');
    } catch (err) {
      toast.error('AI assistant failed to analyze resume.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700 font-inter">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <Badge variant="indigo" className="mb-4">Career Advancement</Badge>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none transition-colors">Career Prep</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium text-lg transition-colors">Optimize your professional narrative with AI-powered resume analysis.</p>
        </div>
      </div>

      <div className="space-y-10">
        <Card className="p-8 md:p-10 border-none ring-1 ring-slate-100 dark:ring-slate-800 bg-white dark:bg-slate-900 transition-colors shadow-sm rounded-[3rem]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Resume Integration</h3>
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isParsingPDF} />
              <Badge variant="indigo" className={`h-10 px-6 cursor-pointer hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 ${isParsingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isParsingPDF ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Parsing...
                  </>
                ) : (
                  'Upload .PDF'
                )}
              </Badge>
            </label>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resume content (Parsed from PDF or Paste)</label>
              <textarea 
                className="w-full h-64 p-6 rounded-3xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 outline-none focus:border-indigo-500 font-medium text-sm text-slate-700 dark:text-slate-300 transition-all no-scrollbar"
                placeholder="Paste your professional experience, education, and skills here, or upload your PDF resume above..."
                value={resumeText}
                onChange={handleResumeChange}
              />
            </div>

            <Button 
              onClick={handleGenerateQuestions}
              isLoading={isAnalyzing}
              className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98]"
            >
              {isAnalyzing ? 'Analyzing Experience...' : '✨ Generate AI Practice Questions'}
            </Button>
          </div>
        </Card>

        {aiQuestions.length > 0 && (
          <Card className="p-8 md:p-10 border-none ring-1 ring-indigo-200 dark:ring-indigo-900 bg-white dark:bg-slate-900 transition-colors shadow-2xl rounded-[3rem] animate-in slide-in-from-bottom-10 duration-700">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">✨</div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Interview Coach</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Questions tailored to your resume</p>
                </div>
             </div>

             <div className="space-y-4">
                {aiQuestions.map((q, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg group">
                     <div className="flex gap-4">
                        <span className="text-xs font-black text-indigo-400 dark:text-indigo-600 italic">Q{i+1}</span>
                        <p className="text-slate-700 dark:text-slate-200 font-bold leading-relaxed">{q}</p>
                     </div>
                  </div>
                ))}
             </div>

             <div className="mt-10 pt-8 border-t dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic">Practice answering these aloud to master your professional narrative.</p>
             </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
