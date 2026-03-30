import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizAPI, courseAPI } from '../services/api';
import { Card, PageHeader, Badge, Button, EmptyState, Modal, FormField, Input, Textarea, Select, Spinner } from '../components/common/UI';
import { QuestionMarkCircleIcon, PlusIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [qr, cr] = await Promise.all([quizAPI.getAll(), courseAPI.getAll()]);
      setQuizzes(qr.data.data.quizzes);
      setCourses(cr.data.data.courses);
    } catch { toast.error('Failed to load quizzes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quizzes"
        subtitle={`${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} available`}
        action={user?.role !== 'student' && (
          <Button leftIcon={PlusIcon} onClick={() => setShowCreate(true)}>Create Quiz</Button>
        )}
      />

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : quizzes.length === 0 ? (
          <EmptyState icon={QuestionMarkCircleIcon} title="No quizzes yet" description="Quizzes will appear here once your teacher creates them" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quizzes.map((q) => <QuizCard key={q._id} quiz={q} userRole={user?.role} />)}
          </div>
        )}

      {showCreate && <CreateQuizModal courses={courses} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function QuizCard({ quiz, userRole }) {
  const overdue = isPast(new Date(quiz.dueDate));
  const attempted = !!quiz.myAttempt;

  return (
    <Link to={`/quizzes/${quiz._id}`}>
      <Card hover className="h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <QuestionMarkCircleIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {attempted && <Badge color="green">Completed</Badge>}
            {!attempted && overdue && <Badge color="red">Expired</Badge>}
            {!attempted && !overdue && <Badge color="blue">Available</Badge>}
          </div>
        </div>
        <h3 className="font-display font-semibold text-surface-900 text-sm mb-1 line-clamp-2">{quiz.title}</h3>
        <p className="text-xs text-surface-500 mb-3">{quiz.courseId?.name}</p>
        {quiz.description && <p className="text-xs text-surface-500 line-clamp-2 mb-4 flex-1">{quiz.description}</p>}
        <div className="border-t border-surface-100 pt-3 mt-auto">
          <div className="flex items-center gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{quiz.timeLimit} min</span>
            <span>{quiz.questionCount || quiz.questions?.length || 0} questions</span>
          </div>
          {quiz.myAttempt && (
            <div className="mt-2 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-surface-700">
                {quiz.myAttempt.score}/{quiz.myAttempt.totalMarks} • {quiz.myAttempt.grade} • {quiz.myAttempt.percentage}%
              </span>
            </div>
          )}
          <p className="text-xs text-surface-400 mt-1">Due {format(new Date(quiz.dueDate), 'MMM d, yyyy')}</p>
        </div>
      </Card>
    </Link>
  );
}

function CreateQuizModal({ courses, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', courseId: '', timeLimit: 30, dueDate: '' });
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => setQuestions((p) => [...p, { questionText: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]);
  const removeQuestion = (i) => setQuestions((p) => p.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, val) => setQuestions((p) => p.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  const updateOption = (qi, oi, val) => setQuestions((p) => p.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? val : o) } : q));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.courseId || !form.dueDate) { toast.error('Fill all required fields'); return; }
    if (questions.some((q) => !q.questionText.trim() || q.options.some((o) => !o.trim()))) {
      toast.error('Fill all question text and options'); return;
    }
    setLoading(true);
    try {
      await quizAPI.create({ ...form, questions });
      toast.success('Quiz created!');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create quiz'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen title="Create Quiz" onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title" required>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Quiz title" />
          </FormField>
          <FormField label="Course" required>
            <Select value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Time Limit (minutes)" required>
            <Input type="number" min="1" max="300" value={form.timeLimit} onChange={(e) => setForm((p) => ({ ...p, timeLimit: parseInt(e.target.value) }))} />
          </FormField>
          <FormField label="Due Date" required>
            <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} min={new Date().toISOString().slice(0, 16)} />
          </FormField>
        </div>

        <div className="border-t border-surface-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-surface-900">Questions ({questions.length})</h3>
            <Button type="button" variant="secondary" size="sm" leftIcon={PlusIcon} onClick={addQuestion}>Add Question</Button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {questions.map((q, qi) => (
              <div key={qi} className="border border-surface-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-surface-700">Q{qi + 1}</span>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
                <Input value={q.questionText} onChange={(e) => updateQuestion(qi, 'questionText', e.target.value)}
                  placeholder="Question text..." className="mb-3" />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)} className="text-primary-600" />
                      <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`} className="text-xs" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500">Marks:</span>
                  <Input type="number" min="1" value={q.marks} onChange={(e) => updateQuestion(qi, 'marks', parseInt(e.target.value))} className="w-20 text-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Quiz</Button>
        </div>
      </form>
    </Modal>
  );
}
