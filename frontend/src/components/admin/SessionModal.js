import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SessionModal = ({ isOpen, onClose, onSubmit, sessionData = null, selectedDate = null }) => {
  const [formData, setFormData] = useState({
    classId: '',
    sessionDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    sessionType: 'regular',
    room: '',
    topic: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  const isEditing = !!sessionData;

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await api.get('/classes');
        if (response.success) {
          setClasses(response.classes || []);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };

    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  // Populate form when editing or date selected
  useEffect(() => {
    if (sessionData) {
      setFormData({
        classId: sessionData.class?._id || '',
        sessionDate: sessionData.sessionDate ? format(new Date(sessionData.sessionDate), 'yyyy-MM-dd') : '',
        scheduledStartTime: sessionData.scheduledStartTime || '',
        scheduledEndTime: sessionData.scheduledEndTime || '',
        sessionType: sessionData.sessionType || 'regular',
        room: sessionData.room || '',
        topic: sessionData.topic || '',
        description: sessionData.description || ''
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        sessionDate: format(selectedDate, 'yyyy-MM-dd'),
        classId: '',
        scheduledStartTime: '',
        scheduledEndTime: '',
        sessionType: 'regular',
        room: '',
        topic: '',
        description: ''
      }));
    } else {
      // Reset form
      setFormData({
        classId: '',
        sessionDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledStartTime: '',
        scheduledEndTime: '',
        sessionType: 'regular',
        room: '',
        topic: '',
        description: ''
      });
    }
    setErrors({});
  }, [sessionData, selectedDate, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-populate room from class schedule
    if (name === 'classId' && value) {
      const selectedClass = classes.find(c => c._id === value);
      if (selectedClass?.schedule?.room) {
        setFormData(prev => ({
          ...prev,
          room: selectedClass.schedule.room
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.classId) {
      newErrors.classId = 'Class is required';
    }

    if (!formData.sessionDate) {
      newErrors.sessionDate = 'Session date is required';
    }

    if (!formData.scheduledStartTime) {
      newErrors.scheduledStartTime = 'Start time is required';
    }

    if (!formData.scheduledEndTime) {
      newErrors.scheduledEndTime = 'End time is required';
    }

    if (formData.scheduledStartTime && formData.scheduledEndTime) {
      if (formData.scheduledStartTime >= formData.scheduledEndTime) {
        newErrors.scheduledEndTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {isEditing ? '✏️ Edit Session' : '➕ Create New Session'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📚 Session Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.classId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loadingClasses}
                >
                  <option value="">
                    {loadingClasses ? 'Loading...' : 'Select Active Class'}
                  </option>
                  {classes.map(classItem => (
                    classItem.isActive &&
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name} ({classItem.code})
                    </option> 
                  ))}
                </select>
                {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date *
                </label>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.sessionDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.sessionDate && <p className="mt-1 text-sm text-red-600">{errors.sessionDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="scheduledStartTime"
                  value={formData.scheduledStartTime}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.scheduledStartTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.scheduledStartTime && <p className="mt-1 text-sm text-red-600">{errors.scheduledStartTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  name="scheduledEndTime"
                  value={formData.scheduledEndTime}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.scheduledEndTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.scheduledEndTime && <p className="mt-1 text-sm text-red-600">{errors.scheduledEndTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="regular">Regular Class</option>
                  <option value="makeup">Makeup Class</option>
                  <option value="extra">Extra Session</option>
                  <option value="exam">Exam</option>
                  <option value="lab">Lab Session</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Room 101"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Additional Information</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic/Subject
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Introduction to Algorithms, Chapter 5 Review"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description/Notes
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Additional notes or instructions for this session..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Session' : 'Create Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
