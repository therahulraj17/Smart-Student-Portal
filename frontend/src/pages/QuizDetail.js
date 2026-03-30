// ── QuizDetail ────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizAPI } from '../services/api';
import { Card, Badge, Button, Spinner } from '../components/common/UI';
import { ArrowLeftIcon, ClockIcon, QuestionMarkCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';

export default function QuizDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizAPI.getById(id)
      .then((r) => setData(r.data.data))
      .catch(() => { toast.error('Failed to load quiz'); navigate('/quizzes'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { quiz, alreadyAttempted, myAttempt } = data;
  const overdue = isPast(new Date(quiz.dueDate));
  const totalMarks = quiz.questions?.reduce((s, q) => s + q.marks, 0) || 0;

  const handleStartQuiz = async () => {
    try {
      await quizAPI.startAttempt(id);
      navigate(`/quizzes/${id}/attempt`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    }
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Quizzes
      </button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <QuestionMarkCircleIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex gap-2">
            {alreadyAttempted ? <Badge color="green">Completed</Badge> : overdue ? <Badge color="red">Expired</Badge> : <Badge color="blue">Available</Badge>}
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-surface-900 mb-1">{quiz.title}</h1>
        <p className="text-sm text-surface-500 mb-4">{quiz.courseId?.name}</p>
        {quiz.description && <p className="text-surface-700 text-sm mb-4">{quiz.description}</p>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-50 rounded-xl p-3 text-center">
            <p className="text-xs text-surface-400 mb-1">Questions</p>
            <p className="text-xl font-bold text-surface-900">{quiz.questions?.length || 0}</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-3 text-center">
            <p className="text-xs text-surface-400 mb-1">Time Limit</p>
            <p className="text-xl font-bold text-surface-900">{quiz.timeLimit}m</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-3 text-center">
            <p className="text-xs text-surface-400 mb-1">Total Marks</p>
            <p className="text-xl font-bold text-surface-900">{totalMarks}</p>
          </div>
        </div>

        <p className="text-xs text-surface-400 mb-5">Due: {format(new Date(quiz.dueDate), 'MMMM d, yyyy h:mm a')}</p>

        {user?.role === 'student' && (
          alreadyAttempted ? (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-800">Quiz Completed!</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-2xl font-bold text-green-700">{myAttempt?.score}</p><p className="text-xs text-green-600">Score</p></div>
                <div><p className="text-2xl font-bold text-green-700">{myAttempt?.grade}</p><p className="text-xs text-green-600">Grade</p></div>
                <div><p className="text-2xl font-bold text-green-700">{myAttempt?.percentage}%</p><p className="text-xs text-green-600">Percent</p></div>
              </div>
            </div>
          ) : overdue ? (
            <p className="text-sm text-red-600">This quiz has expired.</p>
          ) : (
            <Button onClick={handleStartQuiz} size="lg" className="w-full">
              Start Quiz — {quiz.timeLimit} minutes
            </Button>
          )
        )}
      </Card>

      {/* Teacher: show questions with answers */}
      {user?.role !== 'student' && quiz.questions && (
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-surface-900">Questions</h2>
          {quiz.questions.map((q, i) => (
            <Card key={i}>
              <p className="text-sm font-semibold text-surface-900 mb-3">Q{i + 1}. {q.questionText} <span className="text-xs font-normal text-surface-400">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span></p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`px-3 py-2 rounded-lg text-sm ${oi === q.correctAnswer ? 'bg-green-100 text-green-800 font-medium' : 'bg-surface-50 text-surface-600'}`}>
                    {String.fromCharCode(65 + oi)}. {opt}
                    {oi === q.correctAnswer && ' ✓'}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
