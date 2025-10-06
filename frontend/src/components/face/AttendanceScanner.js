// import React, { useState, useEffect, useRef, useCallback } from "react";
// import Webcam from "react-webcam";
// import { useCamera } from "../../hooks/useCamera";
// import faceService from "../../services/faceService";
// import { useAuth } from "../../contexts/AuthContext";
// import { api } from "../../services/api";
// import toast from "react-hot-toast";

// const AttendanceScanner = () => {
//   // Remove unused 'user' variable
//   const [isScanning, setIsScanning] = useState(false);
//   const [recognitionResults, setRecognitionResults] = useState([]);
//   const [registeredFaces, setRegisteredFaces] = useState([]);
//   const [scanHistory, setScanHistory] = useState([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const canvasRef = useRef(null);
//   const [markedToday, setMarkedToday] = useState(new Set());
//   const scanIntervalRef = useRef(null);

//   const { webcamRef, isActive, isLoading, error, startCamera, stopCamera } =
//     useCamera();

//   const loadRegisteredFaces = useCallback(async () => {
//     try {
//       console.log("🔄 Loading registered faces from API...");

//       // Use real API call instead of mock
//       const response = await api.get("/students/registered-faces");

//       if (response.success) {
//         setRegisteredFaces(response.registeredFaces || []);
//         console.log(
//           "✅ Loaded registered faces:",
//           response.registeredFaces?.length
//         );
//         console.log("📋 Faces data:", response.registeredFaces);
//       } else {
//         console.error("❌ Failed to load registered faces:", response.message);
//         toast.error("Failed to load registered faces");
//       }
//     } catch (error) {
//       console.error("❌ Error loading registered faces:", error);
//       toast.error("Failed to load registered faces");
//     }
//   }, []);

//   const stopScanning = useCallback(() => {
//     setIsScanning(false);
//     if (scanIntervalRef.current) {
//       clearInterval(scanIntervalRef.current);
//       scanIntervalRef.current = null;
//     }
//     stopCamera();
//     // ✅ Fixed: Use toast() instead of toast.info()
//     toast("📹 Attendance scanning stopped", {
//       icon: "📹",
//       style: {
//         background: "#3b82f6",
//         color: "#ffffff",
//       },
//     });
//   }, [stopCamera]);

//   useEffect(() => {
//     loadRegisteredFaces();
//     return () => {
//       stopScanning();
//     };
//   }, [loadRegisteredFaces, stopScanning]); // ✅ Fixed: Added dependencies


//   // Add this after the useCamera hook
// useEffect(() => {
//   if (isScanning) {
//     const checkCameraStatus = () => {
//       const video = webcamRef.current?.video;
//       console.log('📹 Camera Status:', {
//         hasWebcam: !!webcamRef.current,
//         hasVideo: !!video,
//         readyState: video?.readyState,
//         videoWidth: video?.videoWidth,
//         videoHeight: video?.videoHeight,
//         paused: video?.paused,
//         isActive: isActive
//       });
//     };
    
//     const statusInterval = setInterval(checkCameraStatus, 5000);
//     return () => clearInterval(statusInterval);
//   }
// }, [isScanning, isActive, webcamRef]);


//   const startScanning = async () => {
//     if (!faceService.isModelLoaded) {
//       const loaded = await faceService.loadModels();
//       if (!loaded) {
//         toast.error("Failed to load face detection models");
//         return;
//       }
//     }

//     console.log("🎯 Starting scanning process...");
//     setIsScanning(true);

//     try {
//       await startCamera();

//       // ✅ Wait a bit for camera to fully initialize
//       setTimeout(() => {
//         if (webcamRef.current && webcamRef.current.video) {
//           console.log("✅ Camera ready, starting recognition interval...");
//           // Start continuous face recognition
//           scanIntervalRef.current = setInterval(performFaceRecognition, 3000); // Increased to 3 seconds
//           toast.success("🎯 Attendance scanning started!");
//         } else {
//           console.error("❌ Camera not ready after start");
//           toast.error("Camera not ready. Please try again.");
//           setIsScanning(false);
//         }
//       }, 1000); // Wait 1 second for camera to initialize
//     } catch (error) {
//       console.error("❌ Error starting scanner:", error);
//       toast.error("Failed to start camera");
//       setIsScanning(false);
//     }
//   };

