import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import './App.css'

// Import pages
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import BillingPage from './pages/BillingPage'
import AuthProvider from './auth/AuthProvider'

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

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <header className="app-header">
              <h1>ProjectFlow</h1>
              <nav>
                <ul>
                  <li><Link to="/">Projects</Link></li>
                  <li><Link to="/tasks">Tasks</Link></li>
                  <li><Link to="/billing">Billing</Link></li>
                </ul>
              </nav>
            </header>

            <main className="app-content">
              <Routes>
                <Route path="/" element={<ProjectsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/billing" element={<BillingPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </MsalProvider>
  )
}

export default App
