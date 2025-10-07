import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const menuItems = {
    admin: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Overview & Analytics' },
      { id: 'students', icon: '👥', label: 'Students', description: 'Manage Students' },
      { id: 'attendance', icon: '📝', label: 'Attendance', description: 'View & Edit Records' },
      { id: 'reports', icon: '📈', label: 'Reports', description: 'Analytics & Exports' },
      { id: 'classes', icon: '📚', label: 'Classes', description: 'Manage Classes' },
      { id: 'schedule', icon: '⏰', label: 'schedule', description: 'Manage Classes' },
      { id: 'settings', icon: '⚙️', label: 'Settings', description: 'System Configuration' },
    ],
    teacher: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Class Overview' },
      { id: 'attendance', icon: '📝', label: 'Attendance', description: 'Mark & View Records' },
      { id: 'students', icon: '👥', label: 'My Students', description: 'Student Management' },
      { id: 'reports', icon: '📈', label: 'Reports', description: 'Class Analytics' },
      { id: 'profile', icon: '👤', label: 'Profile', description: 'My Profile' },
    ],
    student: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', description: 'My Overview' },
      { id: 'attendance', icon: '📝', label: 'My Attendance', description: 'Attendance History' },
      { id: 'face', icon: '📸', label: 'Face Setup', description: 'Register Face' },
      { id: 'profile', icon: '👤', label: 'Profile', description: 'My Profile' },
    ],
  };

  const currentMenuItems = menuItems[user?.role] || menuItems.student;

  return (
    <div className="w-64 bg-white shadow-lg h-full border-r border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Panel
        </p>
      </div>

      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {currentMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className={`text-xs ${
                    activeTab === item.id ? 'text-indigo-500' : 'text-gray-400'
                  }`}>
                    {item.description}
                  </p>
                </div>
                {activeTab === item.id && (
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Stats */}
      {/* <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
          <h3 className="font-semibold text-sm">Quick Stats</h3>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Today's Attendance</span>
              <span className="font-medium">85%</span>
            </div>
            {user?.role === 'student' && (
              <div className="flex justify-between text-xs">
                <span>My Attendance</span>
                <span className="font-medium">92%</span>
              </div>
            )}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;
