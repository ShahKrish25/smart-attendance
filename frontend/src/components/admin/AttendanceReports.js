// // new code  by claude

// import React, { useState, useCallback, useRef } from 'react';
// import { api } from '../../services/api';
// import toast from 'react-hot-toast';
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
// } from 'recharts';
// import { useReactToPrint } from 'react-to-print';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// const AttendanceReports = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [dateRange, setDateRange] = useState('week');
//   const [customStartDate, setCustomStartDate] = useState('');
//   const [customEndDate, setCustomEndDate] = useState('');
//   const [reportData, setReportData] = useState({
//     summary: {
//       totalStudents: 0,
//       totalPresentDays: 0,
//       totalPossibleDays: 0,
//       totalAbsentDays: 0,
//       averageAttendance: 0
//     },
//     dailyStats: [],
//     studentStats: [],
//     attendanceRecords: []
//   });
//   const [chartType, setChartType] = useState('bar');
  
//   const printRef = useRef();

//   // Date range calculations
//   const getDateRange = useCallback(() => {
//     const now = new Date();
//     switch (dateRange) {
//       case 'today':
//         return {
//           startDate: format(now, 'yyyy-MM-dd'),
//           endDate: format(now, 'yyyy-MM-dd')
//         };
//       case 'week':
//         return {
//           startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
//           endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
//         };
//       case 'month':
//         return {
//           startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
//           endDate: format(endOfMonth(now), 'yyyy-MM-dd')
//         };
//       case 'last30':
//         return {
//           startDate: format(subDays(now, 30), 'yyyy-MM-dd'),
//           endDate: format(now, 'yyyy-MM-dd')
//         };
//       case 'custom':
//         return {
//           startDate: customStartDate,
//           endDate: customEndDate
//         };
//       default:
//         return {
//           startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
//           endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
//         };
//     }
//   }, [dateRange, customStartDate, customEndDate]);

//   // Load report data - FIXED VERSION
//   const loadReportData = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       const dateInfo = getDateRange();
      
//       if (!dateInfo.startDate || !dateInfo.endDate) {
//         toast.error('Please select valid date range');
//         return;
//       }

//       console.log('📊 Loading report data for:', dateInfo.startDate, 'to', dateInfo.endDate);

//       // ✅ FIX: Manually construct URL with query parameters
//       const url = `/admin/reports/attendance?startDate=${dateInfo.startDate}&endDate=${dateInfo.endDate}`;
      
//       console.log('📡 API URL:', url);
      
//       const response = await api.get(url);

//       console.log('📥 API Response:', response);

//       if (response.success) {
//         setReportData(response.data || {
//           summary: {
//             totalStudents: 0,
//             totalPresentDays: 0,
//             totalPossibleDays: 0,
//             totalAbsentDays: 0,
//             averageAttendance: 0
//           },
//           dailyStats: [],
//           studentStats: [],
//           attendanceRecords: []
//         });
//         console.log('✅ Report data loaded:', response.data);
//         toast.success('Report generated successfully!');
//       } else {
//         throw new Error(response.message || 'Failed to load report data');
//       }
//     } catch (error) {
//       console.error('❌ Error loading report data:', error);
//       toast.error(error.message || 'Failed to load report data');
      
//       setReportData({
//         summary: {
//           totalStudents: 0,
//           totalPresentDays: 0,
//           totalPossibleDays: 0,
//           totalAbsentDays: 0,
//           averageAttendance: 0
//         },
//         dailyStats: [],
//         studentStats: [],
//         attendanceRecords: []
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [getDateRange]);

//   // Chart data formatters with safety checks
//   const getDailyChartData = () => {
//     if (!reportData.dailyStats || reportData.dailyStats.length === 0) {
//       return [
//         { date: 'No Data', present: 0, absent: 0, total: 0, rate: 0 }
//       ];
//     }
    
//     return reportData.dailyStats.map(day => ({
//       date: format(new Date(day.date), 'MMM dd'),
//       present: day.presentCount || 0,
//       absent: day.absentCount || 0,
//       total: day.totalStudents || 0,
//       rate: day.attendanceRate || 0
//     }));
//   };

