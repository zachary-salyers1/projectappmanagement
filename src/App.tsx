import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import './App.css'

// Import pages
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import BillingPage from './pages/BillingPage'
import LoginPage from './pages/LoginPage'
import AuthProvider, { useAuth } from './auth/AuthProvider'

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AAD_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AAD_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// Protected route component
interface ProtectedRouteProps {
  element: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="card">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{element}</>;
};

// Header component with authentication buttons
const AppHeader = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1>ProjectFlow</h1>
        <nav>
          <ul>
            <li><Link to="/">Projects</Link></li>
            <li><Link to="/tasks">Tasks</Link></li>
            <li><Link to="/billing">Billing</Link></li>
          </ul>
        </nav>
      </div>
      <div className="app-header-right">
        {isAuthenticated ? (
          <div className="user-menu">
            <span className="user-name">{user?.displayName}</span>
            <button className="secondary-button" onClick={logout}>Sign Out</button>
          </div>
        ) : (
          <button className="primary-button" onClick={() => login()}>Sign In</button>
        )}
      </div>
    </header>
  );
};

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <AppHeader />
            <main className="app-content">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute element={<ProjectsPage />} />} />
                <Route path="/tasks" element={<ProtectedRoute element={<TasksPage />} />} />
                <Route path="/billing" element={<ProtectedRoute element={<BillingPage />} />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </MsalProvider>
  )
}

export default App
