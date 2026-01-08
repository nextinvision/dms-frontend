import { useState } from 'react';
import { useUpload } from '@/shared/hooks/useUpload';
import { UploadResult } from '@/services/upload.service';

interface UploaderProps {
  onUploadComplete: (results: UploadResult[]) => void;
  multiple?: boolean;
  folder?: string;
}

export function Uploader({
  onUploadComplete,
  multiple = false,
  folder,
}: UploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { upload, uploadMultiple, isUploading, progress, error } = useUpload();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      return;
    }

    let results: UploadResult[] | null = null;
    if (multiple) {
      results = await uploadMultiple(files, { folder });
    } else {
      const result = await upload(files[0], { folder });
      if (result) {
        results = [result];
      }
    }

    if (results) {
      onUploadComplete(results);
      setFiles([]);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple={multiple}
        onChange={handleFileChange}
        id="file-upload-input"
        className="hidden"
      />
      <label
        htmlFor="file-upload-input"
        className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Select Files
      </label>

      {files.length > 0 && (
        <div className="mt-4">
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {isUploading && (
        <div className="mt-2 w-full rounded-full bg-gray-200">
          <div
            className="rounded-full bg-indigo-600 p-0.5 text-center text-xs font-medium leading-none text-white"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