//   const getStudentChartData = () => {
//     if (!reportData.studentStats || reportData.studentStats.length === 0) {
//       return [
//         { name: 'No Data', rate: 0, present: 0, total: 0 }
//       ];
//     }
    
//     return reportData.studentStats.slice(0, 10).map(student => ({
//       name: student.name ? student.name.split(' ')[0] : 'Unknown',
//       rate: student.attendanceRate || 0,
//       present: student.presentDays || 0,
//       total: student.totalDays || 0
//     }));
//   };

//   const getAttendanceDistribution = () => {
//     if (!reportData.summary) {
//       return [
//         { name: 'No Data', value: 1, color: '#e5e7eb' }
//       ];
//     }
    
//     const totalPresentDays = reportData.summary.totalPresentDays || 0;
//     const totalAbsentDays = reportData.summary.totalAbsentDays || 0;
    
//     if (totalPresentDays === 0 && totalAbsentDays === 0) {
//       return [
//         { name: 'No Data', value: 1, color: '#e5e7eb' }
//       ];
//     }
    
//     return [
//       { name: 'Present', value: totalPresentDays, color: '#00C49F' },
//       { name: 'Absent', value: totalAbsentDays, color: '#FF8042' }
//     ];
//   };

//   const renderChart = (chartData, ChartComponent, props) => {
//     if (!chartData || chartData.length === 0) {
//       return (
//         <div className="flex items-center justify-center h-full">
//           <p className="text-gray-500">No data available</p>
//         </div>
//       );
//     }

//     try {
//       return (
//         <ResponsiveContainer width="100%" height={300}>
//           <ChartComponent data={chartData} {...props}>
//             {props.children}
//           </ChartComponent>
//         </ResponsiveContainer>
//       );
//     } catch (error) {
//       console.error('Chart rendering error:', error);
//       return (
//         <div className="flex items-center justify-center h-full">
//           <p className="text-red-500">Chart rendering error</p>
//         </div>
//       );
//     }
//   };

//   const handlePrint = useReactToPrint({
//     content: () => printRef.current,
//     documentTitle: `Attendance Report - ${format(new Date(), 'yyyy-MM-dd')}`,
//     onAfterPrint: () => toast.success('Report printed successfully!')
//   });

//   const exportToPDF = () => {
//     try {
//       const doc = new jsPDF();
//       const dateInfo = getDateRange();
      
//       doc.setFontSize(20);
//       doc.text('Attendance Report', 20, 20);
      
//       doc.setFontSize(12);
//       doc.text(`Period: ${dateInfo.startDate} to ${dateInfo.endDate}`, 20, 35);
      
//       doc.text('Summary Statistics:', 20, 50);
//       doc.text(`Total Students: ${reportData.summary?.totalStudents || 0}`, 30, 65);
//       doc.text(`Average Attendance: ${reportData.summary?.averageAttendance || 0}%`, 30, 75);
//       doc.text(`Total Present Days: ${reportData.summary?.totalPresentDays || 0}`, 30, 85);
//       doc.text(`Total Possible Days: ${reportData.summary?.totalPossibleDays || 0}`, 30, 95);

//       if (reportData.studentStats && reportData.studentStats.length > 0) {
//         const tableData = reportData.studentStats.map(student => [
//           student.name || 'N/A',
//           student.studentNumber || 'N/A',
//           student.presentDays || 0,
//           student.totalDays || 0,
//           `${student.attendanceRate || 0}%`
//         ]);

//         doc.autoTable({
//           head: [['Student Name', 'Student ID', 'Present', 'Total', 'Rate']],
//           body: tableData,
//           startY: 110,
//           styles: { fontSize: 10 },
//           headStyles: { fillColor: [79, 70, 229] }
//         });
//       }

//       doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
//       toast.success('PDF exported successfully!');
//     } catch (error) {
//       console.error('❌ Error exporting PDF:', error);
//       toast.error('Failed to export PDF');
//     }
//   };

