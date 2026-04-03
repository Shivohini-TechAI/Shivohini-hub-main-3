import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, GitBranch, CreditCard as Edit, Archive, Trash2, CheckCircle } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import MeetingNotes from '../components/MeetingNotes';
import TaskList from '../components/TaskList';
import ProgressTable from '../components/ProgressTable';
import CostingTable from '../components/CostingTable';
import ClientPayments from '../components/ClientPayments';
import DeploymentLinkField from '../components/DeploymentLinkField';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, archiveProject, completeProject } = useProjects();
  const { user, getAllUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'progress' | 'costing' | 'payments'>('notes');
  const [isEditing, setIsEditing] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    clientRequirement: '',
    status: 'not_started' as const,
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
        assignedMembers: project.assignedMembers
      });
    }
  }, [project]);

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'project_manager' || project.createdBy === user?.id;

  const canEditDeploymentLink = user?.role === 'admin' ||
                                 user?.role === 'project_manager' ||
                                 user?.role === 'team_leader';

  const handleSaveEdit = () => {
    updateProject(project.id, {
      ...editData,
      githubUrl: editData.githubUrl || undefined,
      deploymentLink: editData.deploymentLink || undefined
    });
    setIsEditing(false);
  };

  const handleUpdateDeploymentLink = async (newLink: string) => {
    await updateProject(project.id, { deploymentLink: newLink });
  };

  const handleArchive = () => {
    archiveProject(project.id);
    setShowArchiveModal(false);
    navigate('/dashboard');
  };

  const handleDelete = () => {
    deleteProject(project.id);
    setShowDeleteModal(false);
    navigate('/dashboard');
  };

  const handleComplete = () => {
    if (!completionNote.trim()) {
      alert('Please enter completion notes before marking the project as completed.');
      return;
    }
    
    completeProject(project.id, completionNote);
    setShowCompleteModal(false);
    setCompletionNote('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white/20 dark:border-gray-700/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 w-full border-b-2 border-gray-300 dark:border-gray-600 focus:border-purple-500 outline-none bg-transparent"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="text-gray-600 dark:text-gray-300 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700"
                    rows={3}
                  />
                  <textarea
                    value={editData.clientRequirement}
                    onChange={(e) => setEditData(prev => ({ ...prev, clientRequirement: e.target.value }))}
                    placeholder="Client Requirements"
                    className="text-gray-600 dark:text-gray-300 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700"
                    rows={3}
                  />
                  <div className="flex items-center space-x-4">
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="ongoing">Ongoing</option>
                    </select>
                    <input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="End Date"
                    />
                    <input
                      type="url"
                      value={editData.githubUrl}
                      onChange={(e) => setEditData(prev => ({ ...prev, githubUrl: e.target.value }))}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="GitHub URL"
                    />
                    <input
                      type="url"
                      value={editData.deploymentLink}
                      onChange={(e) => setEditData(prev => ({ ...prev, deploymentLink: e.target.value }))}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Deployment Link"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowTeamModal(true)}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
                    >
                      Manage Team
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{project.title}</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                  {project.clientRequirement && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Client Requirements:</h3>
                      <p className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-wrap">{project.clientRequirement}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-1" />
                      {(project.assignedMembers || []).length} members
                    </div>
                    
                    {project.endDate && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {formatDate(project.endDate)}
                      </div>
                    )}
                    
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <GitBranch className="h-4 w-4 mr-1" />
                        GitHub Repository
                      </a>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <DeploymentLinkField
                      deploymentLink={project.deploymentLink}
                      canEdit={canEditDeploymentLink}
                      onUpdate={handleUpdateDeploymentLink}
                      variant="full"
                    />
                  </div>

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Created on {formatDate(project.createdAt)}
                  </div>
                </>
              )}
            </div>

            {!isEditing && canEdit && (
              <div className="flex items-center space-x-2">
                {project.status !== 'completed' && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Mark as Completed"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  title="Edit Project"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {!project.archivedAt && (
                  <button
                    onClick={() => setShowArchiveModal(true)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    title="Archive Project"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Meeting Notes ({project.meetingNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              To-Do List ({project.tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'progress'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Progress ({project.progressSteps.length})
            </button>
            <button
              onClick={() => setActiveTab('costing')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'costing'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Costing to Scale ({project.costingItems?.length || 0})
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Client Payments ({project.clientPayments?.length || 0})
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'notes' && <MeetingNotes projectId={project.id} />}
          {activeTab === 'tasks' && <TaskList projectId={project.id} />}
          {activeTab === 'progress' && <ProgressTable projectId={project.id} />}
          {activeTab === 'costing' && <CostingTable projectId={project.id} />}
          {activeTab === 'payments' && <ClientPayments projectId={project.id} />}
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Archive Project</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to archive this project? This will pause the project and move it to the archive section.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Archive Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Project</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this project? This action cannot be undone and all project data will be permanently lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Project Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Complete Project</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Please provide completion notes before marking this project as completed:
            </p>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={4}
              placeholder="Enter completion notes, achievements, and final remarks..."
              required
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompletionNote('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Manage Team Members</h3>
            <div className="max-h-64 overflow-y-auto">
              {getAllUsers().filter(u => u.role === 'team_member' || u.role === 'team_leader').map((member) => (
                <label key={member.id} className="flex items-center space-x-2 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.assignedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditData(prev => ({
                          ...prev,
                          assignedMembers: [...prev.assignedMembers, member.id]
                        }));
                      } else {
                        setEditData(prev => ({
                          ...prev,
                          assignedMembers: prev.assignedMembers.filter(id => id !== member.id)
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{member.name} ({member.email})</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;