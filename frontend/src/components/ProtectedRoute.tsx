import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, User } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: User['role'][];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  // ⏳ WAIT UNTIL AUTH LOADS
  if (loading) {
    return (
      <div className="text-white text-center mt-10">
        Loading...
      </div>
    );
  }

  // ❌ NOT LOGGED IN
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ ROLE NOT ALLOWED
  if (requiredRole && !requiredRole.includes(user.role)) {

    // 🔁 Redirect based on role
    const roleRedirect: Record<string, string> = {
      admin: "/admin",
      project_manager: "/pm",
      team_leader: "/tl",
      team_member: "/tm"
    };

    return <Navigate to={roleRedirect[user.role] || "/dashboard"} replace />;
  }

  // ✅ ACCESS ALLOWED
  return <>{children}</>;
};

export default ProtectedRoute;