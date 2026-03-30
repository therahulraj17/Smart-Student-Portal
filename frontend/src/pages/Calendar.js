import React, { useEffect, useState } from 'react';
import { calendarAPI } from '../services/api';
import { Card, PageHeader, Badge, Spinner } from '../components/common/UI';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_COLORS = { assignment: 'bg-red-400', quiz: 'bg-purple-400', class: 'bg-blue-400', exam: 'bg-orange-400', holiday: 'bg-green-400', reminder: 'bg-amber-400', other: 'bg-gray-400' };

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setLoading(true);
    calendarAPI.getEvents({ month: currentMonth.getMonth(), year: currentMonth.getFullYear() })
      .then((r) => setEvents(r.data.data.events))
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth));
  const selectedEvents = selectedDay ? events.filter((e) => isSameDay(new Date(e.startDate), selectedDay)) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Calendar" subtitle="View upcoming assignments, quizzes, and events" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <h2 className="font-display font-semibold text-surface-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-xs font-medium bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors">Today</button>
                <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-surface-400 py-2">{d}</div>
                ))}
              </div>
              {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map((day) => {
                    const dayEvents = events.filter((e) => isSameDay(new Date(e.startDate), day));
                    const selected = selectedDay && isSameDay(day, selectedDay);
                    return (
                      <button key={day.toISOString()} onClick={() => setSelectedDay(selected ? null : day)}
                        className={`p-1.5 rounded-xl text-center transition-all min-h-[60px] flex flex-col items-center ${selected ? 'bg-primary-600 text-white' : isToday(day) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-surface-50'}`}>
                        <span className={`text-xs font-semibold ${selected ? 'text-white' : isToday(day) ? 'text-primary-700' : 'text-surface-700'}`}>{format(day, 'd')}</span>
                        <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.type] || 'bg-gray-400'} ${selected ? 'bg-white/70' : ''}`} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <h3 className="font-display font-semibold text-surface-900 mb-4">
              {selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'Select a day'}
            </h3>
            {selectedDay ? (
              selectedEvents.length === 0 ? (
                <div className="text-center py-8"><CalendarDaysIcon className="w-8 h-8 text-surface-300 mx-auto mb-2" /><p className="text-sm text-surface-400">No events</p></div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((e) => (
                    <div key={e._id} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${EVENT_COLORS[e.type] || 'bg-gray-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-surface-900">{e.title}</p>
                        <p className="text-xs text-surface-500 capitalize">{e.type} {e.courseId ? `• ${e.courseId.name}` : ''}</p>
                        {e.description && <p className="text-xs text-surface-400 mt-1">{e.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8"><CalendarDaysIcon className="w-8 h-8 text-surface-300 mx-auto mb-2" /><p className="text-sm text-surface-400">Click a date to see events</p></div>
            )}
          </Card>
          <Card className="mt-4">
            <p className="text-xs font-semibold text-surface-500 mb-3">LEGEND</p>
            <div className="space-y-2">
              {Object.entries(EVENT_COLORS).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
                  <span className="text-xs text-surface-600 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
