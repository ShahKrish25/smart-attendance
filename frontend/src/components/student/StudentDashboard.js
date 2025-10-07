// import React, { useState, useEffect } from 'react';
// import { api } from '../../services/api';
// import toast from 'react-hot-toast';
// import { format, isToday, parseISO } from 'date-fns';
// import AttendanceScanner from '../face/AttendanceScanner';

// const StudentDashboard = () => {
//   const [sessions, setSessions] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectedSession, setSelectedSession] = useState(null);
//   const [showAttendanceScanner, setShowAttendanceScanner] = useState(false);
//   const [userInfo, setUserInfo] = useState(null);

//   // Load user info and sessions
//   useEffect(() => {
//     loadUserInfo();
//     loadStudentSessions();
//   }, []);

//   const loadUserInfo = async () => {
//     try {
//       const response = await api.get('/auth/me');
//       if (response.success) {
//         setUserInfo(response.user);
//       }
//     } catch (error) {
//       console.error('Error loading user info:', error);
//     }
//   };

//   const loadStudentSessions = async () => {
//     try {
//       setIsLoading(true);
      
//       // Get current week sessions for student's enrolled classes
//       const response = await api.get('/sessions/student/schedule');
      
//       if (response.success) {
//         setSessions(response.sessions || []);
//       }
//     } catch (error) {
//       console.error('Error loading student sessions:', error);
//       toast.error('Failed to load class schedule');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle attendance marking
//   const handleMarkAttendance = (session) => {
//     if (session.status !== 'active') {
//       toast.error('Attendance can only be marked during active sessions');
//       return;
//     }
    
//     setSelectedSession(session);
//     setShowAttendanceScanner(true);
//   };

//   // Handle successful attendance
//   const handleAttendanceSuccess = async (data) => {
//     try {
//       const response = await api.post(`/sessions/${selectedSession._id}/attendance`, {
//         method: 'face_recognition',
//         confidence: data.confidence
//       });

//       if (response.success) {
//         toast.success('Attendance marked successfully!');
//         setShowAttendanceScanner(false);
//         setSelectedSession(null);
//         await loadStudentSessions(); // Reload to get updated status
//       }
//     } catch (error) {
//       console.error('Error marking attendance:', error);
//       toast.error('Failed to mark attendance');
//     }
//   };

//   // Get session status for student
//   const getAttendanceStatus = (session) => {
//     if (!session.attendanceRecords || !userInfo) return 'not_marked';
    
//     const userRecord = session.attendanceRecords.find(record => 
//       record.student._id === userInfo._id
//     );
    
//     return userRecord ? userRecord.status : 'not_marked';
//   };

//   // Get status display info
//   const getStatusDisplay = (session) => {
//     const attendanceStatus = getAttendanceStatus(session);
    
//     if (session.status === 'active') {
//       if (attendanceStatus === 'not_marked') {
//         return {
//           text: 'Mark Attendance',
//           color: 'bg-green-600 hover:bg-green-700',
//           icon: '📸',
//           clickable: true
//         };
//       } else {
//         return {
//           text: `Marked as ${attendanceStatus}`,
//           color: 'bg-green-100 text-green-800',
//           icon: '✅',
//           clickable: false
//         };
//       }
//     } else if (session.status === 'completed') {
//       if (attendanceStatus === 'not_marked') {
//         return {
//           text: 'Absent',
//           color: 'bg-red-100 text-red-800',
//           icon: '❌',
//           clickable: false
//         };
//       } else {
//         return {
//           text: `${attendanceStatus}`,
//           color: attendanceStatus === 'present' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
//           icon: attendanceStatus === 'present' ? '✅' : '🕐',
//           clickable: false
//         };
//       }
//     } else if (session.status === 'scheduled') {
//       return {
//         text: 'Upcoming',
//         color: 'bg-blue-100 text-blue-800',
//         icon: '📅',
//         clickable: false
//       };
//     } else {
//       return {
//         text: 'Cancelled',
//         color: 'bg-gray-100 text-gray-800',
//         icon: '❌',
//         clickable: false
//       };
//     }
//   };

