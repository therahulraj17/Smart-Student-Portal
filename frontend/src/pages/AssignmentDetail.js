import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI } from '../services/api';
import { Card, Badge, Button, Modal, FormField, Input, Textarea, Spinner } from '../components/common/UI';
import { ArrowLeftIcon, PaperClipIcon, UserIcon } from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

export default function AssignmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showGrade, setShowGrade] = useState(null);

  const load = async () => {
    try {
      const r = await assignmentAPI.getById(id);
      setAssignment(r.data.data.assignment);
    } catch { toast.error('Failed to load assignment'); navigate('/assignments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!assignment) return null;

  const overdue = isPast(new Date(assignment.dueDate));
  const mySubmission = assignment.mySubmission || (user?.role === 'student' ? null : undefined);

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Assignments
      </button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge color={overdue ? 'red' : 'green'}>{overdue ? 'Overdue' : 'Open'}</Badge>
              <Badge color="gray">{assignment.courseId?.name}</Badge>
            </div>
            <h1 className="text-2xl font-display font-bold text-surface-900">{assignment.title}</h1>
            <p className="text-sm text-surface-500 mt-1">
              By {assignment.teacherId?.name} • Due {format(new Date(assignment.dueDate), 'MMMM d, yyyy h:mm a')}
              {' '}({formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })})
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="text-2xl font-bold text-primary-600">{assignment.totalMarks}</p>
            <p className="text-xs text-surface-400">total marks</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-surface-700 whitespace-pre-wrap">
          {assignment.description}
        </div>

        {assignment.attachments?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <p className="text-sm font-medium text-surface-700 mb-2">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {assignment.attachments.map((f, i) => (
                <a key={i} href={`/uploads/assignments/${f.filename}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-lg text-xs font-medium text-surface-700 hover:bg-surface-200 transition-colors">
                  <PaperClipIcon className="w-3.5 h-3.5" /> {f.originalName}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Student actions */}
        {user?.role === 'student' && (
          <div className="mt-6 pt-4 border-t border-surface-100">
            {mySubmission ? (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-800 mb-1">✅ Submitted</p>
                <p className="text-xs text-green-600">Submitted {format(new Date(mySubmission.submittedAt), 'MMM d, yyyy h:mm a')}</p>
                {mySubmission.status === 'graded' && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold text-surface-900">Grade: {mySubmission.marks}/{assignment.totalMarks}</p>
                    {mySubmission.feedback && <p className="text-xs text-surface-600 mt-1">{mySubmission.feedback}</p>}
                  </div>
                )}
              </div>
            ) : overdue ? (
              <p className="text-sm text-red-600 font-medium">⚠️ Deadline has passed</p>
            ) : (
              <Button onClick={() => setShowSubmit(true)}>Submit Assignment</Button>
            )}
          </div>
        )}
      </Card>

      {/* Teacher: Submissions list */}
      {user?.role !== 'student' && assignment.submissions && (
        <Card>
          <h2 className="font-display font-semibold text-surface-900 mb-4">
            Submissions ({assignment.submissions.length})
          </h2>
          {assignment.submissions.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-4">No submissions yet</p>
          ) : (
            <div className="divide-y divide-surface-100">
              {assignment.submissions.map((sub) => (
                <div key={sub._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-surface-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{sub.studentId?.name}</p>
                      <p className="text-xs text-surface-400">
                        {format(new Date(sub.submittedAt), 'MMM d, h:mm a')}
                        {sub.isLate && <span className="text-red-500 ml-1">(late)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sub.status === 'graded' ? (
                      <Badge color="green">{sub.marks}/{assignment.totalMarks}</Badge>
                    ) : (
                      <Badge color="yellow">Ungraded</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowGrade(sub)}>
                      {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showSubmit && (
        <SubmitModal assignmentId={id} onClose={() => setShowSubmit(false)} onSubmitted={() => { setShowSubmit(false); load(); }} />
      )}
      {showGrade && (
        <GradeModal assignmentId={id} submission={showGrade} totalMarks={assignment.totalMarks}
          onClose={() => setShowGrade(null)} onGraded={() => { setShowGrade(null); load(); }} />
      )}
    </div>
  );
}

function SubmitModal({ assignmentId, onClose, onSubmitted }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) { toast.error('Add text or files to submit'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      if (text) fd.append('textContent', text);
      files.forEach((f) => fd.append('files', f));
      await assignmentAPI.submit(assignmentId, fd);
      toast.success('Assignment submitted!');
      onSubmitted();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen title="Submit Assignment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Written Answer">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Type your answer here..." />
        </FormField>
        <FormField label="Upload Files">
          <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.zip"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
        </FormField>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Submit</Button>
        </div>
      </form>
    </Modal>
  );
}

function GradeModal({ assignmentId, submission, totalMarks, onClose, onGraded }) {
  const [marks, setMarks] = useState(submission.marks || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [loading, setLoading] = useState(false);

  const handleGrade = async (e) => {
    e.preventDefault();
    if (marks > totalMarks) { toast.error(`Max marks is ${totalMarks}`); return; }
    setLoading(true);
    try {
      await assignmentAPI.grade(assignmentId, submission._id, { marks: parseFloat(marks), feedback });
      toast.success('Graded successfully!');
      onGraded();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to grade'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen title={`Grade: ${submission.studentId?.name}`} onClose={onClose}>
      <form onSubmit={handleGrade} className="space-y-4">
        <FormField label={`Marks (out of ${totalMarks})`} required>
          <Input type="number" min="0" max={totalMarks} step="0.5" value={marks}
            onChange={(e) => setMarks(e.target.value)} />
        </FormField>
        <FormField label="Feedback" required>
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Provide constructive feedback..." />
        </FormField>
        {submission.textContent && (
          <div className="bg-surface-50 rounded-xl p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-surface-500 mb-1">Student submission:</p>
            <p className="text-sm text-surface-700 whitespace-pre-wrap">{submission.textContent}</p>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Grade</Button>
        </div>
      </form>
    </Modal>
  );
}
