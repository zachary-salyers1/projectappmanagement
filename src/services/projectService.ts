// Project service for API interactions
import { Project, Task } from '../types';

// We'll try both endpoints
const API_BASE_URL = '/api';
const DAB_API_BASE_URL = '/api/data';

export const projectService = {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    try {
      // Try Data API Builder endpoint first
      const response = await fetch(`${DAB_API_BASE_URL}/Projects`);
      if (response.ok) {
        const data = await response.json();
        return data.value || [];
      }
      
      // Fallback to Azure Function endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/projects`);
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }
      return await fallbackResponse.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Get a single project by ID
  async getProject(id: number): Promise<Project | null> {
    try {
      // Try Data API Builder endpoint first
      const response = await fetch(`${DAB_API_BASE_URL}/Projects/${id}`);
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback to Azure Function endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }
      return await fallbackResponse.json();
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      return null;
    }
  },

  // Create a new project
  async createProject(project: Omit<Project, 'projectId'>): Promise<Project | null> {
    try {
      // Try creating using stored procedure first
      const spResponse = await fetch(`${DAB_API_BASE_URL}/CreateProject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: project.name,
          Description: project.description,
          StartDate: project.startDate,
          DueDate: project.dueDate,
          Status: project.status,
          Priority: project.priority,
          Owner: project.owner
        }),
      });
      
      if (spResponse.ok) {
        const result = await spResponse.json();
        // Get the newly created project
        if (result.ProjectId) {
          return await this.getProject(result.ProjectId);
        }
      }
      
      // Try Data API Builder entity endpoint
      const dabResponse = await fetch(`${DAB_API_BASE_URL}/Projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (dabResponse.ok) {
        return await dabResponse.json();
      }
      
      // Fallback to Azure Function endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }
      
      return await fallbackResponse.json();
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  // Update an existing project
  async updateProject(id: number, project: Partial<Project>): Promise<Project | null> {
    try {
      // Try stored procedure first
      if (project.name) {  // Only use SP if we have a name to update
        const spResponse = await fetch(`${DAB_API_BASE_URL}/UpdateProject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ProjectId: id,
            Name: project.name,
            Description: project.description,
            StartDate: project.startDate,
            DueDate: project.dueDate,
            Status: project.status,
            Priority: project.priority,
            Owner: project.owner
          }),
        });
        
        if (spResponse.ok) {
          const result = await spResponse.json();
          return result;
        }
      }
      
      // Try Data API Builder entity endpoint
      const dabResponse = await fetch(`${DAB_API_BASE_URL}/Projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (dabResponse.ok) {
        return await dabResponse.json();
      }
      
      // Fallback to Azure Function endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }
      
      return await fallbackResponse.json();
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      return null;
    }
  },

  // Delete a project
  async deleteProject(id: number): Promise<boolean> {
    try {
      // Try Data API Builder endpoint first
      const response = await fetch(`${DAB_API_BASE_URL}/Projects/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        return true;
      }
      
      // Fallback to Azure Function endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      
      return fallbackResponse.ok;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return false;
    }
  },

  // Get tasks for a project
  async getProjectTasks(projectId: number): Promise<Task[]> {
    try {
      // Try Data API Builder endpoint first
      const response = await fetch(`${DAB_API_BASE_URL}/Tasks?$filter=projectId eq ${projectId}`);
      if (response.ok) {
        const data = await response.json();
        return data.value || [];
      }
      
      // Fallback to Azure Function endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/project-tasks/${projectId}`);
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }
      const data = await fallbackResponse.json();
      return data || [];
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error);
      return [];
    }
  }
}; 