import React, { useState, useEffect } from 'react';
import { Project, BillingService, projectsApi, billingApi, filesApi } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

const BillingPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [billingServices, setBillingServices] = useState<BillingService[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBilling, setNewBilling] = useState({
    name: '',
    projectId: '',
    amount: '',
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
        
        // Fetch all billing services or those for selected project
        const billingData = selectedProjectId === 'all'
          ? await billingApi.getAll()
          : await billingApi.getAll(selectedProjectId);
        setBillingServices(billingData);
        
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
    setNewBilling(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleCreateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBilling.name.trim() || !newBilling.projectId || !newBilling.amount) return;

    try {
      setIsCreating(true);
      // Create billing service
      const createdBilling = await billingApi.create({
        name: newBilling.name,
        projectId: newBilling.projectId,
        amount: parseFloat(newBilling.amount),
        dueDate: newBilling.dueDate,
        paid: false
      });

      // Upload file if selected
      if (selectedFile) {
        // TODO: Implement file upload when backend is ready
        // This will be handled by the Files API using Microsoft Graph
        // const fileAttachment = await filesApi.uploadFile(selectedFile, 'billing', createdBilling.id);
        console.log('File upload would happen here');
      }

      // Refresh billing list or add to current list
      if (selectedProjectId === 'all' || selectedProjectId === newBilling.projectId) {
        setBillingServices(prev => [...prev, createdBilling]);
      }
      
      // Reset form
      setNewBilling({
        name: '',
        projectId: '',
        amount: '',
        dueDate: ''
      });
      setSelectedFile(null);
      setError(null);
    } catch (err) {
      setError('Failed to create billing service. Please try again.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePaid = async (billing: BillingService) => {
    try {
      const updatedBilling = await billingApi.update(billing.id, {
        paid: !billing.paid
      });
      
      setBillingServices(prev => 
        prev.map(b => b.id === updatedBilling.id ? updatedBilling : b)
      );
    } catch (err) {
      setError('Failed to update billing service. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteBilling = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this billing service?')) return;

    try {
      await billingApi.delete(id);
      setBillingServices(prev => prev.filter(billing => billing.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete billing service. Please try again.');
      console.error(err);
    }
  };

  if (!isAuthenticated && !isLoading) {
    return <div className="card">Please sign in to view billing services.</div>;
  }

  if (loading && projects.length === 0) {
    return <div className="card">Loading billing services...</div>;
  }

  return (
    <div>
      <h2>Billing Services</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card">
        <h3>Create New Billing Service</h3>
        <form onSubmit={handleCreateBilling}>
          <div className="form-group">
            <label htmlFor="projectId">Project</label>
            <select
              id="projectId"
              name="projectId"
              value={newBilling.projectId}
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
            <label htmlFor="name">Service Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newBilling.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={newBilling.amount}
              onChange={handleInputChange}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={newBilling.dueDate}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="file">Receipt/Invoice</label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
            />
            <small>Upload a receipt or invoice</small>
          </div>
          
          <button 
            type="submit" 
            disabled={isCreating || !newBilling.name.trim() || !newBilling.projectId || !newBilling.amount}
          >
            {isCreating ? 'Creating...' : 'Create Billing Service'}
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
      
      <div className="billing-list">
        {billingServices.length === 0 ? (
          <div className="card">No billing services found. Create your first billing service above.</div>
        ) : (
          billingServices.map(billing => (
            <div key={billing.id} className="card">
              <div className="billing-header">
                <h3 style={{ textDecoration: billing.paid ? 'line-through' : 'none' }}>
                  {billing.name}
                </h3>
                <div className="billing-amount">${billing.amount.toFixed(2)}</div>
              </div>
              
              <div className="billing-details">
                <div>Project: {projects.find(p => p.id === billing.projectId)?.title || 'Unknown'}</div>
                {billing.dueDate && <div>Due: {new Date(billing.dueDate).toLocaleDateString()}</div>}
                <div>Status: <span className={billing.paid ? 'status-paid' : 'status-unpaid'}>
                  {billing.paid ? 'Paid' : 'Unpaid'}
                </span></div>
              </div>
              
              {billing.attachments && billing.attachments.length > 0 && (
                <div className="attachments">
                  <h4>Attachments</h4>
                  <ul>
                    {billing.attachments.map(attachment => (
                      <li key={attachment.id}>
                        <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer">
                          {attachment.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="billing-actions">
                <button 
                  onClick={() => handleTogglePaid(billing)}
                  className={billing.paid ? 'btn-success' : ''}
                >
                  {billing.paid ? 'Mark Unpaid' : 'Mark Paid'}
                </button>
                <button onClick={() => handleDeleteBilling(billing.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BillingPage; 