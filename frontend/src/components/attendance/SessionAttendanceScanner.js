import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const SessionAttendanceScanner = ({ 
  sessionId, 
  expectedStudentId, 
  expectedStudentName,
  onSuccess, 
  onError 
}) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptors, setFaceDescriptors] = useState([]);
  const [scanningStatus, setScanningStatus] = useState('Initializing...');

  // Load models and start scanner
  useEffect(() => {
    const loadModelsAndStartScanner = async () => {
      try {
        setScanningStatus('Loading face recognition models...');
        
        // Load face-api models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);

        console.log('✅ Face-api models loaded');
        setModelsLoaded(true);

        // Load face descriptors for the expected student ONLY
        await loadStudentFaceDescriptor();
        
        // Start video
        await startVideo();
        
        setIsLoading(false);
        setScanningStatus('Ready to scan...');
      } catch (error) {
        console.error('❌ Error loading models:', error);
        setIsLoading(false);
        setScanningStatus('Error loading face recognition models');
        onError?.(error);
      }
    };

    loadModelsAndStartScanner();

    return () => {
      stopVideo();
    };
  }, [sessionId, expectedStudentId]);

  // Load ONLY the expected student's face descriptor
  const loadStudentFaceDescriptor = async () => {
    try {
      setScanningStatus('Loading your face profile...');
      
      const response = await api.get(`/auth/face-descriptor/${expectedStudentId}`);
      
      if (response.success && response.faceDescriptor) {
        // Convert the descriptor back to Float32Array
        const descriptorArray = new Float32Array(response.faceDescriptor);
        
        setFaceDescriptors([{
          studentId: expectedStudentId,
          name: expectedStudentName,
          descriptor: descriptorArray
        }]);
        
        console.log('✅ Face descriptor loaded for:', expectedStudentName);
        setScanningStatus('Face profile loaded successfully');
      } else {
        throw new Error('Face profile not found. Please register your face first.');
      }
    } catch (error) {
      console.error('❌ Error loading face descriptor:', error);
      setScanningStatus('Face profile not found - Please register first');
      onError?.(new Error('Face profile not found. Please complete face registration first.'));
    }
  };

  // Start video stream
  const startVideo = async () => {
    try {
      setScanningStatus('Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video stream started');
          setScanningStatus('Camera ready - Position your face in the frame');
        };
      }
    } catch (error) {
      console.error('❌ Error starting video:', error);
      setScanningStatus('Camera access denied');
      onError?.(error);
    }
  };

  // Stop video stream
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Start scanning
  const startScanning = async () => {
    if (!modelsLoaded || faceDescriptors.length === 0) {
      toast.error('Face recognition not ready. Please wait...');
      return;
    }

    setIsScanning(true);
    setScanningStatus('Scanning... Please look at the camera');
    
    const detection = setInterval(async () => {
      await detectFaces();
    }, 1000); // Check every second

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (isScanning) {
        clearInterval(detection);
        setIsScanning(false);
        setScanningStatus('Scan timeout. Please try again.');
      }
    }, 30000);

    // Store interval for cleanup
    window.faceDetectionInterval = detection;
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    setScanningStatus('Scanning stopped');
    
    if (window.faceDetectionInterval) {
      clearInterval(window.faceDetectionInterval);
      window.faceDetectionInterval = null;
    }
  };

  // Detect faces in video
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Clear canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length === 0) {
        setScanningStatus('No face detected. Please position your face in the camera.');
        setDetectedFaces([]);
        return;
      }

      if (detections.length > 1) {
        setScanningStatus('Multiple faces detected. Please ensure only you are in the frame.');
        setDetectedFaces([]);
        return;
      }

      // Match face with expected student ONLY
      const detection = detections[0];
      const expectedDescriptor = faceDescriptors[0].descriptor;
      
      // Calculate distance
      const distance = faceapi.euclideanDistance(detection.descriptor, expectedDescriptor);
      const confidence = Math.max(0, (1 - distance) * 100);

      console.log('🔍 Face detection result:', {
        distance,
        confidence,
        expectedStudent: expectedStudentName
      });

      // Draw detection box
      const box = detection.detection.box;
      ctx.strokeStyle = confidence > 70 ? '#10B981' : '#EF4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw confidence label
      const label = confidence > 70 
        ? `${expectedStudentName} (${confidence.toFixed(1)}%)` 
        : `Not ${expectedStudentName} (${confidence.toFixed(1)}%)`;
      
      ctx.fillStyle = confidence > 70 ? '#10B981' : '#EF4444';
      ctx.fillRect(box.x, box.y - 25, ctx.measureText(label).width + 10, 25);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(label, box.x + 5, box.y - 7);

      // Check if face matches expected student
      if (confidence > 70) {
        setScanningStatus(`✅ Face recognized: ${expectedStudentName}`);
        
        // Stop scanning and mark attendance
        stopScanning();
        
        // Mark attendance for this specific session
        await markSessionAttendance(confidence);



      } else {
        setScanningStatus(`❌ Face does not match ${expectedStudentName}. Please try again.`);
      }

      setDetectedFaces([{
        name: confidence > 70 ? expectedStudentName : 'Unknown',
        confidence: confidence,
        isMatch: confidence > 70
      }]);

    } catch (error) {
      console.error('❌ Error in face detection:', error);
      setScanningStatus('Error during face detection');
    }
  };

  // Mark attendance for specific session
  // const markSessionAttendance = async (confidence) => {
  //   try {
  //     setScanningStatus('Marking attendance...');
      
  //     const response = await api.post(`/sessions/${sessionId}/attendance`, {
  //       method: 'face_recognition',
  //       confidence: confidence.toFixed(1)
  //     });

  //     if (response.success) {
  //       setScanningStatus('✅ Attendance marked successfully!');
  //       toast.success(`Attendance marked successfully for ${expectedStudentName}!`);
        
  //       // Call success callback
  //       onSuccess?.({
  //         studentId: expectedStudentId,
  //         studentName: expectedStudentName,
  //         confidence: confidence,
  //         sessionId: sessionId
  //       });
  //     } else {
  //       throw new Error(response.message || 'Failed to mark attendance');
  //     }
  //   } catch (error) {
  //     console.error('❌ Error marking attendance:', error);
  //     const errorMessage = error.response?.data?.message || error.message || 'Failed to mark attendance';
  //     setScanningStatus(`❌ Error: ${errorMessage}`);
  //     toast.error(errorMessage);
  //     onError?.(error);
  //   }
  // };




  // grok code
  
  const markSessionAttendance = async (confidence) => {
    try {
      setScanningStatus('Marking attendance...');
      
      const response = await api.post(`/sessions/${sessionId}/attendance`, {
        method: 'face_recognition',
        confidence: confidence.toFixed(1)
      });

      if (response.success) {
        setScanningStatus('✅ Attendance marked successfully!');
        // NO TOAST HERE - parent handles
        
        // Call success callback with status
        onSuccess?.({
          studentId: expectedStudentId,
          studentName: expectedStudentName,
          confidence: confidence,
          sessionId: sessionId,
          status: response.data?.status || 'present'  // Assume backend returns this
        });
      } else {
        throw new Error(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark attendance';
      
      // Handle specific "already marked" case
      if (errorMessage.toLowerCase().includes('already marked')) {
        setScanningStatus('⚠️ Attendance already marked for this session');
        onError?.(new Error('Attendance already marked for this session'));
      } else {
        setScanningStatus(`❌ Error: ${errorMessage}`);
        onError?.(new Error(errorMessage));
      }
    }
  };

  // grok code


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">📸 Session Attendance</h3>
        <p className="text-sm text-gray-600 mt-1">
          Verifying identity for: <span className="font-medium text-indigo-600">{expectedStudentName}</span>
        </p>
      </div>

      {/* Video Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-64 object-cover"
          onCanPlay={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />

        {/* Status Overlay */}
        <div className="absolute top-4 left-4 right-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isScanning 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-800 bg-opacity-75 text-white'
          }`}>
            {scanningStatus}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={isLoading || !modelsLoaded || faceDescriptors.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : '📸 Start Attendance Scan'}
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

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">🔒</div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
            <p className="text-xs text-blue-700 mt-1">
              This system only verifies YOUR registered face. Other faces will not be accepted for attendance.
            </p>
          </div>
        </div>
      </div>

      {/* Detection Results */}
      {detectedFaces.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Detection Results</h4>
          {detectedFaces.map((face, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">{face.name}</span>
              <span className={`text-sm font-medium ${
                face.isMatch ? 'text-green-600' : 'text-red-600'
              }`}>
                {face.confidence.toFixed(1)}% confidence
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionAttendanceScanner;
