// import React, { useState, useEffect, useRef } from 'react';
// import Webcam from 'react-webcam';
// import { useCamera } from '../../hooks/useCamera';
// import faceService from '../../services/faceService';
// import { useAuth } from '../../contexts/AuthContext';
// import { api } from '../../services/api'; // ✅ Use our API service instead
// import toast from 'react-hot-toast';

// const FaceRegistration = () => {
//   const { user, updateUser } = useAuth();
//   const [step, setStep] = useState('setup'); // setup, capture, processing, success
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [detectionResult, setDetectionResult] = useState(null);
//   const [isModelsLoaded, setIsModelsLoaded] = useState(false);
//   const canvasRef = useRef(null);

//   const {
//     webcamRef,
//     isActive,
//     isLoading,
//     error,
//     devices,
//     startCamera,
//     stopCamera,
//     captureImage,
//     switchCamera
//   } = useCamera();

//   useEffect(() => {
//     loadFaceModels();
//     return () => stopCamera();
//   }, [stopCamera]);

//   const loadFaceModels = async () => {
//     try {
//       const loaded = await faceService.loadModels();
//       setIsModelsLoaded(loaded);
//       if (!loaded) {
//         toast.error('Failed to load face detection models. Please refresh and try again.');
//       }
//     } catch (error) {
//       console.error('Model loading error:', error);
//       toast.error('Error loading face detection models');
//     }
//   };

//   const handleStartCapture = async () => {
//     if (!isModelsLoaded) {
//       toast.error('Face detection models not loaded yet. Please wait...');
//       return;
//     }
    
//     setStep('capture');
//     await startCamera();
//   };

//   const handleCapturePhoto = async () => {
//     const imageSrc = captureImage();
//     if (!imageSrc) {
//       toast.error('Failed to capture image');
//       return;
//     }

//     setCapturedImage(imageSrc);
//     setStep('processing');
//     setIsProcessing(true);

//     try {
//       // Create image element for face detection
//       const img = new Image();
//       img.onload = async () => {
//         try {
//           // Detect face in the captured image
//           const detection = await faceService.detectSingleFace(img);
          
//           if (!detection) {
//             toast.error('No face detected in the image. Please try again with better lighting.');
//             setStep('capture');
//             setIsProcessing(false);
//             return;
//           }

//           // Extract biometric data
//           const expression = faceService.getExpressionFromDetection(detection);
//           const ageGender = faceService.getAgeGenderFromDetection(detection);

//           setDetectionResult({
//             detection,
//             expression,
//             ageGender,
//             descriptor: Array.from(detection.descriptor)
//           });

//           // Draw detection results
//           if (canvasRef.current) {
//             const canvas = canvasRef.current;
//             canvas.width = img.width;
//             canvas.height = img.height;
//             const ctx = canvas.getContext('2d');
//             ctx.drawImage(img, 0, 0);
            
//             faceService.drawDetectionResults(canvas, detection, {
//               width: img.width,
//               height: img.height
//             });
//           }

//           setStep('success');
//           toast.success('Face detected successfully! 🎉');

//         } catch (error) {
//           console.error('Face detection error:', error);
//           toast.error('Error processing face data');
//           setStep('capture');
//         } finally {
//           setIsProcessing(false);
//         }
//       };
      
//       img.src = imageSrc;

//     } catch (error) {
//       console.error('Capture processing error:', error);
//       toast.error('Error processing captured image');
//       setStep('capture');
//       setIsProcessing(false);
//     }
//   };

//   const handleRegisterFace = async () => {
//   if (!detectionResult) {
//     toast.error('No face data to register');
//     return;
//   }

//   setIsProcessing(true);

//   try {
//     // Register face with backend using our API service
//     const registrationData = {
//       faceDescriptor: detectionResult.descriptor,
//       biometricData: {
//         lastGender: detectionResult.ageGender.gender,
//         lastEmotion: detectionResult.expression?.expression || 'neutral',
//         lastAge: detectionResult.ageGender.age,
//         confidenceScore: detectionResult.expression?.confidence || 0.8
//       }
//     };

//     // ✅ Updated API call
//     const response = await api.post('/students/register-face', registrationData);

//     if (response.success) {
//       updateUser({ faceRegistered: true });
//       toast.success('Face registered successfully! You can now use face recognition for attendance. 🎉');
//     } else {
//       toast.error(response.message || 'Failed to register face');
//     }

//   } catch (error) {
//     console.error('Face registration error:', error);
//     toast.error('Error registering face data');
//   } finally {
//     setIsProcessing(false);
//   }
// };

//   const handleRetake = () => {
//     setCapturedImage(null);
//     setDetectionResult(null);
//     setStep('capture');
//   };

//   const handleReset = () => {
//     stopCamera();
//     setCapturedImage(null);
//     setDetectionResult(null);
//     setStep('setup');
//   };

//   if (user?.faceRegistered) {
//     return (
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
//           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
//             <span className="text-4xl">✅</span>
//           </div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">Face Already Registered!</h2>
//           <p className="text-gray-600 mb-6">
//             Your face has been successfully registered in the system. You can now use face recognition for attendance marking.
//           </p>
//           <div className="flex justify-center space-x-4">
//             <button
//               onClick={handleReset}
//               className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//             >
//               Re-register Face
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto">
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//         {/* Header */}
//         <div className="px-8 py-6 border-b border-gray-100">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">📸 Face Registration</h2>
//           <p className="text-gray-600">
//             Register your face for quick and secure attendance marking
//           </p>
//         </div>

//         {/* Content */}
//         <div className="p-8">
//           {/* Setup Step */}
//           {step === 'setup' && (
//             <div className="text-center">
//               <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
//                 <span className="text-6xl">📸</span>
//               </div>
              
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 Ready to Register Your Face?
//               </h3>
              
//               <p className="text-gray-600 mb-8 max-w-md mx-auto">
//                 Make sure you're in a well-lit area and position your face clearly in front of the camera.
//               </p>

//               {!isModelsLoaded && (
//                 <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//                   <p className="text-yellow-800">Loading face detection models... Please wait.</p>
//                 </div>
//               )}

//               <button
//                 onClick={handleStartCapture}
//                 disabled={!isModelsLoaded || isLoading}
//                 className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 {isLoading ? 'Starting Camera...' : 'Start Face Registration'}
//               </button>
//             </div>
//           )}

//           {/* Capture Step */}
//           {step === 'capture' && (
//             <div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Camera View */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900">Camera View</h3>
                  
//                   <div className="relative bg-gray-900 rounded-lg overflow-hidden">
//                     {isActive ? (
//                       <Webcam
//                         ref={webcamRef}
//                         audio={false}
//                         screenshotFormat="image/jpeg"
//                         className="w-full h-80 object-cover"
//                         videoConstraints={{
//                           width: 640,
//                           height: 480,
//                           facingMode: "user"
//                         }}
//                       />
//                     ) : (
//                       <div className="w-full h-80 flex items-center justify-center text-white">
//                         <div className="text-center">
//                           <span className="text-4xl block mb-2">📷</span>
//                           <p>Camera not active</p>
//                         </div>
//                       </div>
//                     )}
                    
//                     {/* Camera overlay guides */}
//                     <div className="absolute inset-0 pointer-events-none">
//                       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//                         <div className="w-48 h-64 border-2 border-white border-dashed rounded-lg opacity-50"></div>
//                       </div>
//                     </div>
//                   </div>

//                   {error && (
//                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                       <p className="text-red-800 text-sm">{error}</p>
//                     </div>
//                   )}

//                   <div className="flex space-x-4">
//                     <button
//                       onClick={handleCapturePhoto}
//                       disabled={!isActive || isProcessing}
//                       className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       📸 Capture Photo
//                     </button>
                    
//                     <button
//                       onClick={handleReset}
//                       className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>

//                 {/* Instructions */}
//                 <div className="space-y-6">
//                   <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
                  
