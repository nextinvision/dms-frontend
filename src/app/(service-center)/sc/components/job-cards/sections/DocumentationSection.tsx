import React, { useCallback } from 'react';
import { Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { CreateJobCardForm } from "@/features/job-cards/types/job-card.types";
import { FileCategory } from "@/services/files/types";
import { FileUpload } from '@/components/ui/FileUpload';

interface DocumentationSectionProps {
    form: CreateJobCardForm;
    updateField: <K extends keyof CreateJobCardForm>(field: K, value: CreateJobCardForm[K]) => void;
    jobCardId?: string;
    userId?: string;
}

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
    form,
    updateField,
    jobCardId: propJobCardId,
    userId,
}) => {
    const jobCardId = propJobCardId || form.vehicleId || "temp";

    const handleUploadSuccess = useCallback((field: keyof CreateJobCardForm, fileData: any) => {
        const currentData = form[field] as any || { urls: [], publicIds: [], metadata: [] };

        // Ensure arrays exist
        const urls = currentData.urls || [];
        const publicIds = currentData.publicIds || [];
        const metadata = currentData.metadata || [];

        updateField(field, {
            ...currentData,
            urls: [...urls, fileData.url],
            publicIds: [...publicIds, fileData.publicId],
            metadata: [...metadata, {
                publicId: fileData.publicId,
                url: fileData.url,
                format: fileData.format,
                bytes: fileData.bytes,
                uploadedAt: fileData.createdAt || new Date().toISOString(),
            }]
        });
    }, [form, updateField]);

    return (
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2A</span>
                Warranty/Insurance Case Details
            </h3>

            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Evidence Upload</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Video Evidence */}
                    <div>
                        <FileUpload
                            label="Video Evidence"
                            accept="video/*"
                            entityId={jobCardId}
                            entityType="job_card"
                            category={FileCategory.WARRANTY_VIDEO}
                            onSuccess={(file: any) => handleUploadSuccess('videoEvidence', file)}
                        />
                        {form.videoEvidence?.urls?.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {form.videoEvidence.urls.map((url: string, index: number) => {
                                    const metadata = form.videoEvidence?.metadata?.[index];
                                    return (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <Video className="text-amber-600 shrink-0" size={18} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {metadata?.format ? `Video.${metadata.format}` : "Uploaded Video"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {metadata?.bytes ? (metadata.bytes / 1024).toFixed(2) : "0.00"} KB
                                                </p>
                                            </div>
                                            <a
                                                href={metadata?.url || url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition"
                                                title="View file"
                                            >
                                                <ImageIcon size={16} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    // Logic to remove file would go here if implemented in parent or pass down handler
                                                    const newUrls = [...form.videoEvidence.urls];
                                                    newUrls.splice(index, 1);
                                                    const newPublicIds = [...(form.videoEvidence.publicIds || [])];
                                                    if (newPublicIds.length > index) newPublicIds.splice(index, 1);
                                                    const newMetadata = [...(form.videoEvidence.metadata || [])];
                                                    if (newMetadata.length > index) newMetadata.splice(index, 1);

                                                    updateField('videoEvidence', {
                                                        ...form.videoEvidence,
                                                        urls: newUrls,
                                                        publicIds: newPublicIds,
                                                        metadata: newMetadata
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700 p-1 rounded transition"
                                                title="Remove file"
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* VIN Image */}
                    <div>
                        <FileUpload
                            label="VIN Image"
                            accept="image/*"
                            entityId={jobCardId}
                            entityType="job_card"
                            category={FileCategory.WARRANTY_VIN}
                            onSuccess={(file: any) => handleUploadSuccess('vinImage', file)}
                        />
                        {form.vinImage?.urls?.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {form.vinImage.urls.map((url: string, index: number) => {
                                    const metadata = form.vinImage?.metadata?.[index];
                                    return (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <ImageIcon className="text-amber-600 shrink-0" size={18} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {metadata?.format ? `Image.${metadata.format}` : "Uploaded Image"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {metadata?.bytes ? (metadata.bytes / 1024).toFixed(2) : "0.00"} KB
                                                </p>
                                            </div>
                                            <a
                                                href={metadata?.url || url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition"
                                                title="View file"
                                            >
                                                <ImageIcon size={16} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    const newUrls = [...form.vinImage.urls];
                                                    newUrls.splice(index, 1);
                                                    const newPublicIds = [...(form.vinImage.publicIds || [])];
                                                    if (newPublicIds.length > index) newPublicIds.splice(index, 1);
                                                    const newMetadata = [...(form.vinImage.metadata || [])];
                                                    if (newMetadata.length > index) newMetadata.splice(index, 1);

                                                    updateField('vinImage', {
                                                        ...form.vinImage,
                                                        urls: newUrls,
                                                        publicIds: newPublicIds,
                                                        metadata: newMetadata
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700 p-1 rounded transition"
                                                title="Remove file"
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ODO Meter Image */}
                    <div>
                        <FileUpload
                            label="ODO Meter Image"
                            accept="image/*"
                            entityId={jobCardId}
                            entityType="job_card"
                            category={FileCategory.WARRANTY_ODO}
                            onSuccess={(file: any) => handleUploadSuccess('odoImage', file)}
                        />
                        {form.odoImage?.urls?.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {form.odoImage.urls.map((url: string, index: number) => {
                                    const metadata = form.odoImage?.metadata?.[index];
                                    return (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <ImageIcon className="text-amber-600 shrink-0" size={18} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {metadata?.format ? `Image.${metadata.format}` : "Uploaded Image"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {metadata?.bytes ? (metadata.bytes / 1024).toFixed(2) : "0.00"} KB
                                                </p>
                                            </div>
                                            <a
                                                href={metadata?.url || url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition"
                                                title="View file"
                                            >
                                                <ImageIcon size={16} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    const newUrls = [...form.odoImage.urls];
                                                    newUrls.splice(index, 1);
                                                    const newPublicIds = [...(form.odoImage.publicIds || [])];
                                                    if (newPublicIds.length > index) newPublicIds.splice(index, 1);
                                                    const newMetadata = [...(form.odoImage.metadata || [])];
                                                    if (newMetadata.length > index) newMetadata.splice(index, 1);

                                                    updateField('odoImage', {
                                                        ...form.odoImage,
                                                        urls: newUrls,
                                                        publicIds: newPublicIds,
                                                        metadata: newMetadata
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700 p-1 rounded transition"
                                                title="Remove file"
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Damage Images */}
                    <div>
                        <FileUpload
                            label="Damage Images"
                            accept="image/*"
                            entityId={jobCardId}
                            entityType="job_card"
                            category={FileCategory.WARRANTY_DAMAGE}
                            onSuccess={(file: any) => handleUploadSuccess('damageImages', file)}
                        />
                        {form.damageImages?.urls?.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {form.damageImages.urls.map((url: string, index: number) => {
                                    const metadata = form.damageImages?.metadata?.[index];
                                    return (
                                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <ImageIcon className="text-amber-600 shrink-0" size={18} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {metadata?.format ? `Image.${metadata.format}` : "Uploaded Image"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {metadata?.bytes ? (metadata.bytes / 1024).toFixed(2) : "0.00"} KB
                                                </p>
                                            </div>
                                            <a
                                                href={metadata?.url || url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 p-1 rounded transition"
                                                title="View file"
                                            >
                                                <ImageIcon size={16} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    const newUrls = [...form.damageImages.urls];
                                                    newUrls.splice(index, 1);
                                                    const newPublicIds = [...(form.damageImages.publicIds || [])];
                                                    if (newPublicIds.length > index) newPublicIds.splice(index, 1);
                                                    const newMetadata = [...(form.damageImages.metadata || [])];
                                                    if (newMetadata.length > index) newMetadata.splice(index, 1);

                                                    updateField('damageImages', {
                                                        ...form.damageImages,
                                                        urls: newUrls,
                                                        publicIds: newPublicIds,
                                                        metadata: newMetadata
                                                    });
                                                }}
                                                className="text-red-600 hover:text-red-700 p-1 rounded transition"
                                                title="Remove file"
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-amber-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Case Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                        <textarea
                            value={form.issueDescription}
                            onChange={(e) => updateField('issueDescription', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            rows={3}
                            placeholder="Describe the issue in detail"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Observations</label>
                        <input
                            type="text"
                            value={form.numberOfObservations}
                            onChange={(e) => updateField('numberOfObservations', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Defect Part</label>
                        <input
                            type="text"
                            value={form.defectPart}
                            onChange={(e) => updateField('defectPart', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Symptom</label>
                        <textarea
                            value={form.symptom}
                            onChange={(e) => updateField('symptom', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            rows={3}
                            placeholder="Describe the symptoms observed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
