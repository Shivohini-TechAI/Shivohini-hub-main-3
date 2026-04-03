import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {} from '../lib/api';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  strongAreas?: string;
  role: 'admin' | 'project_manager' | 'team_leader' | 'team_member';
  projectName?: string;
  projectDescription?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  projectSubmittedAt?: string;
  projectDetails?: {
    projectName: string;
    projectDescription: string;
    startDate: string;
    endDate: string;
    submittedAt?: string;
  };
  createdAt: string;
  personalTodos: PersonalTodo[];
}

export interface PersonalTodo {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface SystemSettings {
  maxProjectManagers: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, phone: string, whatsapp: string, strongAreas?: string, role?: User['role'], roleCode?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, role: User['role']) => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  getAllUsers: () => User[];
  updateUserStrongAreas: (userId: string, strongAreas: string) => Promise<void>;
  addPersonalTodo: (userId: string, todo: Omit<PersonalTodo, 'id' | 'createdAt'>) => Promise<void>;
  updatePersonalTodo: (userId: string, todoId: string, updates: Partial<PersonalTodo>) => Promise<void>;
  deletePersonalTodo: (userId: string, todoId: string) => Promise<void>;
  updateUserProfile: (userId: string, profileData: { name: string; email: string; phone: string; whatsapp: string; strongAreas: string }) => Promise<void>;
  getSystemSettings: () => SystemSettings;
  updateSystemSettings: (settings: SystemSettings) => void;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  updateUserProjectDetails: (userId: string, projectDetails: { projectName: string; projectDescription: string; startDate: string; endDate: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ maxProjectManagers: 5 });

  useEffect(() => {
    // Load system settings from localStorage
    const savedSettings = localStorage.getItem('shivohub_settings');
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }

    const initializeAuth = async () => {
      try {
        console.log('🔄 Auth init: Initializing auth...');

        // Get the current session
        const { data: { session }, error: sessionError } = await api.auth.getSession();

        // If there's a session error or no session, set to logged out state
        if (sessionError || !session) {
          console.log('🔄 Auth init: No valid session found');
          setUser(null);
          setUsers([]);
          return;
        }

        console.log('🔄 Auth init: Session found, fetching profile for:', session.user.id);

        // Fetch the user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        // If profile fetch fails or no profile exists, sign out
        if (profileError || !profile) {
          console.error('❌ Auth init profile error:', profileError);
          await api.auth.signOut();
          setUser(null);
          setUsers([]);
          return;
        }

        // Fetch personal todos
        const { data: todos } = await supabase
          .from('personal_todos')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        const userProfile: User = {
          id: profile.id,
          email: session.user.email!,
          name: profile.name,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          strongAreas: profile.strong_areas,
          role: profile.role,
          projectName: profile.project_name,
          projectDescription: profile.project_description,
          projectStartDate: profile.project_start_date,
          projectEndDate: profile.project_end_date,
          projectSubmittedAt: profile.project_submitted_at,
          createdAt: profile.created_at,
          personalTodos: todos?.map(todo => ({
            id: todo.id,
            title: todo.title,
            completed: todo.completed,
            dueDate: todo.due_date,
            createdAt: todo.created_at
          })) || []
        };

        console.log('✅ Auth init: profile loaded -', profile.email);
        setUser(userProfile);

        // Fetch all users if admin/PM
        if (userProfile.role === 'admin' || userProfile.role === 'project_manager') {
          await fetchAllUsers();
        }

        console.log('✅ Auth init: complete');
      } catch (error) {
        console.error('❌ Auth init exception:', error);
        await api.auth.signOut();
        setUser(null);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth changes (but don't block loading)
    const { data: { subscription } } = api.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        // Only update user state if this is a new sign-in (not the initial load)
        // The initialization effect handles the initial load
        (async () => {
          try {
            console.log('🔄 Auth change: User signed in, fetching profile...');

            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError || !profile) {
              console.error('❌ Auth change: Profile error', profileError);
              await api.auth.signOut();
              setUser(null);
              setUsers([]);
              return;
            }

            const { data: todos } = await supabase
              .from('personal_todos')
              .select('*')
              .eq('user_id', session.user.id)
              .order('created_at', { ascending: false });

            const userProfile: User = {
              id: profile.id,
              email: session.user.email!,
              name: profile.name,
              phone: profile.phone,
              whatsapp: profile.whatsapp,
              strongAreas: profile.strong_areas,
              role: profile.role,
              projectName: profile.project_name,
              projectDescription: profile.project_description,
              projectStartDate: profile.project_start_date,
              projectEndDate: profile.project_end_date,
              projectSubmittedAt: profile.project_submitted_at,
              createdAt: profile.created_at,
              personalTodos: todos?.map(todo => ({
                id: todo.id,
                title: todo.title,
                completed: todo.completed,
                dueDate: todo.due_date,
                createdAt: todo.created_at
              })) || []
            };

            console.log('✅ Auth change: profile loaded -', profile.email);
            setUser(userProfile);

            if (userProfile.role === 'admin' || userProfile.role === 'project_manager') {
              await fetchAllUsers();
            }
          } catch (error) {
            console.error('❌ Auth change exception:', error);
            await api.auth.signOut();
            setUser(null);
            setUsers([]);
          }
        })();
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Auth change: User signed out');
        setUser(null);
        setUsers([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const fetchAllUsers = async () => {
    try {
      console.log('Fetching all users...');
      
      // Try to fetch all users - RLS should allow admin/PM access
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Don't set empty array, keep existing users
        return;
      }

      console.log('Fetched profiles:', profiles);

      // Fetch all personal todos separately
      const { data: allTodos, error: todosError } = await supabase
        .from('personal_todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (todosError) {
        console.error('Error fetching todos:', todosError);
        // Don't throw error for todos, just log it
      }

      const allUsers: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        name: profile.name,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        strongAreas: profile.strong_areas,
        role: profile.role,
        projectName: profile.project_name,
        projectDescription: profile.project_description,
        projectStartDate: profile.project_start_date,
        projectEndDate: profile.project_end_date,
        projectSubmittedAt: profile.project_submitted_at,
        createdAt: profile.created_at,
        projectDetails: profile.project_name ? {
          projectName: profile.project_name,
          projectDescription: profile.project_description,
          startDate: profile.project_start_date,
          endDate: profile.project_end_date,
          submittedAt: profile.project_submitted_at
        } : undefined,
        personalTodos: allTodos?.filter(todo => todo.user_id === profile.id).map(todo => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          dueDate: todo.due_date,
          createdAt: todo.created_at
        })) || []
      })) || [];

      console.log('Processed users:', allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Starting login for:', email);

      // Step 1: Clear any existing session
      console.log('🧹 Clearing any existing session...');
      await api.auth.signOut();

      // Step 2: Sign in with password
      console.log('🔑 Attempting to sign in...');
      const { data, error } = await api.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Auth error:', error);
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid credentials')) {
          return { success: false, error: 'Invalid email or password' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.error('❌ No user returned from auth');
        return { success: false, error: 'Login failed' };
      }

      // Step 3: Fetch profile directly
      console.log('✅ Auth successful, fetching profile...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('❌ Profile not found or error');
        await api.auth.signOut();
        setUser(null);
        return { success: false, error: 'Unable to load your profile' };
      }

      // Fetch personal todos
      const { data: todos } = await supabase
        .from('personal_todos')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false });

