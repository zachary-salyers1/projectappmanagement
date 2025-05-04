import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="card">
          <h2>Loading...</h2>
          <p>Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h2>Welcome to ProjectFlow</h2>
        <p>Sign in to manage your projects and tasks.</p>
        <div className="login-actions">
          <button className="primary-button" onClick={login}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 