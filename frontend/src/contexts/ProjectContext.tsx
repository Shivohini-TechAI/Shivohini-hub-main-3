import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API = "http://localhost:5000";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientRequirement?: string;
  status: 'not_started' | 'ongoing' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  endDate?: string;
  githubUrl?: string;
  deploymentLink?: string;
  assignedMembers: string[];
  archivedAt?: string;
  completionNote?: string;
  completedAt?: string;
  meetingNotes?: any[];
  tasks?: Task[];
  progressSteps?: any[];
  costingItems?: any[];
  clientPayments?: any[];
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  getUserProjects: (userId?: string, role?: string) => Project[];
  createProject: (data: any) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  completeProject: (id: string, note: string) => Promise<void>;
  addTask: (projectId: string, data: any) => Promise<void>;
  updateTask: (id: string, data: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addCostingItem: (projectId: string, data: any) => Promise<void>;
  updateCostingItem: (id: string, data: any) => Promise<void>;
  deleteCostingItem: (id: string) => Promise<void>;
  addClientPayment: (projectId: string, data: any) => Promise<void>;
  updateClientPayment: (id: string, data: any) => Promise<void>;
  deleteClientPayment: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within ProjectProvider');
  return context;
};

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`
});

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatProject = (p: any): Project => ({
    id: p.id,
    title: p.title,
    description: p.description || '',
    clientRequirement: p.client_requirement,
    status: p.status,
    createdBy: p.created_by,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    endDate: p.end_date,
    githubUrl: p.github_url,
    deploymentLink: p.deployment_link,
    assignedMembers: p.assigned_members || [],
    archivedAt: p.archived_at,
    completionNote: p.completion_note,
    completedAt: p.completed_at,
    meetingNotes: [],
    tasks: [],
    progressSteps: [],
    costingItems: [],
    clientPayments: []
  });

  const loadProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [activeRes, archivedRes] = await Promise.all([
        fetch(`${API}/projects`, { headers: authHeaders() }),
        fetch(`${API}/projects/archived`, { headers: authHeaders() })
      ]);

      const activeData = await activeRes.json();
      const archivedData = await archivedRes.json();

      if (!Array.isArray(activeData) || !Array.isArray(archivedData)) {
        setError("Invalid server response");
        return;
      }

      const all = [...activeData, ...archivedData].map(formatProject);
      setProjects(all);
    } catch (err) {
      console.error("❌ Error loading projects:", err);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const getUserProjects = (userId?: string, role?: string) => {
    const activeProjects = projects.filter(p => !p.archivedAt);
    if (role === 'admin' || role === 'project_manager') return activeProjects;
    if (!userId) return [];
    return activeProjects.filter(p =>
      p.createdBy === userId ||
      (p.assignedMembers || []).includes(userId)
    );
  };

  const createProject = async (data: any): Promise<Project> => {
    const res = await fetch(`${API}/projects`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const newProject = await res.json();
    if (!res.ok) throw new Error(newProject.error || "Failed to create project");
    const formatted = formatProject(newProject);
    setProjects(prev => [formatted, ...prev]);
    return formatted;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    const existing = projects.find(p => p.id === id);
    if (!existing) return;

    const payload = {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      clientRequirement: data.clientRequirement ?? existing.clientRequirement,
      githubUrl: data.githubUrl ?? existing.githubUrl,
      deploymentLink: data.deploymentLink ?? existing.deploymentLink,
      status: data.status ?? existing.status,
      endDate: data.endDate ?? existing.endDate,
      assignedMembers: data.assignedMembers ?? existing.assignedMembers,
      archivedAt: data.archivedAt !== undefined ? data.archivedAt : existing.archivedAt,
      completionNote: data.completionNote ?? existing.completionNote,
      completedAt: data.completedAt ?? existing.completedAt,
    };

    const res = await fetch(`${API}/projects/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error || "Failed to update project");

    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...formatProject(updated) } : p));
  };

  const archiveProject = async (id: string) => {
    const res = await fetch(`${API}/projects/${id}/archive`, {
      method: "PUT",
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Failed to archive");
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, archivedAt: new Date().toISOString() } : p
    ));
  };

  const restoreProject = async (id: string) => {
    const res = await fetch(`${API}/projects/${id}/restore`, {
      method: "PUT",
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("Failed to restore");
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, archivedAt: undefined } : p
    ));
  };

  const completeProject = async (id: string, note: string) => {
    const res = await fetch(`${API}/projects/${id}/complete`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ completionNote: note })
    });
    if (!res.ok) throw new Error("Failed to complete project");
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'completed', completionNote: note } : p
    ));
  };

  const deleteProject = async (id: string) => {
    await fetch(`${API}/projects/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // ================= TASKS =================
  const addTask = async (projectId: string, data: any) => {
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ projectId, title: data.title, assignedTo: data.assignedTo || null, dueDate: data.dueDate || null })
    });
    const newTask = await res.json();
    const formatted: Task = {
      id: newTask.id, projectId: newTask.project_id, title: newTask.title,
      completed: newTask.completed, assignedTo: newTask.assigned_to, dueDate: newTask.due_date
    };
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, tasks: [...(p.tasks || []), formatted] } : p
    ));
  };

  const updateTask = async (id: string, data: any) => {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => ({
      ...p,
      tasks: (p.tasks || []).map(t => t.id === id ? {
        ...t, title: updated.title, completed: updated.completed,
        assignedTo: updated.assigned_to, dueDate: updated.due_date
      } : t)
    })));
  };

  const deleteTask = async (id: string) => {
    await fetch(`${API}/tasks/${id}`, { method: "DELETE", headers: authHeaders() });
    setProjects(prev => prev.map(p => ({
      ...p, tasks: (p.tasks || []).filter(t => t.id !== id)
    })));
  };

  // ================= COSTING =================
  const addCostingItem = async (projectId: string, data: any) => {
    const res = await fetch(`${API}/costing`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ projectId, ...data })
    });
    const item = await res.json();
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, costingItems: [...(p.costingItems || []), item] } : p
    ));
  };

  const updateCostingItem = async (id: string, data: any) => {
    const res = await fetch(`${API}/costing/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => ({
      ...p, costingItems: (p.costingItems || []).map(c => c.id === id ? updated : c)
    })));
  };

  const deleteCostingItem = async (id: string) => {
    await fetch(`${API}/costing/${id}`, { method: "DELETE", headers: authHeaders() });
    setProjects(prev => prev.map(p => ({
      ...p, costingItems: (p.costingItems || []).filter(c => c.id !== id)
    })));
  };

  // ================= PAYMENTS =================
  const addClientPayment = async (projectId: string, data: any) => {
    const res = await fetch(`${API}/payments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ projectId, ...data })
    });
    const payment = await res.json();
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, clientPayments: [...(p.clientPayments || []), payment] } : p
    ));
  };

  const updateClientPayment = async (id: string, data: any) => {
    const res = await fetch(`${API}/payments/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => ({
      ...p, clientPayments: (p.clientPayments || []).map(pay => pay.id === id ? updated : pay)
    })));
  };

  const deleteClientPayment = async (id: string) => {
    await fetch(`${API}/payments/${id}`, { method: "DELETE", headers: authHeaders() });
    setProjects(prev => prev.map(p => ({
      ...p, clientPayments: (p.clientPayments || []).filter(pay => pay.id !== id)
    })));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadProjects();
  }, [user]);

  return (
    <ProjectContext.Provider value={{
      projects, loading, error,
      loadProjects, getUserProjects,
      createProject, updateProject, deleteProject,
      archiveProject, restoreProject, completeProject,
      addTask, updateTask, deleteTask,
      addCostingItem, updateCostingItem, deleteCostingItem,
      addClientPayment, updateClientPayment, deleteClientPayment
    }}>
      {children}
    </ProjectContext.Provider>
  );
};