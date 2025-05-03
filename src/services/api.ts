/**
 * API Service for ProjectFlow application
 * Handles communication with the backend APIs
 */

// Types
export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  attachments: FileAttachment[];
}

export interface BillingService {
  id: string;
  projectId: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  attachments: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  path: string;
  size: number;
  contentType: string;
  downloadUrl?: string;
}

// API base URL
const API_BASE = '/api';

// Helper function for fetch errors
const handleFetchError = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  return response.json();
};

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE}/projects`);
    return handleFetchError(response);
  },
  
  getById: async (id: string): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`);
    return handleFetchError(response);
  },
  
  create: async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return handleFetchError(response);
  },
  
  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return handleFetchError(response);
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });
    return handleFetchError(response);
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    const url = projectId 
      ? `${API_BASE}/projects/${projectId}/tasks` 
      : `${API_BASE}/tasks`;
    const response = await fetch(url);
    return handleFetchError(response);
  },
  
  getById: async (id: string): Promise<Task> => {
    const response = await fetch(`${API_BASE}/tasks/${id}`);
    return handleFetchError(response);
  },
  
  create: async (task: Omit<Task, 'id' | 'attachments'>): Promise<Task> => {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return handleFetchError(response);
  },
  
  update: async (id: string, task: Partial<Task>): Promise<Task> => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return handleFetchError(response);
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleFetchError(response);
  },
};

// Billing API
export const billingApi = {
  getAll: async (projectId?: string): Promise<BillingService[]> => {
    const url = projectId 
      ? `${API_BASE}/projects/${projectId}/billing` 
      : `${API_BASE}/billing`;
    const response = await fetch(url);
    return handleFetchError(response);
  },
  
  getById: async (id: string): Promise<BillingService> => {
    const response = await fetch(`${API_BASE}/billing/${id}`);
    return handleFetchError(response);
  },
  
  create: async (billing: Omit<BillingService, 'id' | 'attachments'>): Promise<BillingService> => {
    const response = await fetch(`${API_BASE}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billing),
    });
    return handleFetchError(response);
  },
  
  update: async (id: string, billing: Partial<BillingService>): Promise<BillingService> => {
    const response = await fetch(`${API_BASE}/billing/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billing),
    });
    return handleFetchError(response);
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/billing/${id}`, {
      method: 'DELETE',
    });
    return handleFetchError(response);
  },
};

// Files API
export const filesApi = {
  uploadFile: async (file: File, entityType: 'task' | 'billing', entityId: string): Promise<FileAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/files/${entityType}/${entityId}`, {
      method: 'POST',
      body: formData,
    });
    return handleFetchError(response);
  },
  
  getAttachments: async (entityType: 'task' | 'billing', entityId: string): Promise<FileAttachment[]> => {
    const response = await fetch(`${API_BASE}/files/${entityType}/${entityId}`);
    return handleFetchError(response);
  },
  
  deleteFile: async (fileId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
    });
    return handleFetchError(response);
  },
}; 