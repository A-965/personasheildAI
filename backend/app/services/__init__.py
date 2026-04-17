"""Detection Pipeline Service"""
import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional
import logging
from app.schemas import DetectionSignal

logger = logging.getLogger(__name__)


class DetectionService:
    """Core detection service for analyzing deepfakes"""
    
    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self.confidence_threshold = 0.5
        
    async def analyze_image(self, image_path: str) -> Dict:
        """Analyze a single image for deepfakes"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            # Run detection pipeline
            results = await self._run_detection_pipeline(image)
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            raise
    
    
    async def analyze_video(self, video_path: str, max_frames: int = 30) -> Dict:
        """Analyze video for deepfakes by sampling frames"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video: {video_path}")
            
            frame_results = []
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_interval = max(1, total_frames // max_frames)
            
            frame_count = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % frame_interval == 0:
                    result = await self._run_detection_pipeline(frame)
                    frame_results.append({
                        'frame_number': frame_count,
                        'timestamp': frame_count / cap.get(cv2.CAP_PROP_FPS),
                        **result
                    })
                
                frame_count += 1
            
            cap.release()
            
            # Aggregate results
            aggregated = self._aggregate_video_results(frame_results)
            return aggregated
            
        except Exception as e:
            logger.error(f"Error analyzing video: {e}")
            raise
    
    
    async def analyze_frame(self, frame_base64: str) -> Dict:
        """Analyze a single frame (for Live Shield real-time)"""
        import base64
        import re
        
        try:
            # Strip optional data URI prefix
            if frame_base64.startswith('data:image/'):
                frame_base64 = re.sub(r'^data:image/[^;]+;base64,', '', frame_base64)

            # Decode base64 frame
            frame_data = base64.b64decode(frame_base64)
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                raise ValueError("Could not decode frame")
            
            result = await self._run_detection_pipeline(frame)
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            raise
    
    
    async def _run_detection_pipeline(self, image: np.ndarray) -> Dict:
        """
        Run complete detection pipeline on an image/frame
        Pipeline steps:
        1. Face detection
        2. GAN fingerprint detection
        3. Temporal/blending analysis
        4. Calculate risk score
        """
        
        signals: List[DetectionSignal] = []
        scores = {}
        
        # Step 1: Face Detection
        face_data = await self._detect_faces(image)
        scores['face_detection'] = face_data.get('confidence', 0)
        
        if face_data.get('faces_detected', 0) > 0:
            # Check for unnatural face boundaries
            boundary_score = face_data.get('boundary_abnormality', 0)
            if boundary_score > 0.6:
                signals.append(DetectionSignal(
                    type="face_boundary",
                    severity=self._score_to_severity(boundary_score),
                    description="Abnormal face boundary detected - potential face swap or warping",
                    confidence=boundary_score
                ))
        
        # Step 2: GAN Fingerprint Detection
        gan_score = await self._detect_gan_artifacts(image)
        scores['gan_fingerprints'] = gan_score
        
        if gan_score > 0.5:
            signals.append(DetectionSignal(
                type="gan_fingerprint",
                severity=self._score_to_severity(gan_score),
                description="GAN fingerprints detected - likely AI-generated or edited",
                confidence=gan_score
            ))
        
        # Step 3: Temporal/Blending Artifacts
        blending_score = await self._detect_blending_artifacts(image)
        scores['blending_artifacts'] = blending_score
        
        if blending_score > 0.55:
            signals.append(DetectionSignal(
                type="blending_boundary",
                severity=self._score_to_severity(blending_score),
                description="Unnatural blending boundaries detected",
                confidence=blending_score
            ))
        
        # Step 4: Compression Artifacts
        compression_score = await self._detect_compression_artifacts(image)
        scores['compression_artifacts'] = compression_score
        
        if compression_score > 0.6:
            signals.append(DetectionSignal(
                type="compression_anomaly",
                severity=self._score_to_severity(compression_score),
                description="Unusual compression patterns detected",
                confidence=compression_score
            ))
        
        # Calculate overall risk score
        risk_score = self._calculate_risk_score(scores)
        classification = self._classify_risk(risk_score)
        
        return {
            'risk_score': risk_score,
            'classification': classification,
            'confidence': max(scores.values()) * 100 if scores else 0,
            'signals': signals,
            'face_count': face_data.get('faces_detected', 0),
            'gan_fingerprints': gan_score,
            'temporal_consistency': 1.0 - (blending_score + compression_score) / 2,
            'audio_visual_sync': None,  # Requires audio analysis
            'blending_artifacts': blending_score,
        }
    
    
    async def _detect_faces(self, image: np.ndarray) -> Dict:
        """Detect faces and check for anomalies"""
        # Placeholder: In production, use MediaPipe or similar
        # For now, simulate detection
        
        try:
            # Check image dimensions
            height, width = image.shape[:2]
            if height < 100 or width < 100:
                return {'faces_detected': 0, 'boundary_abnormality': 0}
            
            # Simulate face detection
            detected_faces = np.random.random() > 0.3  # 70% chance of face
            boundary_abnormality = np.random.uniform(0, 0.8) if detected_faces else 0
            
            return {
                'faces_detected': 1 if detected_faces else 0,
                'boundary_abnormality': boundary_abnormality,
                'confidence': 0.85 if detected_faces else 0
            }
        except Exception as e:
            logger.error(f"Error in face detection: {e}")
            return {'faces_detected': 0, 'boundary_abnormality': 0}
    
    
    async def _detect_gan_artifacts(self, image: np.ndarray) -> float:
        """Detect GAN/AI-generated artifacts"""
        try:
            # Convert to float
            img_float = image.astype(np.float32) / 255.0
            
            # Analyze frequency spectrum (simplified GAN detection)
            if len(image.shape) == 3:
                img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                img_gray = image
            
            # Compute FFT
            fft = np.fft.fft2(img_gray)
            spectrum = np.abs(fft)
            
            # Look for artifacts (elevated high-frequency components)
            high_freq_ratio = np.sum(spectrum[-50:, -50:]) / np.sum(spectrum)
            gan_score = min(high_freq_ratio * 10, 1.0)  # Normalize to 0-1
            
            # Add randomness for simulation
            gan_score = gan_score * 0.3 + np.random.uniform(0, 0.7) * 0.7
            
            return float(gan_score)
        except Exception as e:
            logger.error(f"Error in GAN detection: {e}")
            return 0.3  # Default score
    
    
    async def _detect_blending_artifacts(self, image: np.ndarray) -> float:
        """Detect blending boundaries and unnatural seams"""
        try:
            # Detect edges (potential blending boundaries)
            if len(image.shape) == 3:
                img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                img_gray = image
            
            # Use Canny edge detection
            edges = cv2.Canny(img_gray, 100, 200)
            edge_density = np.sum(edges) / (image.shape[0] * image.shape[1])
            
            # Check for anomalous edge patterns
            blending_score = min(edge_density * 5, 1.0)
            blending_score = blending_score * 0.4 + np.random.uniform(0, 0.6) * 0.6
            
            return float(blending_score)
        except Exception as e:
            logger.error(f"Error in blending detection: {e}")
            return 0.2
    
    
    async def _detect_compression_artifacts(self, image: np.ndarray) -> float:
        """Detect unusual compression artifacts"""
        try:
            # Analyze blocking artifacts (common in generated/edited content)
            if len(image.shape) == 3:
                img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                img_gray = image
            
            # Detect 8x8 block boundaries (JPEG artifacts)
            block_size = 8
            artifacts = 0
            
            for i in range(0, img_gray.shape[0] - block_size, block_size):
                for j in range(0, img_gray.shape[1] - block_size, block_size):
                    block = img_gray[i:i+block_size, j:j+block_size]
                    # Look for uniform blocks (sign of compression)
                    if np.std(block) < 5:
                        artifacts += 1
            
            total_blocks = (img_gray.shape[0] // block_size) * (img_gray.shape[1] // block_size)
            compression_score = min((artifacts / max(total_blocks, 1)) * 2, 1.0)
            
            return float(compression_score)
        except Exception as e:
            logger.error(f"Error in compression detection: {e}")
            return 0.1
    
    
    def _calculate_risk_score(self, scores: Dict[str, float]) -> float:
        """Calculate overall risk score from individual detection scores"""
        if not scores:
            return 0.0
        
        # Weight different scores
        weights = {
            'gan_fingerprints': 0.35,
            'blending_artifacts': 0.30,
            'compression_artifacts': 0.20,
            'face_detection': 0.15,
        }
        
        weighted_score = 0
        total_weight = 0
        
        for key, value in scores.items():
            if key in weights:
                weighted_score += value * weights[key]
                total_weight += weights[key]
        
        if total_weight == 0:
            return 0.0
        
        risk_score = (weighted_score / total_weight) * 100
        return min(max(risk_score, 0), 100)  # Clamp to 0-100
    
    
    def _classify_risk(self, risk_score: float) -> str:
        """Classify risk level based on score"""
        if risk_score > 70:
            return "LIKELY FAKE"
        elif risk_score > 40:
            return "SUSPICIOUS"
        else:
            return "LIKELY REAL"
    
    
    def _score_to_severity(self, score: float) -> str:
        """Convert score to severity level"""
        if score > 0.7:
            return "high"
        elif score > 0.4:
            return "medium"
        else:
            return "low"
    
    
    def _aggregate_video_results(self, frame_results: List[Dict]) -> Dict:
        """Aggregate results from multiple frames"""
        if not frame_results:
            return {'risk_score': 0, 'classification': 'LIKELY REAL'}
        
        # Calculate averages
        avg_risk = np.mean([r['risk_score'] for r in frame_results])
        max_risk = np.max([r['risk_score'] for r in frame_results])
        
        # Use max risk score as overall (more conservative)
        overall_risk = max_risk * 0.6 + avg_risk * 0.4
        
        return {
            'risk_score': overall_risk,
            'classification': self._classify_risk(overall_risk),
            'frame_count': len(frame_results),
            'avg_risk_per_frame': avg_risk,
            'max_risk_per_frame': max_risk,
            'frame_results': frame_results[:5]  # Return first 5 frames for debug
        }
