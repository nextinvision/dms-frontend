import { useState, useCallback } from 'react';
import {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
} from '@/services/cloudinary/cloudinary.service';
import {
  CloudinaryUploadOptions,
  CloudinaryUploadResult,
} from '@/services/cloudinary/types';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

interface FileUploadProgress {
  fileIndex: number;
  progress: number;
}

export function useCloudinaryUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const [multiFileProgress, setMultiFileProgress] = useState<
    Map<number, number>
  >(new Map());

  const uploadFile = useCallback(
    async (
      file: File,
      folder: string,
      options?: Omit<CloudinaryUploadOptions, 'folder'>
    ): Promise<CloudinaryUploadResult> => {
      setState({
        isUploading: true,
        progress: 0,
        error: null,
      });

      try {
        const result = await uploadToCloudinary(
          file,
          { folder, ...options },
          (progress) => {
            setState((prev) => ({
              ...prev,
              progress,
            }));
          }
        );

        setState({
          isUploading: false,
          progress: 100,
          error: null,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
        setState({
          isUploading: false,
          progress: 0,
          error: err,
        });
        throw err;
      }
    },
    []
  );

  const uploadMultiple = useCallback(
    async (
      files: File[],
      folder: string,
      options?: Omit<CloudinaryUploadOptions, 'folder'>
    ): Promise<CloudinaryUploadResult[]> => {
      setState({
        isUploading: true,
        progress: 0,
        error: null,
      });

      setMultiFileProgress(new Map());

      try {
        const results = await uploadMultipleToCloudinary(
          files,
          folder,
          options,
          (fileIndex, progress) => {
            setMultiFileProgress((prev) => {
              const next = new Map(prev);
              next.set(fileIndex, progress);
              
              // Calculate overall progress
              const progressValues = Array.from(next.values()) as number[];
              const totalProgress =
                progressValues.reduce((sum: number, p: number) => sum + p, 0) /
                files.length;
              setState((prevState) => ({
                ...prevState,
                progress: totalProgress,
              }));
              
              return next;
            });
          }
        );

        setState({
          isUploading: false,
          progress: 100,
          error: null,
        });

        setMultiFileProgress(new Map());

        return results;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
        setState({
          isUploading: false,
          progress: 0,
          error: err,
        });
        setMultiFileProgress(new Map());
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
    });
    setMultiFileProgress(new Map());
  }, []);

  return {
    uploadFile,
    uploadMultiple,
    isUploading: state.isUploading,
    progress: state.progress,
    multiFileProgress: Array.from(multiFileProgress.entries()).map(
      ([fileIndex, progress]) => ({ fileIndex, progress })
    ),
    error: state.error,
    reset,
  };
}

