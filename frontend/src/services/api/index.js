import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Simple fetch wrapper
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🚀 API Request: ${options.method || 'GET'} ${API_BASE_URL}${url}`);
    
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      console.error(`❌ API Error: ${response.status}`, errorData);
      
      switch (response.status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('Access denied.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 422:
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorData.errors.forEach(err => toast.error(err.message));
          } else {
            toast.error(errorData.message || 'Validation error.');
          }
          break;
        default:
          toast.error(errorData.message || 'An error occurred.');
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
    
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      toast.error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// API helper functions
export const api = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, data = {}) => 
    apiRequest(url, { 
      method: 'POST', 
      body: JSON.stringify(data)
    }),
  put: (url, data = {}) => 
    apiRequest(url, { 
      method: 'PUT', 
      body: JSON.stringify(data)
    }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};




export default api;