//   const performFaceRecognition = async () => {
//     // ✅ Better condition check
//     if (!webcamRef.current || !webcamRef.current.video || isProcessing) {
//       console.log("🚫 Skipping recognition:", {
//         hasWebcam: !!webcamRef.current,
//         hasVideo: !!webcamRef.current?.video,
//         isActive,
//         isProcessing,
//       });
//       return;
//     }

//     const video = webcamRef.current.video;

//     // ✅ Check if video is actually playing
//     if (!video || video.readyState !== 4 || video.paused || video.ended) {
//       console.log("❌ Video not ready:", {
//         readyState: video?.readyState,
//         paused: video?.paused,
//         ended: video?.ended,
//       });
//       return;
//     }

//     console.log("🔍 Starting face recognition...");
//     setIsProcessing(true);

//     try {
//       console.log(
//         "📹 Video dimensions:",
//         video.videoWidth,
//         "x",
//         video.videoHeight
//       );

//       // Create image from video
//       const canvas = document.createElement("canvas");
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(video, 0, 0);

//       console.log("🤖 Running face detection...");
//       // Detect faces in current frame
//       const detections = await faceService.detectAllFaces(canvas);

//       console.log(
//         "🔎 Detection results:",
//         detections?.length || 0,
//         "faces found"
//       );

//       if (detections && detections.length > 0) {
//         console.log(`👥 Processing ${detections.length} face(s)...`);
//         console.log("📋 Available registered faces:", registeredFaces.length);

//         const recognitionResults = [];

//         for (const detection of detections) {
//           // Try to recognize each detected face
//           const bestMatch = faceService.recognizeFace(
//             detection.descriptor,
//             registeredFaces
//           );

//           if (bestMatch) {
//             console.log(
//               "✅ Face recognized:",
//               bestMatch.user.firstName,
//               "Confidence:",
//               bestMatch.confidence
//             );

//             recognitionResults.push({
//               user: bestMatch.user,
//               confidence: bestMatch.confidence,
//               detection: detection,
//               timestamp: new Date(),
//             });

//             // Mark attendance for recognized user
//             await markAttendance(bestMatch.user, bestMatch.confidence);
//           } else {
//             console.log("❓ Unknown face detected");
//             recognitionResults.push({
//               user: null,
//               confidence: 0,
//               detection: detection,
//               timestamp: new Date(),
//             });
//           }
//         }

//         setRecognitionResults(recognitionResults);

//         // Draw results on canvas
//         if (canvasRef.current) {
//           drawRecognitionResults(detections, recognitionResults);
//         }
//       } else {
//         console.log("👤 No faces detected in current frame");
//       }
//     } catch (error) {
//       console.error("❌ Face recognition error:", error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const markAttendance = async (recognizedUser, confidence) => {
//   try {
//     // ✅ Check if attendance already marked today (frontend check)
//     if (markedToday.has(recognizedUser.id)) {
//       console.log('✋ Already marked in this session:', recognizedUser.firstName);
//       return;
//     }

//     const existingEntry = scanHistory.find(entry => 
//       entry.user.id === recognizedUser.id &&
//       new Date(entry.timestamp).toDateString() === new Date().toDateString()
//     );

//     if (existingEntry) {
//       console.log('⏭️ Attendance already marked today for:', recognizedUser.firstName);
//       return; // Don't make API call if already marked
//     }

//     // ✅ Also check if we're currently processing this user (prevent rapid duplicates)
//     const recentEntry = scanHistory.find(entry =>
//       entry.user.id === recognizedUser.id &&
//       (new Date() - new Date(entry.timestamp)) < 30000 // Within last 30 seconds
//     );

//     if (recentEntry) {
//       console.log('⏱️ Recent attendance found, skipping duplicate:', recognizedUser.firstName);
//       return;
//     }

//     console.log('📝 Marking attendance for:', recognizedUser.firstName);

//     const attendanceData = {
//       studentId: recognizedUser.id,
//       confidence: confidence,
//       method: 'face_recognition',
//       biometricData: {
//         recognitionConfidence: confidence,
//         timestamp: new Date().toISOString()
//       }
//     };

//     const response = await api.post('/attendance/mark', attendanceData);

//     if (response.success) {
//       toast.success(`✅ Attendance marked for ${recognizedUser.firstName} ${recognizedUser.lastName}!`);
      
//       // ✅ Add to scan history immediately to prevent duplicates
//        setScanHistory(prev => [{
//         id: response.attendanceId,
//         user: recognizedUser,
//         confidence: confidence,
//         timestamp: new Date(),
//         status: 'present'
//       }, ...prev]);
//     }

//   } catch (error) {
//     console.error('Attendance marking error:', error);
//     if (error.message?.includes('already marked')) {
//       console.log('⏭️ Attendance already marked today (backend confirmed)');
//       // ✅ Add to local history even if backend says already marked
//       setScanHistory(prev => [{
//         id: `local_${Date.now()}`,
//         user: recognizedUser,
//         confidence: confidence,
//         timestamp: new Date(),
//         status: 'present'
//       }, ...prev]);
//     } else {
//       toast.error('Failed to mark attendance');
//     }
//   }
// };
// useEffect(() => {
// setMarkedToday(new Set());
// }, []);



  

