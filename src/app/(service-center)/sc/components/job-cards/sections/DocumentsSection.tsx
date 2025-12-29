import React, { useCallback } from 'react';
import { Camera, FileText, ImageIcon, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { CreateJobCardForm } from "@/features/job-cards/types/job-card.types";
import { useCloudinaryUploadWithMetadata } from "@/shared/hooks/useCloudinaryUploadWithMetadata";
import { FileCategory, RelatedEntityType } from "@/services/files/types";
import { DocumentationFiles } from "@/shared/types/documentation.types";

interface DocumentsSectionProps {
    form: CreateJobCardForm;
    updateField: <K extends keyof CreateJobCardForm>(field: K, value: CreateJobCardForm[K]) => void;
    jobCardId?: string;
    userId?: string;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
    form,
    updateField,
    jobCardId,
    userId,
}) => {
    const { uploadMultipleWithMetadata } = useCloudinaryUploadWithMetadata();

    // Mapping form fields to File Categories
    const getCategoryForField = (field: keyof CreateJobCardForm): FileCategory => {
        switch (field) {
            case 'customerIdProof': return FileCategory.CUSTOMER_ID_PROOF;
            case 'vehicleRCCopy': return FileCategory.VEHICLE_RC;
            case 'warrantyCardServiceBook': return FileCategory.WARRANTY_CARD;
            case 'photosVideos': return FileCategory.PHOTOS_VIDEOS;
            default: return FileCategory.PHOTOS_VIDEOS;
        }
    };

    const handleDocumentUpload = async (field: keyof CreateJobCardForm, fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const files = Array.from(fileList);
        // Use the passed jobCardId (could be temp ID or real ID)
        const entityId = jobCardId || `TEMP_JC_${Date.now()}`;
        const category = getCategoryForField(field);

        try {
            console.log(`📤 Uploading ${files.length} files for ${field} with entityId: ${entityId}`);
            const result = await uploadMultipleWithMetadata(files, {
                folder: 'job-cards',
                category,
                entityId,
                entityType: RelatedEntityType.JOB_CARD,
                uploadedBy: userId,
            });

            if (result) {
                // Map FileMetadata[] to DocumentationFiles
                const newMetadata = result.map(f => ({
                    url: f.url,
                    publicId: f.publicId,
                    filename: f.filename,
                    fileId: f.id || "",
                    id: f.id,
                    secureUrl: f.url,
                    resourceType: f.format && ['jpg', 'jpeg', 'png', 'webp'].includes(f.format) ? 'image' : 'raw',
                    format: f.format,
                    bytes: f.bytes,
                    width: f.width,
                    height: f.height,
                    duration: f.duration,
                    uploadedAt: new Date().toISOString(),
                }));

                const newUrls = result.map(f => f.url);
                const newPublicIds = result.map(f => f.publicId);

                // Merge with existing
                const currentDoc = form[field] as DocumentationFiles || { urls: [], publicIds: [], metadata: [] };

                const newDoc: DocumentationFiles = {
                    urls: [...(currentDoc.urls || []), ...newUrls],
                    publicIds: [...(currentDoc.publicIds || []), ...newPublicIds],
                    metadata: [...(currentDoc.metadata || []), ...newMetadata],
                };

                updateField(field, newDoc);
                console.log(`✅ Successfully uploaded and saved files for ${field}`);
            }
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const handleRemoveDocument = async (field: keyof CreateJobCardForm, index: number) => {
        const currentDoc = form[field] as DocumentationFiles;
        if (!currentDoc) return;

        const metadata = currentDoc.metadata?.[index];
        const fileId = metadata?.fileId || (metadata as any)?.id;

        // Optimistic update
        const newDoc: DocumentationFiles = {
            urls: currentDoc.urls.filter((_, i) => i !== index),
            publicIds: currentDoc.publicIds.filter((_, i) => i !== index),
            metadata: currentDoc.metadata?.filter((_, i) => i !== index) || [],
        };
        updateField(field, newDoc);

        // Delete from backend if we have a file ID
        if (fileId) {
            try {
                const { deleteFile } = await import("@/services/cloudinary/fileMetadata.service");
                await deleteFile(fileId);
                console.log(`✅ Successfully deleted file: ${fileId}`);
            } catch (error) {
                console.error('Failed to delete file from backend:', error);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="text-blue-600" size={24} />
                Documents & Images
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Proof */}
                <UploadBox
                    label="Customer ID Proof (Aadhar/PAN/License)"
                    accept=".pdf,.jpg,.jpeg,.png"
                    files={form.customerIdProof}
                    onUpload={(files) => handleDocumentUpload('customerIdProof', files)}
                    onRemove={(idx) => handleRemoveDocument('customerIdProof', idx)}
                />

                {/* RC Copy */}
                <UploadBox
                    label="Vehicle RC Copy"
                    accept=".pdf,.jpg,.jpeg,.png"
                    files={form.vehicleRCCopy}
                    onUpload={(files) => handleDocumentUpload('vehicleRCCopy', files)}
                    onRemove={(idx) => handleRemoveDocument('vehicleRCCopy', idx)}
                />

                {/* Warranty/Service Book */}
                <UploadBox
                    label="Warranty Card / Service Book"
                    accept=".pdf,.jpg,.jpeg,.png"
                    files={form.warrantyCardServiceBook}
                    onUpload={(files) => handleDocumentUpload('warrantyCardServiceBook', files)}
                    onRemove={(idx) => handleRemoveDocument('warrantyCardServiceBook', idx)}
                />

                {/* Photos/Videos */}
                <UploadBox
                    label="Photos/Videos of Vehicle"
                    accept=".jpg,.jpeg,.png,.mp4,.mov"
                    files={form.photosVideos}
                    onUpload={(files) => handleDocumentUpload('photosVideos', files)}
                    onRemove={(idx) => handleRemoveDocument('photosVideos', idx)}
                    isMedia
                />
            </div>
        </div>
    );
};

interface UploadBoxProps {
    label: string;
    accept: string;
    files?: DocumentationFiles;
    onUpload: (files: FileList | null) => void;
    onRemove: (index: number) => void;
    isMedia?: boolean;
}

const UploadBox: React.FC<UploadBoxProps> = ({ label, accept, files, onUpload, onRemove, isMedia }) => (
    <div className="bg-white rounded-lg p-4 border border-indigo-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
            {label}
        </label>
        <div className="space-y-3">
            <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center h-32 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="text-indigo-600" size={24} />
                        <span className="text-sm text-gray-600 font-medium">Click to upload</span>
                        <span className="text-xs text-gray-500">{accept.replace(/\./g, ' ').toUpperCase()}</span>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept={accept}
                        multiple
                        onChange={(e) => onUpload(e.target.files)}
                    />
                </label>
            </div>
            {files?.urls && files.urls.length > 0 && (
                <div className={isMedia ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                    {files.urls.map((url, index) => {
                        const metadata = files.metadata?.[index];
                        const isImg = metadata?.format && ['jpg', 'jpeg', 'png', 'webp'].includes(metadata.format.toLowerCase());

                        // Simple logic: if isMedia & image, show thumb. Else list.
                        if (isMedia && isImg) {
                            return (
                                <div key={index} className="relative group bg-gray-50 rounded border overflow-hidden h-24">
                                    <Image
                                        src={url}
                                        alt="Preview"
                                        width={100}
                                        height={100}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                    <button onClick={() => onRemove(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )
                        }

                        return (
                            <div key={index} className="flex items-center gap-3 bg-gray-50 p-2 rounded border">
                                <FileText className="text-indigo-600 shrink-0" size={16} />
                                <span className="text-xs truncate flex-1">{metadata?.filename || "File"}</span>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600"><ImageIcon size={14} /></a>
                                <button type="button" onClick={() => onRemove(index)} className="text-red-600"><Trash2 size={14} /></button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
);
