import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const webcamRef = useRef(null);

  const startCamera = useCallback(async (deviceId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get available camera devices
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      
      setDevices(videoDevices);

      // Use specified device or default
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: deviceId ? undefined : 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
      }

      setSelectedDevice(deviceId || videoDevices[0]?.deviceId);
      setIsActive(true);
      
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
      const stream = webcamRef.current.video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      webcamRef.current.video.srcObject = null;
    }
    setIsActive(false);
    setSelectedDevice(null);
  }, []);

  const captureImage = useCallback(() => {
    if (!webcamRef.current) return null;
    
    return webcamRef.current.getScreenshot();
  }, []);

  const switchCamera = useCallback((deviceId) => {
    if (isActive) {
      stopCamera();
      setTimeout(() => startCamera(deviceId), 100);
    } else {
      startCamera(deviceId);
    }
  }, [isActive, startCamera, stopCamera]);

  return {
    webcamRef,
    isActive,
    isLoading,
    error,
    devices,
    selectedDevice,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera
  };
};
