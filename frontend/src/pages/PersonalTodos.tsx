import React, { useState } from 'react';
import { Plus, CheckCircle, Circle, Calendar, Edit, Trash2, CheckSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PersonalTodos: React.FC = () => {
  const { user, addPersonalTodo, updatePersonalTodo, deletePersonalTodo } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    completed: false
  });

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePersonalTodo(user.id, editingId, formData);
      setEditingId(null);
    } else {
      addPersonalTodo(user.id, formData);
      setShowAddForm(false);
    }
    setFormData({ title: '', dueDate: '', completed: false });
  };

  const handleEdit = (todo: any) => {
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      dueDate: todo.dueDate || '',
      completed: todo.completed
    });
    setShowAddForm(true);
  };

  const handleDelete = (todoId: string) => {
    if (window.confirm('Are you sure you want to delete this to-do?')) {
      deletePersonalTodo(user.id, todoId);
    }
  };

  const handleToggleComplete = (todoId: string, completed: boolean) => {
    updatePersonalTodo(user.id, todoId, { completed: !completed });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const completedTodos = user.personalTodos.filter(t => t.completed);
  const pendingTodos = user.personalTodos.filter(t => !t.completed);
  const overdueTodos = pendingTodos.filter(t => t.dueDate && isOverdue(t.dueDate));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Personal To-Do List</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your personal tasks and reminders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.personalTodos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Circle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTodos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTodos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueTodos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Todo Form */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-8 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal To-Do Items</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add To-Do</span>
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To-Do Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter to-do title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
                >
                  {editingId ? 'Update To-Do' : 'Add To-Do'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ title: '', dueDate: '', completed: false });
                  }}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-3">
          {user.personalTodos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>No personal to-dos yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
              >
                Add your first to-do
              </button>
            </div>
          ) : (
            user.personalTodos
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((todo) => (
                <div key={todo.id} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${todo.completed ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => handleToggleComplete(todo.id, todo.completed)}
                        className={`mt-1 ${todo.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400'}`}
                      >
                        {todo.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-medium ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {todo.title}
                        </h4>
                        {todo.dueDate && (
                          <div className={`flex items-center space-x-1 mt-2 text-sm ${isOverdue(todo.dueDate) && !todo.completed ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Calendar className="h-4 w-4" />
                            <span>Due: {formatDate(todo.dueDate)}</span>
                            {isOverdue(todo.dueDate) && !todo.completed && (
                              <span className="text-red-600 dark:text-red-400 font-medium">(Overdue)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(todo)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalTodos;