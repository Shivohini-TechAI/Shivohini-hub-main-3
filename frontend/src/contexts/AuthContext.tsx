import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ================= USER TYPE =================
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'project_manager' | 'team_leader' | 'team_member';
  phone?: string;
  whatsapp?: string;
  strongAreas?: string;
}

// ================= SIGNUP TYPE =================
interface SignupData {
  name: string;
  email: string;
  password: string;
  phone: string;
  whatsapp: string;
  strongAreas: string;
  role: 'team_member' | 'team_leader' | 'project_manager' | 'admin';
}

// ================= CONTEXT TYPE =================
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (id: string, data: any) => Promise<any>;
}

const API = "/api";

// ================= CONTEXT =================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// ================= PROVIDER =================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // ✅ START as true — wait until session check is done

  // ================= LOGIN =================
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return { success: false, error: result.error || "Login failed" };
      }

      localStorage.setItem("token", result.session.access_token);
      setUser(result.user);

      return { success: true };

    } catch (err) {
      return { success: false, error: "Server error" };
    } finally {
      setLoading(false);
    }
  };

  // ================= SIGNUP =================
  const signup = async (data: SignupData) => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error("Signup error:", result);
        return false;
      }

      localStorage.setItem("token", result.session.access_token);
      setUser(result.user);

      return true;

    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // ================= UPDATE PROFILE =================
  const updateUserProfile = async (id: string, data: any) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/users/profile/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Update failed");
      }

      setUser(prev => prev ? { ...prev, ...result } : prev);

      return result;

    } catch (err) {
      console.error("Update profile error:", err);
      throw err;
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // ================= INIT SESSION =================
  // ✅ loading starts true, only set false AFTER session check completes
  // This prevents components from rendering with user=null and skipping data fetches
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false); // no token = not logged in, done
      return;
    }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          // token invalid/expired
          localStorage.removeItem("token");
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false); // ✅ always set false when done
      });

  }, []);

  // ✅ Don't render children until session check is complete
  // This prevents useEffect([user]) in child components firing with user=null
  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };