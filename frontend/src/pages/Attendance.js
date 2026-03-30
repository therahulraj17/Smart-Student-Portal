// ════════════════════════════════════════════════════
// ATTENDANCE PAGE
// ════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, courseAPI } from '../services/api';
import { Card, PageHeader, Badge, Button, ProgressBar, StatCard, Spinner, Select, FormField } from '../components/common/UI';
import { ChartBarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AttendancePage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [form, setForm] = useState({ courseId: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [records, setRecords] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const cr = await courseAPI.getAll();
        setCourses(cr.data.data.courses);
        if (user.role === 'student') {
          const ar = await attendanceAPI.getMy();
          setData(ar.data.data.attendance);
        }
      } catch { toast.error('Failed to load attendance data'); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (form.courseId && user.role === 'teacher') {
      const course = courses.find((c) => c._id === form.courseId);
      setStudents(course?.students || []);
      const initialRecords = {};
      (course?.students || []).forEach((s) => { initialRecords[s._id] = 'present'; });
      setRecords(initialRecords);
    }
  }, [form.courseId, courses]);

  const handleMark = async () => {
    if (!form.courseId || !form.date) { toast.error('Select course and date'); return; }
    setMarking(true);
    try {
      const recs = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      await attendanceAPI.mark({ courseId: form.courseId, date: form.date, records: recs });
      toast.success('Attendance marked!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to mark attendance'); }
    finally { setMarking(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance" subtitle={user.role === 'student' ? 'Your attendance across all courses' : 'Mark and manage attendance'} />

      {user.role === 'student' && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <Card key={item.course?._id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-surface-900 text-sm">{item.course?.name}</p>
                    <p className="text-xs text-surface-400">{item.course?.code}</p>
                  </div>
                  <Badge color={item.percentage >= 75 ? 'green' : item.percentage >= 50 ? 'yellow' : 'red'}>
                    {item.percentage}%
                  </Badge>
                </div>
                <ProgressBar value={item.percentage} color={item.percentage >= 75 ? 'green' : item.percentage >= 50 ? 'amber' : 'red'} showPercent={false} />
                <div className="flex justify-between mt-3 text-xs text-surface-500">
                  <span>Present: {item.present}</span>
                  <span>Absent: {item.absent}</span>
                  <span>Total: {item.total}</span>
                </div>
                {item.percentage < 75 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">⚠️ Below 75% minimum</p>
                )}
              </Card>
            ))}
            {data.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <ChartBarIcon className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                <p className="text-surface-500 text-sm">No attendance data yet</p>
              </div>
            )}
          </div>
        </>
      )}

      {user.role === 'teacher' && (
        <Card>
          <h2 className="font-display font-semibold text-surface-900 mb-4">Mark Attendance</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <FormField label="Course">
              <Select value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Date">
              <input type="date" value={form.date} max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-surface-200 rounded-xl bg-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </FormField>
          </div>

          {students.length > 0 && (
            <>
              <div className="divide-y divide-surface-100 mb-4">
                {students.map((s) => (
                  <div key={s._id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-surface-900">{s.name}</span>
                    </div>
                    <div className="flex gap-2">
                      {['present', 'absent', 'late', 'excused'].map((status) => (
                        <button key={status} onClick={() => setRecords((p) => ({ ...p, [s._id]: status }))}
                          className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all ${
                            records[s._id] === status
                              ? status === 'present' ? 'bg-green-500 text-white' : status === 'absent' ? 'bg-red-500 text-white' : status === 'late' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                          }`}>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleMark} loading={marking} leftIcon={PlusIcon}>
                Mark Attendance for {format(new Date(form.date), 'MMM d, yyyy')}
              </Button>
            </>
          )}
          {form.courseId && students.length === 0 && (
            <p className="text-sm text-surface-400 text-center py-4">No students enrolled in this course</p>
          )}
        </Card>
      )}
    </div>
  );
}

export default AttendancePage;
