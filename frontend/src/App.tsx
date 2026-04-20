import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import ArchivePage from './pages/ArchivePage';
import PersonalTodos from './pages/PersonalTodos';
import ClientCRM from './pages/ClientCRM';
import TerminatedClients from './pages/TerminatedClients';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceSeedDefaultsPage from './pages/InvoiceSeedDefaultsPage';
import CalendarPage from './pages/CalendarPage';
import OfferLetterCreator from './pages/OfferLetterCreator';
import AppreciationCertificateCreator from './pages/AppreciationCertificateCreator';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading application...</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">This should only take a few seconds</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Refresh if stuck
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* ✅ AUTH ROUTES */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

        {/* ✅ FIXED: allow access even if user exists */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ✅ PROTECTED APP */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="personal-todos" element={<PersonalTodos />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="project/:id" element={<ProjectDetails />} />
          <Route path="archive" element={<ArchivePage />} />

          <Route path="users" element={
            <ProtectedRoute requiredRole={['admin', 'project_manager']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="analytics" element={
            <ProtectedRoute requiredRole={['admin', 'project_manager', 'team_leader', 'team_member']}>
              <Analytics />
            </ProtectedRoute>
          } />

          <Route path="admin/client-crm" element={
            <ProtectedRoute requiredRole={['admin']}>
              <ClientCRM />
            </ProtectedRoute>
          } />

          <Route path="admin/terminated-clients" element={
            <ProtectedRoute requiredRole={['admin']}>
              <TerminatedClients />
            </ProtectedRoute>
          } />

          <Route path="admin/invoices" element={
            <ProtectedRoute requiredRole={['admin']}>
              <InvoicesPage />
            </ProtectedRoute>
          } />

          <Route path="admin/invoices/settings" element={
            <ProtectedRoute requiredRole={['admin']}>
              <InvoiceSeedDefaultsPage />
            </ProtectedRoute>
          } />

          <Route path="admin/offer-letters" element={
            <ProtectedRoute requiredRole={['admin', 'project_manager']}>
              <OfferLetterCreator />
            </ProtectedRoute>
          } />

          <Route path="admin/appreciation-certificates" element={
            <ProtectedRoute requiredRole={['admin', 'project_manager']}>
              <AppreciationCertificateCreator />
            </ProtectedRoute>
          } />
        </Route>

      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <NotificationProvider>
            <AppContent />
            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;