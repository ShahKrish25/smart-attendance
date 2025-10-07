// import React from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import StudentDashboard from '../student/StudentDashboard';

// const StatCard = ({ title, value, icon, color, description, trend }) => (
//   <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${color}`}>
//     <div className="flex items-center justify-between">
//       <div>
//         <p className="text-sm font-medium text-gray-600">{title}</p>
//         <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
//         {description && (
//           <p className="text-sm text-gray-500 mt-1">{description}</p>
//         )}
//         {trend && (
//           <div className={`flex items-center mt-2 text-sm ${
//             trend.type === 'up' ? 'text-green-600' : 'text-red-600'
//           }`}>
//             <span className="mr-1">
//               {trend.type === 'up' ? '↗️' : '↘️'}
//             </span>
//             {trend.value}
//           </div>
//         )}
//       </div>
//       <div className="text-4xl opacity-80">
//         {icon}
//       </div>
//     </div>
//   </div>
// );

// const DashboardContent = () => {
//   const { user } = useAuth();

//   const getStatsForRole = (role) => {
//     switch (role) {
//       case 'admin':
//         return [
//           {
//             title: 'Total Students',
//             value: '1,247',
//             icon: '👥',
//             color: 'hover:shadow-md transition-shadow',
//             description: 'Active students',
//             trend: { type: 'up', value: '+12 this month' }
//           },
//           {
//             title: 'Today\'s Attendance',
//             value: '87%',
//             icon: '📊',
//             color: 'hover:shadow-md transition-shadow',
//             description: '1,085 present',
//             trend: { type: 'up', value: '+3% vs yesterday' }
//           },
//           {
//             title: 'Classes Active',
//             value: '24',
//             icon: '📚',
//             color: 'hover:shadow-md transition-shadow',
//             description: 'Running classes'
//           },
//           {
//             title: 'Teachers',
//             value: '45',
//             icon: '👨‍🏫',
//             color: 'hover:shadow-md transition-shadow',
//             description: 'Active faculty'
//           }
//         ];
//       case 'teacher':
//         return [
//           {
//             title: 'My Students',
//             value: '156',
//             icon: '👥',
//             color: 'hover:shadow-md transition-shadow',
//             description: 'Enrolled students'
//           },
//           {
//             title: 'Today\'s Attendance',
//             value: '92%',
//             icon: '📊',
//             color: 'hover:shadow-md transition-shadow',
//             description: '143 present',
//             trend: { type: 'up', value: '+5% vs yesterday' }
//           },
//           {
//             title: 'My Classes',
//             value: '6',
//             icon: '📚',
//             color: 'hover:shadow-md transition-shadow',
//             description: 'This semester'
//           },
//           {
//             title: 'Avg Attendance',
//             value: '88%',
//             icon: '📈',
//             color: 'hover:shadow-md transition-shadow',
//             description: 'This month'
//           }
//         ];
//       case 'student':
//         return <StudentDashboard />
//         // return [
//         //   {
//         //     title: 'My Attendance',
//         //     value: '92%',
//         //     icon: '📊',
//         //     color: 'hover:shadow-md transition-shadow',
//         //     description: '23/25 classes',
//         //     trend: { type: 'up', value: '+2 classes this week' }
//         //   },
//         //   {
//         //     title: 'Classes Today',
//         //     value: '4',
//         //     icon: '📚',
//         //     color: 'hover:shadow-md transition-shadow',
//         //     description: '2 completed'
//         //   },
//         //   {
//         //     title: 'Face Status',
//         //     value: user?.faceRegistered ? '✅' : '❌',
//         //     icon: '📸',
//         //     color: 'hover:shadow-md transition-shadow',
//         //     description: user?.faceRegistered ? 'Registered' : 'Not registered'
//         //   },
//         //   {
//         //     title: 'Rank',
//         //     value: '#7',
//         //     icon: '🏆',
//         //     color: 'hover:shadow-md transition-shadow',
//         //     description: 'In your class'
//         //   }
//         // ];

//       default:
//         return [];
//     }
//   };

