// Project type definition
export interface Project {
  projectId: number;
  name: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 1 | 2 | 3; // 1=High, 2=Medium, 3=Low
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

// Task type definition
export interface Task {
  taskId: number;
  projectId: number;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 1 | 2 | 3; // 1=High, 2=Medium, 3=Low
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Project status options
export const PROJECT_STATUS_OPTIONS = [
  'Not Started',
  'In Progress', 
  'Completed', 
  'On Hold'
] as const;

// Task status options
export const TASK_STATUS_OPTIONS = [
  'To Do',
  'In Progress',
  'Completed',
  'Blocked'
] as const;

// Priority options
export const PRIORITY_OPTIONS = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' }
] as const; 