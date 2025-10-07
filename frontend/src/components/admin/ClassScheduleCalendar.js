import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from "date-fns";
import SessionModal from "./SessionModal";
import LiveSessionModal from "./LiveSessionModal";

const ClassScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week"); // 'day', 'week', 'month'
  const [sessions, setSessions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showLiveSessionModal, setShowLiveSessionModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  // Load sessions based on current view and date
  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);

      let startDate, endDate;

      switch (view) {
        case "day":
          startDate = format(currentDate, "yyyy-MM-dd");
          endDate = format(currentDate, "yyyy-MM-dd");
          break;
        case "week":
          startDate = format(startOfWeek(currentDate), "yyyy-MM-dd");
          endDate = format(endOfWeek(currentDate), "yyyy-MM-dd");
          break;
        case "month":
          startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
          endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");
          break;
        default:
          startDate = format(startOfWeek(currentDate), "yyyy-MM-dd");
          endDate = format(endOfWeek(currentDate), "yyyy-MM-dd");
      }

      const response = await api.get("/sessions", {
        params: { startDate, endDate, view },
      });

      if (response.success) {
        setSessions(response.sessions || []);
        setGroupedSessions(response.groupedSessions || {});
        setStats(response.stats || {});

        // Filter active sessions
        const active = (response.sessions || []).filter(
          (session) => session.status === "active"
        );
        setActiveSessions(active);

        console.log("✅ Loaded sessions:", response.sessions?.length);
      }
    } catch (error) {
      console.error("❌ Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, view]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Navigation functions
  const navigatePrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      default:
        break;
    }
  };

  //   new code handler for the delete button
  // Add this function after handleSessionAction
  const handleDeleteSession = async (sessionId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this session? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/sessions/${sessionId}`);

      if (response.success) {
        toast.success("Session deleted successfully!");
        await loadSessions(); // Reload sessions
      }
    } catch (error) {
      console.error("❌ Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const navigateNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      default:
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return groupedSessions[dateKey] || [];
  };

  // Handle session creation
  const handleCreateSession = (date = null) => {
    setSelectedDate(date || currentDate);
    setEditingSession(null);
    setShowSessionModal(true);
  };

  // Handle session editing
  const handleEditSession = (session) => {
    setEditingSession(session);
    setShowSessionModal(true);
  };

  // Handle session submission
  const handleSessionSubmit = async (sessionData) => {
    try {
      if (editingSession) {
        const response = await api.put(
          `/sessions/${editingSession._id}`,
          sessionData
        );
        if (response.success) {
          toast.success("Session updated successfully!");
        }
      } else {
        const response = await api.post("/sessions", sessionData);
        if (response.success) {
          toast.success("Session created successfully!");
        }
      }

      setShowSessionModal(false);
      setEditingSession(null);
      await loadSessions();
    } catch (error) {
      console.error("❌ Error saving session:", error);
    }
  };

  // Handle session start/end
  const handleSessionAction = async (sessionId, action) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/${action}`);

      if (response.success) {
        toast.success(`Session ${action}ed successfully!`);
        await loadSessions();
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing session:`, error);
      toast.error(`Failed to ${action} session`);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return "📅";
      case "active":
        return "🟢";
      case "completed":
        return "✅";
      case "cancelled":
        return "❌";
      default:
        return "📅";
    }
  };

  // Render header
  const renderHeader = () => {
    let headerText;

    switch (view) {
      case "day":
        headerText = format(currentDate, "EEEE, MMMM d, yyyy");
        break;
      case "week":
        headerText = `${format(startOfWeek(currentDate), "MMM d")} - ${format(
          endOfWeek(currentDate),
          "MMM d, yyyy"
        )}`;
        break;
      case "month":
        headerText = format(currentDate, "MMMM yyyy");
        break;
      default:
        break;
    }

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">
            📅 Class Schedule
          </h1>

          {/* View Toggle */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  view === v
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Sessions Indicator */}
          {activeSessions.length > 0 && (
            <button
              onClick={() => setShowLiveSessionModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>
                {activeSessions.length} Live Session
                {activeSessions.length > 1 ? "s" : ""}
              </span>
            </button>
          )}

          <button
            onClick={() => handleCreateSession()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>New Session</span>
          </button>
        </div>
      </div>
    );
  };

  // Render navigation
  const renderNavigation = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            ⬅️
          </button>

          <h2 className="text-xl font-semibold text-gray-900 min-w-[300px] text-center">
            {(() => {
              switch (view) {
                case "day":
                  return format(currentDate, "EEEE, MMMM d, yyyy");
                case "week":
                  return `${format(
                    startOfWeek(currentDate),
                    "MMM d"
                  )} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;
                case "month":
                  return format(currentDate, "MMMM yyyy");
                default:
                  return "";
              }
            })()}
          </h2>

          <button
            onClick={navigateNext}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            ➡️
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Today
        </button>
      </div>
    );
  };

  // Render stats
  const renderStats = () => {
    return (
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, icon: "📊", color: "indigo" },
          {
            label: "Scheduled",
            value: stats.scheduled,
            icon: "📅",
            color: "blue",
          },
          { label: "Active", value: stats.active, icon: "🟢", color: "green" },
          {
            label: "Completed",
            value: stats.completed,
            icon: "✅",
            color: "gray",
          },
          {
            label: "Cancelled",
            value: stats.cancelled,
            icon: "❌",
            color: "red",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value || 0}
                </p>
              </div>
              <div className="text-2xl opacity-80">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render session card
  const renderSessionCard = (session) => {
    const isLive = session.status === "active";
    const canStart =
      session.status === "scheduled" &&
      new Date() >= new Date(session.sessionDate);

    return (
      <div
        key={session._id}
        className={`p-3 rounded-lg border-l-4 border transition-all hover:shadow-md cursor-pointer ${
          isLive
            ? "bg-green-50 border-green-500 hover:bg-green-100"
            : "bg-white border-indigo-500 hover:bg-gray-50"
        }`}
        onClick={() => handleEditSession(session)}
      >
        {/* Session Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {session.class?.name} ({session.class?.code})
            </h4>
            <p className="text-xs text-gray-600">
              {session.instructor?.firstName} {session.instructor?.lastName}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              session.status
            )}`}
          >
            {getStatusIcon(session.status)} {session.status}
          </span>
        </div>
        {/* Time */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <span>⏰</span>
          <span>
            {session.scheduledStartTime} - {session.scheduledEndTime}
          </span>
          {session.room && (
            <>
              <span>•</span>
              <span>📍 {session.room}</span>
            </>
          )}
        </div>
        {/* Topic */}
        {session.topic && (
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
            {session.topic}
          </p>
        )}
        {/* Action Buttons */}
        {/* <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {session.attendanceStats?.presentStudents || 0} / {session.class?.students?.length || 0} attended
          </div>
          
          <div className="flex space-x-2">
            {canStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSessionAction(session._id, 'start');
                }}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
              >
                ▶️ Start
              </button>
            )}
            
            {isLive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSessionAction(session._id, 'end');
                }}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
              >
                ⏹️ End
              </button>
            )}
          </div>
        </div> */}
        {/* new code with delete */}
        {/* // Find the existing action buttons section and replace it with: */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {session.attendanceStats?.presentStudents || 0} /{" "}
            {session.class?.students?.length || 0} attended
          </div>

          <div className="flex space-x-1">
            {canStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSessionAction(session._id, "start");
                }}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
              >
                ▶️ Start
              </button>
            )}

            {isLive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSessionAction(session._id, "end");
                }}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
              >
                ⏹️ End
              </button>
            )}

            {/* ✅ NEW: Delete Button */}
            {session.status !== "active" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session._id);
                }}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                title="Delete session"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        {/* new code with delete */}
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const daySessions = getSessionsForDate(currentDate);
    const timeSlots = [];

    // Generate time slots from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <button
              onClick={() => handleCreateSession(currentDate)}
              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              + Add Session
            </button>
          </div>

          {daySessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">📅</span>
              <p>No sessions scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySessions
                .sort((a, b) =>
                  a.scheduledStartTime.localeCompare(b.scheduledStartTime)
                )
                .map(renderSessionCard)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate),
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="p-4 border-r border-gray-200 last:border-r-0"
            >
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday(day)
                      ? "bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                      : "text-gray-900"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 min-h-[500px]">
          {weekDays.map((day, dayIndex) => {
            const daySessions = getSessionsForDate(day);

            return (
              <div
                key={dayIndex}
                className="p-2 border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleCreateSession(day)}
              >
                <div className="space-y-2">
                  {daySessions
                    .sort((a, b) =>
                      a.scheduledStartTime.localeCompare(b.scheduledStartTime)
                    )
                    .map((session) => (
                      <div
                        key={session._id}
                        className={`p-2 rounded text-xs border-l-2 transition-all hover:shadow-sm ${
                          session.status === "active"
                            ? "bg-green-50 border-green-500 text-green-800"
                            : "bg-indigo-50 border-indigo-500 text-indigo-800"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSession(session);
                        }}
                      >
                        <div className="font-medium truncate">
                          {session.class?.code}
                        </div>
                        <div className="text-gray-600">
                          {session.scheduledStartTime}
                        </div>
                        {session.status === "active" && (
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span>LIVE</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Month Header */}
        <div className="grid grid-cols-7 gap-0 bg-gray-50 border-b border-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-4 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-rows-5 gap-0">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7 gap-0 border-b border-gray-200 last:border-b-0"
            >
              {week.map((day, dayIndex) => {
                const daySessions = getSessionsForDate(day);
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();
                const hasActiveSessions = daySessions.some(
                  (s) => s.status === "active"
                );

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] p-2 border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors ${
                      isCurrentMonth
                        ? "hover:bg-gray-50"
                        : "bg-gray-50 text-gray-400"
                    } ${isToday(day) ? "bg-indigo-50" : ""}`}
                    onClick={() => handleCreateSession(day)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          isToday(day)
                            ? "bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            : isCurrentMonth
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {format(day, "d")}
                      </span>

                      {hasActiveSessions && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {daySessions.slice(0, 3).map((session) => (
                        <div
                          key={session._id}
                          className={`p-1 rounded text-xs truncate ${
                            session.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSession(session);
                          }}
                        >
                          {session.class?.code} {session.scheduledStartTime}
                        </div>
                      ))}

                      {daySessions.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{daySessions.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderNavigation()}
      {renderStats()}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading calendar...</span>
        </div>
      ) : (
        <div>
          {view === "day" && renderDayView()}
          {view === "week" && renderWeekView()}
          {view === "month" && renderMonthView()}
        </div>
      )}

      {/* Modals */}
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setEditingSession(null);
          setSelectedDate(null);
        }}
        onSubmit={handleSessionSubmit}
        sessionData={editingSession}
        selectedDate={selectedDate}
      />

      <LiveSessionModal
        isOpen={showLiveSessionModal}
        onClose={() => setShowLiveSessionModal(false)}
        activeSessions={activeSessions}
        onSessionEnd={(sessionId) => handleSessionAction(sessionId, "end")}
      />
    </div>
  );
};

export default ClassScheduleCalendar;
