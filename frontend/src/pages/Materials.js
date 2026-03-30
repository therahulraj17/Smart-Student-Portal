import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { materialAPI, courseAPI } from '../services/api';
import { Card, PageHeader, Badge, Button, EmptyState, Modal, FormField, Input, Textarea, Select, Spinner } from '../components/common/UI';
import { BookOpenIcon, PlusIcon, ArrowDownTrayIcon, LinkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_COLORS = { pdf: 'red', video: 'purple', link: 'blue', note: 'amber', other: 'gray' };
const TYPE_ICONS = { pdf: '📄', video: '🎬', link: '🔗', note: '📝', other: '📎' };

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [mr, cr] = await Promise.all([materialAPI.getAll(), courseAPI.getAll()]);
      setMaterials(mr.data.data.materials);
      setCourses(cr.data.data.courses);
    } catch { toast.error('Failed to load materials'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = typeFilter === 'all' ? materials : materials.filter((m) => m.type === typeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Study Materials" subtitle={`${materials.length} resource${materials.length !== 1 ? 's' : ''} available`}
        action={user?.role !== 'student' && <Button leftIcon={PlusIcon} onClick={() => setShowUpload(true)}>Upload Material</Button>} />
      <div className="flex gap-2 flex-wrap">
        {['all', 'pdf', 'video', 'link', 'note', 'other'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-1.5 text-sm font-medium rounded-full capitalize transition-all ${typeFilter === t ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'}`}>{t}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : filtered.length === 0 ? <EmptyState icon={BookOpenIcon} title="No materials found" description="Upload study materials for your students" />
        : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <Card key={m._id} hover className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{TYPE_ICONS[m.type] || '📎'}</span>
                  <Badge color={TYPE_COLORS[m.type] || 'gray'}>{m.type}</Badge>
                </div>
                <h3 className="font-semibold text-surface-900 text-sm mb-1 line-clamp-2">{m.title}</h3>
                <p className="text-xs text-surface-500 mb-1">{m.courseId?.name}</p>
                {m.description && <p className="text-xs text-surface-400 line-clamp-2 mb-3 flex-1">{m.description}</p>}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(m.tags || []).map((tag) => <span key={tag} className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">#{tag}</span>)}
                </div>
                <div className="border-t border-surface-100 pt-3 mt-auto flex items-center justify-between">
                  <p className="text-xs text-surface-400">{format(new Date(m.createdAt), 'MMM d, yyyy')}</p>
                  {m.file ? (
                    <a href={`/uploads/materials/${m.file.filename}`} target="_blank" rel="noreferrer" download
                      className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700">
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download
                    </a>
                  ) : m.externalUrl ? (
                    <a href={m.externalUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700">
                      <LinkIcon className="w-3.5 h-3.5" /> Open Link
                    </a>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      {showUpload && <UploadModal courses={courses} onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); load(); }} />}
    </div>
  );
}

function UploadModal({ courses, onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', description: '', courseId: '', type: 'pdf', externalUrl: '', tags: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.courseId) { toast.error('Title and course required'); return; }
    if (form.type !== 'link' && !file) { toast.error('Please select a file'); return; }
    if (form.type === 'link' && !form.externalUrl) { toast.error('Please enter a URL'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      await materialAPI.upload(fd);
      toast.success('Material uploaded!');
      onUploaded();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen title="Upload Study Material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Material title" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Course" required>
            <Select value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}>
              <option value="">Select course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Type" required>
            <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {['pdf', 'video', 'link', 'note', 'other'].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </Select>
          </FormField>
        </div>
        {form.type === 'link' ? (
          <FormField label="URL" required><Input value={form.externalUrl} onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))} placeholder="https://..." /></FormField>
        ) : (
          <FormField label="File" required>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700" />
          </FormField>
        )}
        <FormField label="Tags"><Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="tag1, tag2, tag3" /></FormField>
        <FormField label="Description"><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Optional description..." className="w-full px-4 py-2.5 text-sm border border-surface-200 rounded-xl bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" /></FormField>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Upload</Button>
        </div>
      </form>
    </Modal>
  );
}
