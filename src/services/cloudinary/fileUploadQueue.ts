import { CloudinaryUploadResult } from './types';
import { FileCategory, RelatedEntityType } from './fileMetadata.service';

/**
 * Queued file for upload
 */
export interface QueuedFile {
    file: File;
    category: FileCategory;
    uploadResult?: CloudinaryUploadResult;
    dbRecordId?: string;
    error?: Error;
    progress?: number;
}

/**
 * Upload queue metadata
 */
export interface UploadQueue {
    id: string;
    files: QueuedFile[];
    entityType: RelatedEntityType;
    tempEntityId: string;
    uploadedBy?: string;
    createdAt: number;
}

/**
 * File upload queue manager
 * Manages file uploads and their association with entities
 */
export class FileUploadQueueManager {
    private queues: Map<string, UploadQueue> = new Map();
    private readonly STORAGE_KEY = 'dms_file_upload_queues';

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Create a new upload queue
     */
    createQueue(
        files: File[],
        entityType: RelatedEntityType,
        tempEntityId: string,
        category: FileCategory,
        uploadedBy?: string
    ): string {
        const queueId = this.generateQueueId();

        const queue: UploadQueue = {
            id: queueId,
            files: files.map(file => ({
                file,
                category,
            })),
            entityType,
            tempEntityId,
            uploadedBy,
            createdAt: Date.now(),
        };

        this.queues.set(queueId, queue);
        this.saveToStorage();

        return queueId;
    }

    /**
     * Get a queue by ID
     */
    getQueue(queueId: string): UploadQueue | undefined {
        return this.queues.get(queueId);
    }

    /**
     * Update file upload result in queue
     */
    updateFileResult(
        queueId: string,
        fileIndex: number,
        uploadResult: CloudinaryUploadResult,
        dbRecordId?: string
    ): void {
        const queue = this.queues.get(queueId);
        if (!queue || !queue.files[fileIndex]) return;

        queue.files[fileIndex].uploadResult = uploadResult;
        queue.files[fileIndex].dbRecordId = dbRecordId;

        this.saveToStorage();
    }

    /**
     * Update file progress
     */
    updateFileProgress(queueId: string, fileIndex: number, progress: number): void {
        const queue = this.queues.get(queueId);
        if (!queue || !queue.files[fileIndex]) return;

        queue.files[fileIndex].progress = progress;
        // Don't save to storage for progress updates (too frequent)
    }

    /**
     * Update file error
     */
    updateFileError(queueId: string, fileIndex: number, error: Error): void {
        const queue = this.queues.get(queueId);
        if (!queue || !queue.files[fileIndex]) return;

        queue.files[fileIndex].error = error;
        this.saveToStorage();
    }

    /**
     * Get all successfully uploaded files from a queue
     */
    getUploadedFiles(queueId: string): QueuedFile[] {
        const queue = this.queues.get(queueId);
        if (!queue) return [];

        return queue.files.filter(f => f.uploadResult && f.dbRecordId);
    }

    /**
     * Get all file database IDs from a queue
     */
    getFileDbIds(queueId: string): string[] {
        const uploaded = this.getUploadedFiles(queueId);
        return uploaded.map(f => f.dbRecordId!).filter(Boolean);
    }

    /**
     * Check if all files in a queue are uploaded
     */
    isQueueComplete(queueId: string): boolean {
        const queue = this.queues.get(queueId);
        if (!queue) return false;

        return queue.files.every(f => f.uploadResult && f.dbRecordId);
    }

    /**
     * Delete a queue
     */
    deleteQueue(queueId: string): void {
        this.queues.delete(queueId);
        this.saveToStorage();
    }

    /**
     * Get queues for a temp entity ID
     */
    getQueuesByTempEntity(tempEntityId: string): UploadQueue[] {
        return Array.from(this.queues.values()).filter(
            q => q.tempEntityId === tempEntityId
        );
    }

    /**
     * Clean up old queues (older than 24 hours)
     */
    cleanupOldQueues(): void {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        for (const [id, queue] of this.queues.entries()) {
            if (queue.createdAt < oneDayAgo) {
                this.queues.delete(id);
            }
        }

        this.saveToStorage();
    }

    /**
     * Generate a unique queue ID
     */
    private generateQueueId(): string {
        return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save queues to localStorage
     * Note: File objects cannot be serialized, so we only save metadata
     */
    private saveToStorage(): void {
        try {
            const serializable = Array.from(this.queues.entries()).map(([id, queue]) => ({
                id,
                entityType: queue.entityType,
                tempEntityId: queue.tempEntityId,
                uploadedBy: queue.uploadedBy,
                createdAt: queue.createdAt,
                files: queue.files.map(f => ({
                    fileName: f.file.name,
                    fileSize: f.file.size,
                    category: f.category,
                    uploadResult: f.uploadResult,
                    dbRecordId: f.dbRecordId,
                    error: f.error ? { message: f.error.message } : undefined,
                })),
            }));

            if (typeof window !== 'undefined') {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
            }
        } catch (error) {
            console.warn('Failed to save upload queues to storage:', error);
        }
    }

    /**
     * Load queues from localStorage
     * Note: This only loads metadata, not actual File objects
     */
    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return;

            const data = JSON.parse(saved);
            // We can only restore metadata, not File objects
            // This is mainly for tracking completed uploads

            // Clear old data on load
            this.cleanupOldQueues();
        } catch (error) {
            console.warn('Failed to load upload queues from storage:', error);
        }
    }
}

// Export a singleton instance
export const fileUploadQueue = new FileUploadQueueManager();
