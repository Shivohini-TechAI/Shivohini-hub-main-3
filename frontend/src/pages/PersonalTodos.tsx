import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Circle, Calendar, Edit, Trash2, CheckSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { safeArray } from "../lib/api";
import api from '../lib/api';

interface Todo {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

const PersonalTodos: React.FC = () => {
  const { user } = useAuth();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    dueDate: ''
  });

  // ✅ LOAD TASKS FROM BACKEND
  const loadTasks = async () => {
    try {
      const res = await api.get("/tasks");

      const data = Array.isArray(res.data) ? res.data : [];

      const formatted: Todo[] = safeArray(res.data).map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date || undefined,
        completed: t.completed,
        createdAt: t.created_at
      }));

      setTodos(formatted);
    } catch (err) {
      console.error("❌ LOAD TASK ERROR:", err);
    }
  };

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  if (!user) return null;

  // ✅ ADD / UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, {
          title: formData.title,
          dueDate: formData.dueDate || null
        });
      } else {
        await api.post("/tasks", {
          title: formData.title,
          dueDate: formData.dueDate || null
        });
      }

      await loadTasks(); // 🔥 refresh from DB
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ title: '', dueDate: '' });

    } catch (err) {
      console.error("❌ SAVE TASK ERROR:", err);
    }
  };

  // ✅ DELETE
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;

    await api.delete(`/tasks/${id}`);
    await loadTasks();
  };

  // ✅ TOGGLE COMPLETE
  const handleToggleComplete = async (todo: Todo) => {
    await api.put(`/tasks/${todo.id}`, {
      completed: !todo.completed
    });

    await loadTasks();
  };

  // ✅ EDIT
  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      dueDate: todo.dueDate || ''
    });
    setShowAddForm(true);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  const isOverdue = (date: string) =>
    new Date(date) < new Date();

  const completedTodos = todos.filter(t => t.completed);
  const pendingTodos = todos.filter(t => !t.completed);
  const overdueTodos = pendingTodos.filter(t => t.dueDate && isOverdue(t.dueDate));

  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen p-6 rounded-xl">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">
          My Tasks 🚀
        </h1>
        <p className="text-gray-700">Stay productive and organized</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={CheckSquare} title="Total" value={todos.length} bg="bg-blue-200" />
        <StatCard icon={Circle} title="Pending" value={pendingTodos.length} bg="bg-yellow-200" />
        <StatCard icon={CheckCircle} title="Completed" value={completedTodos.length} bg="bg-green-200" />
        <StatCard icon={Calendar} title="Overdue" value={overdueTodos.length} bg="bg-red-200" />
      </div>

      {/* MAIN */}
      <div className="bg-white rounded-xl shadow-lg p-6">

        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Your Tasks</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>

        {/* FORM */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-4">

            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="Task title..."
              className="w-full border p-2 rounded-lg"
              required
            />

            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
              className="w-full border p-2 rounded-lg"
            />

            <div className="flex gap-2">
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg">
                {editingId ? "Update" : "Add"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>

          </form>
        )}

        {/* LIST */}
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No tasks yet ✨</p>
        ) : (
          todos.map(todo => {
            const isDue = todo.dueDate && new Date(todo.dueDate).toDateString() === new Date().toDateString();

            return (
              <div
                key={todo.id}
                className={`p-4 rounded-lg mb-3 flex justify-between items-center border
                ${todo.completed ? "border-green-500" :
                  isDue ? "border-red-500" :
                  todo.dueDate && isOverdue(todo.dueDate) ? "border-yellow-500" :
                  "border-gray-200"}`}
              >

                <div>
                  <p className={todo.completed ? "line-through text-gray-400" : ""}>
                    {todo.title}
                  </p>

                  {todo.dueDate && (
                    <p className="text-sm text-gray-500">
                      Due: {formatDate(todo.dueDate)}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleToggleComplete(todo)}>
                    {todo.completed ? <CheckCircle className="text-green-500"/> : <Circle />}
                  </button>

                  <button onClick={() => handleEdit(todo)}>
                    <Edit className="text-blue-500"/>
                  </button>

                  <button onClick={() => handleDelete(todo.id)}>
                    <Trash2 className="text-red-500"/>
                  </button>
                </div>

              </div>
            );
          })
        )}

      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, bg }: any) => (
  <div className={`${bg} p-4 rounded-xl shadow flex items-center gap-3`}>
    <Icon />
    <div>
      <p>{title}</p>
      <p className="font-bold">{value}</p>
    </div>
  </div>
);

export default PersonalTodos;