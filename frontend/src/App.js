import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// import Layout from './components/common/Layouts/Layout';
import Layout from './components/common/Layouts/Layout';
import DashboardContent from './components/dashboard/DashboardContent';
import FaceRegistration from './components/face/FaceRegistration';
import AttendanceScanner from './components/face/AttendanceScanner';
import StudentManagement from './components/admin/StudentManagement';
import AttendanceReports from './components/admin/AttendanceReports';
import './styles/globals.css';
import ClassManagement from './components/admin/ClassManagement';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
};

// Dashboard with Tab Content
const Dashboard = () => {
  return (
    <Layout>
      {(activeTab, setActiveTab) => {
        switch (activeTab) {
          case 'dashboard':
            return <DashboardContent />;
          case 'students':
            return <StudentManagement />;
          case 'attendance':
            return <AttendanceScanner />;
          case 'reports':
            return <AttendanceReports />;
          case 'classes':
            return <ClassManagement />;
          case 'face':
            return <FaceRegistration />; // 🎯 Face Registration Component
          case 'profile':
            return (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Profile Settings</h2>
                <p className="text-gray-600">Profile management features coming next!</p>
              </div>
            );
          case 'settings':
            return (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ System Settings</h2>
                <p className="text-gray-600">System configuration features coming next!</p>
              </div>
            );
          default:
            return <DashboardContent />;
        }
      }}
    </Layout>
  );
};

// Main App Routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Dashboard /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Dashboard /> : <RegisterPage />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={isAuthenticated ? <Dashboard /> : <LoginPage />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                duration: 3000,
              },
              error: {
                duration: 5000,
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
