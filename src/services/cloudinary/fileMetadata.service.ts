import { apiClient } from '@/core/api';
import { API_ENDPOINTS } from '@/config/api.config';
import { CloudinaryUploadResult } from './types';

export enum FileCategory {
    CUSTOMER_ID_PROOF = 'customer_id_proof',
    VEHICLE_RC = 'vehicle_rc',
    WARRANTY_CARD = 'warranty_card',
    PHOTOS_VIDEOS = 'photos_videos',
    WARRANTY_VIDEO = 'warranty_video',
    WARRANTY_VIN = 'warranty_vin',
    WARRANTY_ODO = 'warranty_odo',
    WARRANTY_DAMAGE = 'warranty_damage',
    VEHICLE_CONDITION = 'vehicle_condition',
    VEHICLE_PHOTOS = 'vehicle_photos',
}

export enum RelatedEntityType {
    APPOINTMENT = 'appointment',
    JOB_CARD = 'job_card',
    VEHICLE = 'vehicle',
    CUSTOMER = 'customer',
}

export interface FileMetadata {
    id?: string; // DB record ID (returned after save)
    url: string;
    publicId: string;
    filename: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    category: FileCategory;
    relatedEntityId: string;
    relatedEntityType: RelatedEntityType;
    uploadedBy?: string;
    metadata?: Record<string, any>;
}

export interface SaveFileMetadataRequest {
    url: string;
    publicId: string;
    filename: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    category: FileCategory;
    relatedEntityId: string;
    relatedEntityType: RelatedEntityType;
    uploadedBy?: string;
    metadata?: Record<string, any>;
}

/**
 * Generate a temporary entity ID for files uploaded before entity creation
 */
export function generateTempEntityId(): string {
    return `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an entity ID is temporary
 */
export function isTempEntityId(entityId: string): boolean {
    return entityId.startsWith('TEMP_');
}

/**
 * Save file metadata to backend
 */
export async function saveFileMetadata(
    uploadResult: CloudinaryUploadResult,
    originalFile: File,
    metadata: {
        category: FileCategory;
        relatedEntityId: string;
        relatedEntityType: RelatedEntityType;
        uploadedBy?: string;
    }
): Promise<FileMetadata> {
    const payload: SaveFileMetadataRequest = {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        filename: originalFile.name,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        category: metadata.category,
        relatedEntityId: metadata.relatedEntityId,
        relatedEntityType: metadata.relatedEntityType,
        uploadedBy: metadata.uploadedBy,
        metadata: {
            originalName: originalFile.name,
            uploadedAt: new Date().toISOString(),
            cloudinaryVersion: uploadResult.version,
            resourceType: uploadResult.resourceType,
        },
    };

    const response = await apiClient.post<FileMetadata>(API_ENDPOINTS.FILES, payload);
    return response.data;
}

/**
 * Save multiple file metadata records
 */
export async function saveMultipleFileMetadata(
    uploadResults: CloudinaryUploadResult[],
    originalFiles: File[],
    metadata: {
        category: FileCategory;
        relatedEntityId: string;
        relatedEntityType: RelatedEntityType;
        uploadedBy?: string;
    }
): Promise<FileMetadata[]> {
    const payloads: SaveFileMetadataRequest[] = uploadResults.map((result, index) => ({
        url: result.secureUrl,
        publicId: result.publicId,
        filename: originalFiles[index]?.name || `file_${index}`,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        category: metadata.category,
        relatedEntityId: metadata.relatedEntityId,
        relatedEntityType: metadata.relatedEntityType,
        uploadedBy: metadata.uploadedBy,
        metadata: {
            originalName: originalFiles[index]?.name,
            uploadedAt: new Date().toISOString(),
            cloudinaryVersion: result.version,
            resourceType: result.resourceType,
        },
    }));

    const response = await apiClient.post<FileMetadata[]>(`${API_ENDPOINTS.FILES}/bulk`, payloads);
    return response.data;
}

/**
 * Update entity association for temporary file records
 */
export async function updateFileEntityAssociation(
    tempEntityId: string,
    actualEntityId: string,
    entityType: RelatedEntityType
): Promise<void> {
    await apiClient.patch(`${API_ENDPOINTS.FILES}/update-entity`, {
        tempEntityId,
        actualEntityId,
        entityType,
    });
}

/**
 * Get files for an entity
 */
export async function getFilesByEntity(
    entityType: RelatedEntityType,
    entityId: string,
    category?: FileCategory
): Promise<FileMetadata[]> {
    const params: Record<string, string> = {
        entityType,
        entityId,
    };

    if (category) {
        params.category = category;
    }

    const response = await apiClient.get<FileMetadata[]>(API_ENDPOINTS.FILES, { params });
    return response.data;
}

/**
 * Delete a file by its database ID
 */
export async function deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.FILES}/${fileId}`);
}

/**
 * Delete multiple files by their database IDs
 */
export async function deleteMultipleFiles(fileIds: string[]): Promise<void> {
    await Promise.all(fileIds.map(id => deleteFile(id)));
}

/**
 * Delete all files for an entity
 */
export async function deleteFilesByEntity(
    entityType: RelatedEntityType,
    entityId: string
): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.FILES}/entity/${entityType}/${entityId}`);
}
