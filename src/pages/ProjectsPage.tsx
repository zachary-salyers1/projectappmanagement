import React, { useState, useEffect } from 'react';
import { Project, projectsApi } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

const ProjectsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
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

  if (!isAuthenticated && !isLoading) {
    return <div className="card">Please sign in to view projects.</div>;
  }

  if (loading) {
    return <div className="card">Loading projects...</div>;
  }

  return (
    <div>
      <h2>Projects</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card">
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
            />
          </div>
          <button type="submit" disabled={isCreating || !newProject.title.trim()}>
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
      
      <div className="grid">
        {projects.length === 0 ? (
          <div className="card">No projects found. Create your first project above.</div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="card">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
              <div className="card-actions">
                <button onClick={() => handleDeleteProject(project.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsPage; 