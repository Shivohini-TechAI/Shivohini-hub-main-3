import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, CheckCircle, Users, GitBranch, Calendar, ExternalLink, X, Search } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import MeetingNotes from '../components/MeetingNotes';
import TaskList from '../components/TaskList';
import ProgressTable from '../components/ProgressTable';
import CostingTable from '../components/CostingTable';
import ClientPayments from '../components/ClientPayments';

const API = "http://localhost:5001";

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, archiveProject, completeProject } = useProjects();
  const { user } = useAuth();

  const [activeModule, setActiveModule] = useState<'overview' | 'tasks' | 'notes' | 'progress' | 'costing' | 'payments'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);

  // 🔥 Project search within page
  const [projectSearch, setProjectSearch] = useState('');
  const allActiveProjects = projects.filter(p => !p.archivedAt);
  const searchedProjects = projectSearch.trim()
    ? allActiveProjects.filter(p =>
        p.title.toLowerCase().includes(projectSearch.toLowerCase())
      )
    : [];

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    clientRequirement: '',
    status: 'not_started' as any,
    endDate: '',
    githubUrl: '',
    deploymentLink: '',
    assignedMembers: [] as string[]
  });

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (project) {
      setEditData({
        title: project.title,
        description: project.description,
        clientRequirement: project.clientRequirement || '',
        status: project.status,
        endDate: project.endDate || '',
        githubUrl: project.githubUrl || '',
        deploymentLink: project.deploymentLink || '',
        assignedMembers: project.assignedMembers || []
      });
    }
  }, [project]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setAllUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/tasks?projectId=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProjectTasks(Array.isArray(data) ? data.filter((t: any) => t.project_id === id) : []);
      } catch (err) {
        console.error("Failed to load project tasks:", err);
      }
    };
    fetchProjectTasks();
  }, [id]);

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* 🔥 Search for project by name when not found */}
        <div className="mb-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search for a Project</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search project by name..."
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            {searchedProjects.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchedProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/project/${p.id}`)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>
                  </button>
                ))}
              </div>
            )}
            {projectSearch && searchedProjects.length === 0 && (
              <p className="mt-3 text-gray-400 text-sm">No projects found matching "{projectSearch}"</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'project_manager' || project.createdBy === user?.id;
  const assignedUsers = allUsers.filter(u => (project.assignedMembers || []).includes(u.id));
  const completedTasks = projectTasks.filter(t => t.completed);
  const pendingTasks = projectTasks.filter(t => !t.completed);
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = pendingTasks.filter(t => t.due_date && t.due_date < today);

  const handleSaveEdit = async () => {
    try {
      await updateProject(project.id, editData);
      setShowEditModal(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveProject(project.id);
      navigate('/archive');
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  const handleComplete = async () => {
    if (!completionNote.trim()) return;
    try {
      await completeProject(project.id, completionNote);
      setShowCompleteModal(false);
    } catch (err) {
      console.error("Complete failed:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const modules = [
    { key: 'overview', label: 'Overview' },
    { key: 'tasks', label: `Tasks (${projectTasks.length})` },
    { key: 'notes', label: 'Notes' },
    { key: 'progress', label: 'Progress' },
    { key: 'costing', label: 'Costing' },
    { key: 'payments', label: 'Payments' },
  ];

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* 🔥 Search by project name inline */}
        {/* <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search project by name..."
            value={projectSearch}
            onChange={e => setProjectSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {projectSearch && searchedProjects.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {searchedProjects.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  onClick={() => { navigate(`/project/${p.id}`); setProjectSearch(''); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                >
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.status.replace('_', ' ')}</p>
                </button>
              ))}
            </div>
          )}
        </div> */}

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-500 text-sm">{project.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Edit className="h-4 w-4" /> Edit Project
          </button>
          {project.status !== 'completed' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4" /> Mark Complete
            </button>
          )}
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            <Archive className="h-4 w-4" /> Archive
          </button>
        </div>
      )}

      {/* Module Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {modules.map(mod => (
          <button
            key={mod.key}
            onClick={() => setActiveModule(mod.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeModule === mod.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {/* Module Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

        {activeModule === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Project Details</h3>

                {project.clientRequirement && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Client Requirement</p>
                    <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{project.clientRequirement}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">End Date</p>
                    <p className="text-gray-800 flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" /> {formatDate(project.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Created</p>
                    <p className="text-gray-800 text-sm">{formatDate(project.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Last Updated</p>
                    <p className="text-gray-800 text-sm">{formatDate(project.updatedAt)}</p>
                  </div>
                </div>

                {project.githubUrl && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">GitHub</p>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                      <GitBranch className="h-3 w-3" /> {project.githubUrl}
                    </a>
                  </div>
                )}

                {project.deploymentLink && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Deployment</p>
                    <a href={project.deploymentLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                      <ExternalLink className="h-3 w-3" /> {project.deploymentLink}
                    </a>
                  </div>
                )}

                {project.completionNote && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completion Note</p>
                    <p className="text-sm text-gray-800 bg-green-50 rounded-lg p-3">{project.completionNote}</p>
                  </div>
                )}
              </div>

              {/* Team */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Team ({assignedUsers.length})
                </h3>
                <div className="space-y-2">
                  {assignedUsers.length === 0 ? (
                    <p className="text-gray-400 text-sm">No members assigned</p>
                  ) : (
                    assignedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{u.role?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Task Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Task Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-100" onClick={() => setActiveModule('tasks')}>
                  <p className="text-2xl font-bold text-blue-600">{projectTasks.length}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center cursor-pointer hover:bg-green-100" onClick={() => setActiveModule('tasks')}>
                  <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center cursor-pointer hover:bg-red-100" onClick={() => setActiveModule('tasks')}>
                  <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </div>

            {pendingTasks.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pending Tasks</h3>
                <div className="space-y-2">
                  {pendingTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-800">{task.title}</span>
                      {task.due_date && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${task.due_date < today ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {task.due_date < today ? 'Overdue' : `Due ${formatDate(task.due_date)}`}
                        </span>
                      )}
                    </div>
                  ))}
                  {pendingTasks.length > 5 && (
                    <button onClick={() => setActiveModule('tasks')} className="text-sm text-blue-600 hover:text-blue-700">
                      View all {pendingTasks.length} tasks →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeModule === 'tasks' && <TaskList projectId={project.id} />}
        {activeModule === 'notes' && <MeetingNotes projectId={project.id} />}
        {activeModule === 'progress' && <ProgressTable projectId={project.id} />}
        {activeModule === 'costing' && <CostingTable projectId={project.id} />}
        {activeModule === 'payments' && <ClientPayments projectId={project.id} />}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit Project</h2>
              <button onClick={() => setShowEditModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  value={editData.title}
                  onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Requirement</label>
                <textarea
                  value={editData.clientRequirement}
                  onChange={e => setEditData(p => ({ ...p, clientRequirement: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editData.status}
                    onChange={e => setEditData(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editData.endDate}
                    onChange={e => setEditData(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                <input
                  value={editData.githubUrl}
                  onChange={e => setEditData(p => ({ ...p, githubUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deployment Link</label>
                <input
                  value={editData.deploymentLink}
                  onChange={e => setEditData(p => ({ ...p, deploymentLink: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Team Members</label>
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.assignedMembers.includes(u.id)}
                        onChange={() => setEditData(p => ({
                          ...p,
                          assignedMembers: p.assignedMembers.includes(u.id)
                            ? p.assignedMembers.filter(mid => mid !== u.id)
                            : [...p.assignedMembers, u.id]
                        }))}
                        className="rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{u.role?.replace('_', ' ')}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-96 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Mark Project as Complete</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={completionNote}
                onChange={e => setCompletionNote(e.target.value)}
                rows={3}
                placeholder="Describe what was accomplished..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-700">
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={!completionNote.trim()}
                className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRM */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-96 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Archive Project?</h2>
            <p className="text-sm text-gray-600">This project will be moved to the Archive page. You can restore or terminate it from there.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveConfirm(false)} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-700">
                Cancel
              </button>
              <button
                onClick={() => { setShowArchiveConfirm(false); handleArchive(); }}
                className="flex-1 bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;