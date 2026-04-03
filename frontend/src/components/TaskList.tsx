import React, { useState } from 'react';
import { Plus, CheckCircle, Circle, Calendar, User, Edit, Trash2, ClipboardList, Upload, X, File } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { uploadFile, getFileUrl } from '../lib/api';

interface TaskListProps {
  projectId: string;
}

const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  const { projects, addTask, updateTask, deleteTask } = useProjects();
  const { user, getAllUsers } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    dueDate: '',
    completed: false,
    files: [] as File[]
  });
  const [uploading, setUploading] = useState(false);

  const project = projects.find(p => p.id === projectId);
  const allUsers = getAllUsers();

  if (!project) return null;

  const canCreate = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'team_leader' || project.createdBy === user?.id || project.assignedMembers.includes(user?.id || '');
  const canEdit = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'team_leader';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveTask();
  };

  const handleSaveTask = async () => {
    setUploading(true);
    try {
      let uploadedFiles = [];
      
      // Upload files to Supabase
      for (const file of formData.files) {
        try {
          const uploadResult = await uploadFile(file, 'project-files', `tasks/${projectId}`);
          const fileUrl = getFileUrl('project-files', uploadResult.filePath);
          
          uploadedFiles.push({
            id: uploadResult.fileName,
            name: file.name,
            url: fileUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            path: uploadResult.filePath
          });
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with other files even if one fails
        }
      }

    if (editingId) {
      await updateTask(editingId, {
        title: formData.title,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        completed: formData.completed
      });
      setEditingId(null);
    } else {
      await addTask(projectId, {
        title: formData.title,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        completed: formData.completed
      });
      setShowAddForm(false);
    }
    setFormData({ title: '', assignedTo: '', dueDate: '', completed: false, files: [] });
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      completed: task.completed,
      files: []
    });
    setShowAddForm(true);
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed: !completed });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const getUserName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.name || 'Unassigned';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate !== '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">To-Do List</h3>
        {canCreate && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add To-Do</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To-Do Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter to-do title..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select team member</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Attachments
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="task-file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="task-file-upload"
                  className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload files</span>
                </label>
                
                {formData.files.length > 0 && (
                  <div className="space-y-1">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-600 px-3 py-2 rounded">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{file.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
              >
                {uploading ? 'Saving...' : editingId ? 'Update To-Do' : 'Add To-Do'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ title: '', assignedTo: '', dueDate: '', completed: false, files: [] });
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {project.tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No to-dos yet</p>
            {canCreate && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add the first to-do
              </button>
            )}
          </div>
        ) : (
          project.tasks
            .sort((a, b) => {
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            })
            .map((task) => (
              <div key={task.id} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${task.completed ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`mt-1 ${task.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400'}`}
                    >
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{getUserName(task.assignedTo)}</span>
                        </div>
                        {task.dueDate && (
                          <div className={`flex items-center space-x-1 ${isOverdue(task.dueDate) && !task.completed ? 'text-red-600 dark:text-red-400' : ''}`}>
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(task.dueDate)}</span>
                            {isOverdue(task.dueDate) && !task.completed && (
                              <span className="text-red-600 dark:text-red-400 font-medium">(Overdue)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {task.files && task.files.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-1">
                          {task.files.map((file) => (
                            <a
                              key={file.id}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                            >
                              <File className="h-3 w-3" />
                              <span>{file.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default TaskList;