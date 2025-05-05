// Project service for API interactions
import { Project, Task } from '../types';

const API_BASE_URL = '/api/data';

export const projectService = {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Projects`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Get a single project by ID
  async getProject(id: number): Promise<Project | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/Projects/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      return null;
    }
  },

  // Create a new project
  async createProject(project: Omit<Project, 'projectId'>): Promise<Project | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/Projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  // Update an existing project
  async updateProject(id: number, project: Partial<Project>): Promise<Project | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/Projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      return null;
    }
  },

  // Delete a project
  async deleteProject(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/Projects/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return false;
    }
  },

  // Get tasks for a project
  async getProjectTasks(projectId: number): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Tasks?$filter=projectId eq ${projectId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error);
      return [];
    }
  }
}; 