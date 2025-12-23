import { FileValidationOptions } from './types';

// File size limits as per requirements
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB for images
const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB for videos
const MAX_PDF_SIZE = 4 * 1024 * 1024; // 4MB for PDFs

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/webm',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get the maximum allowed file size based on file type
 */
function getMaxSizeForFile(file: File): number {
  // Check if it's a video
  if (file.type.startsWith('video/')) {
    return MAX_VIDEO_SIZE;
  }
  
  // Check if it's a PDF
  if (file.type === 'application/pdf') {
    return MAX_PDF_SIZE;
  }
  
  // Default to image size limit (includes jpg, jpeg, png, webp)
  return MAX_IMAGE_SIZE;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult {
  const {
    maxSize, // If explicitly provided, use it; otherwise auto-detect
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = options;

  // Determine max size based on file type if not explicitly provided
  const effectiveMaxSize = maxSize || getMaxSizeForFile(file);

  // Check file size
  if (file.size > effectiveMaxSize) {
    const maxSizeMB = (effectiveMaxSize / (1024 * 1024)).toFixed(0);
    const fileType = file.type.startsWith('video/') ? 'Video' : 
                     file.type === 'application/pdf' ? 'PDF' : 'Image';
    return {
      valid: false,
      error: `${fileType} file size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension (additional safety)
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'pdf',
    'mp4',
    'mov',
    'avi',
    'webm',
  ];
  
  if (extension && !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension .${extension} is not allowed`,
    };
  }

  return { valid: true };
}

export function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): ValidationResult {
  for (const file of files) {
    const result = validateFile(file, options);
    if (!result.valid) {
      return {
        valid: false,
        error: `${file.name}: ${result.error}`,
      };
    }
  }
  return { valid: true };
}
