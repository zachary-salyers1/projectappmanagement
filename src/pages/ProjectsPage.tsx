import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, projectsApi } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectsApi.getAll();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError('Failed to load projects. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchProjects();
    }
  }, [isAuthenticated, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      setIsCreating(true);
      const created = await projectsApi.create(newProject);
      setProjects(prev => [...prev, created]);
      setNewProject({ title: '', description: '' });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsApi.delete(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete project. Please try again.');
      console.error(err);
    }
  };

  const handleViewTasks = (projectId: string) => {
    navigate(`/tasks?projectId=${projectId}`);
  };

  if (!isAuthenticated && !isLoading) {
    return <div className="card">Please sign in to view projects.</div>;
  }

  if (loading) {
    return <div className="card">Loading projects...</div>;
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <h2>Projects</h2>
        <button 
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showForm && (
        <div className="card form-card">
          <h3>Create New Project</h3>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                required
                placeholder="Enter project title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter project description"
              />
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="secondary-button" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="primary-button"
                disabled={isCreating || !newProject.title.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="card empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
            <button 
              className="primary-button" 
              onClick={() => setShowForm(true)}
            >
              Create Project
            </button>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
              </div>
              <div className="project-description">
                {project.description || <em>No description</em>}
              </div>
              <div className="project-meta">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="card-actions">
                <button 
                  className="secondary-button"
                  onClick={() => handleViewTasks(project.id)}
                >
                  View Tasks
                </button>
                <button 
                  className="danger-button"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsPage; 