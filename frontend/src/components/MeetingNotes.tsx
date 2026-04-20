import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, Edit, Trash2, FileText } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';

interface MeetingNotesProps {
  projectId: string;
}

const API = "http://localhost:5000";

const MeetingNotes: React.FC<MeetingNotesProps> = ({ projectId }) => {
  const { projects } = useProjects();
  const { user } = useAuth();

  // ✅ MOCK USERS (fix getAllUsers error)
  const getAllUsers = () => [];

  const [notes, setNotes] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [attendedMembers, setAttendedMembers] = useState<string[]>([]);

  const project = projects.find(p => p.id === projectId);
  const allUsers = getAllUsers();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/meeting-notes/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    setNotes(data);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/meeting-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId,
        content: newNote,
        attendedMembers: attendedMembers.join(",")
      })
    });

    const saved = await res.json();

    setNotes(prev => [saved, ...prev]);
    setNewNote('');
    setAttendedMembers([]);
    setShowAddForm(false);
  };

  const deleteNote = async (id: string) => {
    const token = localStorage.getItem("token");

    await fetch(`${API}/meeting-notes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const toggleMember = (userId: string) => {
    setAttendedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!project) return null;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Meeting Notes</h3>
        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
          <Plus className="h-4 w-4 inline mr-1" />
          Add Note
        </button>
      </div>

      {/* ADD FORM */}
      {showAddForm && (
        <div className="p-4 border rounded">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter note..."
            className="w-full border p-2 rounded"
          />

          {/* Members */}
          <div className="mt-2">
            {allUsers.map((member: any) => (
              <label key={member.id}>
                <input
                  type="checkbox"
                  onChange={() => toggleMember(member.id)}
                />
                {member.name}
              </label>
            ))}
          </div>

          <button onClick={addNote} className="mt-2 bg-green-600 text-white px-3 py-1 rounded">
            Save
          </button>
        </div>
      )}

      {/* NOTES LIST */}
      {notes.length === 0 ? (
        <p>No notes yet</p>
      ) : (
        notes.map((note: any) => (
          <div key={note.id} className="border p-3 rounded">
            <div className="flex justify-between">
              <span>{formatDate(note.date)}</span>
              <button onClick={() => deleteNote(note.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
            <p>{note.content}</p>
          </div>
        ))
      )}

    </div>
  );
};

export default MeetingNotes;