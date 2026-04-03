import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Types
export interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  files?: FileAttachment[];
}

export interface MeetingNote {
  id: string;
  projectId: string;
  date: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  files?: FileAttachment[];
  attendedMembers?: string[]; //  ADDED THIS
}

export interface ProgressStep {
  id: string;
  projectId: string;
  step: string;
  responsible?: string;
  startDate?: string;
  endDate?: string;
  status: 'not_started' | 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CostingItem {
  id: string;
  projectId: string;
  productService: string;
  quantity: number;
  currency: string;
  amount: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPayment {
  id: string;
  projectId: string;
  clientName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
  path: string;
  uploadedBy: string;
  taskId?: string;
  meetingNoteId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientRequirement?: string;
  status: 'not_started' | 'ongoing' | 'completed';
  endDate?: string;
  githubUrl?: string;
  deploymentLink?: string;
  createdBy: string;
  completionNote?: string;
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignedMembers: string[];
  tasks: Task[];
  meetingNotes: MeetingNote[];
  progressSteps: ProgressStep[];
  costingItems: CostingItem[];
  clientPayments: ClientPayment[];
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'meetingNotes' | 'progressSteps' | 'costingItems' | 'clientPayments' | 'fileAttachments'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  getUserProjects: (userId: string, userRole: string) => Project[];

  // Task methods
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addTask: (projectId: string, taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<Task>;

  // Meeting notes methods
  createMeetingNote: (note: Omit<MeetingNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MeetingNote>;
  updateMeetingNote: (id: string, updates: Partial<MeetingNote>) => Promise<void>;
  deleteMeetingNote: (id: string) => Promise<void>;
  addMeetingNote: (projectId: string, noteData: Omit<MeetingNote, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<MeetingNote>;

  // Progress steps methods
  createProgressStep: (step: Omit<ProgressStep, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProgressStep>;
  updateProgressStep: (id: string, updates: Partial<ProgressStep>) => Promise<void>;
  deleteProgressStep: (id: string) => Promise<void>;
  addProgressStep: (projectId: string, stepData: Omit<ProgressStep, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<ProgressStep>;

  // Costing methods
  createCostingItem: (item: Omit<CostingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CostingItem>;
  updateCostingItem: (id: string, updates: Partial<CostingItem>) => Promise<void>;
  deleteCostingItem: (id: string) => Promise<void>;
  addCostingItem: (projectId: string, itemData: Omit<CostingItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<CostingItem>;

  // Client payments methods
  createClientPayment: (payment: Omit<ClientPayment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ClientPayment>;
  updateClientPayment: (id: string, updates: Partial<ClientPayment>) => Promise<void>;
  deleteClientPayment: (id: string) => Promise<void>;
  addClientPayment: (projectId: string, paymentData: Omit<ClientPayment, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<ClientPayment>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const initializeProjects = async () => {
    if (!user) {
      console.log('🚫 No user found, skipping project initialization');
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log('⏰ Project initialization timeout - forcing completion');
      setLoading(false);
    }, 8000); // 8 second timeout

    try {
      console.log('🔄 Initializing projects...');
      await loadProjects();
      clearTimeout(timeoutId);
      console.log('✅ Projects initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize projects');
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      console.log('📊 Loading projects from database...');
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          tasks(*, file_attachments(*)),
          meeting_notes(*, file_attachments(*)),
          progress_steps(*),
          costing_items(*),
          client_payments(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Database error:', fetchError);
        throw fetchError;
      }

      console.log('📊 Raw projects data:', data);

      const formattedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        clientRequirement: project.client_requirement,
        status: project.status,
        endDate: project.end_date,
        githubUrl: project.github_url,
        deploymentLink: project.deployment_link,
        createdBy: project.created_by,
        completionNote: project.completion_note,
        completedAt: project.completed_at,
        archivedAt: project.archived_at,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        assignedMembers: project.assigned_members || [],
        tasks: (project.tasks || []).map((task: any) => ({
          id: task.id,
          projectId: task.project_id,
          title: task.title,
          completed: task.completed,
          assignedTo: task.assigned_to,
          dueDate: task.due_date,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          files: (task.file_attachments || []).map((file: any) => ({
            id: file.id,
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size,
            path: file.path,
            uploadedBy: file.uploaded_by,
            taskId: file.task_id,
            meetingNoteId: file.meeting_note_id,
            createdAt: file.created_at,
          })),
        })),
        meetingNotes: (project.meeting_notes || []).map((note: any) => ({
          id: note.id,
          projectId: note.project_id,
          date: note.date,
          content: note.content,
          createdBy: note.created_by,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          attendedMembers: note.attended_members || [], // THIS updated
          files: (note.file_attachments || []).map((file: any) => ({
            id: file.id,
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size,
            path: file.path,
            uploadedBy: file.uploaded_by,
            taskId: file.task_id,
            meetingNoteId: file.meeting_note_id,
            createdAt: file.created_at,
          })),
        })),
        progressSteps: (project.progress_steps || []).map((step: any) => ({
          id: step.id,
          projectId: step.project_id,
          step: step.step,
          responsible: step.responsible,
          startDate: step.start_date,
          endDate: step.end_date,
          status: step.status,
          createdAt: step.created_at,
          updatedAt: step.updated_at,
        })),
        costingItems: (project.costing_items || []).map((item: any) => ({
          id: item.id,
          projectId: item.project_id,
          productService: item.product_service,
          quantity: item.quantity,
          currency: item.currency,
          amount: parseFloat(item.amount),
          comment: item.comment,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        clientPayments: (project.client_payments || []).map((payment: any) => ({
          id: payment.id,
          projectId: payment.project_id,
          clientName: payment.client_name,
          amount: parseFloat(payment.amount),
          currency: payment.currency,
          paymentDate: payment.payment_date,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        })),
      }));

      console.log('✅ Formatted projects:', formattedProjects);
      setProjects(formattedProjects);
    } catch (err) {
      console.error('❌ Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      throw err;
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'meetingNotes' | 'progressSteps' | 'costingItems' | 'clientPayments' | 'fileAttachments'>): Promise<Project> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          client_requirement: projectData.clientRequirement,
          status: projectData.status,
          end_date: projectData.endDate,
          github_url: projectData.githubUrl,
          deployment_link: projectData.deploymentLink,
          created_by: projectData.createdBy,
          assigned_members: projectData.assignedMembers,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description,
        clientRequirement: data.client_requirement,
        status: data.status,
        endDate: data.end_date,
        githubUrl: data.github_url,
        deploymentLink: data.deployment_link,
        createdBy: data.created_by,
        completionNote: data.completion_note,
        completedAt: data.completed_at,
        archivedAt: data.archived_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        assignedMembers: data.assigned_members || [],
        tasks: [],
        meetingNotes: [],
        progressSteps: [],
        costingItems: [],
        clientPayments: [],
      };

      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: updates.title,
          description: updates.description,
          client_requirement: updates.clientRequirement,
          status: updates.status,
          end_date: updates.endDate,
          github_url: updates.githubUrl,
          deployment_link: updates.deploymentLink,
          completion_note: updates.completionNote,
          completed_at: updates.completedAt,
          assigned_members: updates.assignedMembers,
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => 
        project.id === id ? { ...project, ...updates } : project
      ));
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const archiveProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => 
        project.id === id ? { ...project, archivedAt: new Date().toISOString() } : project
      ));
    } catch (err) {
      console.error('Error archiving project:', err);
      throw err;
    }
  };

  const getUserProjects = (userId: string, userRole: string): Project[] => {
    console.log('🔍 Getting user projects for:', { userId, userRole });
    console.log('📊 Total projects available:', projects.length);
    
    if (userRole === 'admin' || userRole === 'project_manager') {
      console.log('👑 Admin/PM - showing all projects');
      return projects.filter(p => !p.archivedAt);
    }
    
    const userProjects = projects.filter(p => 
      !p.archivedAt && (
        p.createdBy === userId || 
        (p.assignedMembers && p.assignedMembers.includes(userId))
      )
    );
    
    console.log('👤 User projects filtered:', userProjects.length);
    return userProjects;
  };

  // Task methods
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: taskData.projectId,
          title: taskData.title,
          completed: taskData.completed,
          assigned_to: taskData.assignedTo,
          due_date: taskData.dueDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        completed: data.completed,
        assignedTo: data.assigned_to,
        dueDate: data.due_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Update local state
      setProjects(prev => prev.map(project => 
        project.id === taskData.projectId 
          ? { ...project, tasks: [...project.tasks, newTask] }
          : project
      ));

      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          completed: updates.completed,
          assigned_to: updates.assignedTo,
          due_date: updates.dueDate,
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        tasks: project.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      })));
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        tasks: project.tasks.filter(task => task.id !== id)
      })));
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  // Meeting notes methods
  const createMeetingNote = async (noteData: Omit<MeetingNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<MeetingNote> => {
    try {
      const { data, error } = await supabase
        .from('meeting_notes')
        .insert({
          project_id: noteData.projectId,
          date: noteData.date,
          content: noteData.content,
          created_by: noteData.createdBy,
           attended_members: noteData.attendedMembers || [],
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: MeetingNote = {
        id: data.id,
        projectId: data.project_id,
        date: data.date,
        content: data.content,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
         attendedMembers: data.attended_members || [], //  updated THIS
      };

      setProjects(prev => prev.map(project => 
        project.id === noteData.projectId 
          ? { ...project, meetingNotes: [...project.meetingNotes, newNote] }
          : project
      ));

      return newNote;
    } catch (err) {
      console.error('Error creating meeting note:', err);
      throw err;
    }
  };

  const updateMeetingNote = async (id: string, updates: Partial<MeetingNote>) => {
    try {
      const { error } = await supabase
        .from('meeting_notes')
        .update({
          date: updates.date,
          content: updates.content,
          attended_members: updates.attendedMembers || [], // Added THIS
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        meetingNotes: project.meetingNotes.map(note => 
          note.id === id ? { ...note, ...updates } : note
        )
      })));
    } catch (err) {
      console.error('Error updating meeting note:', err);
      throw err;
    }
  };

  const deleteMeetingNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meeting_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        meetingNotes: project.meetingNotes.filter(note => note.id !== id)
      })));
    } catch (err) {
      console.error('Error deleting meeting note:', err);
      throw err;
    }
  };

  // Progress steps methods
  const createProgressStep = async (stepData: Omit<ProgressStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgressStep> => {
    try {
      const { data, error } = await supabase
        .from('progress_steps')
        .insert({
          project_id: stepData.projectId,
          step: stepData.step,
          responsible: stepData.responsible,
          start_date: stepData.startDate,
          end_date: stepData.endDate,
          status: stepData.status,
        })
        .select()
        .single();

      if (error) throw error;

      const newStep: ProgressStep = {
        id: data.id,
        projectId: data.project_id,
        step: data.step,
        responsible: data.responsible,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProjects(prev => prev.map(project => 
        project.id === stepData.projectId 
          ? { ...project, progressSteps: [...project.progressSteps, newStep] }
          : project
      ));

      return newStep;
    } catch (err) {
      console.error('Error creating progress step:', err);
      throw err;
    }
  };

  const updateProgressStep = async (id: string, updates: Partial<ProgressStep>) => {
    try {
      const { error } = await supabase
        .from('progress_steps')
        .update({
          step: updates.step,
          responsible: updates.responsible,
          start_date: updates.startDate,
          end_date: updates.endDate,
          status: updates.status,
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        progressSteps: project.progressSteps.map(step => 
          step.id === id ? { ...step, ...updates } : step
        )
      })));
    } catch (err) {
      console.error('Error updating progress step:', err);
      throw err;
    }
  };

  const deleteProgressStep = async (id: string) => {
    try {
      const { error } = await supabase
        .from('progress_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        progressSteps: project.progressSteps.filter(step => step.id !== id)
      })));
    } catch (err) {
      console.error('Error deleting progress step:', err);
      throw err;
    }
  };

  // Costing methods
  const createCostingItem = async (itemData: Omit<CostingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostingItem> => {
    try {
      const { data, error } = await supabase
        .from('costing_items')
        .insert({
          project_id: itemData.projectId,
          product_service: itemData.productService,
          quantity: itemData.quantity,
          currency: itemData.currency,
          amount: itemData.amount,
          comment: itemData.comment,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: CostingItem = {
        id: data.id,
        projectId: data.project_id,
        productService: data.product_service,
        quantity: data.quantity,
        currency: data.currency,
        amount: parseFloat(data.amount),
        comment: data.comment,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProjects(prev => prev.map(project => 
        project.id === itemData.projectId 
          ? { ...project, costingItems: [...project.costingItems, newItem] }
          : project
      ));

      return newItem;
    } catch (err) {
      console.error('Error creating costing item:', err);
      throw err;
    }
  };

  const updateCostingItem = async (id: string, updates: Partial<CostingItem>) => {
    try {
      const { error } = await supabase
        .from('costing_items')
        .update({
          product_service: updates.productService,
          quantity: updates.quantity,
          currency: updates.currency,
          amount: updates.amount,
          comment: updates.comment,
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        costingItems: project.costingItems.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      })));
    } catch (err) {
      console.error('Error updating costing item:', err);
      throw err;
    }
  };

  const deleteCostingItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('costing_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        costingItems: project.costingItems.filter(item => item.id !== id)
      })));
    } catch (err) {
      console.error('Error deleting costing item:', err);
      throw err;
    }
  };

  // Client payments methods
  const createClientPayment = async (paymentData: Omit<ClientPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClientPayment> => {
    try {
      const { data, error } = await supabase
        .from('client_payments')
        .insert({
          project_id: paymentData.projectId,
          client_name: paymentData.clientName,
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_date: paymentData.paymentDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newPayment: ClientPayment = {
        id: data.id,
        projectId: data.project_id,
        clientName: data.client_name,
        amount: parseFloat(data.amount),
        currency: data.currency,
        paymentDate: data.payment_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setProjects(prev => prev.map(project => 
        project.id === paymentData.projectId 
          ? { ...project, clientPayments: [...project.clientPayments, newPayment] }
          : project
      ));

      return newPayment;
    } catch (err) {
      console.error('Error creating client payment:', err);
      throw err;
    }
  };

  const updateClientPayment = async (id: string, updates: Partial<ClientPayment>) => {
    try {
      const { error } = await supabase
        .from('client_payments')
        .update({
          client_name: updates.clientName,
          amount: updates.amount,
          currency: updates.currency,
          payment_date: updates.paymentDate,
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        clientPayments: project.clientPayments.map(payment => 
          payment.id === id ? { ...payment, ...updates } : payment
        )
      })));
    } catch (err) {
      console.error('Error updating client payment:', err);
      throw err;
    }
  };

  const deleteClientPayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('client_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => ({
        ...project,
        clientPayments: project.clientPayments.filter(payment => payment.id !== id)
      })));
    } catch (err) {
      console.error('Error deleting client payment:', err);
      throw err;
    }
  };

  const addTask = async (projectId: string, taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    return createTask({ ...taskData, projectId });
  };

  const addMeetingNote = async (projectId: string, noteData: Omit<MeetingNote, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    return createMeetingNote({ ...noteData, projectId });
  };

  const addProgressStep = async (projectId: string, stepData: Omit<ProgressStep, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    return createProgressStep({ ...stepData, projectId });
  };

  const addCostingItem = async (projectId: string, itemData: Omit<CostingItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    return createCostingItem({ ...itemData, projectId });
  };

  const addClientPayment = async (projectId: string, paymentData: Omit<ClientPayment, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    return createClientPayment({ ...paymentData, projectId });
  };

  useEffect(() => {
    initializeProjects();
  }, [user]);

  const value: ProjectContextType = {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    getUserProjects,
    createTask,
    updateTask,
    deleteTask,
    addTask,
    createMeetingNote,
    updateMeetingNote,
    deleteMeetingNote,
    addMeetingNote,
    createProgressStep,
    updateProgressStep,
    deleteProgressStep,
    addProgressStep,
    createCostingItem,
    updateCostingItem,
    deleteCostingItem,
    addCostingItem,
    createClientPayment,
    updateClientPayment,
    deleteClientPayment,
    addClientPayment,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};