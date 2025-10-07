import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LiveSessionModal = ({ isOpen, onClose, activeSessions = [], onSessionEnd }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load session details when selected
  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!selectedSession) return;
      
      try {
        setIsLoading(true);
        const response = await api.get(`/sessions/${selectedSession._id}`);
        
        if (response.success) {
          setSessionDetails(response.session);
        }
      } catch (error) {
        console.error('Error loading session details:', error);
        toast.error('Failed to load session details');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionDetails();
  }, [selectedSession]);

  // Select first session by default
  useEffect(() => {
    if (activeSessions.length > 0 && !selectedSession) {
      setSelectedSession(activeSessions[0]);
    }
  }, [activeSessions, selectedSession]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSession(null);
      setSessionDetails(null);
    }
  }, [isOpen]);

  // Handle end session
  const handleEndSession = async (sessionId) => {
    try {
      await onSessionEnd(sessionId);
      
      // Remove ended session from list
      if (activeSessions.length === 1) {
        onClose();
      } else {
        // Select next session
        const remainingSessions = activeSessions.filter(s => s._id !== sessionId);
        setSelectedSession(remainingSessions[0] || null);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (!isOpen || activeSessions.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                <span>Live Sessions ({activeSessions.length})</span>
              </h3>
              <p className="text-green-100 mt-1">Monitor ongoing class sessions</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Session List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Active Sessions</h4>
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedSession?._id === session._id
                        ? 'bg-green-100 border-green-500 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">
                          {session.class?.name}
                        </h5>
                        <p className="text-xs text-gray-600">
                          {session.class?.code} • {session.instructor?.firstName} {session.instructor?.lastName}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            ⏰ {session.scheduledStartTime} - {session.scheduledEndTime}
                          </span>
                        </div>
                        {session.room && (
                          <p className="text-xs text-gray-500 mt-1">📍 {session.room}</p>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2 mt-1"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading session details...</span>
              </div>
            ) : sessionDetails ? (
              <div className="p-6">
                {/* Session Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {sessionDetails.class?.name}
                      </h3>
                      <p className="text-gray-600">
                        {sessionDetails.class?.code} • {sessionDetails.class?.subject}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>👨‍🏫 {sessionDetails.instructor?.firstName} {sessionDetails.instructor?.lastName}</span>
                        <span>⏰ {sessionDetails.scheduledStartTime} - {sessionDetails.scheduledEndTime}</span>
                        {sessionDetails.room && <span>📍 {sessionDetails.room}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                        LIVE
                      </span>
                    </div>
                  </div>

                  {sessionDetails.topic && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700">Today's Topic:</h4>
                      <p className="text-gray-900 mt-1">{sessionDetails.topic}</p>
                    </div>
                  )}
                </div>

                {/* Attendance Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {sessionDetails.class?.students?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sessionDetails.attendanceStats?.presentStudents || 0}
                    </div>
                    <div className="text-sm text-gray-600">Present</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {sessionDetails.attendanceStats?.attendanceRate || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => handleEndSession(sessionDetails._id)}
                    className="flex items-center justify-center space-x-2 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <span>⏹️</span>
                    <span>End Session</span>
                  </button>
                </div>

                {/* Recent Attendance */}
                {sessionDetails.attendanceRecords && sessionDetails.attendanceRecords.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      ✅ Recent Attendance ({sessionDetails.attendanceRecords.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sessionDetails.attendanceRecords
                        .sort((a, b) => new Date(b.markedAt) - new Date(a.markedAt))
                        .slice(0, 10)
                        .map((record, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-xs">
                                  {record.student?.firstName?.charAt(0)}{record.student?.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.student?.firstName} {record.student?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {record.student?.studentId}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === 'present' 
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(record.markedAt), 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <span className="text-4xl block mb-2">📅</span>
                  <p>Select a session to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionModal;
