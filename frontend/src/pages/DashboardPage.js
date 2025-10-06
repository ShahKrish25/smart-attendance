import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Your Profile</h3>
              <p className="text-sm text-gray-600">
                Name: {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                Email: {user?.email}
              </p>
              <p className="text-sm text-gray-600">
                Role: {user?.role}
              </p>
              {user?.studentId && (
                <p className="text-sm text-gray-600">
                  Student ID: {user.studentId}
                </p>
              )}
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Face Registration</h3>
              <p className="text-sm text-gray-600">
                Status: {user?.faceRegistered ? 'Registered' : 'Not Registered'}
              </p>
              {!user?.faceRegistered && (
                <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm">
                  Register Face
                </button>
              )}
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Attendance</h3>
              <p className="text-sm text-gray-600">
                Quick attendance marking will be available here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
