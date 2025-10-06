import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, icon, color, description, trend }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${
            trend.type === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="mr-1">
              {trend.type === 'up' ? '↗️' : '↘️'}
            </span>
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-4xl opacity-80">
        {icon}
      </div>
    </div>
  </div>
);

const DashboardContent = () => {
  const { user } = useAuth();

  const getStatsForRole = (role) => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Total Students',
            value: '1,247',
            icon: '👥',
            color: 'hover:shadow-md transition-shadow',
            description: 'Active students',
            trend: { type: 'up', value: '+12 this month' }
          },
          {
            title: 'Today\'s Attendance',
            value: '87%',
            icon: '📊',
            color: 'hover:shadow-md transition-shadow',
            description: '1,085 present',
            trend: { type: 'up', value: '+3% vs yesterday' }
          },
          {
            title: 'Classes Active',
            value: '24',
            icon: '📚',
            color: 'hover:shadow-md transition-shadow',
            description: 'Running classes'
          },
          {
            title: 'Teachers',
            value: '45',
            icon: '👨‍🏫',
            color: 'hover:shadow-md transition-shadow',
            description: 'Active faculty'
          }
        ];
      case 'teacher':
        return [
          {
            title: 'My Students',
            value: '156',
            icon: '👥',
            color: 'hover:shadow-md transition-shadow',
            description: 'Enrolled students'
          },
          {
            title: 'Today\'s Attendance',
            value: '92%',
            icon: '📊',
            color: 'hover:shadow-md transition-shadow',
            description: '143 present',
            trend: { type: 'up', value: '+5% vs yesterday' }
          },
          {
            title: 'My Classes',
            value: '6',
            icon: '📚',
            color: 'hover:shadow-md transition-shadow',
            description: 'This semester'
          },
          {
            title: 'Avg Attendance',
            value: '88%',
            icon: '📈',
            color: 'hover:shadow-md transition-shadow',
            description: 'This month'
          }
        ];
      case 'student':
        return [
          {
            title: 'My Attendance',
            value: '92%',
            icon: '📊',
            color: 'hover:shadow-md transition-shadow',
            description: '23/25 classes',
            trend: { type: 'up', value: '+2 classes this week' }
          },
          {
            title: 'Classes Today',
            value: '4',
            icon: '📚',
            color: 'hover:shadow-md transition-shadow',
            description: '2 completed'
          },
          {
            title: 'Face Status',
            value: user?.faceRegistered ? '✅' : '❌',
            icon: '📸',
            color: 'hover:shadow-md transition-shadow',
            description: user?.faceRegistered ? 'Registered' : 'Not registered'
          },
          {
            title: 'Rank',
            value: '#7',
            icon: '🏆',
            color: 'hover:shadow-md transition-shadow',
            description: 'In your class'
          }
        ];
      default:
        return [];
    }
  };

  const stats = getStatsForRole(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your attendance system today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">
              {user?.role === 'admin' ? '👑' : user?.role === 'teacher' ? '👨‍🏫' : '🎓'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'admin' && (
            <>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👥</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Add Student</p>
                  <p className="text-sm text-gray-500">Register new student</p>
                </div>
              </button>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📈</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">View Reports</p>
                  <p className="text-sm text-gray-500">Attendance analytics</p>
                </div>
              </button>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">⚙️</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Settings</p>
                  <p className="text-sm text-gray-500">System configuration</p>
                </div>
              </button>
            </>
          )}
          
          {user?.role === 'teacher' && (
            <>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📝</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Mark Attendance</p>
                  <p className="text-sm text-gray-500">For current class</p>
                </div>
              </button>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👥</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">View Students</p>
                  <p className="text-sm text-gray-500">Manage class roster</p>
                </div>
              </button>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📊</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Class Reports</p>
                  <p className="text-sm text-gray-500">Performance analytics</p>
                </div>
              </button>
            </>
          )}
          
          {user?.role === 'student' && (
            <>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📸</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Register Face</p>
                  <p className="text-sm text-gray-500">Setup face recognition</p>
                </div>
              </button>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📊</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">My Attendance</p>
                  <p className="text-sm text-gray-500">View history</p>
                </div>
              </button>
              <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👤</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Update Profile</p>
                  <p className="text-sm text-gray-500">Personal information</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { time: '2 min ago', action: 'Face recognition attendance marked', type: 'success' },
            { time: '15 min ago', action: 'New student registered: John Doe', type: 'info' },
            { time: '1 hour ago', action: 'Attendance report generated', type: 'success' },
            { time: '2 hours ago', action: 'System backup completed', type: 'success' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-3 h-3 rounded-full mr-4 ${
                activity.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
