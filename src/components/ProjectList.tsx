import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, PRIORITY_OPTIONS } from '../types';
import { projectService } from '../services/projectService';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError('Failed to load projects. Please try again.');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const success = await projectService.deleteProject(id);
        if (success) {
          setProjects(projects.filter(p => p.projectId !== id));
        } else {
          setError('Failed to delete project. Please try again.');
        }
      } catch (err) {
        setError('Failed to delete project. Please try again.');
        console.error('Error deleting project:', err);
      }
    }
  };

  const getPriorityLabel = (priority: number) => {
    const found = PRIORITY_OPTIONS.find(p => p.value === priority);
    return found ? found.label : 'Unknown';
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-200';
      case 'In Progress': return 'bg-blue-200';
      case 'Completed': return 'bg-green-200';
      case 'On Hold': return 'bg-yellow-200';
      default: return 'bg-gray-200';
    }
  };

  if (loading) return <div className="text-center py-10">Loading projects...</div>;

  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  if (projects.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">No projects found. Get started by creating your first project!</p>
        <Link 
          to="/projects/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          Create New Project
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link 
          to="/projects/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          New Project
        </Link>
      </div>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.projectId} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-t-lg ${getStatusClass(project.status)}`}>
              <h2 className="text-xl font-semibold">{project.name}</h2>
            </div>
            <div className="p-4">
              {project.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-gray-100 text-sm rounded">
                  {project.status}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-sm rounded">
                  Priority: {getPriorityLabel(project.priority)}
                </span>
              </div>
              
              <div className="flex flex-wrap justify-between text-sm text-gray-500 mb-3">
                {project.startDate && (
                  <div>
                    <strong>Start:</strong> {new Date(project.startDate).toLocaleDateString()}
                  </div>
                )}
                {project.dueDate && (
                  <div>
                    <strong>Due:</strong> {new Date(project.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-3 border-t">
                <Link 
                  to={`/projects/${project.projectId}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Details
                </Link>
                <div className="space-x-2">
                  <Link 
                    to={`/projects/${project.projectId}/edit`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDeleteProject(project.projectId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList; 