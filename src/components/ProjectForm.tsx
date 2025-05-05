import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Project, PROJECT_STATUS_OPTIONS, PRIORITY_OPTIONS } from '../types';
import { projectService } from '../services/projectService';

interface ProjectFormProps {
  isEditMode?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ isEditMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : undefined;
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    startDate: '',
    dueDate: '',
    status: 'Not Started',
    priority: 2,
    owner: ''
  });
  
  useEffect(() => {
    const fetchProject = async () => {
      if (isEditMode && projectId) {
        try {
          setLoading(true);
          const project = await projectService.getProject(projectId);
          if (project) {
            // Format dates for input fields
            const formattedProject = {
              ...project,
              startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
              dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''
            };
            setFormData(formattedProject);
          } else {
            setError('Project not found');
          }
        } catch (err) {
          setError('Failed to load project');
          console.error('Error fetching project:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProject();
  }, [isEditMode, projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      let result;
      if (isEditMode && projectId) {
        result = await projectService.updateProject(projectId, formData);
      } else {
        result = await projectService.createProject(formData as Omit<Project, 'projectId'>);
      }
      
      if (result) {
        navigate('/projects');
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} project`);
      }
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} project. Please try again.`);
      console.error('Error submitting project:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading project data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </h1>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Project Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status || 'Not Started'}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROJECT_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority || 2}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Owner
          </label>
          <input
            type="text"
            name="owner"
            value={formData.owner || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Project' : 'Create Project')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm; 