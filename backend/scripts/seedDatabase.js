const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Class = require('../models/Class');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-attendance');
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      Student.deleteMany({}),
      Class.deleteMany({})
    ]);

    // Create Super Admin
    console.log('👑 Creating Super Admin...');
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin'
    });
    await superAdmin.save();

    const adminProfile = new Admin({
      user: superAdmin._id,
      permissions: {
        canManageStudents: true,
        canManageClasses: true,
        canViewReports: true,
        canManageAttendance: true,
        canManageSystem: true
      },
      department: 'Computer Science',
      designation: 'Principal',
      employeeId: 'EMP001',
      joiningDate: new Date('2020-01-01'),
      contactNumber: '+1234567890',
      isSuper: true
    });
    await adminProfile.save();

    // Create Teacher
    console.log('👨‍🏫 Creating Teacher...');
    const teacher = new User({
      firstName: 'John',
      lastName: 'Smith',
      email: 'teacher@college.edu',
      password: 'teacher123',
      role: 'admin' // Teachers have admin privileges for class management
    });
    await teacher.save();

    const teacherProfile = new Admin({
      user: teacher._id,
      permissions: {
        canManageStudents: true,
        canManageClasses: true,
        canViewReports: true,
        canManageAttendance: true,
        canManageSystem: false
      },
      department: 'Computer Science',
      designation: 'HOD',
      employeeId: 'EMP002',
      joiningDate: new Date('2021-06-15'),
      contactNumber: '+1234567891'
    });
    await teacherProfile.save();

    // Create Sample Students
    console.log('👨‍🎓 Creating sample students...');
    const students = [];
    const studentProfiles = [];

    for (let i = 1; i <= 5; i++) {
      const student = new User({
        firstName: `Student${i}`,
        lastName: 'Test',
        email: `student${i}@college.edu`,
        password: 'student123',
        role: 'student',
        studentId: `STU00${i}`
      });
      await student.save();
      students.push(student);

      const studentProfile = new Student({
        user: student._id,
        rollNumber: `2024CS00${i}`,
        batch: '2024-2028',
        semester: 1,
        branch: 'Computer Engineering',
        section: 'A',
        dateOfBirth: new Date(`200${i}-0${i}-15`),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        contactNumber: `+123456789${i}`,
        parentDetails: {
          fatherName: `Father${i}`,
          motherName: `Mother${i}`,
          parentContact: `+987654321${i}`,
          parentEmail: `parent${i}@email.com`
        },
        academicDetails: {
          admissionDate: new Date('2024-08-01'),
          admissionType: 'Regular'
        }
      });
      await studentProfile.save();
      studentProfiles.push(studentProfile);
    }

    // Create Sample Classes
    console.log('📚 Creating sample classes...');
    const classes = [
      {
        className: 'CS101 - Programming Fundamentals',
        subject: 'Programming',
        teacher: teacher._id,
        students: students.slice(0, 3).map(s => s._id),
        schedule: {
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '10:00'
        },
        semester: 'Fall 2024',
        academicYear: '2024-2025'
      },
      {
        className: 'CS102 - Data Structures',
        subject: 'Computer Science',
        teacher: teacher._id,
        students: students.slice(2, 5).map(s => s._id),
        schedule: {
          dayOfWeek: 'Tuesday',
          startTime: '10:00',
          endTime: '11:00'
        },
        semester: 'Fall 2024',
        academicYear: '2024-2025'
      }
    ];

    for (const classData of classes) {
      const newClass = new Class(classData);
      await newClass.save();

      // Update student profiles with enrolled classes
      await Student.updateMany(
        { user: { $in: classData.students } },
        { $push: { enrolledClasses: newClass._id } }
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: admin@college.edu / admin123');
    console.log('Teacher: teacher@college.edu / teacher123');
    console.log('Student 1: student1@college.edu / student123');
    console.log('Student 2: student2@college.edu / student123');
    console.log('... (student3, student4, student5)');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
