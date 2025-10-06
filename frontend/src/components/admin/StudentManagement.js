import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import StudentModal from './StudentModal'; // ✅ Import the modal

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Add submitting state
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    active: 0,
    inactive: 0
  });

  // Load students from API
  const loadStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/students');
      
      if (response.success) {
        setStudents(response.students || []);
        setStats(response.stats || {});
        console.log('✅ Loaded', response.students?.length, 'students');
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ✅ Handle Add Student
  const handleAddStudent = async (studentData) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/students', studentData);
      
      if (response.success) {
        toast.success('Student created successfully!');
        setShowAddModal(false);
        await loadStudents(); // Reload the list
      }
    } catch (error) {
      console.error('❌ Error creating student:', error);
      // Error message will be shown by the API interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Handle Edit Student  
  const handleEditStudent = async (studentData) => {
    setIsSubmitting(true);
    try {
      const response = await api.put(`/admin/students/${editingStudent._id}`, studentData);
      
      if (response.success) {
        toast.success('Student updated successfully!');
        setEditingStudent(null);
        await loadStudents(); // Reload the list
      }
    } catch (error) {
      console.error('❌ Error updating student:', error);
      // Error message will be shown by the API interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle student deletion
  const handleDeleteStudent = async (studentId) => {
    try {
      const response = await api.delete(`/admin/students/${studentId}`);
      
      if (response.success) {
        toast.success('Student deleted successfully');
        setDeleteConfirm(null);
        await loadStudents(); // Reload the list
      }
    } catch (error) {
      console.error('❌ Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  // Toggle student status
  const toggleStudentStatus = async (studentId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/students/${studentId}/status`, {
        isActive: !currentStatus
      });
      
      if (response.success) {
        toast.success(`Student ${!currentStatus ? 'activated' : 'deactivated'}`);
        await loadStudents(); // Reload the list
      }
    } catch (error) {
      console.error('❌ Error updating student status:', error);
      toast.error('Failed to update student status');
    }
  };

  // Select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    
    try {
      const response = await api.post('/admin/students/bulk-delete', {
        studentIds: selectedStudents
      });
      
      if (response.success) {
        setSelectedStudents([]);
        toast.success(`${response.deletedCount} students deleted`);
        await loadStudents(); // Reload the list
      }
    } catch (error) {
      console.error('❌ Error bulk deleting students:', error);
      toast.error('Failed to delete selected students');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Student Management</h1>
          <p className="text-gray-600 mt-2">Manage student accounts and information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-xl">➕</span>
          <span>Add Student</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats.total, icon: '👥', color: 'indigo' },
          { label: 'Face Registered', value: stats.registered, icon: '📸', color: 'green' },
          { label: 'Active', value: stats.active, icon: '✅', color: 'blue' },
          { label: 'Inactive', value: stats.inactive, icon: '⏸️', color: 'red' }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search students by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          {selectedStudents.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedStudents.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">👥</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No students found' : 'No students yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first student'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Face Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student._id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.faceRegistered 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.faceRegistered ? '📸 Registered' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStudentStatus(student._id, student.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          student.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {student.isActive ? '✅ Active' : '⏸️ Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.lastLogin 
                        ? new Date(student.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors text-lg"
                          title="Edit student"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student)}
                          className="text-red-600 hover:text-red-900 transition-colors text-lg"
                          title="Delete student"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✅ Add Student Modal */}
      <StudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStudent}
        isLoading={isSubmitting}
      />

      {/* ✅ Edit Student Modal */}
      <StudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSubmit={handleEditStudent}
        student={editingStudent}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {deleteConfirm.firstName} {deleteConfirm.lastName}
                </span>?
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
                  onClick={() => handleDeleteStudent(deleteConfirm._id)}
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

export default StudentManagement;
