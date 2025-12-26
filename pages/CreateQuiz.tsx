
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { quizService } from '../services/quizService';
import { generateAIQuestions } from '../services/gemini';
import { Quiz, Question, QuestionType, Option, QuizSettings } from '../types';
import { Button, Card, Input, Modal, toast, Badge } from '../components/UI';

const CreateQuiz: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [addToBankByDefault, setAddToBankByDefault] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10); // Minimum 10 questions

  useEffect(() => {
    if (id) {
      const quiz = quizService.getQuizById(id);
      if (quiz) {
        setTitle(quiz.title);
        setDescription(quiz.description);
        setTimeLimit(quiz.settings.timeLimitMinutes);
        setAttemptLimit(quiz.settings.attemptLimit || 1);
        setScheduledAt(quiz.settings.scheduledAt || '');
        setExpiresAt(quiz.settings.expiresAt || '');
        setQuestions(quizService.getQuestionsForQuiz(id));
      }
    }
  }, [id]);

  const handleSaveQuiz = () => {
    if (!title || !description) {
      toast.error('Basic quiz info is required');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const settings: QuizSettings = {
      timeLimitMinutes: timeLimit,
      attemptLimit: attemptLimit,
      randomizeQuestions: true,
      isPublic: true,
      scheduledAt: scheduledAt || undefined,
      expiresAt: expiresAt || undefined
    };

    let quizId = id;
    if (id) {
      quizService.updateQuiz(id, { title, description, settings, questionIds: questions.map(q => q.id) });
    } else {
      const newQuiz = quizService.createQuiz(user!.id, title, description, settings);
      quizId = newQuiz.id;
    }

    questions.forEach((q) => {
      quizService.saveQuestion({ ...q, quizId: quizId! });
      if (addToBankByDefault) {
        quizService.addToQuestionBank({ ...q });
      }
    });

    toast.success('Course material updated successfully!');
    navigate('/');
  };

  const onDragStart = (idx: number) => setDraggedIdx(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const newQuestions = [...questions];
    const item = newQuestions.splice(draggedIdx, 1)[0];
    newQuestions.splice(idx, 0, item);
    setQuestions(newQuestions);
    setDraggedIdx(idx);
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: undefined, text: '', type: QuestionType.MCQ, category: 'General',
      options: [{ id: '1', text: '' }, { id: '2', text: '' }],
      correctAnswerIds: [], points: 1
    });
    setIsModalOpen(true);
  };

  const saveEditedQuestion = () => {
    if (!editingQuestion?.text || editingQuestion.correctAnswerIds?.length === 0) {
      toast.error('Question text and correct answers are required');
      return;
    }
    const q = editingQuestion as Question;
    if (editingQuestion.id) setQuestions(prev => prev.map(item => item.id === editingQuestion.id ? q : item));
    else setQuestions(prev => [...prev, { ...q, id: Math.random().toString(36).substr(2, 9) }]);
    setIsModalOpen(false);
  };

  const handleGenerateAI = async () => {
    if (!aiTopic) return;
    if (aiCount < 10) {
      toast.error('AI requires a minimum generation of 10 items.');
      return;
    }
    setIsGenerating(true);
    try {
      const aiQuestions = await generateAIQuestions(aiTopic, aiCount);
      const formatted = aiQuestions.map(aq => ({
        id: Math.random().toString(36).substr(2, 9),
        quizId: id || '',
        text: aq.text,
        type: aq.type,
        category: aiTopic,
        options: aq.options.map((o, idx) => ({ id: String(idx), text: o.text })),
        correctAnswerIds: aq.correctAnswerIndices.map(String),
        points: aq.points,
        explanation: aq.explanation
      } as Question));
      setQuestions(prev => [...prev, ...formatted]);
      setIsAIModalOpen(false);
      toast.success(`Generated ${formatted.length} unique questions!`);
    } catch (err) {
      toast.error('AI assistant is temporarily unavailable.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-500 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 md:mb-10 no-print">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {id ? 'Edit Assessment' : 'New Assessment'}
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium mt-1">
            Design professional learning experiences.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/')} 
            className="w-full sm:w-40 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 h-14 md:h-12 font-bold"
          >
            Discard
          </Button>
          <Button 
            onClick={handleSaveQuiz} 
            className="w-full sm:w-48 rounded-xl shadow-lg h-14 md:h-12 font-black"
          >
            Save & Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Main Form Area */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <Card className="p-6 md:p-8 space-y-6 border-none ring-1 ring-gray-100 dark:ring-slate-800 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold border-b dark:border-slate-800 pb-4 flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-tight">
              Basic Information
            </h3>
            <Input 
              label="Quiz Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., Q2 Biochemistry Fundamentals" 
              className="h-12 font-bold text-base md:text-lg" 
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Instructional Text</label>
              <textarea 
                className="px-4 py-3 border rounded-xl border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] text-gray-900 dark:text-gray-100 font-medium transition-all bg-white dark:bg-slate-800"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the quiz goals, rules, and expectations..."
              />
            </div>
          </Card>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Question Set ({questions.length})
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  onClick={() => setIsAIModalOpen(true)} 
                  className="flex-1 sm:flex-none text-xs h-10 font-bold bg-indigo-50 dark:bg-indigo-900/20 border-none text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                >
                  ✨ AI Assist
                </Button>
                <Button 
                  onClick={handleAddQuestion} 
                  className="flex-1 sm:flex-none text-xs h-10 font-bold px-6"
                >
                  Add Item
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-900/30">
                  <p className="text-gray-400 dark:text-gray-500 font-medium italic">No questions added yet. Use AI Assist or manual entry.</p>
                </div>
              )}
              {questions.map((q, idx) => (
                <Card 
                  key={q.id} 
                  draggable 
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={() => setDraggedIdx(null)}
                  className={`p-5 md:p-6 group border-none ring-2 ring-transparent hover:ring-indigo-400 transition-all cursor-move bg-indigo-950 dark:bg-slate-900 shadow-xl rounded-2xl ${draggedIdx === idx ? 'opacity-50 ring-indigo-500 scale-95' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-900/50">
                          {idx + 1}
                        </span>
                        <Badge variant="indigo" className="text-[10px] bg-indigo-800 text-indigo-100 ring-1 ring-white/10 border-none">
                          {q.category}
                        </Badge>
                      </div>
                      <p className="font-bold text-white text-base md:text-lg leading-snug pl-1">
                        {q.text}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all ml-4">
                      <button 
                        onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }} 
                        className="p-2.5 bg-white/10 text-white hover:bg-indigo-600 rounded-xl transition-all border-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8 no-print">
          <Card className="p-6 md:p-8 space-y-6 border-none ring-1 ring-gray-100 dark:ring-slate-800 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold border-b dark:border-slate-800 pb-4 text-gray-900 dark:text-white uppercase tracking-tight">
              Configuration
            </h3>
            <Input 
              label="Duration (Minutes)" 
              type="number" 
              value={timeLimit} 
              onChange={e => setTimeLimit(Number(e.target.value))} 
              className="h-12 font-bold" 
            />
            <Input 
              label="Attempt Limit" 
              type="number" 
              min={1} 
              value={attemptLimit} 
              onChange={e => setAttemptLimit(Number(e.target.value))} 
              className="h-12 font-bold" 
            />
            <Input 
              label="Expiration Date" 
              type="datetime-local" 
              value={expiresAt} 
              onChange={e => setExpiresAt(e.target.value)} 
              className="h-12 font-bold" 
            />
          </Card>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingQuestion?.id ? 'Refine Item' : 'New Question Item'} 
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <Input 
            label="Prompt / Question Text" 
            value={editingQuestion?.text} 
            onChange={e => setEditingQuestion(prev => ({ ...prev!, text: e.target.value }))} 
            className="h-12 font-medium" 
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest block mb-2 transition-colors">Category</label>
              <input 
                className="w-full border rounded-xl h-12 px-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" 
                value={editingQuestion?.category} 
                onChange={e => setEditingQuestion(prev => ({ ...prev!, category: e.target.value }))} 
                placeholder="e.g. Physics" 
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest block mb-2 transition-colors">Points</label>
              <input 
                type="number" 
                className="w-full border rounded-xl h-12 px-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" 
                value={editingQuestion?.points} 
                onChange={e => setEditingQuestion(prev => ({ ...prev!, points: Number(e.target.value) }))} 
              />
            </div>
          </div>
          <Button 
            className="w-full mt-6 py-4 rounded-xl text-lg font-black shadow-lg" 
            onClick={saveEditedQuestion}
          >
            Confirm Item
          </Button>
        </div>
      </Modal>

      {/* AI Assistant Modal */}
      <Modal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        title="AI Assessment Designer"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Gemini 3 Flash will generate a set of unique questions tailored to your chosen topic. <strong>Minimum count is 10.</strong>
          </p>
          <Input 
            label="Subject / Core Concept" 
            placeholder="e.g., Biochemistry" 
            value={aiTopic} 
            onChange={e => setAiTopic(e.target.value)} 
            className="h-12 font-bold" 
          />
          <div className="flex flex-col gap-2">
             <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest transition-colors">Question Quantity ({aiCount})</label>
             <input 
              type="range" 
              min="10" 
              max="25" 
              step="1"
              className="w-full accent-indigo-600 cursor-pointer"
              value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))}
             />
             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Core (10)</span>
                <span>Deep (25)</span>
             </div>
          </div>
          <Button 
            className="w-full h-14 rounded-xl text-lg font-black shadow-lg" 
            onClick={handleGenerateAI} 
            isLoading={isGenerating}
          >
            Design {aiCount} Questions
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CreateQuiz;
