import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  displayName: string;
  email: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing development login in localStorage
  useEffect(() => {
    const checkUser = async () => {
      try {
        if (isDevelopment) {
          // For local development, check localStorage
          const devUser = localStorage.getItem('dev_user');
          if (devUser) {
            setUser(JSON.parse(devUser));
          } else {
            setUser(null);
          }
          setIsLoading(false);
        } else {
          // For production, check SWA auth endpoint
          const response = await fetch('/.auth/me');
          const authData = await response.json();
          
          if (authData && authData.clientPrincipal) {
            const { userDetails, userId } = authData.clientPrincipal;
            setUser({
              displayName: userDetails,
              email: userDetails, // Email might be available in a different property
              id: userId
            });
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async () => {
    if (isDevelopment) {
      // For development, create a mock user
      const mockUser = {
        displayName: 'Development User',
        email: 'dev@example.com',
        id: 'dev-user-123'
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('dev_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } else {
      // For production, redirect to Azure AD login
      window.location.href = '/.auth/login/aad';
    }
  };

  const logout = async () => {
    if (isDevelopment) {
      // For development, remove from localStorage
      localStorage.removeItem('dev_user');
      setUser(null);
    } else {
      // For production, use SWA logout
      window.location.href = '/.auth/logout';
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 