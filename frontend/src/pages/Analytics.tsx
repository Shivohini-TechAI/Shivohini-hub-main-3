import React, { useMemo } from 'react';
import { TrendingUp, Users, CheckCircle, Clock, BarChart3, PieChart } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../hooks/useAuth';

const Analytics: React.FC = () => {
  const { projects } = useProjects();
  const { user } = useAuth();

  const { getAllUsers } = useAuth();
  const allUsers = getAllUsers();

  // Filter users based on current user's role
  const visibleUsers = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'project_manager') {
      return allUsers;
    } else if (user?.role === 'team_leader' || user?.role === 'team_member') {
      // Team leaders and team members can only see other team leaders and team members
      return allUsers.filter(u => u.role === 'team_leader' || u.role === 'team_member');
    }
    return [];
  }, [allUsers, user?.role]);

  // Filter projects based on user role
  const visibleProjects = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'project_manager') {
      return projects;
    } else if (user?.role === 'team_leader' || user?.role === 'team_member') {
      // Team leaders and team members can only see projects they are assigned to
      return projects.filter(p => 
        p.assignedMembers.includes(user.id) || p.createdBy === user.id
      );
    }
    return [];
  }, [projects, user?.role, user?.id]);

  // Get current user's task statistics
  const getCurrentUserStats = () => {
    if (!user) return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0, completionRate: 0 };
    
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;

    visibleProjects.forEach(project => {
      const userTasks = project.tasks.filter(task => task.assignedTo === user.id);
      totalTasks += userTasks.length;
      completedTasks += userTasks.filter(task => task.completed).length;
      overdueTasks += userTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < new Date()
      ).length;
    });

    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return { totalTasks, completedTasks, pendingTasks, overdueTasks, completionRate };
  };

  // Get team ranking based on task completion rate
  const getTeamRanking = () => {
    return visibleUsers.map(targetUser => {
      let totalTasks = 0;
      let completedTasks = 0;

      visibleProjects.forEach(project => {
        const userTasks = project.tasks.filter(task => task.assignedTo === targetUser.id);
        totalTasks += userTasks.length;
        completedTasks += userTasks.filter(task => task.completed).length;
      });

      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        ...targetUser,
        totalTasks,
        completedTasks,
        completionRate
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  };

  const analytics = useMemo(() => {
    const totalProjects = visibleProjects.length;
    const activeProjects = visibleProjects.filter(p => p.status === 'ongoing').length;
    const completedProjects = visibleProjects.filter(p => p.status === 'completed').length;
    const notStartedProjects = visibleProjects.filter(p => p.status === 'not_started').length;
    
    const totalTasks = visibleProjects.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = visibleProjects.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
    const overdueTasks = visibleProjects.reduce((sum, p) => {
      const overdue = p.tasks.filter(t => 
        !t.completed && 
        t.dueDate && 
        new Date(t.dueDate) < new Date()
      ).length;
      return sum + overdue;
    }, 0);

    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // User workload
    const userWorkload = visibleUsers.map(targetUser => {
      const userTasks = visibleProjects.reduce((sum, p) => {
        return sum + p.tasks.filter(t => t.assignedTo === targetUser.id).length;
      }, 0);
      const userCompletedTasks = visibleProjects.reduce((sum, p) => {
        return sum + p.tasks.filter(t => t.assignedTo === targetUser.id && t.completed).length;
      }, 0);
      const userProjects = visibleProjects.filter(p => 
        p.assignedMembers.includes(targetUser.id) || p.createdBy === targetUser.id
      ).length;

      return {
        ...targetUser,
        taskCount: userTasks,
        completedTasks: userCompletedTasks,
        projectCount: userProjects,
        completionRate: userTasks > 0 ? (userCompletedTasks / userTasks) * 100 : 0
      };
    });

    // Project progress over time
    const projectsByMonth = visibleProjects.reduce((acc, project) => {
      const month = new Date(project.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      notStartedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      taskCompletionRate,
      userWorkload,
      projectsByMonth
    };
  }, [visibleProjects, visibleUsers]);

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    subtitle?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 bg-${color}-100 dark:bg-${color}-900 rounded-lg flex items-center justify-center`}>
            <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Project performance and team productivity insights</p>
      </div>

      {/* Task Overview for Team Leaders and Team Members */}
      {(user?.role === 'team_leader' || user?.role === 'team_member') && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Task Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(() => {
              const userStats = getCurrentUserStats();
              return (
                <>
                  <StatCard
                    title="Total Tasks"
                    value={userStats.totalTasks}
                    icon={BarChart3}
                    color="blue"
                  />
                  <StatCard
                    title="Completed"
                    value={userStats.completedTasks}
                    icon={CheckCircle}
                    color="green"
                  />
                  <StatCard
                    title="Pending"
                    value={userStats.pendingTasks}
                    icon={Clock}
                    color="orange"
                  />
                  <StatCard
                    title="Overdue"
                    value={userStats.overdueTasks}
                    icon={Clock}
                    color="red"
                  />
                  <StatCard
                    title="Task Completion Rate"
                    value={`${userStats.completionRate.toFixed(1)}%`}
                    icon={TrendingUp}
                    color="purple"
                  />
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {(user?.role === 'admin' || user?.role === 'project_manager') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Projects"
          value={analytics.totalProjects}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={analytics.activeProjects}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.completionRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Overdue Tasks"
          value={analytics.overdueTasks}
          icon={Clock}
          color="red"
        />
        </div>
      )}

      {/* Project Status Distribution */}
      {(user?.role === 'admin' || user?.role === 'project_manager') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Status Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{analytics.completedProjects}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProjects > 0 ? (analytics.completedProjects / analytics.totalProjects) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Ongoing</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{analytics.activeProjects}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProjects > 0 ? (analytics.activeProjects / analytics.totalProjects) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Not Started</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{analytics.notStartedProjects}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${analytics.totalProjects > 0 ? (analytics.notStartedProjects / analytics.totalProjects) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">{analytics.completedTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Pending</span>
              <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">{analytics.totalTasks - analytics.completedTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Overdue</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">{analytics.overdueTasks}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Task Completion Rate</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{analytics.taskCompletionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${analytics.taskCompletionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Team Ranking for Team Leaders and Team Members */}
      {(user?.role === 'team_leader' || user?.role === 'team_member') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Ranking (Based on Task Completion Rate)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {getTeamRanking().map((member, index) => (
                  <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${member.id === user?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          index === 2 ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                        {index < 3 && (
                          <span className="ml-2 text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${member.id === user?.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                            {member.name} {member.id === user?.id && '(You)'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{member.role.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {member.totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {member.completedTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                          {member.completionRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              member.completionRate >= 80 ? 'bg-green-500' :
                              member.completionRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${member.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Workload */}
      {(user?.role === 'admin' || user?.role === 'project_manager') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Workload</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.userWorkload.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.projectCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.taskCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.completedTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                        {user.completionRate.toFixed(1)}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${user.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default Analytics;