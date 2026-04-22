import React, { useState } from 'react';
import { Archive, Search, RotateCcw, GitBranch, Calendar, XCircle, X } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const API = "/api";

const ArchivePage: React.FC = () => {
  const { projects, restoreProject, deleteProject } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Terminate modal state
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminateError, setTerminateError] = useState('');
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

  const archivedProjects = projects.filter(p => p.archivedAt);

  const filteredProjects = archivedProjects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = user?.role === 'admin' || user?.role === 'project_manager';

  const handleRestore = async (id: string) => {
    if (!window.confirm('Restore this project to dashboard?')) return;
    try {
      await restoreProject(id);
      navigate('/dashboard');
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  // 🔥 Terminate project — same logic as ClientCRM terminate
  const openTerminateModal = (id: string) => {
    setTargetProjectId(id);
    setTerminateReason('');
    setTerminateError('');
    setShowTerminateModal(true);
  };

  const handleTerminate = async () => {
    if (!targetProjectId) return;
    if (!terminateReason.trim()) {
      setTerminateError('Please enter a reason to terminate this project.');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/projects/${targetProjectId}/terminate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: terminateReason })
      });

      // Remove from local state
      await deleteProject(targetProjectId);

      setShowTerminateModal(false);
      setTerminateReason('');
      setTerminateError('');
      setTargetProjectId(null);
    } catch (err) {
      console.error("Terminate failed:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Archive</h1>
        <p className="text-gray-500">View, restore, or terminate archived projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Archive className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Archived</p>
              <p className="text-2xl font-bold text-gray-900">{archivedProjects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ongoing (Archived)</p>
              <p className="text-2xl font-bold text-gray-900">{archivedProjects.filter(p => p.status === 'ongoing').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Archive className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed (Archived)</p>
              <p className="text-2xl font-bold text-gray-900">{archivedProjects.filter(p => p.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search archived projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Archive className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No archived projects</h3>
          <p className="text-gray-500">Archived projects will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{project.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                {project.githubUrl && <GitBranch className="h-4 w-4 text-gray-400" />}
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>{(project.assignedMembers || []).length} members</span>
                  <span>Archived: {project.archivedAt ? formatDate(project.archivedAt) : '—'}</span>
                </div>
              </div>

              {/* 🔥 Two buttons: Restore + Terminate */}
              {canManage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestore(project.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="h-4 w-4" /> Restore
                  </button>
                  <button
                    onClick={() => openTerminateModal(project.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <XCircle className="h-4 w-4" /> Terminate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TERMINATE MODAL */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-red-600">Terminate Project</h2>
              <button onClick={() => { setShowTerminateModal(false); setTerminateError(''); setTerminateReason(''); }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              This project will be permanently terminated. This action moves it to terminated records.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for termination <span className="text-red-500">*</span>
              </label>
              <textarea
                value={terminateReason}
                onChange={e => { setTerminateReason(e.target.value); setTerminateError(''); }}
                placeholder="Enter reason..."
                rows={3}
                className="border border-gray-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {terminateError && <p className="text-red-500 text-sm mt-1">{terminateError}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowTerminateModal(false); setTerminateError(''); setTerminateReason(''); }}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Confirm Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;