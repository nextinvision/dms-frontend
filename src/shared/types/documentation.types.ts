/**
 * Shared type definitions for documentation files (Cloudinary)
 * This is the single source of truth for DocumentationFiles interface
 */

export interface DocumentationFiles {
  urls: string[]; // Cloudinary secure URLs
  publicIds: string[]; // Cloudinary public IDs for management
  fileMetadata?: any[]; // FileMetadata objects from the database
  metadata?: Array<{
    publicId: string;
    url: string;
    filename: string;
    format: string;
    bytes: number;
    uploadedAt: string;
    fileId: string; // Database ID for deletion
  }>;
}

export const INITIAL_DOCUMENTATION_FILES: DocumentationFiles = {
  urls: [],
  publicIds: [],
  metadata: [],
};