//   const drawRecognitionResults = (detections, results) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const video = webcamRef.current.video;
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     detections.forEach((detection, index) => {
//       const result = results[index];
//       const { box } = detection.detection;

//       // Draw bounding box
//       ctx.strokeStyle = result.user ? "#00ff00" : "#ff0000";
//       ctx.lineWidth = 3;
//       ctx.strokeRect(box.x, box.y, box.width, box.height);

//       // Draw user info
//       if (result.user) {
//         const label = `${result.user.firstName} ${result.user.lastName}`;
//         const confidence = `${(result.confidence * 100).toFixed(1)}%`;

//         ctx.fillStyle = "#00ff00";
//         ctx.fillRect(box.x, box.y - 60, 200, 55);

//         ctx.fillStyle = "#ffffff";
//         ctx.font = "16px Arial";
//         ctx.fillText(label, box.x + 5, box.y - 35);
//         ctx.fillText(`Confidence: ${confidence}`, box.x + 5, box.y - 15);
//       } else {
//         ctx.fillStyle = "#ff0000";
//         ctx.fillRect(box.x, box.y - 30, 150, 25);

//         ctx.fillStyle = "#ffffff";
//         ctx.font = "14px Arial";
//         ctx.fillText("Unknown Person", box.x + 5, box.y - 10);
//       }
//     });
//   };

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100">
//         {/* Header */}
//         <div className="px-8 py-6 border-b border-gray-100">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                 🎯 Attendance Scanner
//               </h2>
//               <p className="text-gray-600">
//                 Real-time face recognition for automatic attendance marking
//               </p>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-right">
//                 <p className="text-sm text-gray-500">Registered Faces</p>
//                 <p className="text-2xl font-bold text-indigo-600">
//                   {registeredFaces.length}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="text-sm text-gray-500">Today's Scans</p>
//                 <p className="text-2xl font-bold text-green-600">
//                   {scanHistory.length}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="p-8">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Camera View */}
//             <div className="lg:col-span-2 space-y-4">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Live Camera Feed
//                 </h3>
//                 <div className="flex space-x-2">
//                   {!isScanning ? (
//                     <button
//                       onClick={startScanning}
//                       disabled={isLoading}
//                       className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
//                     >
//                       {isLoading ? "Starting..." : "🎯 Start Scanning"}
//                     </button>
//                   ) : (
//                     <button
//                       onClick={stopScanning}
//                       className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//                     >
//                       ⏹️ Stop Scanning
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <div className="relative bg-gray-900 rounded-lg overflow-hidden">
//                 {isActive ? (
//                   <>
//                     <Webcam
//                       ref={webcamRef}
//                       audio={false}
//                       className="w-full h-96 object-cover"
//                       videoConstraints={{
//                         width: 640,
//                         height: 480,
//                         facingMode: "user",
//                       }}
//                     />
//                     <canvas
//                       ref={canvasRef}
//                       className="absolute inset-0 w-full h-full pointer-events-none"
//                     />
//                   </>
//                 ) : (
//                   <div className="w-full h-96 flex items-center justify-center text-white">
//                     <div className="text-center">
//                       <span className="text-6xl block mb-4">📹</span>
//                       <p className="text-xl mb-2">Camera Not Active</p>
//                       <p className="text-sm opacity-75">
//                         Click "Start Scanning" to begin
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Status Overlay */}
//                 <div className="absolute top-4 left-4 flex space-x-2">
//                   <div
//                     className={`px-3 py-1 rounded-full text-sm font-medium ${
//                       isScanning
//                         ? "bg-green-500 text-white"
//                         : "bg-gray-500 text-white"
//                     }`}
//                   >
//                     {isScanning ? "🔴 SCANNING" : "⚫ STOPPED"}
//                   </div>
//                   {isProcessing && (
//                     <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
//                       🧠 PROCESSING
//                     </div>
//                   )}
//                 </div>

//                 {error && (
//                   <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500 text-white rounded-lg">
//                     <p className="text-sm">❌ {error}</p>
//                   </div>
//                 )}
//               </div>

//               {/* Current Recognition Results */}
//               {recognitionResults.length > 0 && (
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <h4 className="font-semibold text-gray-900 mb-3">
//                     Current Frame Results
//                   </h4>
//                   <div className="space-y-2">
//                     {recognitionResults.map((result, index) => (
//                       <div
//                         key={index}
//                         className={`flex items-center space-x-3 p-3 rounded-lg ${
//                           result.user
//                             ? "bg-green-50 border border-green-200"
//                             : "bg-red-50 border border-red-200"
//                         }`}
//                       >
//                         <div
//                           className={`w-3 h-3 rounded-full ${
//                             result.user ? "bg-green-500" : "bg-red-500"
//                           }`}
//                         ></div>
//                         <div className="flex-1">
//                           {result.user ? (
//                             <div>
//                               <p className="font-medium text-green-800">
//                                 {result.user.firstName} {result.user.lastName}
//                               </p>
//                               <p className="text-sm text-green-600">
//                                 Confidence:{" "}
//                                 {(result.confidence * 100).toFixed(1)}% •{" "}
//                                 {result.user.studentId}
//                               </p>
//                             </div>
//                           ) : (
//                             <p className="text-red-800 font-medium">
//                               Unknown Person
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Scan History */}
//             <div className="space-y-6">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Today's Attendance
//                 </h3>
//                 <div className="space-y-3 max-h-96 overflow-y-auto">
//                   {scanHistory.length > 0 ? (
//                     scanHistory.map((entry, index) => (
//                       <div
//                         key={index}
//                         className="bg-green-50 border border-green-200 rounded-lg p-3"
//                       >
//                         <div className="flex items-center space-x-3">
//                           <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                             <span className="text-green-600 font-semibold">
//                               {entry.user.firstName.charAt(0)}
//                               {entry.user.lastName.charAt(0)}
//                             </span>
//                           </div>
//                           <div className="flex-1">
//                             <p className="font-medium text-green-800">
//                               {entry.user.firstName} {entry.user.lastName}
//                             </p>
//                             <p className="text-sm text-green-600">
//                               {new Date(entry.timestamp).toLocaleTimeString()}
//                             </p>
//                             <p className="text-xs text-green-500">
//                               Confidence: {(entry.confidence * 100).toFixed(1)}%
//                             </p>
//                           </div>
//                           <span className="text-green-500 text-xl">✅</span>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <span className="text-4xl block mb-2">📝</span>
//                       <p>No attendance marked yet</p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Quick Stats */}
//               <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
//                 <h4 className="font-semibold text-indigo-800 mb-3">
//                   Quick Stats
//                 </h4>
//                 <div className="space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-indigo-600">Total Registered:</span>
//                     <span className="font-medium text-indigo-800">
//                       {registeredFaces.length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-indigo-600">Present Today:</span>
//                     <span className="font-medium text-indigo-800">
//                       {scanHistory.length}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-indigo-600">Attendance Rate:</span>
//                     <span className="font-medium text-indigo-800">
//                       {registeredFaces.length > 0
//                         ? Math.round(
//                             (scanHistory.length / registeredFaces.length) * 100
//                           )
//                         : 0}
//                       %
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AttendanceScanner;









