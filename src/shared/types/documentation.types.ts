/**
 * Shared type definitions for documentation files (Cloudinary)
 * This is the single source of truth for DocumentationFiles interface
 */

export interface DocumentationFiles {
  urls: string[]; // Cloudinary secure URLs
  publicIds: string[]; // Cloudinary public IDs for management
  metadata?: Array<{
    publicId: string;
    url: string;
    format: string;
    bytes: number;
    uploadedAt: string;
  }>;
}

export const INITIAL_DOCUMENTATION_FILES: DocumentationFiles = {
  urls: [],
  publicIds: [],
  metadata: [],
};

