/**
 * Format timestamp to human-readable string
 */
export function formatTimestamp(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString();
}

/**
 * Get risk level and color based on score
 */
export function getRiskLevel(score) {
  if (score > 70) {
    return {
      level: 'LIKELY FAKE',
      icon: '🔴',
      color: '#ef4444',
      severity: 'high'
    };
  }
  
  if (score > 40) {
    return {
      level: 'SUSPICIOUS',
      icon: '🟡',
      color: '#f59e0b',
      severity: 'medium'
    };
  }
  
  return {
    level: 'LIKELY REAL',
    icon: '🟢',
    color: '#10b981',
    severity: 'low'
  };
}

/**
 * Convert file size to human-readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type
 */
export function isValidMediaFile(file) {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  
  return validTypes.includes(file.type);
}

/**
 * Validate URL format
 */
export function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Generate unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}
