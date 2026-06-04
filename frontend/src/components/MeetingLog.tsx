import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Calendar, Clock, Users, ChevronDown, ChevronUp, X, Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MeetingRecord {
  id: string;
  project_id: string;
  date: string;
  time: string;
  topic?: string;
  attended_members: string[];
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface MeetingLogProps {
  projectId: string;
  assignedMembers: string[]; // only assigned members shown in selector
  allUsers: { id: string; name: string; role: string }[];
}

const API = "/api";

const canManage = (role?: string) =>
  role === 'admin' || role === 'project_manager' || role === 'team_leader';

const canDelete = (role?: string) =>
  role === 'admin' || role === 'project_manager';

const MeetingLog: React.FC<MeetingLogProps> = ({ projectId, assignedMembers, allUsers }) => {
  const { user } = useAuth();

  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    topic: '',
    attendedMembers: [] as string[]
  });

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Only show members assigned to this project
  const projectMembers = allUsers.filter(u => assignedMembers.includes(u.id));

  // ─── FETCH ────────────────────────────────────────────────────────────────────

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API}/meeting-log?projectId=${projectId}`, { headers });
      const data = await res.json();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch meetings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [projectId]);

  // ─── RESET FORM ───────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ date: '', time: '', topic: '', attendedMembers: [] });
    setEditingId(null);
    setShowForm(false);
  };

  // ─── OPEN EDIT ────────────────────────────────────────────────────────────────

  const handleEdit = (meeting: MeetingRecord) => {
    setFormData({
      date: meeting.date?.split('T')[0] ?? '',
      time: meeting.time?.slice(0, 5) ?? '',
      topic: meeting.topic || '',
      attendedMembers: meeting.attended_members || []
    });
    setEditingId(meeting.id);
    setShowForm(true);
  };

  // ─── TOGGLE MEMBER ────────────────────────────────────────────────────────────

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      attendedMembers: prev.attendedMembers.includes(memberId)
        ? prev.attendedMembers.filter(id => id !== memberId)
        : [...prev.attendedMembers, memberId]
    }));
  };

  // ─── SAVE ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.date || !formData.time) return;

    try {
      const body = JSON.stringify({
        projectId,
        date: formData.date,
        time: formData.time,
        topic: formData.topic || null,
        attendedMembers: formData.attendedMembers
      });

      if (editingId) {
        await fetch(`${API}/meeting-log/${editingId}`, {
          method: 'PUT', headers, body
        });
      } else {
        await fetch(`${API}/meeting-log`, {
          method: 'POST', headers, body
        });
      }

      await fetchMeetings();
      resetForm();
    } catch (err) {
      console.error('Save meeting error:', err);
    }
  };

  // ─── DELETE ───────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/meeting-log/${id}`, { method: 'DELETE', headers });
      setDeleteConfirmId(null);
      await fetchMeetings();
    } catch (err) {
      console.error('Delete meeting error:', err);
    }
  };

  // ─── HELPERS ──────────────────────────────────────────────────────────────────

  const getMemberName = (id: string) =>
    allUsers.find(u => u.id === id)?.name || 'Unknown';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Meeting Log</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {canManage(user?.role) && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log Meeting
          </button>
        )}
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="border border-gray-200 rounded-xl bg-gray-50 p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-800 text-sm">
              {editingId ? 'Edit Meeting' : 'New Meeting'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Topic <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={e => setFormData(p => ({ ...p, topic: e.target.value }))}
              placeholder="e.g. Sprint planning, Client review..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Attended Members
              <span className="ml-2 text-gray-400 font-normal">
                ({formData.attendedMembers.length} selected)
              </span>
            </label>

            {projectMembers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No members assigned to this project.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {projectMembers.map(member => {
                  const selected = formData.attendedMembers.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selected}
                        onChange={() => toggleMember(member.id)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {member.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{member.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{member.role?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!formData.date || !formData.time}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {editingId ? 'Update Meeting' : 'Save Meeting'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Meeting List ── */}
      {meetings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No meetings logged yet</p>
          {canManage(user?.role) && (
            <p className="text-xs mt-1">Click "Log Meeting" to add the first one</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(meeting => {
            const isExpanded = expandedId === meeting.id;
            const isDeleteConfirm = deleteConfirmId === meeting.id;
            const attendedCount = meeting.attended_members?.length || 0;

            return (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-xl bg-white overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-center gap-4 px-4 py-3">

                  {/* Date badge */}
                  <div className="flex-shrink-0 text-center bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 min-w-[60px]">
                    <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">
                      {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-bold text-blue-700 leading-tight">
                      {new Date(meeting.date).getDate()}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {meeting.topic || <span className="text-gray-400 font-normal italic">No topic specified</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(meeting.time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {attendedCount} attended
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canManage(user?.role) && (
                      <button
                        onClick={() => handleEdit(meeting)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete(user?.role) && (
                      <button
                        onClick={() => setDeleteConfirmId(meeting.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                    >
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Delete confirm */}
                {isDeleteConfirm && (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                    <p className="text-sm text-red-700 font-medium">Delete this meeting record?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded attendance list */}
                {isExpanded && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Attendance ({attendedCount})
                    </p>

                    {attendedCount === 0 ? (
                      <p className="text-sm text-gray-400 italic">No members marked as attended.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {meeting.attended_members.map(memberId => (
                          <div
                            key={memberId}
                            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getMemberName(memberId)?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {getMemberName(memberId)}
                              </p>
                              <p className="text-xs text-green-600 flex items-center gap-0.5">
                                <Check className="h-3 w-3" strokeWidth={3} /> Present
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      Logged by {meeting.created_by_name} · {formatDate(meeting.date)} at {formatTime(meeting.time)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeetingLog;