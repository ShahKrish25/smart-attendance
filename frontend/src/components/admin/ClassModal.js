import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const ClassModal = ({ isOpen, onClose, onSubmit, classData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    subject: '',
    instructor: '',
    capacity: 30,
    department: '',
    semester: '',
    academicYear: '2025',
    credits: 3,
    schedule: {
      days: [],
      startTime: '',
      endTime: '',
      room: ''
    },
    tags: [],
    isActive: true,
    enrollmentOpen: true,
    attendanceRequired: true,
    minimumAttendance: 75
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  
  const isEditing = !!classData;

  // Load instructors
 // Replace the instructor loading useEffect with this:
useEffect(() => {
  const loadInstructors = async () => {
    try {
      setLoadingInstructors(true);
      
      // First try to get instructors, then fall back to admins
      let response;
      try {
        response = await api.get('/admin/instructors');
      } catch (error) {
        console.log('📝 No instructors route, using admin users...');
        // Fallback to admin users
        response = await api.get('/admin/users', {
          params: { role: 'admin' }
        });
      }
      
      if (response.success) {
        const users = response.instructors || response.users || [];
        setInstructors(users);
        console.log('✅ Loaded instructors/admins:', users.length);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
      // If all fails, allow manual entry
      setInstructors([]);
    } finally {
      setLoadingInstructors(false);
    }
  };

  if (isOpen) {
    loadInstructors();
  }
}, [isOpen]);


  // Populate form when editing
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        code: classData.code || '',
        description: classData.description || '',
        subject: classData.subject || '',
        instructor: classData.instructor?._id || '',
        capacity: classData.capacity || 30,
        department: classData.department || '',
        semester: classData.semester || '',
        academicYear: classData.academicYear || '2025',
        credits: classData.credits || 3,
        schedule: {
          days: classData.schedule?.days || [],
          startTime: classData.schedule?.startTime || '',
          endTime: classData.schedule?.endTime || '',
          room: classData.schedule?.room || ''
        },
        tags: classData.tags || [],
        isActive: classData.isActive !== undefined ? classData.isActive : true,
        enrollmentOpen: classData.enrollmentOpen !== undefined ? classData.enrollmentOpen : true,
        attendanceRequired: classData.attendanceRequired !== undefined ? classData.attendanceRequired : true,
        minimumAttendance: classData.minimumAttendance || 75
      });
    } else {
      // Reset form for new class
      setFormData({
        name: '',
        code: '',
        description: '',
        subject: '',
        instructor: '',
        capacity: 30,
        department: '',
        semester: '',
        academicYear: '2025',
        credits: 3,
        schedule: {
          days: [],
          startTime: '',
          endTime: '',
          room: ''
        },
        tags: [],
        isActive: true,
        enrollmentOpen: true,
        attendanceRequired: true,
        minimumAttendance: 75
      });
    }
    setErrors({});
  }, [classData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('schedule.')) {
      const scheduleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [scheduleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                type === 'number' ? parseInt(value) || 0 : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: prev.schedule.days.includes(day)
          ? prev.schedule.days.filter(d => d !== day)
          : [...prev.schedule.days, day]
      }
    }));
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const tag = e.target.value.trim();
      if (!formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Class code is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.instructor) {
      newErrors.instructor = 'Instructor is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
    }

    if (formData.capacity < 1 || formData.capacity > 200) {
      newErrors.capacity = 'Capacity must be between 1 and 200';
    }

    if (formData.credits < 1 || formData.credits > 10) {
      newErrors.credits = 'Credits must be between 1 and 10';
    }

    if (formData.minimumAttendance < 0 || formData.minimumAttendance > 100) {
      newErrors.minimumAttendance = 'Minimum attendance must be between 0 and 100';
    }

    if (formData.schedule.startTime && formData.schedule.endTime) {
      if (formData.schedule.startTime >= formData.schedule.endTime) {
        newErrors['schedule.endTime'] = 'End time must be after start time';
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

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {isEditing ? '✏️ Edit Class' : '➕ Create New Class'}
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
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📚 Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Introduction to Computer Science"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="CS101"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Computer Science"
                />
                {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Business">Business</option>
                  <option value="Engineering">Engineering</option>
                </select>
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the class..."
              />
            </div>
          </div>

          {/* Instructor & Academic Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">👨‍🏫 Academic Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor *
                </label>
                <select
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.instructor ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loadingInstructors}
                >
                  <option value="">
                    {loadingInstructors ? 'Loading...' : 'Select Instructor'}
                  </option>
                  {instructors.map(instructor => (
                    <option key={instructor._id} value={instructor._id}>
                      {instructor.firstName} {instructor.lastName}
                    </option>
                  ))}
                </select>
                {errors.instructor && <p className="mt-1 text-sm text-red-600">{errors.instructor}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.semester ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Semester</option>
                  <option value="Fall 2025">Fall 2025</option>
                  <option value="Spring 2025">Spring 2025</option>
                  <option value="Summer 2025">Summer 2025</option>
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2024">Spring 2024</option>
                </select>
                {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits *
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.credits ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.credits && <p className="mt-1 text-sm text-red-600">{errors.credits}</p>}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">⏰ Schedule</h4>
            
            <div className="space-y-4">
              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.schedule.days.includes(day)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="schedule.startTime"
                    value={formData.schedule.startTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="schedule.endTime"
                    value={formData.schedule.endTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors['schedule.endTime'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['schedule.endTime'] && <p className="mt-1 text-sm text-red-600">{errors['schedule.endTime']}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    name="schedule.room"
                    value={formData.schedule.room}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Room 101"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="200"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.capacity ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Attendance (%)
                </label>
                <input
                  type="number"
                  name="minimumAttendance"
                  value={formData.minimumAttendance}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.minimumAttendance ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.minimumAttendance && <p className="mt-1 text-sm text-red-600">{errors.minimumAttendance}</p>}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active Class
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enrollmentOpen"
                  name="enrollmentOpen"
                  checked={formData.enrollmentOpen}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enrollmentOpen" className="ml-2 text-sm text-gray-700">
                  Enrollment Open
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="attendanceRequired"
                  name="attendanceRequired"
                  checked={formData.attendanceRequired}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="attendanceRequired" className="ml-2 text-sm text-gray-700">
                  Attendance Required
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Tags</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Tags (Press Enter to add)
              </label>
              <input
                type="text"
                onKeyPress={handleTagAdd}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type a tag and press Enter..."
              />
              
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                isEditing ? 'Update Class' : 'Create Class'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassModal;