// updated file 

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
  // Add this ref at the top of the component
  import { useCamera } from '../../hooks/useCamera';
  import faceService from '../../services/faceService';
  // import { useAuth } from '../../contexts/AuthContext';
  import { api } from '../../services/api';
  import toast from 'react-hot-toast';
  
  const AttendanceScanner = () => {
  const attendanceInProgress = useRef(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState([]);
  const [registeredFaces, setRegisteredFaces] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [markedToday, setMarkedToday] = useState(new Set()); // ✅ Session tracking
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const {
    webcamRef,
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera
  } = useCamera();

  const loadRegisteredFaces = useCallback(async () => {
    try {
      console.log('🔄 Loading registered faces from API...');
      
      const response = await api.get('/students/registered-faces');
      
      if (response.success) {
        setRegisteredFaces(response.registeredFaces || []);
        console.log('✅ Loaded registered faces:', response.registeredFaces?.length);
      } else {
        console.error('❌ Failed to load registered faces:', response.message);
        toast.error('Failed to load registered faces');
      }
    } catch (error) {
      console.error('❌ Error loading registered faces:', error);
      toast.error('Failed to load registered faces');
    }
  }, []);


  // Add this function after loadRegisteredFaces
const loadTodaysAttendance = useCallback(async () => {
  try {
    console.log('📅 Loading today\'s attendance...');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const response = await api.get(`/attendance/today?date=${today}`);
    
    if (response.success && response.attendance) {
      console.log('✅ Loaded today\'s attendance:', response.attendance.length, 'records');
      
      // Update scan history
      setScanHistory(response.attendance.map(record => ({
        id: record._id || record.id,
        user: {
          id: record.student._id || record.student.id,
          firstName: record.student.firstName,
          lastName: record.student.lastName,
          studentId: record.student.studentId
        },
        confidence: record.confidence || 0.6,
        timestamp: new Date(record.createdAt || record.date),
        status: record.status || 'present'
      })));
      
      // Update markedToday Set with existing attendance
      const markedUserIds = new Set(response.attendance.map(record => 
        record.student._id || record.student.id
      ));
      setMarkedToday(markedUserIds);
      
      console.log('🔄 Updated markedToday with', markedUserIds.size, 'existing records');
    }
  } catch (error) {
    console.error('❌ Error loading today\'s attendance:', error);
    // Don't show error toast as this is background loading
  }
}, []);

// Update the useEffect to load attendance data


  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    stopCamera();
    toast('📹 Attendance scanning stopped', {
      icon: '📹',
      style: {
        background: '#3b82f6',
        color: '#ffffff',
      }
    });
  }, [stopCamera]);

  useEffect(() => {
  loadRegisteredFaces();
  loadTodaysAttendance(); // ✅ Load existing attendance
  return () => {
    stopScanning();
  };
}, [loadRegisteredFaces, loadTodaysAttendance, stopScanning]);


  const startScanning = async () => {
    if (!faceService.isModelLoaded) {
      const loaded = await faceService.loadModels();
      if (!loaded) {
        toast.error('Failed to load face detection models');
        return;
      }
    }

    console.log('🎯 Starting scanning process...');
    setIsScanning(true);
    
    try {
      await startCamera();
      
      setTimeout(() => {
        if (webcamRef.current && webcamRef.current.video) {
          console.log('✅ Camera ready, starting recognition interval...');
          scanIntervalRef.current = setInterval(performFaceRecognition, 3000);
          toast.success('🎯 Attendance scanning started!');
        } else {
          console.error('❌ Camera not ready after start');
          toast.error('Camera not ready. Please try again.');
          setIsScanning(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error starting scanner:', error);
      toast.error('Failed to start camera');
      setIsScanning(false);
    }
  };

  const performFaceRecognition = async () => {
    if (!webcamRef.current || !webcamRef.current.video || isProcessing) {
      return;
    }

    const video = webcamRef.current.video;
    
    if (!video || video.readyState !== 4 || video.paused || video.ended) {
      return;
    }

    console.log('🔍 Starting face recognition...');
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const detections = await faceService.detectAllFaces(canvas);
      console.log('🔎 Detection results:', detections?.length || 0, 'faces found');
      
      if (detections && detections.length > 0) {
        console.log(`👥 Processing ${detections.length} face(s)...`);
        console.log('📋 Available registered faces:', registeredFaces.length);

        const recognitionResults = [];

        for (const detection of detections) {
          const bestMatch = faceService.recognizeFace(
            detection.descriptor,
            registeredFaces
          );

          if (bestMatch) {
            console.log('✅ Face recognized:', bestMatch.user.firstName, 'Confidence:', bestMatch.confidence);
            
            recognitionResults.push({
              user: bestMatch.user,
              confidence: bestMatch.confidence,
              detection: detection,
              timestamp: new Date()
            });

            // ✅ Only mark attendance if not already marked today
            if (!markedToday.has(bestMatch.user.id)) {
              await markAttendance(bestMatch.user, bestMatch.confidence);
            } else {
              console.log('✋ Already marked today:', bestMatch.user.firstName);
            }
          } else {
            console.log('❓ Unknown face detected');
            recognitionResults.push({
              user: null,
              confidence: 0,
              detection: detection,
              timestamp: new Date()
            });
          }
        }

        setRecognitionResults(recognitionResults);
        
        if (canvasRef.current) {
          drawRecognitionResults(detections, recognitionResults);
        }
      }

    } catch (error) {
      console.error('❌ Face recognition error:', error);
    } finally {
      setIsProcessing(false);
    }
  };



// Update the markAttendance function
const markAttendance = async (recognizedUser, confidence) => {
  try {
    // ✅ Check if attendance is currently being processed for this user
    if (attendanceInProgress.current.has(recognizedUser.id)) {
      console.log('⏳ Attendance already in progress for:', recognizedUser.firstName);
      return;
    }

    // ✅ Check session tracking
    if (markedToday.has(recognizedUser.id)) {
      console.log('✋ Session check: Already marked today for:', recognizedUser.firstName);
      return;
    }

    // ✅ Add to in-progress set
    attendanceInProgress.current.add(recognizedUser.id);
    console.log('📝 Marking attendance for:', recognizedUser.firstName);

    const attendanceData = {
      studentId: recognizedUser.id,
      confidence: confidence,
      method: 'face_recognition',
      biometricData: {
        recognitionConfidence: confidence,
        timestamp: new Date().toISOString()
      }
    };

    const response = await api.post('/attendance/mark', attendanceData);

    if (response.success) {
      // ✅ Add to session tracking immediately
      setMarkedToday(prev => new Set([...prev, recognizedUser.id]));
      
      if (!response.alreadyExists) {
        toast.success(`✅ Attendance marked for ${recognizedUser.firstName} ${recognizedUser.lastName}!`);
      } else {
        toast.success(`ℹ️ Attendance already exists for ${recognizedUser.firstName} ${recognizedUser.lastName} today`);
      }
      
      // ✅ Add to scan history (avoid duplicates)
      setScanHistory(prev => {
        const existingEntry = prev.find(entry => 
          entry.user.id === recognizedUser.id
        );
        
        if (!existingEntry) {
          return [{
            id: response.attendanceId,
            user: recognizedUser,
            confidence: confidence,
            timestamp: new Date(),
            status: 'present'
          }, ...prev];
        }
        return prev;
      });
    }

  } catch (error) {
    console.error('Attendance marking error:', error);
    toast.error('Failed to mark attendance');
  } finally {
    // ✅ Remove from in-progress set after 5 seconds
    setTimeout(() => {
      attendanceInProgress.current.delete(recognizedUser.id);
    }, 5000);
  }
};


  const drawRecognitionResults = (detections, results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const video = webcamRef.current.video;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection, index) => {
      const result = results[index];
      const { box } = detection.detection;

      // Draw bounding box
      ctx.strokeStyle = result.user ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw user info
      if (result.user) {
        const label = `${result.user.firstName} ${result.user.lastName}`;
        const confidence = `${(result.confidence * 100).toFixed(1)}%`;
        const status = markedToday.has(result.user.id) ? 'MARKED' : 'NEW';
        
        ctx.fillStyle = markedToday.has(result.user.id) ? '#fbbf24' : '#00ff00';
        ctx.fillRect(box.x, box.y - 80, 200, 75);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(label, box.x + 5, box.y - 55);
        ctx.fillText(`Confidence: ${confidence}`, box.x + 5, box.y - 35);
        ctx.fillText(`Status: ${status}`, box.x + 5, box.y - 15);
      } else {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(box.x, box.y - 30, 150, 25);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('Unknown Person', box.x + 5, box.y - 10);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Attendance Scanner</h2>
              <p className="text-gray-600">
                Real-time face recognition for automatic attendance marking
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Registered Faces</p>
                <p className="text-2xl font-bold text-indigo-600">{registeredFaces.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Marked Today</p>
                <p className="text-2xl font-bold text-green-600">{markedToday.size}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Camera View */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Camera Feed</h3>
                <div className="flex space-x-2">
                  {!isScanning ? (
                    <button
                      onClick={startScanning}
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'Starting...' : '🎯 Start Scanning'}
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ⏹️ Stop Scanning
                    </button>
                  )}
                </div>
              </div>

              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {isActive || (webcamRef.current && webcamRef.current.video) ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      className="w-full h-96 object-cover"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                  </>
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-white">
                    <div className="text-center">
                      <span className="text-6xl block mb-4">📹</span>
                      <p className="text-xl mb-2">Camera Not Active</p>
                      <p className="text-sm opacity-75">Click "Start Scanning" to begin</p>
                    </div>
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute top-4 left-4 flex space-x-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isScanning ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {isScanning ? '🔴 SCANNING' : '⚫ STOPPED'}
                  </div>
                  {isProcessing && (
                    <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                      🧠 PROCESSING
                    </div>
                  )}
                </div>

                {error && (
                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500 text-white rounded-lg">
                    <p className="text-sm">❌ {error}</p>
                  </div>
                )}
              </div>

              {/* Current Recognition Results */}
              {recognitionResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Current Frame Results</h4>
                  <div className="space-y-2">
                    {recognitionResults.map((result, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                        result.user 
                          ? markedToday.has(result.user.id)
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          result.user 
                            ? markedToday.has(result.user.id)
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-red-500'
                        }`}></div>
                        <div className="flex-1">
                          {result.user ? (
                            <div>
                              <p className={`font-medium ${
                                markedToday.has(result.user.id) ? 'text-yellow-800' : 'text-green-800'
                              }`}>
                                {result.user.firstName} {result.user.lastName} 
                                {markedToday.has(result.user.id) && ' (Already Marked)'}
                              </p>
                              <p className={`text-sm ${
                                markedToday.has(result.user.id) ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                Confidence: {(result.confidence * 100).toFixed(1)}% • {result.user.studentId}
                              </p>
                            </div>
                          ) : (
                            <p className="text-red-800 font-medium">Unknown Person</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scan History */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.length > 0 ? (
                    scanHistory.map((entry, index) => (
                      <div key={entry.id || index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">
                              {entry.user.firstName.charAt(0)}{entry.user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-green-800">
                              {entry.user.firstName} {entry.user.lastName}
                            </p>
                            <p className="text-sm text-green-600">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-green-500">
                              Confidence: {(entry.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                          <span className="text-green-500 text-xl">✅</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl block mb-2">📝</span>
                      <p>No attendance marked yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-600">Total Registered:</span>
                    <span className="font-medium text-indigo-800">{registeredFaces.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-600">Present Today:</span>
                    <span className="font-medium text-indigo-800">{markedToday.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-600">Attendance Rate:</span>
                    <span className="font-medium text-indigo-800">
                      {registeredFaces.length > 0 ? Math.round((markedToday.size / registeredFaces.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScanner;
