import { useState, useCallback } from 'react';
import {
  uploadFile,
  uploadMultipleFiles,
  UploadOptions,
  UploadResult,
  UploadError,
} from '@/services/upload.service';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File,
      options: UploadOptions = {},
    ): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const result = await uploadFile(file, options, setProgress);
        setIsUploading(false);
        return result;
      } catch (e) {
        const error = e as UploadError;
        setError(error.message);
        setIsUploading(false);
        return null;
      }
    },
    [],
  );

  const uploadMultiple = useCallback(
    async (
      files: File[],
      options: UploadOptions = {},
    ): Promise<UploadResult[] | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const results = await uploadMultipleFiles(files, options, setProgress);
        setIsUploading(false);
        return results;
      } catch (e) {
        const error = e as UploadError;
        setError(error.message);
        setIsUploading(false);
        return null;
      }
    },
    [],
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
  };
}
