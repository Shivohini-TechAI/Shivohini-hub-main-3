import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Archive,
  Sun,
  Moon,
  CheckSquare,
  Edit,
  FileText,
  XCircle,
  Receipt,
  Calendar,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationPanel from './NotificationPanel';
import EditProfileModal from './EditProfileModal';
import ProjectDetailsForm from './ProjectDetailsForm';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showProjectDetailsForm, setShowProjectDetailsForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout().then(() => {
      navigate('/login');
    }).catch(() => {
      // Force navigation even if logout fails
      navigate('/login');
    });
  };

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'My To-Do', icon: CheckSquare, path: '/personal-todos' },
    ...(user?.role === 'project_manager' || user?.role === 'team_leader' || user?.role === 'team_member'
      ? [{ name: 'Project Details', icon: FileText, action: () => setShowProjectDetailsForm(true) }]
      : []
    ),
    ...(user?.role === 'admin' || user?.role === 'project_manager' ? [{ name: 'Archive', icon: Archive, path: '/archive' }] : []),
    ...(user?.role === 'admin' || user?.role === 'project_manager'
      ? [
          { name: 'Users', icon: Users, path: '/users' },
          { name: 'Analytics', icon: BarChart3, path: '/analytics' }
        ]
      : [
          { name: 'Analytics', icon: BarChart3, path: '/analytics' }
        ]
    ),
    ...(user?.role === 'admin'
      ? [
          { name: 'Client CRM', icon: BarChart3, path: '/admin/client-crm' },
          { name: 'Terminated Clients', icon: XCircle, path: '/admin/terminated-clients' },
          { name: 'Invoices', icon: Receipt, path: '/admin/invoices' }
        ]
      : []
    ),
    ...(user?.role === 'admin' || user?.role === 'project_manager'
      ? [
          { name: 'Offer Letters', icon: FileCheck, path: '/admin/offer-letters' },
          { name: 'Appreciation Certificates', icon: FileText, path: '/admin/appreciation-certificates' }
        ]
      : []
    )
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden dark:bg-gray-900 dark:bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/Real_Logo_V1.png" 
                alt="Shivohini TechAI Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Shivohini-Hub</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shivohini TechAI</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 px-4">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                } else if (item.action) {
                  item.action();
                }
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                item.path && isActive(item.path)
                  ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900 dark:to-blue-900 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-purple-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-2"
          >
            <Edit className="h-5 w-5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="ml-auto flex items-center space-x-4">
              <button
                onClick={() => navigate('/calendar')}
                className={`p-2 rounded-full transition-colors ${
                  isActive('/calendar')
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title="Calendar"
              >
                <Calendar className="h-5 w-5" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {notificationOpen && (
                  <NotificationPanel onClose={() => setNotificationOpen(false)} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {/* Project Details Form Modal */}
      {showProjectDetailsForm && (
        <ProjectDetailsForm onClose={() => setShowProjectDetailsForm(false)} />
      )}
    </div>
  );
};

export default Layout;