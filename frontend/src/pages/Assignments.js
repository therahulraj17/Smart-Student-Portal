import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignmentAPI, courseAPI } from '../services/api';
import { Card, PageHeader, Badge, Button, EmptyState, Modal, FormField, Input, Textarea, Select, Spinner } from '../components/common/UI';
import { ClipboardDocumentListIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLOR = { submitted: 'blue', graded: 'green', late: 'red' };

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, overdue, submitted

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([assignmentAPI.getAll(), courseAPI.getAll()]);
      setAssignments(aRes.data.data.assignments);
      setCourses(cRes.data.data.courses);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = assignments.filter((a) => {
    if (filter === 'upcoming') return !isPast(new Date(a.dueDate));
    if (filter === 'overdue') return isPast(new Date(a.dueDate)) && !a.mySubmission;
    if (filter === 'submitted') return !!a.mySubmission;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Assignments"
        subtitle={`${assignments.length} total assignment${assignments.length !== 1 ? 's' : ''}`}
        action={user?.role !== 'student' && (
          <Button leftIcon={PlusIcon} onClick={() => setShowCreate(true)}>Create Assignment</Button>
        )}
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'upcoming', 'overdue', 'submitted'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardDocumentListIcon} title="No assignments found"
          description={filter !== 'all' ? 'Try changing the filter' : user?.role === 'student' ? 'Your teacher hasn\'t posted any assignments yet' : 'Create your first assignment'}
          action={user?.role !== 'student' && <Button leftIcon={PlusIcon} onClick={() => setShowCreate(true)}>Create Assignment</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => <AssignmentCard key={a._id} assignment={a} userRole={user?.role} />)}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentModal courses={courses} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}
    </div>
  );
}

function AssignmentCard({ assignment: a, userRole }) {
  const overdue = isPast(new Date(a.dueDate));
  const submission = a.mySubmission;

  return (
    <Link to={`/assignments/${a._id}`}>
      <Card hover className="h-full flex flex-col transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardDocumentListIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {overdue && !submission && <Badge color="red">Overdue</Badge>}
            {submission && <Badge color={STATUS_COLOR[submission.status] || 'blue'}>{submission.status}</Badge>}
            {!overdue && !submission && <Badge color="green">Open</Badge>}
          </div>
        </div>

        <h3 className="font-display font-semibold text-surface-900 text-sm mb-1 line-clamp-2">{a.title}</h3>
        <p className="text-xs text-surface-500 mb-3">{a.courseId?.name}</p>
        <p className="text-xs text-surface-500 line-clamp-2 mb-4 flex-1">{a.description}</p>

        <div className="border-t border-surface-100 pt-3 mt-auto">
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>Due {format(new Date(a.dueDate), 'MMM d, yyyy')}</span>
            <span className={overdue && !submission ? 'text-red-500 font-medium' : ''}>
              {formatDistanceToNow(new Date(a.dueDate), { addSuffix: true })}
            </span>
          </div>
          {userRole !== 'student' && (
            <div className="flex items-center justify-between text-xs text-surface-500 mt-1">
              <span>{a.totalMarks} marks</span>
              <span>{a.submissionCount || 0} submissions</span>
            </div>
          )}
          {submission?.marks !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${(submission.marks / a.totalMarks) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold text-surface-700">{submission.marks}/{a.totalMarks}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

function CreateAssignmentModal({ courses, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', courseId: '', dueDate: '', totalMarks: 100 });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.courseId) e.courseId = 'Select a course';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    else if (new Date(form.dueDate) <= new Date()) e.dueDate = 'Due date must be in the future';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('attachments', f));
      await assignmentAPI.create(fd);
      toast.success('Assignment created!');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen title="Create Assignment" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Title" error={errors.title} required>
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Assignment title" error={errors.title} />
        </FormField>
        <FormField label="Description" error={errors.description} required>
          <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the assignment..." error={errors.description} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Course" error={errors.courseId} required>
            <Select value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))} error={errors.courseId}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Total Marks" required>
            <Input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Due Date" error={errors.dueDate} required>
          <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} error={errors.dueDate}
            min={new Date().toISOString().slice(0, 16)} />
        </FormField>
        <FormField label="Attachments">
          <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.zip"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          {files.length > 0 && <p className="text-xs text-surface-500 mt-1">{files.length} file(s) selected</p>}
        </FormField>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Assignment</Button>
        </div>
      </form>
    </Modal>
  );
}
