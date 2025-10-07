import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import ClassModal from './ClassModal';
import StudentEnrollmentModal from './StudentEnrollmentModal';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    academicYear: '',
    isActive: 'all'
  });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalStudentsEnrolled: 0
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Load classes
  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        search: searchTerm,
        ...filters
      });

      const response = await api.get(`/classes?${queryParams}`);
      
      if (response.success) {
        setClasses(response.classes || []);
        setStats(response.stats || {});
        console.log('✅ Loaded stats:', response.classes);
        // console.log('✅ Loaded', response.classes?.length, 'classes');
      }
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Filter classes based on search and filters
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = !searchTerm || 
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.instructor?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.instructor?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Handle class creation/update
  const handleClassSubmit = async (classData) => {
    try {
      if (editingClass) {
        const response = await api.put(`/classes/${editingClass._id}`, classData);
        if (response.success) {
          toast.success('Class updated successfully!');
          setEditingClass(null);
          await loadClasses();
        }
      } else {
        const response = await api.post('/classes', classData);
        if (response.success) {
          toast.success('Class created successfully!');
          setShowAddModal(false);
          await loadClasses();
        }
      }
    } catch (error) {
      console.error('❌ Error saving class:', error);
    }
  };

  // Handle class deletion
  const handleDeleteClass = async (classId) => {
    try {
      const response = await api.delete(`/classes/${classId}`);
      
      if (response.success) {
        toast.success('Class deleted successfully');
        setDeleteConfirm(null);
        await loadClasses();
      }
    } catch (error) {
      console.error('❌ Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  // Handle student enrollment
  const handleEnrollStudents = async (studentIds) => {
    try {
      const response = await api.post(`/classes/${selectedClassForEnrollment._id}/enroll`, {
        studentIds
      });
      
      if (response.success) {
        toast.success(`${response.enrolledCount} students enrolled successfully!`);
        setShowEnrollmentModal(false);
        setSelectedClassForEnrollment(null);
        await loadClasses();
      }
    } catch (error) {
      console.error('❌ Error enrolling students:', error);
    }
  };

  // Handle bulk operations
  const handleBulkDelete = async () => {
    if (selectedClasses.length === 0) return;
    
    try {
      const deletePromises = selectedClasses.map(classId => 
        api.delete(`/classes/${classId}`)
      );
      
      await Promise.all(deletePromises);
      
      setSelectedClasses([]);
      toast.success(`${selectedClasses.length} classes deleted`);
      await loadClasses();
    } catch (error) {
      console.error('❌ Error bulk deleting classes:', error);
      toast.error('Failed to delete selected classes');
    }
  };

  // Select all classes
  const handleSelectAll = () => {
    if (selectedClasses.length === filteredClasses.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(filteredClasses.map(c => c._id));
    }
  };

  // Get enrollment status color
  const getEnrollmentStatusColor = (enrollmentStatus) => {
    switch (enrollmentStatus) {
      case 'Full': return 'bg-red-100 text-red-800';
      case 'Almost_full': return 'bg-yellow-100 text-yellow-800';
      case 'Open': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get enrollment status text
  const getEnrollmentStatusText = (enrollmentStatus) => {
    switch (enrollmentStatus) {
      case 'Full': return 'Full';
      case 'Open' : return 'Open';
      case 'Almost_full': return 'Almost Full';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📚 Class Management</h1>
          <p className="text-gray-600 mt-2">Manage classes, schedules, and enrollments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>{viewMode === 'grid' ? '📋' : '⊞'}</span>
            <span>{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <span className="text-xl">➕</span>
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Classes', value: stats.total, icon: '📚', color: 'indigo' },
          { label: 'Active Classes', value: stats.active, icon: '✅', color: 'green' },
          { label: 'Inactive Classes', value: stats.inactive, icon: '⏸️', color: 'red' },
          { label: 'Total Enrolled', value: stats.totalStudentsEnrolled, icon: '👥', color: 'blue' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value || 0}</p>
              </div>
              <div className="text-4xl opacity-80">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search classes by name, code, subject, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filters */}
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
              value={filters.semester}
              onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Semesters</option>
              <option value="Fall 2025">Fall 2025</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Summer 2025">Summer 2025</option>
            </select>
          </div>

          <div>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedClasses.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {selectedClasses.length} classes selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Classes Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading classes...</span>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl block mb-4">📚</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No classes found' : 'No classes yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or filters' 
                : 'Get started by creating your first class'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create First Class
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => (
                <div key={classItem._id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
                  {/* Class Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {classItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getEnrollmentStatusColor(classItem.enrollmentStatus)
                        }`}>
                          {getEnrollmentStatusText(classItem.enrollmentStatus)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{classItem.name}</h3>
                      <p className="text-sm text-indigo-600 font-medium">{classItem.code}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(classItem._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, classItem._id]);
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== classItem._id));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Subject & Department */}
                  <div className="mb-4">
                    <p className="text-gray-900 font-medium">{classItem.subject}</p>
                    <p className="text-sm text-gray-600">{classItem.department}</p>
                  </div>

                  {/* Instructor */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-xs">
                          {classItem.instructor?.firstName?.charAt(0)}{classItem.instructor?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {classItem.instructor?.firstName} {classItem.instructor?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Instructor</p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  {classItem.schedule && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>⏰</span>
                        <span>{classItem.schedule.startTime} - {classItem.schedule.endTime}</span>
                      </div>
                      {classItem.schedule.room && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                          <span>📍</span>
                          <span>{classItem.schedule.room}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enrollment Info */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Enrollment</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {classItem.capacity - classItem.availableSlots}/{classItem.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          classItem.enrollmentStatus === 'full' ? 'bg-red-500' :
                          classItem.enrollmentStatus === 'almost_full' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((classItem.enrollmentCount / classItem.capacity) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Semester & Year */}
                  <div className="mb-4 text-xs text-gray-500">
                    <span>{classItem.semester} • {classItem.academicYear}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedClassForEnrollment(classItem);
                        setShowEnrollmentModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-1"
                    >
                      <span>👥</span>
                      <span>Enroll</span>
                    </button>
                    <button
                      onClick={() => setEditingClass(classItem)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      title="Edit class"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(classItem)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      title="Delete class"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedClasses.length === filteredClasses.length && filteredClasses.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(classItem._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses([...selectedClasses, classItem._id]);
                          } else {
                            setSelectedClasses(selectedClasses.filter(id => id !== classItem._id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                        <div className="text-sm text-indigo-600 font-medium">{classItem.code}</div>
                        <div className="text-sm text-gray-500">{classItem.subject}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-xs">
                            {classItem.instructor?.firstName?.charAt(0)}{classItem.instructor?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {classItem.instructor?.firstName} {classItem.instructor?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{classItem.instructor?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {classItem.schedule ? (
                        <div>
                          <div>{classItem.schedule.startTime} - {classItem.schedule.endTime}</div>
                          {classItem.schedule.room && (
                            <div className="text-gray-500">{classItem.schedule.room}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {classItem.enrollmentCount}/{classItem.capacity}
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              classItem.enrollmentStatus === 'full' ? 'bg-red-500' :
                              classItem.enrollmentStatus === 'almost_full' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min((classItem.enrollmentCount / classItem.capacity) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {classItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getEnrollmentStatusColor(classItem.enrollmentStatus)
                        }`}>
                          {getEnrollmentStatusText(classItem.enrollmentStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedClassForEnrollment(classItem);
                            setShowEnrollmentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors text-lg"
                          title="Manage enrollment"
                        >
                          👥
                        </button>
                        <button
                          onClick={() => setEditingClass(classItem)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors text-lg"
                          title="Edit class"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(classItem)}
                          className="text-red-600 hover:text-red-900 transition-colors text-lg"
                          title="Delete class"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClassModal
        isOpen={showAddModal || !!editingClass}
        onClose={() => {
          setShowAddModal(false);
          setEditingClass(null);
        }}
        onSubmit={handleClassSubmit}
        classData={editingClass}
      />

      <StudentEnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => {
          setShowEnrollmentModal(false);
          setSelectedClassForEnrollment(null);
        }}
        onSubmit={handleEnrollStudents}
        classData={selectedClassForEnrollment}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Class?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {deleteConfirm.name} ({deleteConfirm.code})
                </span>?
                <br />This will also delete all attendance records for this class.
                <br />This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteClass(deleteConfirm._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
