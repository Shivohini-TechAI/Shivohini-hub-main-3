import React, { useState } from 'react';
import { Plus, Calendar, User, Edit, Trash2, FileText, Upload, X, File } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { uploadFile, getFileUrl } from '../lib/api';

interface MeetingNotesProps {
  projectId: string;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ projectId }) => {
  const { projects, addMeetingNote, updateMeetingNote, deleteMeetingNote } = useProjects();
  const { user, getAllUsers } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    content: '',
    files: [] as File[]
  });
//memberschecklist
  const [attendedMembers, setAttendedMembers] = useState<string[]>([]);
  const toggleMember = (userId: string) => {
  setAttendedMembers(prev =>
    prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  );
};


  const [uploading, setUploading] = useState(false);

  const project = projects.find(p => p.id === projectId);
  const allUsers = getAllUsers();

  if (!project) return null;

  const canEdit = user?.role === 'admin' || user?.role === 'project_manager' || user?.role === 'team_leader' || project.createdBy === user?.id || project.assignedMembers.includes(user?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveNote();
  };

  const handleSaveNote = async () => {
    setUploading(true);
    try {
      let uploadedFiles = [];
      
      // Upload files to Supabase
      for (const file of formData.files) {
        try {
          const uploadResult = await uploadFile(file, 'project-files', `meeting-notes/${projectId}`);
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
      await updateMeetingNote(editingId, {
        date: formData.date,
        content: formData.content,attendedMembers
      });
      setEditingId(null);
    } else {
      await addMeetingNote(projectId, {
        date: formData.date,
        content: formData.content,
        createdBy: user!.id,attendedMembers
      });
      setShowAddForm(false);
    }
    setFormData({ date: new Date().toISOString().split('T')[0], content: '', files: [] });
    setAttendedMembers([]);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setFormData({
      date: note.date,
      content: note.content,
      files: []
    });
    setShowAddForm(true);
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this meeting note?')) {
      deleteMeetingNote(noteId);
    }
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
    return user?.name || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Meeting Notes</h3>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meeting Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={4}
                placeholder="Enter meeting notes..."
                required
              />
            </div>

            {/* Attended Members Checklist */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Attended Members
  </label>

  <div className="grid grid-cols-2 gap-2">
    {allUsers.map((member) => (
      <label
        key={member.id}
        className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200"
      >
        <input
          type="checkbox"
          checked={attendedMembers.includes(member.id)}
          onChange={() => toggleMember(member.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>{member.name}</span>
      </label>
    ))}
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
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="file-upload"
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
                {uploading ? 'Saving...' : editingId ? 'Update Note' : 'Add Note'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ date: new Date().toISOString().split('T')[0], content: '', files: [] });
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {project.meetingNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No meeting notes yet</p>
            {canEdit && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add the first note
              </button>
            )}
          </div>
        ) : (
          project.meetingNotes
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((note) => (
              <div key={note.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(note.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{getUserName(note.createdBy)}</span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.content}</div>
                {note.files && note.files.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments:</p>
                    <div className="space-y-1">
                      {note.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <File className="h-4 w-4" />
                          <span>{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default MeetingNotes;