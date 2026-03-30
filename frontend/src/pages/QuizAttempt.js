import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { Button, Card, Spinner } from '../components/common/UI';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const startQuiz = useCallback(async () => {
    try {
      const [quizRes, attemptRes] = await Promise.all([
        quizAPI.getById(id),
        quizAPI.startAttempt(id),
      ]);
      const qData = quizRes.data.data.quiz;
      setQuiz(qData);
      setAttemptId(attemptRes.data.data.attemptId);
      setTimeLeft(qData.timeLimit * 60); // seconds
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
      navigate(`/quizzes/${id}`);
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { startQuiz(); }, [startQuiz]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const handleAnswer = (qIdx, optIdx) => {
    setAnswers((p) => ({ ...p, [qIdx]: optIdx }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    clearTimeout(timerRef.current);
    try {
      const formattedAnswers = quiz.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedOption: answers[idx] !== undefined ? answers[idx] : -1,
      }));
      const r = await quizAPI.submitAttempt(id, attemptId, { answers: formattedAnswers });
      setResult(r.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  }, [id, attemptId, answers, quiz, submitting, result]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!quiz) return null;

  // ── Results screen ─────────────────────────────────────────────
  if (result) {
    const gradeColors = { 'A+': 'emerald', 'A': 'green', 'B': 'blue', 'C': 'amber', 'D': 'orange', 'F': 'red' };
    const gc = gradeColors[result.grade] || 'gray';
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
        <div className={`w-24 h-24 bg-${gc}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
          <CheckCircleIcon className={`w-12 h-12 text-${gc}-600`} />
        </div>
        <h1 className="text-3xl font-display font-bold text-surface-900 mb-1">Quiz Submitted!</h1>
        <p className="text-surface-500 mb-8">Here are your results</p>

        <Card className="text-left mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-primary-600">{result.percentage}%</p>
              <p className="text-sm text-surface-500 mt-1">Score</p>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-display font-bold text-${gc}-600`}>{result.grade}</p>
              <p className="text-sm text-surface-500 mt-1">Grade</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-surface-900">{result.score}/{result.totalMarks}</p>
              <p className="text-sm text-surface-500 mt-1">Marks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-surface-900">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
              <p className="text-sm text-surface-500 mt-1">Time Taken</p>
            </div>
          </div>
        </Card>

        <Button onClick={() => navigate('/quizzes')} size="lg" className="w-full">Back to Quizzes</Button>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft !== null && timeLeft <= 60;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-surface-200 px-5 py-3 shadow-card">
        <div>
          <p className="font-display font-semibold text-surface-900 text-sm">{quiz.title}</p>
          <p className="text-xs text-surface-400">{answeredCount}/{quiz.questions.length} answered</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${isLowTime ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-surface-100 text-surface-700'}`}>
          <ClockIcon className="w-4 h-4" />
          {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-100 rounded-full h-1.5">
        <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <Card>
        <p className="text-xs text-surface-400 mb-2 font-medium">Question {currentQ + 1} of {quiz.questions.length} • {question.marks} mark{question.marks !== 1 ? 's' : ''}</p>
        <h2 className="text-base font-semibold text-surface-900 mb-5">{question.questionText}</h2>
        <div className="space-y-3">
          {question.options.map((opt, oi) => (
            <button key={oi} onClick={() => handleAnswer(currentQ, oi)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                answers[currentQ] === oi
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-surface-200 hover:border-surface-300 bg-white text-surface-700'
              }`}>
              <span className="inline-flex w-6 h-6 rounded-full bg-surface-100 items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                {String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)}>← Previous</Button>
        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                i === currentQ ? 'bg-primary-600 text-white' : answers[i] !== undefined ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
        {currentQ < quiz.questions.length - 1 ? (
          <Button onClick={() => setCurrentQ((p) => p + 1)}>Next →</Button>
        ) : (
          <Button onClick={handleSubmit} loading={submitting} variant="primary">
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
