import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Send,
  Edit2,
  FileText,
  AlertCircle,
  Clock3,
  CheckCircle,
  X,
  Twitter
} from 'lucide-react';
import { Post } from '../types.js';

interface CalendarSchedulerProps {
  posts: Post[];
  onUpdatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
}

export default function CalendarScheduler({
  posts,
  onUpdatePost,
  onDeletePost
}: CalendarSchedulerProps) {
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayPosts, setSelectedDayPosts] = useState<Post[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  // Editing state for calendar items
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar Math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null); // blank cells
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Group scheduled posts by date (YYYY-MM-DD in local/UTC time)
  const getPostsForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledPosts.filter(p => {
      if (!p.scheduledTime) return false;
      const pDate = new Date(p.scheduledTime);
      const pYear = pDate.getFullYear();
      const pMonth = pDate.getMonth();
      const pDay = pDate.getDate();
      return pYear === year && pMonth === month && pDay === day;
    });
  };

  const handleDayClick = (day: number) => {
    const dayPosts = getPostsForDay(day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    setSelectedDayPosts(dayPosts.length > 0 ? dayPosts : []);
  };

  const handlePublishNow = async (post: Post) => {
    await onUpdatePost(post.id, {
      status: 'published',
      publishedTime: new Date().toISOString()
    });
    // Update local modal list
    if (selectedDayPosts) {
      setSelectedDayPosts(selectedDayPosts.filter(p => p.id !== post.id));
    }
  };

  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to cancel and delete this scheduled post?')) {
      await onDeletePost(postId);
      if (selectedDayPosts) {
        setSelectedDayPosts(selectedDayPosts.filter(p => p.id !== postId));
      }
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditText(post.selectedPostText);
  };

  const handleSaveEdit = async (post: Post) => {
    await onUpdatePost(post.id, {
      selectedPostText: editText
    });
    setEditingPostId(null);
    // Refresh modal content
    if (selectedDayPosts) {
      setSelectedDayPosts(selectedDayPosts.map(p => p.id === post.id ? { ...p, selectedPostText: editText } : p));
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/20 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6">
      
      {/* Calendar Block (Left 65%) */}
      <div className="flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-white text-base">
              {monthNames[month]} {year}
            </h2>
          </div>
          <div className="flex gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Header */}
        <div className="grid grid-cols-7 text-center text-slate-500 font-mono text-[10px] uppercase font-bold border-b border-slate-800/80 pb-3 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[350px]">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-slate-950/10 rounded-xl" />;
            }

            const dayPosts = getPostsForDay(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleDayClick(day)}
                className={`p-2.5 rounded-xl text-left flex flex-col justify-between items-start transition-all relative group h-16 ${
                  isToday
                    ? 'bg-sky-600/10 border-2 border-sky-500 hover:bg-sky-600/15'
                    : 'bg-slate-950/40 border border-slate-850 hover:bg-slate-850/40 hover:border-slate-800'
                }`}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-sky-400' : 'text-slate-400'}`}>
                  {day}
                </span>

                {dayPosts.length > 0 && (
                  <div className="w-full flex flex-wrap gap-1">
                    {dayPosts.map((post) => (
                      <span
                        key={post.id}
                        className={`w-1.5 h-1.5 rounded-full block ${
                          post.category === 'Technology' ? 'bg-purple-500' :
                          post.category === 'Cryptocurrency' ? 'bg-amber-500' :
                          post.category === 'Business' ? 'bg-emerald-500' :
                          post.category === 'Breaking News' ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        title={`${post.category}: ${post.selectedPostText}`}
                      />
                    ))}
                  </div>
                )}
                {dayPosts.length > 0 && (
                  <span className="absolute bottom-1 right-1 text-[8px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slideout details card / Panel (Right 35%) */}
      <div className="w-full md:w-96 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between h-full min-h-[450px]">
        <div>
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-sky-400" />
              Scheduler Inspector
            </h3>
            {selectedDateStr && (
              <span className="text-[10px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded font-bold">
                {selectedDateStr}
              </span>
            )}
          </div>

          {selectedDayPosts === null ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 flex-1 h-[300px]">
              <CalendarIcon className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-xs">
                Select any calendar cell containing dot indicators to inspect, edit, reschedule, or cancel pending scheduled postings.
              </p>
            </div>
          ) : selectedDayPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 flex-1 h-[300px]">
              <CheckCircle className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-xs font-semibold">No Scheduled Posts</p>
              <p className="text-[11px] text-slate-600 mt-1">There is no content queued for publishing on {selectedDateStr}.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayPosts.map((post) => (
                <div key={post.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative">
                  {/* Category and Time */}
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        post.category === 'Technology' ? 'bg-purple-500/10 text-purple-400' :
                        post.category === 'Cryptocurrency' ? 'bg-amber-500/10 text-amber-400' :
                        post.category === 'Business' ? 'bg-emerald-500/10 text-emerald-400' :
                        post.category === 'Breaking News' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-sky-400 bg-sky-500/10 border border-sky-500/15 px-1 py-0.2 rounded font-mono font-medium">
                        <Twitter className="w-2.5 h-2.5" />
                        <span>{post.targetXHandle || '@AIPressRoom'}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {post.scheduledTime ? new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* Text area edit mode or simple view */}
                  {editingPostId === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 text-xs rounded-lg text-slate-200 outline-none focus:border-sky-500"
                        rows={4}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] px-2 py-1 rounded font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(post)}
                          className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] px-2 py-1 rounded font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-xs leading-relaxed font-sans select-text">
                      {post.selectedPostText}
                    </p>
                  )}

                  {/* Actions buttons */}
                  {editingPostId !== post.id && (
                    <div className="flex justify-end items-center gap-1 border-t border-slate-900 pt-2.5">
                      <button
                        onClick={() => handleStartEdit(post)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-900"
                        title="Edit post"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePublishNow(post)}
                        className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-900"
                        title="Publish Immediately"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900"
                        title="Cancel Schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global info footer */}
        <div className="border-t border-slate-800/80 pt-4 mt-4 text-[11px] text-slate-500 flex gap-2 items-start leading-normal bg-slate-950/20 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <span>
            Scheduled items are securely saved in our container database. A server cron evaluates them every minute and signs requests to post instantly.
          </span>
        </div>
      </div>
    </div>
  );
}
