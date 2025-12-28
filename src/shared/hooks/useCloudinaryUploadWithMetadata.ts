import { useState, useCallback } from 'react';
import {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    uploadWithRetry,
} from '@/services/cloudinary/cloudinary.service';
import {
    CloudinaryUploadOptions,
    CloudinaryUploadResult,
} from '@/services/cloudinary/types';
import {
    saveFileMetadata,
    saveMultipleFileMetadata,
    FileCategory,
    RelatedEntityType,
    FileMetadata,
} from '@/services/cloudinary/fileMetadata.service';

interface UploadState {
    isUploading: boolean;
    progress: number;
    error: Error | null;
}

export interface UploadFileWithMetadataOptions {
    folder: string;
    category: FileCategory;
    entityId: string;
    entityType: RelatedEntityType;
    uploadedBy?: string;
    cloudinaryOptions?: Omit<CloudinaryUploadOptions, 'folder'>;
}

export function useCloudinaryUploadWithMetadata() {
    const [state, setState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
    });

    const [multiFileProgress, setMultiFileProgress] = useState<
        Map<number, number>
    >(new Map());

    /**
     * Upload a single file and save metadata to database
     */
    const uploadFileWithMetadata = useCallback(
        async (
            file: File,
            options: UploadFileWithMetadataOptions
        ): Promise<FileMetadata> => {
            setState({
                isUploading: true,
                progress: 0,
                error: null,
            });

            try {
                // 1. Upload to Cloudinary with retry logic
                const uploadResult = await uploadWithRetry(
                    file,
                    options.folder,
                    options.cloudinaryOptions || {},
                    3,
                    (progress) => {
                        setState((prev) => ({
                            ...prev,
                            progress,
                        }));
                    }
                );

                // 2. Save metadata to database
                const fileMetadata = await saveFileMetadata(
                    uploadResult,
                    file,
                    {
                        category: options.category,
                        relatedEntityId: options.entityId,
                        relatedEntityType: options.entityType,
                        uploadedBy: options.uploadedBy,
                    }
                );

                setState({
                    isUploading: false,
                    progress: 100,
                    error: null,
                });

                return fileMetadata;
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

    /**
     * Upload multiple files and save metadata to database
     */
    const uploadMultipleWithMetadata = useCallback(
        async (
            files: File[],
            options: UploadFileWithMetadataOptions
        ): Promise<FileMetadata[]> => {
            setState({
                isUploading: true,
                progress: 0,
                error: null,
            });

            setMultiFileProgress(new Map());

            try {
                // 1. Upload to Cloudinary with retry logic
                const uploadResults = await uploadMultipleToCloudinary(
                    files,
                    options.folder,
                    options.cloudinaryOptions || {},
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

                // 2. Save metadata to database
                const fileMetadataList = await saveMultipleFileMetadata(
                    uploadResults,
                    files,
                    {
                        category: options.category,
                        relatedEntityId: options.entityId,
                        relatedEntityType: options.entityType,
                        uploadedBy: options.uploadedBy,
                    }
                );

                setState({
                    isUploading: false,
                    progress: 100,
                    error: null,
                });

                setMultiFileProgress(new Map());

                return fileMetadataList;
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
        uploadFileWithMetadata,
        uploadMultipleWithMetadata,
        isUploading: state.isUploading,
        progress: state.progress,
        multiFileProgress: Array.from(multiFileProgress.entries()).map(
            ([fileIndex, progress]) => ({ fileIndex, progress })
        ),
        error: state.error,
        reset,
    };
}
