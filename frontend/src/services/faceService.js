import * as faceapi from 'face-api.js';

class FaceService {
  constructor() {
    this.isModelLoaded = false;
    this.recognitionThreshold = 0.6;
    this.detectionThreshold = 0.5;
  }

  async loadModels() {
    if (this.isModelLoaded) return true;

    try {
      console.log('🤖 Loading Face-API models...');
      
      const modelUrl = '/models';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
      ]);

      this.isModelLoaded = true;
      console.log('✅ Face-API models loaded successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Error loading Face-API models:', error);
      return false;
    }
  }

  async detectSingleFace(imageElement) {
    if (!this.isModelLoaded) {
      await this.loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: this.detectionThreshold }))
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions();

      return detection;
    } catch (error) {
      console.error('❌ Face detection error:', error);
      return null;
    }
  }

  async detectAllFaces(imageElement) {
    if (!this.isModelLoaded) {
      await this.loadModels();
    }

    try {
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: this.detectionThreshold }))
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      return detections;
    } catch (error) {
      console.error('❌ Face detection error:', error);
      return [];
    }
  }

  calculateDistance(descriptor1, descriptor2) {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
  }

  recognizeFace(unknownDescriptor, knownDescriptors) {
    let bestMatch = null;
    let minDistance = Infinity;

    knownDescriptors.forEach((known, index) => {
      const distance = this.calculateDistance(unknownDescriptor, known.descriptor);
      if (distance < minDistance && distance < this.recognitionThreshold) {
        minDistance = distance;
        bestMatch = {
          ...known,
          distance,
          confidence: Math.max(0, 1 - distance)
        };
      }
    });

    return bestMatch;
  }

  getAgeGenderFromDetection(detection) {
    // Note: Age and gender detection require additional models
    // For now, we'll extract available data
    return {
      age: Math.floor(Math.random() * 30) + 18, // Placeholder
      gender: Math.random() > 0.5 ? 'male' : 'female', // Placeholder
      confidence: 0.8
    };
  }

  getExpressionFromDetection(detection) {
    if (!detection.expressions) return null;

    let maxExpression = 'neutral';
    let maxValue = 0;

    Object.entries(detection.expressions).forEach(([expression, value]) => {
      if (value > maxValue) {
        maxValue = value;
        maxExpression = expression;
      }
    });

    return {
      expression: maxExpression,
      confidence: maxValue,
      all: detection.expressions
    };
  }

  drawDetectionResults(canvas, detections, displaySize) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!Array.isArray(detections)) {
      detections = [detections];
    }

    detections.forEach((detection) => {
      if (!detection) return;

      const { box } = detection.detection;
      
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw landmarks
      if (detection.landmarks) {
        ctx.fillStyle = '#ff0000';
        detection.landmarks.positions.forEach((point) => {
          ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
        });
      }

      // Draw expression
      const expression = this.getExpressionFromDetection(detection);
      if (expression) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(box.x, box.y - 30, 120, 25);
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.fillText(
          `${expression.expression} (${(expression.confidence * 100).toFixed(1)}%)`,
          box.x + 5,
          box.y - 10
        );
      }
    });
  }

  // Utility methods
  createImageFromVideo(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    return canvas;
  }

  dataURLToBlob(dataURL) {
    return fetch(dataURL).then(res => res.blob());
  }

  async processImageFile(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
// const faceService = new FaceService();

const faceServiceInstance = new FaceService();
export default faceServiceInstance;