//                   <div className="space-y-4">
//                     {[
//                       { icon: '💡', text: 'Ensure good lighting on your face' },
//                       { icon: '👤', text: 'Position your face in the center frame' },
//                       { icon: '😊', text: 'Look directly at the camera' },
//                       { icon: '📏', text: 'Keep a comfortable distance from camera' },
//                       { icon: '🚫', text: 'Remove glasses/mask if possible' }
//                     ].map((instruction, index) => (
//                       <div key={index} className="flex items-center space-x-3">
//                         <span className="text-2xl">{instruction.icon}</span>
//                         <p className="text-gray-700">{instruction.text}</p>
//                       </div>
//                     ))}
//                   </div>

//                   {devices.length > 1 && (
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-900 mb-2">Camera Selection</h4>
//                       <select
//                         onChange={(e) => switchCamera(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                       >
//                         {devices.map((device, index) => (
//                           <option key={device.deviceId} value={device.deviceId}>
//                             {device.label || `Camera ${index + 1}`}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Processing Step */}
//           {step === 'processing' && (
//             <div className="text-center py-8">
//               <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Face...</h3>
//               <p className="text-gray-600">Analyzing facial features and expressions</p>
//             </div>
//           )}

//           {/* Success Step */}
//           {step === 'success' && detectionResult && (
//             <div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Results */}
//                 <div className="space-y-6">
//                   <h3 className="text-lg font-semibold text-gray-900">Detection Results</h3>
                  
//                   {/* Captured Image */}
//                   <div className="relative">
//                     <img
//                       src={capturedImage}
//                       alt="Captured"
//                       className="w-full h-64 object-cover rounded-lg"
//                     />
//                     <canvas
//                       ref={canvasRef}
//                       className="absolute inset-0 w-full h-full opacity-75"
//                     />
//                   </div>

//                   <div className="flex space-x-4">
//                     <button
//                       onClick={handleRegisterFace}
//                       disabled={isProcessing}
//                       className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       {isProcessing ? 'Registering...' : '✅ Register This Face'}
//                     </button>
                    
//                     <button
//                       onClick={handleRetake}
//                       className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//                     >
//                       📸 Retake
//                     </button>
//                   </div>
//                 </div>

//                 {/* Analysis Results */}
//                 <div className="space-y-6">
//                   <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                  
//                   <div className="space-y-4">
//                     <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <span className="text-green-600">✅</span>
//                         <span className="font-medium text-green-800">Face Detected Successfully</span>
//                       </div>
//                       <p className="text-green-700 text-sm">
//                         High-quality face data captured and ready for registration
//                       </p>
//                     </div>

//                     {detectionResult.expression && (
//                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                         <h4 className="font-medium text-blue-800 mb-2">Expression Analysis</h4>
//                         <p className="text-blue-700">
//                           <span className="font-medium">Detected:</span> {detectionResult.expression.expression}
//                         </p>
//                         <p className="text-blue-700 text-sm">
//                           Confidence: {(detectionResult.expression.confidence * 100).toFixed(1)}%
//                         </p>
//                       </div>
//                     )}

//                     <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//                       <h4 className="font-medium text-purple-800 mb-2">Biometric Data</h4>
//                       <div className="space-y-1 text-sm text-purple-700">
//                         <p><span className="font-medium">Estimated Age:</span> {detectionResult.ageGender.age} years</p>
//                         <p><span className="font-medium">Gender:</span> {detectionResult.ageGender.gender}</p>
//                         <p><span className="font-medium">Face Descriptor:</span> 128 dimensions captured</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FaceRegistration;






// new updated code 