//   const exportToCSV = () => {
//     try {
//       if (!reportData.attendanceRecords || reportData.attendanceRecords.length === 0) {
//         toast.error('No data to export');
//         return;
//       }

//       const csvData = [
//         ['Date', 'Student Name', 'Student ID', 'Email', 'Status', 'Method', 'Confidence', 'Time'],
//         ...reportData.attendanceRecords.map(record => [
//           format(new Date(record.date), 'yyyy-MM-dd'),
//           `${record.student?.firstName || ''} ${record.student?.lastName || ''}`,
//           record.student?.studentId || 'N/A',
//           record.student?.email || 'N/A',
//           record.status || 'present',
//           record.method || 'face_recognition',
//           record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A',
//           format(new Date(record.createdAt), 'HH:mm:ss')
//         ])
//       ];

//       const csvContent = csvData.map(row => row.join(',')).join('\n');
//       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//       const link = document.createElement('a');
      
//       if (link.download !== undefined) {
//         const url = URL.createObjectURL(blob);
//         link.setAttribute('href', url);
//         link.setAttribute('download', `attendance-records-${format(new Date(), 'yyyy-MM-dd')}.csv`);
//         link.style.visibility = 'hidden';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       }

//       toast.success('CSV exported successfully!');
//     } catch (error) {
//       console.error('❌ Error exporting CSV:', error);
//       toast.error('Failed to export CSV');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
//           <p className="text-gray-600 mt-2">Analytics, charts, and export features</p>
//         </div>
//         <div className="flex space-x-3">
//           <button
//             onClick={exportToCSV}
//             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//           >
//             <span>Export CSV</span>
//           </button>
//           <button
//             onClick={exportToPDF}
//             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
//           >
//             <span>Export PDF</span>
//           </button>
//           <button
//             onClick={handlePrint}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
//           >
//             <span>Print</span>
//           </button>
//         </div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Date Range
//             </label>
//             <select
//               value={dateRange}
//               onChange={(e) => setDateRange(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="today">Today</option>
//               <option value="week">This Week</option>
//               <option value="month">This Month</option>
//               <option value="last30">Last 30 Days</option>
//               <option value="custom">Custom Range</option>
//             </select>
//           </div>

//           {dateRange === 'custom' && (
//             <>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Start Date
//                 </label>
//                 <input
//                   type="date"
//                   value={customStartDate}
//                   onChange={(e) => setCustomStartDate(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   End Date
//                 </label>
//                 <input
//                   type="date"
//                   value={customEndDate}
//                   onChange={(e) => setCustomEndDate(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//             </>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Chart Type
//             </label>
//             <select
//               value={chartType}
//               onChange={(e) => setChartType(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="bar">Bar Chart</option>
//               <option value="line">Line Chart</option>
//               <option value="area">Area Chart</option>
//               <option value="pie">Pie Chart</option>
//             </select>
//           </div>
//         </div>

//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={loadReportData}
//             disabled={isLoading}
//             className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
//           >
//             {isLoading ? 'Loading...' : 'Generate Report'}
//           </button>
//         </div>
//       </div>

