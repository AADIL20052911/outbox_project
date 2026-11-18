import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { User } from './types';
import { apiService } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setUser(null);
        // Clear any stale data
        localStorage.clear();
        sessionStorage.clear();
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthSession();
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.warn('[App] Logout error:', err);
    } finally {
      // Always clear user state and storage
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  if (isAuthLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen w-full bg-[var(--background)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs animate-pulse">
              R
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">Verifying authentication session...</span>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              user ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
