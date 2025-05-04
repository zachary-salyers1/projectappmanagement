import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Project, Task, projectsApi, tasksApi } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

const TasksPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>(projectIdParam || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: projectIdParam || '',
    dueDate: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Fetch projects and current project information
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectsApi.getAll();
        setProjects(projectsData);

        // If a specific project is selected, get its details
        if (selectedProjectId !== 'all') {
          const projectDetails = projectsData.find(p => p.id === selectedProjectId);
          setCurrentProject(projectDetails || null);
        } else {
          setCurrentProject(null);
        }
      } catch (err) {
        setError('Failed to load projects. Please try again later.');
        console.error(err);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchProjects();
    }
  }, [isAuthenticated, isLoading, selectedProjectId]);

  // Fetch tasks when selectedProjectId changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Fetch all tasks or tasks for selected project
        const tasksData = selectedProjectId === 'all'
          ? await tasksApi.getAll()
          : await tasksApi.getAll(selectedProjectId);
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        setError('Failed to load tasks. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchTasks();
    }
  }, [isAuthenticated, isLoading, selectedProjectId]);

  // Update URL when selected project changes
  useEffect(() => {
    if (selectedProjectId === 'all') {
      navigate('/tasks');
    } else {
      navigate(`/tasks?projectId=${selectedProjectId}`);
    }
  }, [selectedProjectId, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.projectId) return;

    try {
      setIsCreating(true);
      // Create task
      const createdTask = await tasksApi.create({
        title: newTask.title,
        description: newTask.description,
        projectId: newTask.projectId,
        dueDate: newTask.dueDate || '',
        completed: false
      });

      // Refresh tasks list or add to current list
      if (selectedProjectId === 'all' || selectedProjectId === newTask.projectId) {
        setTasks(prev => [...prev, createdTask]);
      }
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        projectId: newTask.projectId, // Keep the selected project
        dueDate: ''
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create task. Please try again.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await tasksApi.update(task.id, {
        completed: !task.completed
      });
      
      setTasks(prev => 
        prev.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksApi.delete(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error(err);
    }
  };

  if (!isAuthenticated && !isLoading) {
    return <div className="card">Please sign in to view tasks.</div>;
  }

  if (loading && projects.length === 0) {
    return <div className="card">Loading tasks...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h2>
          {currentProject 
            ? `Tasks for ${currentProject.title}` 
            : 'All Tasks'}
        </h2>
        <button 
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
          disabled={projects.length === 0}
        >
          {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showForm && (
        <div className="card form-card">
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label htmlFor="projectId">Project</label>
              <select
                id="projectId"
                name="projectId"
                value={newTask.projectId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                required
                placeholder="Enter task title"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter task description"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={newTask.dueDate}
                onChange={handleInputChange}
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
                disabled={isCreating || !newTask.title.trim() || !newTask.projectId}
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {!currentProject && (
        <div className="filter-container">
          <label htmlFor="projectFilter">Filter by Project:</label>
          <select
            id="projectFilter"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {currentProject && (
        <div className="project-details">
          <p><strong>Description:</strong> {currentProject.description || 'No description'}</p>
          <button 
            className="secondary-button"
            onClick={() => setSelectedProjectId('all')}
          >
            Back to All Tasks
          </button>
        </div>
      )}
      
      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="card empty-state">
            <h3>No tasks found</h3>
            {currentProject ? (
              <p>This project doesn't have any tasks yet.</p>
            ) : (
              <p>No tasks found across all projects.</p>
            )}
            <button 
              className="primary-button" 
              onClick={() => setShowForm(true)}
              disabled={projects.length === 0}
            >
              Create Task
            </button>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task)}
                  aria-label="Mark as complete"
                />
                <h3 className={task.completed ? 'completed' : ''}>
                  {task.title}
                </h3>
              </div>
              
              <div className="task-description">
                {task.description || <em>No description</em>}
              </div>
              
              <div className="task-meta">
                {!currentProject && (
                  <div className="task-project">
                    <strong>Project:</strong> {
                      projects.find(p => p.id === task.projectId)?.title || 'Unknown'
                    }
                  </div>
                )}
                
                {task.dueDate && (
                  <div className="task-due-date">
                    <strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <button
                  className="danger-button"
                  onClick={() => handleDeleteTask(task.id)}
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

export default TasksPage; 