//       <div ref={printRef}>
//         {isLoading ? (
//           <div className="flex items-center justify-center py-12 bg-white rounded-xl">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//             <span className="ml-3 text-gray-600">Loading report data...</span>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//               {[
//                 {
//                   title: 'Total Students',
//                   value: reportData.summary?.totalStudents || 0,
//                   icon: '👥'
//                 },
//                 {
//                   title: 'Average Attendance',
//                   value: `${reportData.summary?.averageAttendance || 0}%`,
//                   icon: '📊'
//                 },
//                 {
//                   title: 'Present Days',
//                   value: reportData.summary?.totalPresentDays || 0,
//                   icon: '✅'
//                 },
//                 {
//                   title: 'Total Records',
//                   value: reportData.attendanceRecords?.length || 0,
//                   icon: '📝'
//                 }
//               ].map((stat, index) => (
//                 <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-gray-600">{stat.title}</p>
//                       <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
//                     </div>
//                     <div className="text-4xl opacity-80">
//                       {stat.icon}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Trend</h3>
//                 {chartType === 'bar' && renderChart(getDailyChartData(), BarChart, {
//                   children: [
//                     <CartesianGrid key="grid" strokeDasharray="3 3" />,
//                     <XAxis key="xaxis" dataKey="date" />,
//                     <YAxis key="yaxis" />,
//                     <Tooltip key="tooltip" />,
//                     <Legend key="legend" />,
//                     <Bar key="present" dataKey="present" fill="#00C49F" name="Present" />,
//                     <Bar key="absent" dataKey="absent" fill="#FF8042" name="Absent" />
//                   ]
//                 })}
//                 {chartType === 'line' && renderChart(getDailyChartData(), LineChart, {
//                   children: [
//                     <CartesianGrid key="grid" strokeDasharray="3 3" />,
//                     <XAxis key="xaxis" dataKey="date" />,
//                     <YAxis key="yaxis" />,
//                     <Tooltip key="tooltip" />,
//                     <Legend key="legend" />,
//                     <Line key="line" type="monotone" dataKey="rate" stroke="#8884d8" name="Attendance Rate %" />
//                   ]
//                 })}
//                 {chartType === 'area' && renderChart(getDailyChartData(), AreaChart, {
//                   children: [
//                     <CartesianGrid key="grid" strokeDasharray="3 3" />,
//                     <XAxis key="xaxis" dataKey="date" />,
//                     <YAxis key="yaxis" />,
//                     <Tooltip key="tooltip" />,
//                     <Legend key="legend" />,
//                     <Area key="present" type="monotone" dataKey="present" stackId="1" stroke="#00C49F" fill="#00C49F" />,
//                     <Area key="absent" type="monotone" dataKey="absent" stackId="1" stroke="#FF8042" fill="#FF8042" />
//                   ]
//                 })}
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance</h3>
//                 {chartType === 'pie' ? renderChart(getAttendanceDistribution(), PieChart, {
//                   children: [
//                     <Pie
//                       key="pie"
//                       data={getAttendanceDistribution()}
//                       cx="50%"
//                       cy="50%"
//                       labelLine={false}
//                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                       outerRadius={80}
//                       fill="#8884d8"
//                       dataKey="value"
//                     >
//                       {getAttendanceDistribution().map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>,
//                     <Tooltip key="tooltip" />
//                   ]
//                 }) : renderChart(getStudentChartData(), BarChart, {
//                   children: [
//                     <CartesianGrid key="grid" strokeDasharray="3 3" />,
//                     <XAxis key="xaxis" dataKey="name" />,
//                     <YAxis key="yaxis" />,
//                     <Tooltip key="tooltip" />,
//                     <Legend key="legend" />,
//                     <Bar key="rate" dataKey="rate" fill="#8884d8" name="Attendance Rate %" />
//                   ]
//                 })}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Statistics</h3>
//                 <div className="overflow-x-auto">
//                   {reportData.studentStats && reportData.studentStats.length > 0 ? (
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {reportData.studentStats.slice(0, 10).map((student, index) => (
//                           <tr key={index}>
//                             <td className="px-4 py-3 text-sm text-gray-900">{student.name || 'Unknown'}</td>
//                             <td className="px-4 py-3 text-sm text-gray-600">{student.presentDays || 0}/{student.totalDays || 0}</td>
//                             <td className="px-4 py-3 text-sm">
//                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                                 (student.attendanceRate || 0) >= 80 
//                                   ? 'bg-green-100 text-green-800' 
//                                   : (student.attendanceRate || 0) >= 60 
//                                     ? 'bg-yellow-100 text-yellow-800'
//                                     : 'bg-red-100 text-red-800'
//                               }`}>
//                                 {student.attendanceRate || 0}%
//                               </span>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No student data available</p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h3>
//                 <div className="space-y-3 max-h-80 overflow-y-auto">
//                   {reportData.attendanceRecords && reportData.attendanceRecords.length > 0 ? (
//                     reportData.attendanceRecords.slice(0, 15).map((record, index) => (
//                       <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                         <div className="flex items-center space-x-3">
//                           <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
//                             <span className="text-indigo-600 text-xs font-semibold">
//                               {record.student?.firstName?.charAt(0) || 'U'}{record.student?.lastName?.charAt(0) || 'N'}
//                             </span>
//                           </div>
//                           <div>
//                             <p className="text-sm font-medium text-gray-900">
//                               {record.student?.firstName || 'Unknown'} {record.student?.lastName || 'User'}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               {format(new Date(record.createdAt), 'MMM dd, HH:mm')}
//                             </p>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
//                             {record.status || 'present'}
//                           </span>
//                           {record.confidence && (
//                             <p className="text-xs text-gray-500 mt-1">
//                               {(record.confidence * 100).toFixed(1)}%
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No attendance records available</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AttendanceReports;















// claude code new

// Fixed export functions

import React, { useState, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const AttendanceReports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState({
    summary: {
      totalStudents: 0,
      totalPresentDays: 0,
      totalPossibleDays: 0,
      totalAbsentDays: 0,
      averageAttendance: 0
    },
    dailyStats: [],
    studentStats: [],
    attendanceRecords: []
  });
  const [chartType, setChartType] = useState('bar');
  
  const printRef = useRef();

  // Date range calculations
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          startDate: format(now, 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        };
      case 'week':
        return {
          startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'last30':
        return {
          startDate: format(subDays(now, 30), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate
        };
      default:
        return {
          startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
    }
  }, [dateRange, customStartDate, customEndDate]);

  // Load report data
  const loadReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const dateInfo = getDateRange();
      
      if (!dateInfo.startDate || !dateInfo.endDate) {
        toast.error('Please select valid date range');
        return;
      }

      console.log('📊 Loading report data for:', dateInfo.startDate, 'to', dateInfo.endDate);

      const url = `/admin/reports/attendance?startDate=${dateInfo.startDate}&endDate=${dateInfo.endDate}`;
      
      console.log('📡 API URL:', url);
      
      const response = await api.get(url);

      console.log('📥 API Response:', response);

      if (response.success) {
        setReportData(response.data || {
          summary: {
            totalStudents: 0,
            totalPresentDays: 0,
            totalPossibleDays: 0,
            totalAbsentDays: 0,
            averageAttendance: 0
          },
          dailyStats: [],
          studentStats: [],
          attendanceRecords: []
        });
        console.log('✅ Report data loaded:', response.data);
        toast.success('Report generated successfully!');
      } else {
        throw new Error(response.message || 'Failed to load report data');
      }
    } catch (error) {
      console.error('❌ Error loading report data:', error);
      toast.error(error.message || 'Failed to load report data');
      
      setReportData({
        summary: {
          totalStudents: 0,
          totalPresentDays: 0,
          totalPossibleDays: 0,
          totalAbsentDays: 0,
          averageAttendance: 0
        },
        dailyStats: [],
        studentStats: [],
        attendanceRecords: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  // Chart data formatters with safety checks
  const getDailyChartData = () => {
    if (!reportData.dailyStats || reportData.dailyStats.length === 0) {
      return [
        { date: 'No Data', present: 0, absent: 0, total: 0, rate: 0 }
      ];
    }
    
    return reportData.dailyStats.map(day => ({
      date: format(new Date(day.date), 'MMM dd'),
      present: day.presentCount || 0,
      absent: day.absentCount || 0,
      total: day.totalStudents || 0,
      rate: day.attendanceRate || 0
    }));
  };

  const getStudentChartData = () => {
    if (!reportData.studentStats || reportData.studentStats.length === 0) {
      return [
        { name: 'No Data', rate: 0, present: 0, total: 0 }
      ];
    }
    
    return reportData.studentStats.slice(0, 10).map(student => ({
      name: student.name ? student.name.split(' ')[0] : 'Unknown',
      rate: student.attendanceRate || 0,
      present: student.presentDays || 0,
      total: student.totalDays || 0
    }));
  };

  const getAttendanceDistribution = () => {
    if (!reportData.summary) {
      return [
        { name: 'No Data', value: 1, color: '#e5e7eb' }
      ];
    }
    
    const totalPresentDays = reportData.summary.totalPresentDays || 0;
    const totalAbsentDays = reportData.summary.totalAbsentDays || 0;
    
    if (totalPresentDays === 0 && totalAbsentDays === 0) {
      return [
        { name: 'No Data', value: 1, color: '#e5e7eb' }
      ];
    }
    
    return [
      { name: 'Present', value: totalPresentDays, color: '#00C49F' },
      { name: 'Absent', value: totalAbsentDays, color: '#FF8042' }
    ];
  };

  const renderChart = (chartData, ChartComponent, props) => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    try {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={chartData} {...props}>
            {props.children}
          </ChartComponent>
        </ResponsiveContainer>
      );
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">Chart rendering error</p>
        </div>
      );
    }
  };


  // FIXED: PDF Export with proper error handling
  const exportToPDF = () => {
    try {
      if (!reportData || !reportData.summary) {
        toast.error('No data available to export');
        return;
      }

      const doc = new jsPDF();
      const dateInfo = getDateRange();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text('Attendance Report', 105, 20, { align: 'center' });
      
      // Date Range
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${dateInfo.startDate} to ${dateInfo.endDate}`, 105, 30, { align: 'center' });
      
      // Summary Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics', 20, 45);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const summaryY = 55;
      doc.text(`Total Students: ${reportData.summary.totalStudents || 0}`, 25, summaryY);
      doc.text(`Average Attendance: ${(reportData.summary.averageAttendance || 0).toFixed(1)}%`, 25, summaryY + 7);
      doc.text(`Total Present Days: ${reportData.summary.totalPresentDays || 0}`, 25, summaryY + 14);
      doc.text(`Total Absent Days: ${reportData.summary.totalAbsentDays || 0}`, 25, summaryY + 21);
      doc.text(`Total Possible Days: ${reportData.summary.totalPossibleDays || 0}`, 25, summaryY + 28);

      // Student Statistics Table
      if (reportData.studentStats && reportData.studentStats.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Student Statistics', 20, 100);

        const tableData = reportData.studentStats.map(student => [
          student.name || 'N/A',
          student.studentNumber || 'N/A',
          `${student.presentDays || 0}`,
          `${student.totalDays || 0}`,
          `${(student.attendanceRate || 0).toFixed(1)}%`
        ]);

        autoTable(doc,{
          head: [['Student Name', 'Student ID', 'Present', 'Total Days', 'Attendance Rate']],
          body: tableData,
          startY: 108,
          theme: 'grid',
          styles: { 
            fontSize: 9,
            cellPadding: 3
          },
          headStyles: { 
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          }
        });
      }

      // Save the PDF
      const fileName = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    }
  };

  // FIXED: CSV Export with proper escaping
  const exportToCSV = () => {
    try {
      if (!reportData.attendanceRecords || reportData.attendanceRecords.length === 0) {
        toast.error('No attendance records to export');
        return;
      }

      // Helper function to escape CSV values
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Create CSV header
      const headers = ['Date', 'Student Name', 'Student ID', 'Email', 'Status', 'Method', 'Confidence', 'Time'];
      
      // Create CSV rows
      const rows = reportData.attendanceRecords.map(record => {
        const studentName = `${record.student?.firstName || ''} ${record.student?.lastName || ''}`.trim() || 'Unknown';
        const confidence = record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A';
        
        return [
          format(new Date(record.date), 'yyyy-MM-dd'),
          studentName,
          record.student?.studentId || 'N/A',
          record.student?.email || 'N/A',
          record.status || 'present',
          record.method || 'face_recognition',
          confidence,
          format(new Date(record.createdAt), 'HH:mm:ss')
        ].map(escapeCSV);
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and download blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-records-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      toast.error(`Failed to export CSV: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600 mt-2">Analytics, charts, and export features</p>
        </div>
        <div className="flex space-x-3 no-print">
          <button
            onClick={exportToCSV}
            disabled={!reportData.attendanceRecords || reportData.attendanceRecords.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={!reportData.summary || reportData.summary.totalStudents === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={loadReportData}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div ref={printRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading report data...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[
                {
                  title: 'Total Students',
                  value: reportData.summary?.totalStudents || 0,
                  icon: '👥'
                },
                {
                  title: 'Average Attendance',
                  value: `${(reportData.summary?.averageAttendance || 0).toFixed(1)}%`,
                  icon: '📊'
                },
                {
                  title: 'Present Days',
                  value: reportData.summary?.totalPresentDays || 0,
                  icon: '✅'
                },
                {
                  title: 'Total Records',
                  value: reportData.attendanceRecords?.length || 0,
                  icon: '📝'
                }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className="text-4xl opacity-80">
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Trend</h3>
                {chartType === 'bar' && renderChart(getDailyChartData(), BarChart, {
                  children: [
                    <CartesianGrid key="grid" strokeDasharray="3 3" />,
                    <XAxis key="xaxis" dataKey="date" />,
                    <YAxis key="yaxis" />,
                    <Tooltip key="tooltip" />,
                    <Legend key="legend" />,
                    <Bar key="present" dataKey="present" fill="#00C49F" name="Present" />,
                    <Bar key="absent" dataKey="absent" fill="#FF8042" name="Absent" />
                  ]
                })}
                {chartType === 'line' && renderChart(getDailyChartData(), LineChart, {
                  children: [
                    <CartesianGrid key="grid" strokeDasharray="3 3" />,
                    <XAxis key="xaxis" dataKey="date" />,
                    <YAxis key="yaxis" />,
                    <Tooltip key="tooltip" />,
                    <Legend key="legend" />,
                    <Line key="line" type="monotone" dataKey="rate" stroke="#8884d8" name="Attendance Rate %" />
                  ]
                })}
                {chartType === 'area' && renderChart(getDailyChartData(), AreaChart, {
                  children: [
                    <CartesianGrid key="grid" strokeDasharray="3 3" />,
                    <XAxis key="xaxis" dataKey="date" />,
                    <YAxis key="yaxis" />,
                    <Tooltip key="tooltip" />,
                    <Legend key="legend" />,
                    <Area key="present" type="monotone" dataKey="present" stackId="1" stroke="#00C49F" fill="#00C49F" />,
                    <Area key="absent" type="monotone" dataKey="absent" stackId="1" stroke="#FF8042" fill="#FF8042" />
                  ]
                })}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance</h3>
                {chartType === 'pie' ? renderChart(getAttendanceDistribution(), PieChart, {
                  children: [
                    <Pie
                      key="pie"
                      data={getAttendanceDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAttendanceDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>,
                    <Tooltip key="tooltip" />
                  ]
                }) : renderChart(getStudentChartData(), BarChart, {
                  children: [
                    <CartesianGrid key="grid" strokeDasharray="3 3" />,
                    <XAxis key="xaxis" dataKey="name" />,
                    <YAxis key="yaxis" />,
                    <Tooltip key="tooltip" />,
                    <Legend key="legend" />,
                    <Bar key="rate" dataKey="rate" fill="#8884d8" name="Attendance Rate %" />
                  ]
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Statistics</h3>
                <div className="overflow-x-auto">
                  {reportData.studentStats && reportData.studentStats.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.studentStats.slice(0, 10).map((student, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{student.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.presentDays || 0}/{student.totalDays || 0}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (student.attendanceRate || 0) >= 80 
                                  ? 'bg-green-100 text-green-800' 
                                  : (student.attendanceRate || 0) >= 60 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {(student.attendanceRate || 0).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No student data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {reportData.attendanceRecords && reportData.attendanceRecords.length > 0 ? (
                    reportData.attendanceRecords.slice(0, 15).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 text-xs font-semibold">
                              {record.student?.firstName?.charAt(0) || 'U'}{record.student?.lastName?.charAt(0) || 'N'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {record.student?.firstName || 'Unknown'} {record.student?.lastName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(record.createdAt), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {record.status || 'present'}
                          </span>
                          {record.confidence && (
                            <p className="text-xs text-gray-500 mt-1">
                              {(record.confidence * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No attendance records available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
