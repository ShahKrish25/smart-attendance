import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const StudentEnrollmentModal = ({ isOpen, onClose, onSubmit, classData = null }) => {
  const [availableStudents, setAvailableStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    status: 'active'
  });
  const [viewMode, setViewMode] = useState('available'); // 'available' or 'enrolled'

  // Load students when modal opens
  useEffect(() => {
    if (isOpen && classData) {
      loadStudents();
    }
  }, [isOpen, classData]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      
      // Load all active students
      const studentsResponse = await api.get('/admin/students', {
        params: {
          isActive: true,
          limit: 1000 // Get all students
        }
      });

      if (studentsResponse.success) {
        const allStudents = studentsResponse.students || [];
        
        // Separate enrolled and available students
        const enrolled = allStudents.filter(student => 
          classData.students && classData.students.some(s => s._id === student._id)
        );
        
        const available = allStudents.filter(student => 
          !classData.students || !classData.students.some(s => s._id === student._id)
        );

        setEnrolledStudents(enrolled);
        setAvailableStudents(available);
        
        console.log('✅ Loaded students:', {
          available: available.length,
          enrolled: enrolled.length
        });
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search and filters
  const getFilteredStudents = (students) => {
    return students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !filters.department || 
        student.department === filters.department;

      const matchesYear = !filters.year || 
        student.academicYear === filters.year;

      return matchesSearch && matchesDepartment && matchesYear;
    });
  };

  // Handle student selection
  const handleStudentSelect = (student, isSelected) => {
    if (isSelected) {
      setSelectedStudents(prev => [...prev, student._id]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== student._id));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const currentStudents = viewMode === 'available' 
      ? getFilteredStudents(availableStudents)
      : getFilteredStudents(enrolledStudents);
      
    if (selectedStudents.length === currentStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(currentStudents.map(s => s._id));
    }
  };

  // Handle bulk enrollment
  const handleBulkEnroll = () => {
    if (selectedStudents.length === 0) return;

    const availableSlots = classData.capacity - enrolledStudents.length;
    if (selectedStudents.length > availableSlots) {
      toast.error(`Only ${availableSlots} slots available. Please select fewer students.`);
      return;
    }

    onSubmit(selectedStudents);
    setSelectedStudents([]);
  };

  // Handle individual enrollment
  const handleIndividualEnroll = (studentId) => {
    const availableSlots = classData.capacity - enrolledStudents.length;
    if (availableSlots <= 0) {
      toast.error('Class is full. Cannot enroll more students.');
      return;
    }

    onSubmit([studentId]);
  };

  // Handle student removal
  const handleRemoveStudent = async (studentId) => {
    try {
      const response = await api.delete(`/classes/${classData._id}/students/${studentId}`);
      
      if (response.success) {
        toast.success('Student removed from class');
        await loadStudents(); // Reload students
      }
    } catch (error) {
      console.error('❌ Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  // Handle bulk removal
  const handleBulkRemove = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const removePromises = selectedStudents.map(studentId =>
        api.delete(`/classes/${classData._id}/students/${studentId}`)
      );
      
      await Promise.all(removePromises);
      
      toast.success(`${selectedStudents.length} students removed from class`);
      setSelectedStudents([]);
      await loadStudents(); // Reload students
    } catch (error) {
      console.error('❌ Error removing students:', error);
      toast.error('Failed to remove students');
    }
  };

  if (!isOpen || !classData) return null;

  const filteredAvailable = getFilteredStudents(availableStudents);
  const filteredEnrolled = getFilteredStudents(enrolledStudents);
  const currentStudents = viewMode === 'available' ? filteredAvailable : filteredEnrolled;
  const availableSlots = classData.capacity - enrolledStudents.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">👥 Manage Class Enrollment</h3>
              <p className="text-indigo-100 mt-1">
                {classData.name} ({classData.code})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Class Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-sm text-indigo-100">Enrolled</div>
              <div className="text-xl font-bold">{enrolledStudents.length}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-sm text-indigo-100">Capacity</div>
              <div className="text-xl font-bold">{classData.capacity}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-sm text-indigo-100">Available</div>
              <div className="text-xl font-bold">{availableSlots}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-indigo-100 mb-1">
              <span>Enrollment Progress</span>
              <span>{Math.round((enrolledStudents.length / classData.capacity) * 100)}%</span>
            </div>
            <div className="w-full bg-indigo-700 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ 
                  width: `${Math.min((enrolledStudents.length / classData.capacity) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('available')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'available'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                Available Students ({filteredAvailable.length})
              </button>
              <button
                onClick={() => setViewMode('enrolled')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'enrolled'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                Enrolled Students ({filteredEnrolled.length})
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {selectedStudents.length > 0 && (
                <>
                  {viewMode === 'available' ? (
                    <button
                      onClick={handleBulkEnroll}
                      disabled={availableSlots <= 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      Enroll {selectedStudents.length} Students
                    </button>
                  ) : (
                    <button
                      onClick={handleBulkRemove}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove {selectedStudents.length} Students
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Years</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">
                {viewMode === 'available' ? '👥' : '📚'}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm 
                  ? 'No students found' 
                  : viewMode === 'available' 
                    ? 'No available students' 
                    : 'No enrolled students'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters'
                  : viewMode === 'available'
                    ? 'All students are already enrolled in this class'
                    : 'No students are currently enrolled in this class'
                }
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === currentStudents.length && currentStudents.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Select All ({currentStudents.length} students)
                  </label>
                </div>
                
                {selectedStudents.length > 0 && (
                  <div className="text-sm text-indigo-600">
                    {selectedStudents.length} selected
                  </div>
                )}
              </div>

              {/* Student Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentStudents.map((student) => (
                  <div
                    key={student._id}
                    className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                      selectedStudents.includes(student._id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStudentSelect(student, !selectedStudents.includes(student._id))}
                  >
                    {/* Student Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-sm text-indigo-600 font-medium">{student.studentId}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStudentSelect(student, e.target.checked);
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>

                    {/* Student Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>📧</span>
                        <span className="truncate">{student.email}</span>
                      </div>
                      
                      {student.department && (
                        <div className="flex items-center space-x-2">
                          <span>🏢</span>
                          <span>{student.department}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{student.faceRegistered ? '📸' : '⏳'}</span>
                          <span className="text-xs">
                            {student.faceRegistered ? 'Face Registered' : 'Face Pending'}
                          </span>
                        </div>
                        
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      {viewMode === 'available' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualEnroll(student._id);
                          }}
                          disabled={availableSlots <= 0}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {availableSlots > 0 ? 'Enroll Student' : 'Class Full'}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStudent(student._id);
                          }}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Remove from Class
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {viewMode === 'available' 
                ? `${filteredAvailable.length} available students • ${availableSlots} slots remaining`
                : `${filteredEnrolled.length} enrolled students • ${Math.round((enrolledStudents.length / classData.capacity) * 100)}% capacity`
              }
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentModal;
