import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Calendar, Edit, Trash2, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TaskListProps {
  projectId: string;
}

const API = "http://localhost:5001";

const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', assignedTo: '', dueDate: '' });

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/tasks?projectId=${projectId}`, { headers });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data.filter(t => t.project_id === projectId) : []);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/users`, { headers });
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [projectId]);

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    try {
      if (editingId) {
        await fetch(`${API}/tasks/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ title: formData.title, assignedTo: formData.assignedTo || null, dueDate: formData.dueDate || null })
        });
      } else {
        await fetch(`${API}/tasks`, {
          method: "POST",
          headers,
          body: JSON.stringify({ projectId, title: formData.title, assignedTo: formData.assignedTo || null, dueDate: formData.dueDate || null })
        });
      }
      setFormData({ title: '', assignedTo: '', dueDate: '' });
      setEditingId(null);
      setShowAddForm(false);
      fetchTasks();
    } catch (err) {
      console.error("Save task error:", err);
    }
  };

  const handleToggle = async (task: any) => {
    try {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ title: task.title, completed: !task.completed, assignedTo: task.assigned_to, dueDate: task.due_date })
      });
      fetchTasks();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await fetch(`${API}/tasks/${id}`, { method: "DELETE", headers });
      fetchTasks();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getUserName = (userId: string) => allUsers.find(u => u.id === userId)?.name || userId;
  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const today = new Date().toISOString().split('T')[0];

  const completed = tasks.filter(t => t.completed);
  const pending = tasks.filter(t => !t.completed);
  const overdue = pending.filter(t => t.due_date && t.due_date < today);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ title: '', assignedTo: '', dueDate: '' }); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{tasks.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-600">{completed.length}</p>
          <p className="text-xs text-gray-500">Done</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-red-600">{overdue.length}</p>
          <p className="text-xs text-gray-500">Overdue</p>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="Task title *"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={formData.assignedTo}
              onChange={e => setFormData(p => ({ ...p, assignedTo: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Assign to...</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-2" />
          <p>No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-start justify-between p-3 rounded-lg border ${
                task.completed ? 'bg-green-50 border-green-200' :
                task.due_date && task.due_date < today ? 'bg-red-50 border-red-200' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button onClick={() => handleToggle(task)} className="mt-0.5 flex-shrink-0">
                  {task.completed
                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                    : <Circle className="h-5 w-5 text-gray-400" />}
                </button>
                <div>
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {task.assigned_to && <span>👤 {getUserName(task.assigned_to)}</span>}
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${task.due_date < today && !task.completed ? 'text-red-600' : ''}`}>
                        <Calendar className="h-3 w-3" /> {formatDate(task.due_date)}
                        {task.due_date < today && !task.completed && ' (Overdue)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => {
                    setEditingId(task.id);
                    setFormData({ title: task.title, assignedTo: task.assigned_to || '', dueDate: task.due_date || '' });
                    setShowAddForm(true);
                  }}
                  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(task.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;