import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

const ShowSessionHistory = ({ isOpen, onClose, sessionId }) => {
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!sessionId) return;
      try {
        setIsLoading(true);
        const response = await api.get(`/sessions/${sessionId}`);
        if (response.success) {
          setSessionDetails(response.session);
        }
      } catch (error) {
        console.error("❌ Error loading session details:", error);
        toast.error("Failed to load session details");
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) loadSessionDetails();
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">📘 Session History</h3>
              <p className="text-indigo-100 mt-1">
                View attendance and insights for this session
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading session details...</span>
            </div>
          ) : sessionDetails ? (
            <>
              {/* Header Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {sessionDetails.class?.name}
                </h3>
                <p className="text-gray-600">
                  {sessionDetails.class?.code} • {sessionDetails.class?.subject}
                </p>
                <div className="flex flex-wrap items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>
                    👨‍🏫 {sessionDetails.instructor?.firstName}{" "}
                    {sessionDetails.instructor?.lastName}
                  </span>
                  <span>
                    🗓️ {format(new Date(sessionDetails.sessionDate), "MMM d, yyyy")}
                  </span>
                  <span>
                    ⏰ {sessionDetails.scheduledStartTime} -{" "}
                    {sessionDetails.scheduledEndTime}
                  </span>
                  {sessionDetails.room && <span>📍 {sessionDetails.room}</span>}
                </div>
              </div>

              {/* Topic */}
              {sessionDetails.topic && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700">Topic:</h4>
                  <p className="text-gray-900 mt-1">{sessionDetails.topic}</p>
                </div>
              )}

              {/* Attendance Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {sessionDetails.attendanceStats?.totalStudents || 0}
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

              {/* Attendance Records */}
              {sessionDetails.attendanceRecords &&
              sessionDetails.attendanceRecords.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    👥 Attendance Records (
                    {sessionDetails.attendanceRecords.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {sessionDetails.attendanceRecords
                      .sort((a, b) => new Date(b.markedAt) - new Date(a.markedAt))
                      .map((record, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold text-xs">
                                {record.student?.firstName?.[0]}
                                {record.student?.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.student?.firstName}{" "}
                                {record.student?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {record.student?.studentId}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "late"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {record.status}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {format(new Date(record.markedAt), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No attendance records available.
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl block mb-2">📘</span>
              <p>No session data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowSessionHistory;