//   // Group sessions by date
//   const groupSessionsByDate = () => {
//     const grouped = {};
//     sessions.forEach(session => {
//       const dateKey = format(parseISO(session.sessionDate), 'yyyy-MM-dd');
//       if (!grouped[dateKey]) {
//         grouped[dateKey] = [];
//       }
//       grouped[dateKey].push(session);
//     });
//     return grouped;
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
//         <h1 className="text-2xl font-bold mb-2">📚 My Class Schedule</h1>
//         {userInfo && (
//           <p className="text-indigo-100">
//             Welcome back, {userInfo.firstName}! Here's your upcoming classes and attendance status.
//           </p>
//         )}
//       </div>

//       {/* Quick Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Total Classes</p>
//               <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
//             </div>
//             <div className="text-2xl">📚</div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Today's Classes</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {sessions.filter(s => isToday(parseISO(s.sessionDate))).length}
//               </p>
//             </div>
//             <div className="text-2xl">📅</div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Active Sessions</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {sessions.filter(s => s.status === 'active').length}
//               </p>
//             </div>
//             <div className="text-2xl">🟢</div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {sessions.length > 0 
//                   ? Math.round((sessions.filter(s => getAttendanceStatus(s) === 'present').length / sessions.filter(s => s.status === 'completed').length) * 100) || 0
//                   : 0}%
//               </p>
//             </div>
//             <div className="text-2xl">📊</div>
//           </div>
//         </div>
//       </div>

//       {/* Sessions List */}
//       {isLoading ? (
//         <div className="flex items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//           <span className="ml-3 text-gray-600">Loading your schedule...</span>
//         </div>
//       ) : sessions.length === 0 ? (
//         <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
//           <span className="text-6xl block mb-4">📚</span>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
//           <p className="text-gray-600">You're not enrolled in any classes yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {Object.entries(groupSessionsByDate())
//             .sort(([a], [b]) => new Date(a) - new Date(b))
//             .map(([date, dateSessions]) => (
//               <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//                 <div className={`p-4 border-b border-gray-200 ${
//                   isToday(parseISO(date)) ? 'bg-indigo-50' : 'bg-gray-50'
//                 }`}>
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     {isToday(parseISO(date)) ? '🎯 Today - ' : ''}
//                     {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
//                   </h3>
//                   <p className="text-sm text-gray-600 mt-1">
//                     {dateSessions.length} class{dateSessions.length > 1 ? 'es' : ''} scheduled
//                   </p>
//                 </div>

//                 <div className="divide-y divide-gray-200">
//                   {dateSessions
//                     .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime))
//                     .map((session) => {
//                       const statusDisplay = getStatusDisplay(session);
                      
//                       return (
//                         <div key={session._id} className="p-4 hover:bg-gray-50 transition-colors">
//                           <div className="flex items-center justify-between">
//                             <div className="flex-1">
//                               <div className="flex items-start justify-between">
//                                 <div>
//                                   <h4 className="font-semibold text-gray-900">
//                                     {session.class?.name}
//                                   </h4>
//                                   <p className="text-sm text-gray-600">
//                                     {session.class?.code} • {session.instructor?.firstName} {session.instructor?.lastName}
//                                   </p>
                                  
//                                   <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
//                                     <span>⏰ {session.scheduledStartTime} - {session.scheduledEndTime}</span>
//                                     {session.room && <span>📍 {session.room}</span>}
//                                     {session.status === 'active' && (
//                                       <span className="flex items-center space-x-1 text-green-600">
//                                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                                         <span className="font-medium">LIVE</span>
//                                       </span>
//                                     )}
//                                   </div>

//                                   {session.topic && (
//                                     <p className="text-sm text-gray-700 mt-2">
//                                       <strong>Topic:</strong> {session.topic}
//                                     </p>
//                                   )}
//                                 </div>

//                                 <div className="ml-4">
//                                   {statusDisplay.clickable ? (
//                                     <button
//                                       onClick={() => handleMarkAttendance(session)}
//                                       className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${statusDisplay.color}`}
//                                     >
//                                       {statusDisplay.icon} {statusDisplay.text}
//                                     </button>
//                                   ) : (
//                                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
//                                       {statusDisplay.icon} {statusDisplay.text}
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                 </div>
//               </div>
//             ))}
//         </div>
//       )}

//       {/* Attendance Scanner Modal */}
//       {showAttendanceScanner && selectedSession && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">📸 Mark Attendance</h3>
//                   <p className="text-gray-600 mt-1">
//                     {selectedSession.class?.name} • {selectedSession.class?.code}
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setShowAttendanceScanner(false);
//                     setSelectedSession(null);
//                   }}
//                   className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>

