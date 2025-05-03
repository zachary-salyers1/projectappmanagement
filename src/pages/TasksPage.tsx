import React, { useState, useEffect } from 'react';
import { Project, Task, projectsApi, tasksApi } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

const TasksPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    dueDate: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch projects
        const projectsData = await projectsApi.getAll();
        setProjects(projectsData);
        
        // Fetch all tasks or tasks for selected project
        const tasksData = selectedProjectId === 'all'
          ? await tasksApi.getAll()
          : await tasksApi.getAll(selectedProjectId);
        setTasks(tasksData);
        
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchInitialData();
    }
  }, [isAuthenticated, isLoading, selectedProjectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
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
        dueDate: newTask.dueDate,
        completed: false
      });

      // Upload file if selected
      if (selectedFile) {
        // TODO: Implement file upload when backend is ready
        // This will be handled by the Files API using Microsoft Graph
        // const fileAttachment = await filesApi.uploadFile(selectedFile, 'task', createdTask.id);
        console.log('File upload would happen here');
      }

      // Refresh tasks list or add to current list
      if (selectedProjectId === 'all' || selectedProjectId === newTask.projectId) {
        setTasks(prev => [...prev, createdTask]);
      }
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        projectId: '',
        dueDate: ''
      });
      setSelectedFile(null);
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
    <div>
      <h2>Tasks</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card">
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
          
          <div className="form-group">
            <label htmlFor="file">Attachment</label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
            />
            <small>Upload a file to attach to this task</small>
          </div>
          
          <button 
            type="submit" 
            disabled={isCreating || !newTask.title.trim() || !newTask.projectId}
          >
            {isCreating ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
      
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
      
      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="card">No tasks found. Create your first task above.</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="card">
              <div className="task-header">
                <h3 style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.title}
                </h3>
                <div className="task-actions">
                  <button 
                    onClick={() => handleToggleComplete(task)}
                    className={task.completed ? 'btn-success' : ''}
                  >
                    {task.completed ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                </div>
              </div>
              <p>{task.description}</p>
              <div className="task-details">
                <div>Project: {projects.find(p => p.id === task.projectId)?.title || 'Unknown'}</div>
                {task.dueDate && <div>Due: {new Date(task.dueDate).toLocaleDateString()}</div>}
              </div>
              
              {task.attachments && task.attachments.length > 0 && (
                <div className="attachments">
                  <h4>Attachments</h4>
                  <ul>
                    {task.attachments.map(attachment => (
                      <li key={attachment.id}>
                        <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer">
                          {attachment.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TasksPage; 