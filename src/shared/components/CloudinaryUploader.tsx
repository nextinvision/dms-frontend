'use client';

import React, { useCallback, useState } from 'react';
import { useCloudinaryUpload } from '@/shared/hooks/useCloudinaryUpload';
import { CloudinaryUploadResult } from '@/services/cloudinary/types';

interface CloudinaryUploaderProps {
  folder: string;
  onUploadComplete: (results: CloudinaryUploadResult[]) => void;
  onUploadError?: (error: Error) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  tags?: string[];
  context?: Record<string, string>;
}

export function CloudinaryUploader({
  folder,
  onUploadComplete,
  onUploadError,
  multiple = true,
  accept = 'image/*,video/*,.pdf',
  maxFiles,
  maxSize,
  disabled = false,
  className = '',
  children,
  tags,
  context,
}: CloudinaryUploaderProps) {
  const { uploadMultiple, isUploading, progress, error } = useCloudinaryUpload();
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);

      // Check max files limit
      if (maxFiles && fileArray.length > maxFiles) {
        const err = new Error(`Maximum ${maxFiles} file(s) allowed`);
        onUploadError?.(err);
        return;
      }

      // Check file sizes
      if (maxSize) {
        const oversizedFiles = fileArray.filter((f) => f.size > maxSize);
        if (oversizedFiles.length > 0) {
          const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
          const err = new Error(
            `Some files exceed ${maxSizeMB}MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`
          );
          onUploadError?.(err);
          return;
        }
      }

      // Create preview URLs
      const previews = fileArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls(previews);

      try {
        const results = await uploadMultiple(fileArray, folder, {
          tags,
          context,
        });

        // Clean up preview URLs
        previews.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);

        onUploadComplete(results);
      } catch (err) {
        // Clean up preview URLs
        previews.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);

        const error = err instanceof Error ? err : new Error('Upload failed');
        onUploadError?.(error);
      }
    },
    [folder, uploadMultiple, maxFiles, maxSize, onUploadComplete, onUploadError, tags, context]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [disabled, isUploading, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) return;
      handleFiles(e.target.files);
      // Reset input
      e.target.value = '';
    },
    [disabled, isUploading, handleFiles]
  );

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled || isUploading}
          className="hidden"
          id="cloudinary-upload-input"
        />
        <label
          htmlFor="cloudinary-upload-input"
          className="block cursor-pointer"
        >
          {children || (
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                {isUploading
                  ? `Uploading... ${Math.round(progress)}%`
                  : 'Drag & drop files here or click to select'}
              </p>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </label>

        {error && (
          <div className="mt-2 text-red-600 text-sm">
            Error: {error.message}
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {previewUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

