import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page user was trying to access, or dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill with test credentials for easy testing
  const fillTestCredentials = (role) => {
    if (role === 'admin') {
      setFormData({
        email: 'admin@college.edu',
        password: 'admin123'
      });
    } else if (role === 'teacher') {
      setFormData({
        email: 'teacher@college.edu',
        password: 'teacher123'
      });
    } else if (role === 'student') {
      setFormData({
        email: 'student1@college.edu',
        password: 'student123'
      });
    }
  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Smart Attendance account
          </p>
        </div>

        {/* Quick Test Buttons */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Quick Test Login:</p>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('teacher')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('student')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              Student
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              to="/register" 
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Don't have an account? Sign up here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
