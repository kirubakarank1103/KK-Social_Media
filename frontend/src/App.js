import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';

// Components
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const LoadingScreen = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16
  }}>
    <div style={{
      width: 48, height: 48,
      background: 'var(--gradient)',
      borderRadius: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24,
      animation: 'pulse 1.5s ease infinite'
    }}>✦</div>
    <div className="spinner" style={{ width: 24, height: 24 }} />
  </div>
);

const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return children;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
      <MobileNav />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontFamily: 'DM Sans, sans-serif'
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0a0a0a' } },
            error: { iconTheme: { primary: '#ff3b5c', secondary: '#0a0a0a' } }
          }}
        />
        <AppLayout>
          <Routes>
            <Route path="/auth" element={
              <PublicRoute><AuthPage /></PublicRoute>
            } />
            <Route path="/" element={
              <PrivateRoute><HomePage /></PrivateRoute>
            } />
            <Route path="/explore" element={
              <PrivateRoute><ExplorePage /></PrivateRoute>
            } />
            <Route path="/profile/:username" element={
              <PrivateRoute><ProfilePage /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;