//   const stats = getStatsForRole(user?.role);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">
//             Welcome back, {user?.firstName}! 👋
//           </h1>
//           <p className="text-gray-600 mt-2">
//             Here's what's happening with your attendance system today.
//           </p>
//         </div>
//         <div className="flex items-center space-x-3">
//           <div className="text-right">
//             <p className="text-sm text-gray-500">Current Time</p>
//             <p className="text-lg font-semibold text-gray-900">
//               {new Date().toLocaleTimeString()}
//             </p>
//           </div>
//           <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
//             <span className="text-2xl">
//               {user?.role === 'admin' ? '👑' : user?.role === 'teacher' ? '👨‍🏫' : '🎓'}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat, index) => (
//           <StatCard key={index} {...stat} />
//         ))}
//       </div>

//       {/* Quick Actions */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//         <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {user?.role === 'admin' && (
//             <>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👥</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">Add Student</p>
//                   <p className="text-sm text-gray-500">Register new student</p>
//                 </div>
//               </button>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📈</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">View Reports</p>
//                   <p className="text-sm text-gray-500">Attendance analytics</p>
//                 </div>
//               </button>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">⚙️</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">Settings</p>
//                   <p className="text-sm text-gray-500">System configuration</p>
//                 </div>
//               </button>
//             </>
//           )}
          
//           {user?.role === 'teacher' && (
//             <>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📝</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">Mark Attendance</p>
//                   <p className="text-sm text-gray-500">For current class</p>
//                 </div>
//               </button>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👥</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">View Students</p>
//                   <p className="text-sm text-gray-500">Manage class roster</p>
//                 </div>
//               </button>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📊</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">Class Reports</p>
//                   <p className="text-sm text-gray-500">Performance analytics</p>
//                 </div>
//               </button>
//             </>
//           )}
          
//           {user?.role === 'student' && (
//             <>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📸</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">Register Face</p>
//                   <p className="text-sm text-gray-500">Setup face recognition</p>
//                 </div>
//               </button>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📊</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">My Attendance</p>
//                   <p className="text-sm text-gray-500">View history</p>
//                 </div>
//               </button>
//               <button className="flex items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
//                 <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👤</span>
//                 <div className="text-left">
//                   <p className="font-semibold text-gray-900">Update Profile</p>
//                   <p className="text-sm text-gray-500">Personal information</p>
//                 </div>
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//         <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
//         <div className="space-y-3">
//           {[
//             { time: '2 min ago', action: 'Face recognition attendance marked', type: 'success' },
//             { time: '15 min ago', action: 'New student registered: John Doe', type: 'info' },
//             { time: '1 hour ago', action: 'Attendance report generated', type: 'success' },
//             { time: '2 hours ago', action: 'System backup completed', type: 'success' },
//           ].map((activity, index) => (
//             <div key={index} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
//               <div className={`w-3 h-3 rounded-full mr-4 ${
//                 activity.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
//               }`}></div>
//               <div className="flex-1">
//                 <p className="text-sm font-medium text-gray-900">{activity.action}</p>
//                 <p className="text-xs text-gray-500">{activity.time}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardContent;









// new role based dashboard

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentDashboard from '../student/StudentDashboard';