import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { useCamera } from '../../hooks/useCamera';
import faceService from '../../services/faceService';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const FaceRegistration = () => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState('setup');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isReRegistering, setIsReRegistering] = useState(false); // ✅ New state for re-registration
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // ✅ Confirmation dialog
  const canvasRef = useRef(null);

  const {
    webcamRef,
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera,
    captureImage
  } = useCamera();

  useEffect(() => {
    loadFaceModels();
    return () => stopCamera();
  }, [stopCamera]);

  const loadFaceModels = async () => {
    try {
      const loaded = await faceService.loadModels();
      setIsModelsLoaded(loaded);
      if (!loaded) {
        toast.error('Failed to load face detection models. Please refresh and try again.');
      }
    } catch (error) {
      console.error('Model loading error:', error);
      toast.error('Error loading face detection models');
    }
  };

  const handleStartCapture = async () => {
    if (!isModelsLoaded) {
      toast.error('Face detection models not loaded yet. Please wait...');
      return;
    }
    
    setStep('capture');
    await startCamera();
    toast.success('Camera started! Position your face in the center.');
  };

  const handleCapturePhoto = async () => {
    const imageSrc = captureImage();
    if (!imageSrc) {
      toast.error('Failed to capture image');
      return;
    }

    setCapturedImage(imageSrc);
    setStep('processing');
    setIsProcessing(true);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          const detection = await faceService.detectSingleFace(img);
          
          if (!detection) {
            toast.error('No face detected in the image. Please try again with better lighting.');
            setStep('capture');
            setIsProcessing(false);
            return;
          }

          const expression = faceService.getExpressionFromDetection(detection);
          const ageGender = faceService.getAgeGenderFromDetection(detection);

          setDetectionResult({
            detection,
            expression,
            ageGender,
            descriptor: Array.from(detection.descriptor)
          });

          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            faceService.drawDetectionResults(canvas, detection, {
              width: img.width,
              height: img.height
            });
          }

          setStep('success');
          toast.success('Face detected successfully! 🎉');

        } catch (error) {
          console.error('Face detection error:', error);
          toast.error('Error processing face data');
          setStep('capture');
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.src = imageSrc;

    } catch (error) {
      console.error('Capture processing error:', error);
      toast.error('Error processing captured image');
      setStep('capture');
      setIsProcessing(false);
    }
  };

  const handleRegisterFace = async () => {
    if (!detectionResult) {
      toast.error('No face data to register');
      return;
    }

    setIsProcessing(true);

    try {
      const registrationData = {
        faceDescriptor: detectionResult.descriptor,
        biometricData: {
          lastGender: detectionResult.ageGender.gender,
          lastEmotion: detectionResult.expression?.expression || 'neutral',
          lastAge: detectionResult.ageGender.age,
          confidenceScore: detectionResult.expression?.confidence || 0.8
        },
        isReRegistration: isReRegistering // ✅ Flag for re-registration
      };

      const response = await api.post('/students/register-face', registrationData);

      if (response.success) {
        updateUser({ faceRegistered: true });
        
        const message = isReRegistering 
          ? 'Face re-registered successfully! Your new face data has been updated. 🎉'
          : 'Face registered successfully! You can now use face recognition for attendance. 🎉';
          
        toast.success(message);
        
        // Reset states
        setIsReRegistering(false);
        setStep('setup');
        setCapturedImage(null);
        setDetectionResult(null);
        stopCamera();
      } else {
        toast.error(response.message || 'Failed to register face');
      }

    } catch (error) {
      console.error('Face registration error:', error);
      toast.error('Error registering face data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setDetectionResult(null);
    setStep('capture');
  };

  const handleReset = () => {
    stopCamera();
    setCapturedImage(null);
    setDetectionResult(null);
    setStep('setup');
    setIsReRegistering(false);
  };

  // ✅ Handle re-registration confirmation
  const handleReRegisterRequest = () => {
    setShowConfirmDialog(true);
  };

  const confirmReRegistration = () => {
    setIsReRegistering(true);
    setShowConfirmDialog(false);
    setStep('setup');
    toast.success('Re-registration mode activated. You can now register a new face.');
  };

  const cancelReRegistration = () => {
    setShowConfirmDialog(false);
  };

  // ✅ Show registration flow if re-registering OR if not registered
  const shouldShowRegistrationFlow = isReRegistering || !user?.faceRegistered;

  if (!shouldShowRegistrationFlow) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Face Already Registered!</h2>
          <p className="text-gray-600 mb-6">
            Your face has been successfully registered in the system. You can now use face recognition for attendance marking.
          </p>
          
          {/* ✅ User Info Card */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {user?.studentId && <p className="text-xs text-gray-500">ID: {user.studentId}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={handleReRegisterRequest}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🔄 Re-register Face
            </button>
          </div>
        </div>

        {/* ✅ Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Re-register Face?</h3>
                <p className="text-gray-600 mb-6">
                  This will replace your current face data with new face recognition data. 
                  Are you sure you want to continue?
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={cancelReRegistration}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReRegistration}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Yes, Re-register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            📸 {isReRegistering ? 'Re-register Face' : 'Face Registration'}
          </h2>
          <p className="text-gray-600">
            {isReRegistering 
              ? 'Update your face data with new recognition information'
              : 'Register your face for quick and secure attendance marking'
            }
          </p>
          {isReRegistering && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Re-registration mode: Your existing face data will be replaced with new data.
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Setup Step */}
          {step === 'setup' && (
            <div className="text-center">
              <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-6xl">📸</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isReRegistering ? 'Ready to Re-register Your Face?' : 'Ready to Register Your Face?'}
              </h3>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Make sure you're in a well-lit area and position your face clearly in front of the camera.
              </p>

              {!isModelsLoaded && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">Loading face detection models... Please wait.</p>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleStartCapture}
                  disabled={!isModelsLoaded || isLoading}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Starting Camera...' : `Start ${isReRegistering ? 'Re-registration' : 'Registration'}`}
                </button>
                
                {isReRegistering && (
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel Re-registration
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Capture Step */}
          {step === 'capture' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Camera View */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Camera View</h3>
                  
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    {isActive ? (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-80 object-cover"
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: "user"
                        }}
                      />
                    ) : (
                      <div className="w-full h-80 flex items-center justify-center text-white">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">📷</span>
                          <p>Camera not active</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Camera overlay guides */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-48 h-64 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={handleCapturePhoto}
                      disabled={!isActive || isProcessing}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      📸 Capture Photo
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isReRegistering ? 'Re-registration Instructions' : 'Instructions'}
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { icon: '💡', text: 'Ensure good lighting on your face' },
                      { icon: '👤', text: 'Position your face in the center frame' },
                      { icon: '😊', text: 'Look directly at the camera' },
                      { icon: '📏', text: 'Keep a comfortable distance from camera' },
                      { icon: '🚫', text: 'Remove glasses/mask if possible' }
                    ].map((instruction, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-2xl">{instruction.icon}</span>
                        <p className="text-gray-700">{instruction.text}</p>
                      </div>
                    ))}
                  </div>

                  {isReRegistering && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Re-registration Tips</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Try different lighting conditions for better recognition</li>
                        <li>• Capture at a slightly different angle if needed</li>
                        <li>• Make sure your face is clearly visible</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Your Face...
              </h3>
              <p className="text-gray-600">Analyzing facial features and expressions</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && detectionResult && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Results */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Detection Results</h3>
                  
                  {/* Captured Image */}
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full opacity-75"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleRegisterFace}
                      disabled={isProcessing}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing 
                        ? (isReRegistering ? 'Re-registering...' : 'Registering...') 
                        : (isReRegistering ? '🔄 Update Face Data' : '✅ Register This Face')
                      }
                    </button>
                    
                    <button
                      onClick={handleRetake}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      📸 Retake
                    </button>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600">✅</span>
                        <span className="font-medium text-green-800">Face Detected Successfully</span>
                      </div>
                      <p className="text-green-700 text-sm">
                        High-quality face data captured and ready for {isReRegistering ? 're-registration' : 'registration'}
                      </p>
                    </div>

                    {detectionResult.expression && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Expression Analysis</h4>
                        <p className="text-blue-700">
                          <span className="font-medium">Detected:</span> {detectionResult.expression.expression}
                        </p>
                        <p className="text-blue-700 text-sm">
                          Confidence: {(detectionResult.expression.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-2">Biometric Data</h4>
                      <div className="space-y-1 text-sm text-purple-700">
                        <p><span className="font-medium">Estimated Age:</span> {detectionResult.ageGender.age} years</p>
                        <p><span className="font-medium">Gender:</span> {detectionResult.ageGender.gender}</p>
                        <p><span className="font-medium">Face Descriptor:</span> 128 dimensions captured</p>
                      </div>
                    </div>

                    {isReRegistering && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">Re-registration Notice</h4>
                        <p className="text-yellow-700 text-sm">
                          This will replace your existing face data. The system will use this new data for future recognition.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