//             <div className="p-6">
//               <AttendanceScanner
//                 onSuccess={handleAttendanceSuccess}
//                 onError={(error) => {
//                   console.error('Attendance error:', error);
//                   toast.error('Failed to mark attendance. Please try again.');
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StudentDashboard;




// new code as per new role based dashboard

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format, isToday, parseISO, addMinutes, isBefore, isAfter } from 'date-fns';
// import AttendanceScanner from '../face/AttendanceScanner';
import SessionAttendanceScanner from '../attendance/SessionAttendanceScanner';

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceScanner, setShowAttendanceScanner] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  



  // Load user info and sessions
  useEffect(() => {
    loadUserInfo();
    loadStudentSessions();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.success) {
        setUserInfo(response.user);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadStudentSessions = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.get('/sessions/student/schedule');
      
      if (response.success) {
        setSessions(response.sessions || []);
      }
    } catch (error) {
      console.error('Error loading student sessions:', error);
      toast.error('Failed to load class schedule');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if session is currently active (within time range)
  const isSessionActive = (session) => {
    const now = new Date();
    const sessionDate = parseISO(session.sessionDate);
    
    if (!isToday(sessionDate)) return false;
    
    const [startHour, startMin] = session.scheduledStartTime.split(':');
    const [endHour, endMin] = session.scheduledEndTime.split(':');
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
    
    const sessionEnd = new Date(sessionDate);
    sessionEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
    
    // Allow attendance 10 minutes before and 15 minutes after session ends
    const attendanceStart = addMinutes(sessionStart, -10);
    const attendanceEnd = addMinutes(sessionEnd, 15);
    
    return now >= attendanceStart && now <= attendanceEnd;
  };

  // Check if session is in the future
  const isSessionFuture = (session) => {
    const now = new Date();
    const sessionDate = parseISO(session.sessionDate);
    
    if (sessionDate > now) return true;
    
    if (isToday(sessionDate)) {
      const [startHour, startMin] = session.scheduledStartTime.split(':');
      const sessionStart = new Date(sessionDate);
      sessionStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
      
      return now < addMinutes(sessionStart, -10); // 10 minutes before session
    }
    
    return false;
  };

  // Handle session click
  const handleSessionClick = (session) => {
    if (isSessionFuture(session)) {
      toast.error('This session is not yet available for attendance');
      return;
    }
    
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  // Handle attendance marking
  const handleMarkAttendance = (session) => {
    if (!isSessionActive(session)) {
      toast.error('Attendance can only be marked during the session time');
      return;
    }
    
    if (session.status !== 'active') {
      toast.error('Session must be started by instructor first');
      return;
    }
    
    setSelectedSession(session);
    setShowAttendanceScanner(true);
    setShowSessionDetails(false);
  };



  // Handle successful attendance
// const handleAttendanceSuccess = async (data) => {
//   try {
//     const response = await api.post(`/sessions/${selectedSession._id}/attendance`, {
//       method: 'face_recognition',
//       confidence: data.confidence
//     });

//     if (response.success) {
//       toast.success(`✅ Attendance marked as ${response.status}!`);
//       setShowAttendanceScanner(false);
//       setSelectedSession(null);
      
//       // ✅ PREVENT MULTIPLE CALLS
//       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
//       await loadStudentSessions(); // Reload to get updated status
//     }
//   } catch (error) {
//     console.error('Error marking attendance:', error);
//     const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
    
//     // ✅ SHOW SPECIFIC ERROR MESSAGE
//     if (errorMessage.includes('already marked')) {
//       toast.error('Attendance already marked for this session!');
//     } else {
//       toast.error(errorMessage);
//     }
    
//     setShowAttendanceScanner(false);
//   }
// };


// Handle successful attendance (NO API CALL HERE - done in child)
const handleAttendanceSuccess = async (data) => {
  toast.success(`✅ Attendance marked as ${data.status || 'present'}!`);
  setShowAttendanceScanner(false);
  setSelectedSession(null);
  await loadStudentSessions(); // Reload immediately
};



  // Get session status for student
  const getAttendanceStatus = (session) => {
    if (!session.attendanceRecords || !userInfo) return 'not_marked';
    
    const userRecord = session.attendanceRecords.find(record => 
      record.student._id === userInfo._id || record.student === userInfo._id
    );
    
    return userRecord ? userRecord.status : 'not_marked';
  };

  // Get status display info
  const getStatusDisplay = (session) => {
    const attendanceStatus = getAttendanceStatus(session);
    const sessionActive = isSessionActive(session);
    const sessionFuture = isSessionFuture(session);
    
    if (sessionFuture) {
      return {
        text: 'Upcoming',
        color: 'bg-gray-100 text-gray-600',
        icon: '🕐',
        clickable: false,
        disabled: true
      };
    }
    
    if (session.status === 'active' && sessionActive) {
      if (attendanceStatus === 'not_marked') {
        return {
          text: 'Mark Attendance',
          color: 'bg-green-600 hover:bg-green-700 text-white',
          icon: '📸',
          clickable: true,
          action: 'attendance'
        };
      } else {
        return {
          text: `Marked as ${attendanceStatus}`,
          color: 'bg-green-100 text-green-800',
          icon: '✅',
          clickable: false
        };
      }
    } else if (session.status === 'completed') {
      if (attendanceStatus === 'not_marked') {
        return {
          text: 'Absent',
          color: 'bg-red-100 text-red-800',
          icon: '❌',
          clickable: false
        };
      } else {
        return {
          text: `${attendanceStatus}`,
          color: attendanceStatus === 'present' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
          icon: attendanceStatus === 'present' ? '✅' : '🕐',
          clickable: false
        };
      }
    } else if (session.status === 'scheduled') {
      return {
        text: 'Scheduled',
        color: 'bg-blue-100 text-blue-800',
        icon: '📅',
        clickable: true,
        action: 'details'
      };
    } else {
      return {
        text: 'Cancelled',
        color: 'bg-gray-100 text-gray-800',
        icon: '❌',
        clickable: false
      };
    }
  };

  // Group sessions by date
  const groupSessionsByDate = () => {
    const grouped = {};
    sessions.forEach(session => {
      const dateKey = format(parseISO(session.sessionDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  };

  // Calculate attendance stats
  const getAttendanceStats = () => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const attendedSessions = completedSessions.filter(s => getAttendanceStatus(s) === 'present');
    
    return {
      total: sessions.length,
      today: sessions.filter(s => isToday(parseISO(s.sessionDate))).length,
      active: sessions.filter(s => s.status === 'active').length,
      attendanceRate: completedSessions.length > 0 ? Math.round((attendedSessions.length / completedSessions.length) * 100) : 0
    };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">📚 My Class Schedule</h1>
        {userInfo && (
          <p className="text-indigo-100">
            Welcome back, {userInfo.firstName}! Here's your upcoming classes and attendance status.
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="text-2xl">📚</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="text-2xl">🟢</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading your schedule...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <span className="text-6xl block mb-4">📚</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
          <p className="text-gray-600">You're not enrolled in any classes yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupSessionsByDate())
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, dateSessions]) => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className={`p-4 border-b border-gray-200 ${
                  isToday(parseISO(date)) ? 'bg-indigo-50' : 'bg-gray-50'
                }`}>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isToday(parseISO(date)) ? '🎯 Today - ' : ''}
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {dateSessions.length} class{dateSessions.length > 1 ? 'es' : ''} scheduled
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {dateSessions
                    .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime))
                    .map((session) => {
                      const statusDisplay = getStatusDisplay(session);
                      
                      return (
                        <div 
                          key={session._id} 
                          className={`p-4 transition-colors ${
                            statusDisplay.disabled 
                              ? 'bg-gray-50 cursor-not-allowed' 
                              : statusDisplay.clickable 
                                ? 'hover:bg-gray-50 cursor-pointer' 
                                : 'hover:bg-gray-50'
                          }`}
                          onClick={() => statusDisplay.clickable && !statusDisplay.disabled && handleSessionClick(session)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className={`font-semibold ${statusDisplay.disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {session.class?.name}
                                  </h4>
                                  <p className={`text-sm ${statusDisplay.disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {session.class?.code} • {session.instructor?.firstName} {session.instructor?.lastName}
                                  </p>
                                  
                                  <div className={`flex items-center space-x-4 mt-2 text-sm ${statusDisplay.disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <span>⏰ {session.scheduledStartTime} - {session.scheduledEndTime}</span>
                                    {session.room && <span>📍 {session.room}</span>}
                                    {session.status === 'active' && isSessionActive(session) && (
                                      <span className="flex items-center space-x-1 text-green-600">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="font-medium">LIVE NOW</span>
                                      </span>
                                    )}
                                  </div>

                                  {session.topic && (
                                    <p className={`text-sm mt-2 ${statusDisplay.disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                                      <strong>Topic:</strong> {session.topic}
                                    </p>
                                  )}
                                </div>

                                <div className="ml-4">
                                  {statusDisplay.action === 'attendance' ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAttendance(session);
                                      }}
                                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusDisplay.color}`}
                                    >
                                      {statusDisplay.icon} {statusDisplay.text}
                                    </button>
                                  ) : (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                                      {statusDisplay.icon} {statusDisplay.text}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">📚 Session Details</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedSession.class?.name} • {selectedSession.class?.code}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSessionDetails(false);
                    setSelectedSession(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Session Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium">{format(parseISO(selectedSession.sessionDate), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-medium">{selectedSession.scheduledStartTime} - {selectedSession.scheduledEndTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Instructor:</span>
                    <p className="font-medium">{selectedSession.instructor?.firstName} {selectedSession.instructor?.lastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Room:</span>
                    <p className="font-medium">{selectedSession.room || 'TBA'}</p>
                  </div>
                </div>
                
                {selectedSession.topic && (
                  <div className="mt-4">
                    <span className="text-gray-600">Topic:</span>
                    <p className="font-medium mt-1">{selectedSession.topic}</p>
                  </div>
                )}
                
                {selectedSession.description && (
                  <div className="mt-4">
                    <span className="text-gray-600">Description:</span>
                    <p className="font-medium mt-1">{selectedSession.description}</p>
                  </div>
                )}
              </div>

              {/* Attendance Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Your Attendance Status</h4>
                <div className="flex items-center space-x-3">
                  {(() => {
                    const status = getAttendanceStatus(selectedSession);
                    if (status === 'present') {
                      return (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 font-medium">Present</span>
                        </>
                      );
                    } else if (status === 'late') {
                      return (
                        <>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-700 font-medium">Late</span>
                        </>
                      );
                    } else if (selectedSession.status === 'completed') {
                      return (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-red-700 font-medium">Absent</span>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-700 font-medium">Not Marked</span>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedSession.status === 'active' && isSessionActive(selectedSession) && getAttendanceStatus(selectedSession) === 'not_marked' && (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleMarkAttendance(selectedSession)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    📸 Mark Attendance Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Scanner Modal */}
      {/* {showAttendanceScanner && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">📸 Mark Attendance</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedSession.class?.name} • {selectedSession.class?.code}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAttendanceScanner(false);
                    setSelectedSession(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <AttendanceScanner
                onSuccess={handleAttendanceSuccess}
                onError={(error) => {
                  console.error('Attendance error:', error);
                  toast.error('Failed to mark attendance. Please try again.');
                }}
              />
            </div>
          </div>
        </div>
      )} */}

    {/* Attendance Scanner Modal */}
{showAttendanceScanner && selectedSession && userInfo && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">📸 Mark Attendance</h3>
            <p className="text-gray-600 mt-1">
              {selectedSession.class?.name} • {selectedSession.class?.code}
            </p>
          </div>
          <button
            onClick={() => {
              setShowAttendanceScanner(false);
              setSelectedSession(null);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Only render SessionAttendanceScanner if all required data is available */}
        {selectedSession?._id && userInfo?._id && userInfo?.firstName && userInfo?.lastName ? (
          <SessionAttendanceScanner
            sessionId={selectedSession._id}
            expectedStudentId={userInfo._id}
            expectedStudentName={`${userInfo.firstName} ${userInfo.lastName}`}
            onSuccess={handleAttendanceSuccess}
            onError={(error) => {
             console.error('Attendance error:', error);
              const errorMsg = error.message || 'Failed to mark attendance. Please try again.';
              toast.error(errorMsg);
              // Auto-close after 3s for retry/dismiss
              setTimeout(() => {
                setShowAttendanceScanner(false);
                setSelectedSession(null);
              }, 3000);
            }}
          />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-3">Loading user information...</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}




    </div>
  );
};

export default StudentDashboard;
