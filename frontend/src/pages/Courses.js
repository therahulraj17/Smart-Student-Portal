// ══════════════════════════════════════════════════════════════
// COURSES PAGE
// ══════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { Card, PageHeader, Badge, Button, EmptyState, Modal, FormField, Input, Textarea, Spinner } from '../components/common/UI';
import { AcademicCapIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await courseAPI.getAll();
      setCourses(r.data.data.courses);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Courses" subtitle={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
        action={(user?.role === 'admin' || user?.role === 'teacher') && (
          <Button leftIcon={PlusIcon} onClick={() => setShowCreate(true)}>Create Course</Button>
        )} />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : courses.length === 0 ? <EmptyState icon={AcademicCapIcon} title="No courses yet" description="Courses will appear here once created" />
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Card key={c._id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <Badge color="blue">{c.code}</Badge>
                </div>
                <h3 className="font-display font-semibold text-surface-900 mb-1">{c.name}</h3>
                <p className="text-xs text-surface-500 mb-3">{c.teacher?.name} {c.semester ? `• ${c.semester}` : ''}</p>
                {c.description && <p className="text-xs text-surface-400 line-clamp-2 mb-3">{c.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                  <div className="flex items-center gap-1.5 text-xs text-surface-500">
                    <UserGroupIcon className="w-3.5 h-3.5" />
                    {c.students?.length || 0} students
                  </div>
                  {c.credits && <span className="text-xs text-surface-400">{c.credits} credits</span>}
                  {user?.role === 'student' && !user?.enrolledCourses?.includes(c._id) && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      try { await courseAPI.enroll(c._id); toast.success(`Enrolled in ${c.name}`); load(); }
                      catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed'); }
                    }}>Enroll</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      {showCreate && <CreateCourseModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateCourseModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', code: '', description: '', semester: '', credits: 3 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Name and code required'); return; }
    setLoading(true);
    try {
      await courseAPI.create({ ...form, credits: parseInt(form.credits) });
      toast.success('Course created!');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create course'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen title="Create Course" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Course Name" required><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Introduction to Computer Science" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Course Code" required><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS101" /></FormField>
          <FormField label="Credits"><Input type="number" min="1" max="10" value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))} /></FormField>
        </div>
        <FormField label="Semester"><Input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} placeholder="e.g. Fall 2024" /></FormField>
        <FormField label="Description"><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 text-sm border border-surface-200 rounded-xl bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Course description..." /></FormField>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Course</Button>
        </div>
      </form>
    </Modal>
  );
}