const StatCard = ({ title, value, icon, color, description, trend }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${
            trend.type === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {trend.type === 'up' ? '↗️' : '↘️'} {trend.value}
          </div>
        )}
      </div>
      <div className={`text-3xl ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ActivityItem = ({ activity }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
    <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
      <p className="text-xs text-gray-500">{activity.time}</p>
    </div>
  </div>
);

const DashboardContent = () => {
  const { user } = useAuth();

  // Function to get stats based on role
  const getStatsForRole = (role) => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Total Students',
            value: '1,234',
            icon: '👥',
            color: 'text-blue-500',
            description: 'Registered users',
            trend: { type: 'up', value: '+12 this week' }
          },
          {
            title: 'Active Classes',
            value: '45',
            icon: '📚',
            color: 'text-green-500',
            description: 'Currently running'
          },
          {
            title: 'Avg Attendance',
            value: '88%',
            icon: '📊',
            color: 'text-purple-500',
            description: 'This month'
          },
          {
            title: 'System Status',
            value: 'Online',
            icon: '🟢',
            color: 'text-green-500',
            description: 'All systems operational'
          }
        ];
      
      case 'instructor':
      case 'teacher':
        return [
          {
            title: 'My Classes',
            value: '8',
            icon: '📚',
            color: 'text-blue-500',
            description: 'Active classes'
          },
          {
            title: 'Students',
            value: '156',
            icon: '👥',
            color: 'text-green-500',
            description: 'Total enrolled'
          },
          {
            title: 'Attendance Rate',
            value: '92%',
            icon: '📊',
            color: 'text-purple-500',
            description: 'This week'
          },
          {
            title: 'Live Sessions',
            value: '2',
            icon: '🔴',
            color: 'text-red-500',
            description: 'Currently active'
          }
        ];
      
      case 'student':
        // For students, we return null as they will use StudentDashboard component
        return null;
      
      default:
        return [
          {
            title: 'Welcome',
            value: 'Hello',
            icon: '👋',
            color: 'text-blue-500',
            description: 'Getting started'
          }
        ];
    }
  };

  // Get recent activities based on role
  const getActivitiesForRole = (role) => {
    switch (role) {
      case 'admin':
        return [
          { action: 'New student registered', time: '2 minutes ago', type: 'success' },
          { action: 'Class CS101 started', time: '5 minutes ago', type: 'info' },
          { action: 'Attendance report generated', time: '10 minutes ago', type: 'success' },
          { action: 'System backup completed', time: '1 hour ago', type: 'success' }
        ];
      
      case 'instructor':
      case 'teacher':
        return [
          { action: 'CS101 session started', time: '5 minutes ago', type: 'success' },
          { action: 'Student marked attendance', time: '10 minutes ago', type: 'info' },
          { action: 'Assignment submitted', time: '30 minutes ago', type: 'success' },
          { action: 'Class schedule updated', time: '1 hour ago', type: 'info' }
        ];
      
      case 'student':
        return [
          { action: 'Attendance marked for CS101', time: '5 minutes ago', type: 'success' },
          { action: 'New assignment posted', time: '30 minutes ago', type: 'info' },
          { action: 'Grade updated for Math201', time: '2 hours ago', type: 'success' },
          { action: 'Schedule reminder set', time: '3 hours ago', type: 'info' }
        ];
      
      default:
        return [];
    }
  };

  // If user is a student, render the StudentDashboard component
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  // For admin and instructor roles, render the traditional dashboard
  const stats = getStatsForRole(user?.role);
  const activities = getActivitiesForRole(user?.role);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {user?.role === 'admin' ? '🎯 Admin Dashboard' : '👨‍🏫 Instructor Dashboard'}
        </h1>
        <p className="text-blue-100">
          {user?.role === 'admin' 
            ? "Here's what's happening with your attendance system today."
            : "Manage your classes and monitor student attendance."
          }
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      )}

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
          <div className="space-y-3">
            {user?.role === 'admin' ? (
              <>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">👥</span>
                    <div>
                      <p className="font-medium text-gray-900">Manage Students</p>
                      <p className="text-sm text-gray-500">View and manage student accounts</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📚</span>
                    <div>
                      <p className="font-medium text-gray-900">Class Management</p>
                      <p className="text-sm text-gray-500">Create and manage classes</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="font-medium text-gray-900">View Reports</p>
                      <p className="text-sm text-gray-500">Generate attendance reports</p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="font-medium text-gray-900">Class Schedule</p>
                      <p className="text-sm text-gray-500">View and manage your class schedule</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="font-medium text-gray-900">Take Attendance</p>
                      <p className="text-sm text-gray-500">Mark attendance for your classes</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="font-medium text-gray-900">View Reports</p>
                      <p className="text-sm text-gray-500">Check attendance reports</p>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Recent Activity</h3>
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Current Time Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">🕐 Current Time</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {new Date().toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-4xl">
            ⏰
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
