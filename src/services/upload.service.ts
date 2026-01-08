import { getApiUrl } from '@/config/api.config';

export interface UploadOptions {
  folder?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  version: number;
  width: number;
  height: number;
  format: string;
  createdAt: string;
  bytes: number;
  secureUrl: string;
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function uploadFile(
  file: File,
  options: UploadOptions = {},
  onProgress?: (progress: number) => void,
): Promise<UploadResult> {
  const url = getApiUrl('/files/upload');

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        if (onProgress) {
          onProgress(percentComplete);
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new UploadError('Failed to parse server response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new UploadError(error.message || 'File upload failed'));
        } catch (e) {
          reject(new UploadError('File upload failed'));
        }
      }
    };

    xhr.onerror = () => {
      reject(new UploadError('Network error occurred during file upload'));
    };

    const formData = new FormData();
    formData.append('file', file);
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    xhr.send(formData);
  });
}

export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {},
  onProgress?: (progress: number) => void,
): Promise<UploadResult[]> {
  const promises = files.map((file) => uploadFile(file, options, onProgress));
  return Promise.all(promises);
}