      const userProfile: User = {
        id: profile.id,
        email: data.user.email!,
        name: profile.name,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        strongAreas: profile.strong_areas,
        role: profile.role,
        projectName: profile.project_name,
        projectDescription: profile.project_description,
        projectStartDate: profile.project_start_date,
        projectEndDate: profile.project_end_date,
        projectSubmittedAt: profile.project_submitted_at,
        createdAt: profile.created_at,
        personalTodos: todos?.map(todo => ({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          dueDate: todo.due_date,
          createdAt: todo.created_at
        })) || []
      };

      setUser(userProfile);

      // Fetch all users if admin/PM
      if (userProfile.role === 'admin' || userProfile.role === 'project_manager') {
        await fetchAllUsers();
      }

      console.log('✅ Login complete!');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Unexpected login error:', error);
      await api.auth.signOut();
      setUser(null);
      return { success: false, error: error.message || 'An error occurred during login' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    whatsapp: string,
    strongAreas: string = '',
    role: User['role'] = 'team_member',
    roleCode?: string
  ): Promise<boolean> => {
    try {
      // Check if user already exists first
      const { data: existingUser } = await api.auth.getUser();
      if (existingUser?.user?.email === email) {
        throw new Error('User already registered with this email');
      }

      // Check project manager limit
      if (role === 'project_manager') {
        const currentPMCount = users.filter(u => u.role === 'project_manager').length;
        if (currentPMCount >= systemSettings.maxProjectManagers) {
          throw new Error(`Maximum ${systemSettings.maxProjectManagers} project managers allowed`);
        }
      }

      const { data, error } = await api.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            whatsapp,
            strong_areas: strongAreas,
            role
          }
        }
      });

      if (error) {
        if (error.message === 'User already registered') {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        throw error;
      }

      if (data.user) {
        console.log('User created successfully with role:', role);

        // Increment signup code usage if code was provided
        if (roleCode) {
          try {
            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-signup-code-usage`;
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code: roleCode.trim().toUpperCase() }),
            });

            if (!response.ok) {
              console.error('Increment code usage returned status:', response.status);
            }

            const incrementResult = await response.json();
            if (!incrementResult.success) {
              console.error('Failed to increment code usage:', incrementResult.error);
            }
          } catch (err) {
            console.error('Error incrementing code usage:', err);
            throw new Error('Failed to process signup code. Please contact support.');
          }
        }

        // Refresh users list
        await fetchAllUsers();
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await api.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
      setUser(null);
    }
  };

  const updateUserRole = async (userId: string, role: User['role']) => {
    try {
      // Check constraints
      if (role === 'admin') {
        const existingAdmin = users.find(u => u.role === 'admin' && u.id !== userId);
        if (existingAdmin) {
          throw new Error('Only one admin account is allowed');
        }
      }

      if (role === 'project_manager') {
        const currentPMCount = users.filter(u => u.role === 'project_manager' && u.id !== userId).length;
        if (currentPMCount >= systemSettings.maxProjectManagers) {
          throw new Error(`Maximum ${systemSettings.maxProjectManagers} project managers allowed`);
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      // Refresh users list
      await fetchAllUsers();

      // Update current user if it's their role being changed
      if (user?.id === userId) {
        setUser(prev => prev ? { ...prev, role } : null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Prevent self-deletion
      if (user?.id === userId) {
        return false;
      }

      const { error } = await api.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Refresh users list
      await fetchAllUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const updateUserStrongAreas = async (userId: string, strongAreas: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ strong_areas: strongAreas })
        .eq('id', userId);

      if (error) throw error;

      // Refresh users list
      await fetchAllUsers();

      // Update current user if it's their profile being changed
      if (user?.id === userId) {
        setUser(prev => prev ? { ...prev, strongAreas } : null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update strong areas');
    }
  };

  const updateUserProfile = async (
    userId: string, 
    profileData: { name: string; email: string; phone: string; whatsapp: string; strongAreas: string }
  ) => {
    try {
      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          whatsapp: profileData.whatsapp,
          strong_areas: profileData.strongAreas
        })
        .eq('id', userId);

      if (error) throw error;

      // Update email in auth if changed
      if (user?.email !== profileData.email) {
        const { error: emailError } = await api.auth.updateUser({
          email: profileData.email
        });
        if (emailError) throw emailError;
      }

      // Refresh users list
      await fetchAllUsers();

      // Update current user if it's their profile being changed
      if (user?.id === userId) {
        setUser(prev => prev ? { 
          ...prev, 
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          whatsapp: profileData.whatsapp,
          strongAreas: profileData.strongAreas
        } : null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const addPersonalTodo = async (userId: string, todoData: Omit<PersonalTodo, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('personal_todos')
        .insert({
          user_id: userId,
          title: todoData.title,
          completed: todoData.completed,
          due_date: todoData.dueDate
        })
        .select()
        .single();

      if (error) throw error;

      // Update current user's todos if it's their todo
      if (user?.id === userId && data) {
        const newTodo: PersonalTodo = {
          id: data.id,
          title: data.title,
          completed: data.completed,
          dueDate: data.due_date,
          createdAt: data.created_at
        };

        setUser(prev => prev ? {
          ...prev,
          personalTodos: [newTodo, ...prev.personalTodos]
        } : null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add todo');
    }
  };

  const updatePersonalTodo = async (userId: string, todoId: string, updates: Partial<PersonalTodo>) => {
    try {
      const { error } = await supabase
        .from('personal_todos')
        .update({
          title: updates.title,
          completed: updates.completed,
          due_date: updates.dueDate
        })
        .eq('id', todoId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update current user's todos if it's their todo
      if (user?.id === userId) {
        setUser(prev => prev ? {
          ...prev,
          personalTodos: prev.personalTodos.map(todo =>
            todo.id === todoId ? { ...todo, ...updates } : todo
          )
        } : null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update todo');
    }
  };

  const deletePersonalTodo = async (userId: string, todoId: string) => {
    try {
      const { error } = await supabase
        .from('personal_todos')
        .delete()
        .eq('id', todoId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update current user's todos if it's their todo
      if (user?.id === userId) {
        setUser(prev => prev ? {
          ...prev,
          personalTodos: prev.personalTodos.filter(todo => todo.id !== todoId)
        } : null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete todo');
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await api.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Sign out user to force re-login with new password
      await logout();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  };

  const updateUserProjectDetails = async (
    userId: string, 
    projectDetails: { projectName: string; projectDescription: string; startDate: string; endDate: string }
  ) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          project_name: projectDetails.projectName,
          project_description: projectDetails.projectDescription,
          project_start_date: projectDetails.startDate,
          project_end_date: projectDetails.endDate,
          project_submitted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update current user if it's their details being changed
      if (user?.id === userId) {
        setUser(prev => prev ? {
          ...prev,
          projectName: projectDetails.projectName,
          projectDescription: projectDetails.projectDescription,
          projectStartDate: projectDetails.startDate,
          projectEndDate: projectDetails.endDate,
          projectSubmittedAt: new Date().toISOString()
        } : null);
      }

      // Refresh users list
      await fetchAllUsers();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update project details');
    }
  };

  const getAllUsers = () => users;

  const getSystemSettings = () => systemSettings;

  const updateSystemSettings = (settings: SystemSettings) => {
    setSystemSettings(settings);
    localStorage.setItem('shivohub_settings', JSON.stringify(settings));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      updateUserRole,
      deleteUser,
      getAllUsers,
      updateUserStrongAreas,
      addPersonalTodo,
      updatePersonalTodo,
      deletePersonalTodo,
      updateUserProfile,
      getSystemSettings,
      updateSystemSettings,
      updateUserPassword,
      updateUserProjectDetails
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };