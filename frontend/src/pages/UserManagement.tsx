import React, { useState } from 'react';
import { Users, Crown, Shield, User, Search, Filter, Trash2, Edit, Save, X, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../contexts/ProjectContext';

const UserManagement: React.FC = () => {
  const { user, getAllUsers, updateUserRole, deleteUser, updateUserStrongAreas, getSystemSettings, updateSystemSettings } = useAuth();
  const { projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'project_manager' | 'team_leader' | 'team_member'>('all');
  const [editingStrongAreas, setEditingStrongAreas] = useState<string | null>(null);
  const [strongAreasValue, setStrongAreasValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [maxPMSetting, setMaxPMSetting] = useState(getSystemSettings().maxProjectManagers);

  const allUsers = getAllUsers();

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    try {
      updateUserRole(userId, newRole as any);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = (targetUser: any) => {
    if (window.confirm(`Are you sure you want to delete ${targetUser.name}? This action cannot be undone.`)) {
      const success = deleteUser(targetUser.id);
      if (!success) {
        alert('Cannot delete your own account.');
      }
    }
  };

  const handleEditStrongAreas = (targetUser: any) => {
    setEditingStrongAreas(targetUser.id);
    setStrongAreasValue(targetUser.strongAreas || '');
  };

  const handleSaveStrongAreas = (userId: string) => {
    updateUserStrongAreas(userId, strongAreasValue);
    setEditingStrongAreas(null);
    setStrongAreasValue('');
  };

  const handleCancelEdit = () => {
    setEditingStrongAreas(null);
    setStrongAreasValue('');
  };

  const handleSaveSettings = () => {
    updateSystemSettings({ maxProjectManagers: maxPMSetting });
    setShowSettings(false);
  };

  const getUserTaskStats = (userId: string) => {
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;

    projects.forEach(project => {
      const userTasks = project.tasks.filter(task => task.assignedTo === userId);
      totalTasks += userTasks.length;
      completedTasks += userTasks.filter(task => task.completed).length;
      overdueTasks += userTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length;
    });

    return { totalTasks, completedTasks, overdueTasks };
  };
//changes done
  const getAttendanceStats = (userId: string) => {
  let totalMeetings = 0;
  let attendedMeetings = 0;

  projects.forEach(project => {
    // OPTIONAL SAFETY (recommended)
    if (!project.assignedMembers?.includes(userId)) return; //changed here

    project.meetingNotes?.forEach(meeting => {
      totalMeetings++;

      if (meeting.attendedMembers?.includes(userId)) {
        attendedMeetings++;
      }
    });
  });

  const percentage =
    totalMeetings === 0
      ? 0
      : Math.round((attendedMeetings / totalMeetings) * 100);

  return { attendedMeetings, totalMeetings, percentage };
};


  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'project_manager': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'team_leader': return <Users className="h-4 w-4 text-teal-600" />;
      case 'team_member': return <User className="h-4 w-4 text-green-600" />;
      default: return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'team_leader': return 'bg-teal-100 text-teal-800';
      case 'team_member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEditRole = (targetUser: any) => {
    return user?.role === 'admin' || 
           (user?.role === 'project_manager' && (targetUser.role === 'team_member' || targetUser.role === 'team_leader'));
  };

  const canDeleteUser = (targetUser: any) => {
    // Cannot delete yourself
    if (user?.id === targetUser.id) return false;
    
    // Admin can delete Project Managers and Team Members
    if (user?.role === 'admin' && (targetUser.role === 'project_manager' || targetUser.role === 'team_leader' || targetUser.role === 'team_member')) {
      return true;
    }
    
    // Project Manager can delete only Team Members
    if (user?.role === 'project_manager' && (targetUser.role === 'team_member' || targetUser.role === 'team_leader')) {
      return true;
    }
    
    return false;
  };
  return (
    <div className="max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage user roles and permissions</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all flex items-center space-x-2 shadow-lg"
            >
              <Settings className="h-4 w-4" />
              <span>System Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {allUsers.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Managers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {allUsers.filter(u => u.role === 'project_manager').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Leaders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {allUsers.filter(u => u.role === 'team_leader').length}
              </p>
            </div>
          </div>
        </div>

        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {allUsers.filter(u => u.role === 'team_member').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="team_leader">Team Leader</option>
                <option value="team_member">Team Member</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Strong Areas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project Names
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Task Stats
                </th>
                {/* ADDED: Attendance column to show meeting participation percentage */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
  Attendance
</th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((targetUser) => (
                <tr key={targetUser.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-purple-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600 dark:text-gray-300" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{targetUser.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{targetUser.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      Phone: {targetUser.phone || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      WhatsApp: {targetUser.whatsapp || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingStrongAreas === targetUser.id ? (
                      <div className="flex items-center space-x-2">
                        <textarea
                          value={strongAreasValue}
                          onChange={(e) => setStrongAreasValue(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          rows={2}
                        />
                        <button
                          onClick={() => handleSaveStrongAreas(targetUser.id)}
                          className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between max-w-xs">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {targetUser.strongAreas || 'Not specified'}
                        </div>
                        {(user?.role === 'admin' || user?.role === 'project_manager') && (
                          <button
                            onClick={() => handleEditStrongAreas(targetUser)}
                            className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {targetUser.projectDetails?.projectName || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                      {targetUser.projectDetails?.projectDescription ? (
                        <div className="truncate" title={targetUser.projectDetails.projectDescription}>
                          {targetUser.projectDetails.projectDescription}
                        </div>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {targetUser.projectDetails?.startDate && targetUser.projectDetails?.endDate ? (
                        <div>
                          <div>{new Date(targetUser.projectDetails.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            to {new Date(targetUser.projectDetails.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const stats = getUserTaskStats(targetUser.id);
                      return (
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-gray-100">Total: {stats.totalTasks}</div>
                          <div className="text-green-600 dark:text-green-400">Completed: {stats.completedTasks}</div>
                          <div className="text-red-600 dark:text-red-400">Overdue: {stats.overdueTasks}</div>
                        </div>
                      );
                    })()}
                  </td>
                  {/* Changes done*/}
                  <td className="px-6 py-4 whitespace-nowrap">
  {(() => {
    const attendance = getAttendanceStats(targetUser.id);

    return (
      <div className="text-sm">
        <div className="text-gray-900 dark:text-gray-100">
          {attendance.attendedMeetings}/{attendance.totalMeetings}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {attendance.percentage}%
        </div>
      </div>
    );
  })()}
</td>


                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(targetUser.role)}`}>
                      {getRoleIcon(targetUser.role)}
                      <span className="ml-1 capitalize">{targetUser.role.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(targetUser.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {canEditRole(targetUser) ? (
                        <select
                          value={targetUser.role}
                          onChange={(e) => handleRoleChange(targetUser.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="team_member">Team Member</option>
                         <option value="team_leader">Team Leader</option>
                          <option value="project_manager">Project Manager</option>
                          {user?.role === 'admin' && (
                            <option value="admin">Admin</option>
                          )}
                        </select>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No permissions</span>
                      )}
                      
                      {canDeleteUser(targetUser) && (
                        <button
                          onClick={() => handleDeleteUser(targetUser)}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
          <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or filters</p>
        </div>
      )}

      {/* System Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Project Managers Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxPMSetting}
                  onChange={(e) => setMaxPMSetting(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current Project Managers: {allUsers.filter(u => u.role === 'project_manager').length}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSettings(false);
                  setMaxPMSetting(getSystemSettings().maxProjectManagers);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;