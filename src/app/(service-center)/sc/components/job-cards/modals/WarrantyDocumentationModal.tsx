"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Upload, Video, Image as ImageIcon, FileText, Trash2, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for local files
import { localStorage as safeStorage } from "@/shared/lib/localStorage";

// Define FileCategory enum as it was previously part of cloudinary context
export enum FileCategory {
  CUSTOMER_ID_PROOF = "customer_id_proof",
  VEHICLE_RC = "vehicle_rc",
  WARRANTY_CARD = "warranty_card",
  VEHICLE_PHOTOS = "vehicle_photos",
  JOB_CARD_WARRANTY = "job_card_warranty",
  WARRANTY_VIDEO = "warranty_video",
  WARRANTY_VIN = "warranty_vin",
  WARRANTY_ODO = "warranty_odo",
  WARRANTY_DAMAGE = "warranty_damage",
  VEHICLE_CONDITION = "vehicle_condition",
  PHOTOS_VIDEOS = "photos_videos", // General category for photos/videos
  APPOINTMENT_DOCS = "appointment_docs", // General category for various appointment documents
}

// Type for document metadata stored in form
interface DocumentMetadata {
  publicId: string; // This will now be a local identifier, not Cloudinary publicId
  url: string; // This will be a local blob URL or identifier, not Cloudinary URL
  filename: string;
  format: string;
  bytes: number;
  uploadedAt: string;
  fileId?: string; // Database ID for deletion (optional string from FileMetadata)
  fileObject?: File; // New field to store the actual File object
}

interface WarrantyDocumentationData {
    videoEvidence: string[];
    vinImage: string[];
    odoImage: string[];
    damageImages: string[];
    issueDescription: string;
    numberOfObservations: string;
    symptom: string;
    defectPart: string;
    // Store full metadata for persistence tracking
    fileMetadata?: Record<string, DocumentMetadata[]>;
}

interface WarrantyDocumentationModalProps {
    open: boolean;
    onClose: () => void;
    itemDescription: string;
    initialData?: WarrantyDocumentationData;
    onSave: (data: WarrantyDocumentationData, pendingFiles: Record<string, { file: File; category: FileCategory; metadata: DocumentMetadata }[]>) => void;
    mode?: "upload" | "view";
    jobCardId?: string; // For folder organization
    itemIndex?: number; // For folder organization
    userId?: string; // User ID for file metadata
    customerId?: string;
    vehicleId?: string;
}

export default function WarrantyDocumentationModal({
    open,
    onClose,
    itemDescription,
    initialData,
    onSave,
    mode = "upload",
    jobCardId = "temp",
    itemIndex = 0,
    userId,
    customerId,
    vehicleId,
}: WarrantyDocumentationModalProps) {
    // State to hold files that are pending upload to the backend
    const [pendingUploads, setPendingUploads] = useState<Record<string, { file: File; category: FileCategory; metadata: DocumentMetadata }[]>>({});

    const [formData, setFormData] = useState<WarrantyDocumentationData>({
        videoEvidence: [],
        vinImage: [],
        odoImage: [],
        damageImages: [],
        issueDescription: "",
        numberOfObservations: "",
        symptom: "",
        defectPart: "",
        fileMetadata: {},
    });

    useEffect(() => {
        if (open) {
            setFormData(initialData || {
                videoEvidence: [],
                vinImage: [],
                odoImage: [],
                damageImages: [],
                issueDescription: "",
                numberOfObservations: "",
                symptom: "",
                defectPart: "",
                fileMetadata: {},
            });
        }
    }, [open, initialData]);

    const handleFileUpload = useCallback(
        async (
            field: keyof Pick<WarrantyDocumentationData, "videoEvidence" | "vinImage" | "odoImage" | "damageImages">,
            files: FileList | null
        ) => {
            if (!files) return;

            const fileArray = Array.from(files);
            const uploadBatchId = `local-warranty-${Date.now()}`;

            let category: FileCategory;
            switch (field) {
                case 'videoEvidence':
                    category = FileCategory.WARRANTY_VIDEO;
                    break;
                case 'vinImage':
                    category = FileCategory.WARRANTY_VIN;
                    break;
                case 'odoImage':
                    category = FileCategory.WARRANTY_ODO;
                    break;
                case 'damageImages':
                    category = FileCategory.WARRANTY_DAMAGE;
                    break;
                default:
                    category = FileCategory.PHOTOS_VIDEOS;
            }

            const newFilesData: { file: File; category: FileCategory; metadata: DocumentMetadata }[] = fileArray.map(file => {
                const publicId = `${uploadBatchId}-${file.name}-${uuidv4()}`; // Unique ID for local tracking
                const url = URL.createObjectURL(file); // Create a local URL for immediate display

                return {
                    file,
                    category,
                    metadata: {
                        publicId: publicId,
                        url: url,
                        filename: file.name,
                        format: file.type.split('/').pop() || 'unknown',
                        bytes: file.size,
                        uploadedAt: new Date().toISOString(),
                        fileObject: file, // Store the actual File object
                    }
                };
            });

            setPendingUploads(prev => ({
                ...prev,
                [field]: [...(prev[field] || []), ...newFilesData],
            }));

            setFormData((prev) => ({
                ...prev,
                [field]: [...(prev[field] || []), ...newFilesData.map(data => data.metadata.url)],
                fileMetadata: {
                    ...(prev.fileMetadata || {}),
                    [field]: [...(prev.fileMetadata?.[field] || []), ...newFilesData.map(data => data.metadata)],
                }
            }));

            console.log(`✅ Successfully queued ${newFilesData.length} files for local storage for ${field}`);
        },
        []
    );

    const handleRemoveFile = useCallback(
        async (
            field: keyof Pick<WarrantyDocumentationData, "videoEvidence" | "vinImage" | "odoImage" | "damageImages">,
            index: number
        ) => {
            const currentMetadata = formData.fileMetadata?.[field];
            if (currentMetadata && currentMetadata[index]?.url) {
                URL.revokeObjectURL(currentMetadata[index].url);
            }

            setFormData((prev) => ({
                ...prev,
                [field]: prev[field].filter((_, i) => i !== index),
                fileMetadata: {
                    ...prev.fileMetadata,
                    [field]: prev.fileMetadata?.[field]?.filter((_, i) => i !== index) || [],
                }
            }));

            setPendingUploads(prev => {
                if (!prev[field]) return prev;
                const newFiles = prev[field].filter((_, i) => i !== index);
                if (newFiles.length === 0) {
                    const { [field]: _, ...rest } = prev;
                    return rest;
                }
                return {
                    ...prev,
                    [field]: newFiles,
                };
            });

            console.log(`✅ Removed file from local queue for ${field}`);
        },
        [formData]
    );

    const handleSave = () => {
        const finalPendingFiles: { file: File; category: FileCategory; metadata: DocumentMetadata }[] = [];
        Object.values(pendingUploads).forEach(fileList => {
            fileList.forEach(fileData => finalPendingFiles.push(fileData));
        });
        onSave(formData, finalPendingFiles);
        onClose();
    };

    if (!open) return null;

    const isViewMode = mode === "view";

    const uploadSections = [
        {
            field: "videoEvidence" as const,
            label: "Video Evidence",
            icon: Video,
            accept: "video/*",
            color: "blue",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-300",
            hoverBg: "hover:bg-blue-100",
            iconColor: "text-blue-600",
            description: "Upload videos showing the issue (MP4, AVI, MOV, Max 15MB)"
        },
        {
            field: "vinImage" as const,
            label: "VIN/Chassis Number",
            icon: ImageIcon,
            accept: "image/*",
            color: "green",
            bgColor: "bg-green-50",
            borderColor: "border-green-300",
            hoverBg: "hover:bg-green-100",
            iconColor: "text-green-600",
            description: "Clear image of VIN/Chassis number (JPG, PNG, Max 4MB)"
        },
        {
            field: "odoImage" as const,
            label: "Odometer Reading",
            icon: ImageIcon,
            accept: "image/*",
            color: "purple",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-300",
            hoverBg: "hover:bg-purple-100",
            iconColor: "text-purple-600",
            description: "Current odometer/kilometer reading (JPG, PNG, Max 4MB)"
        },
        {
            field: "damageImages" as const,
            label: "Damage/Issue Images",
            icon: ImageIcon,
            accept: "image/*",
            color: "orange",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-300",
            hoverBg: "hover:bg-orange-100",
            iconColor: "text-orange-600",
            description: "Multiple angles of the damaged part (JPG, PNG, Max 4MB)"
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 flex items-center justify-between border-b border-blue-800">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {isViewMode ? "View" : "Upload"} Warranty Documentation
                            </h2>
                            <p className="text-blue-100 mt-0.5 text-sm">
                                Part: <span className="font-medium text-white">{itemDescription}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {/* Evidence Upload Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-blue-100 p-2.5 rounded-lg">
                                <Upload size={20} className="text-blue-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Evidence Upload</h3>
                                <p className="text-sm text-gray-600">Upload supporting media files for warranty claim verification</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {uploadSections.map((section) => {
                                const Icon = section.icon;
                                const fileCount = formData[section.field].length;

                                return (
                                    <div key={section.field} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`${section.bgColor} p-2 rounded-lg`}>
                                                <Icon size={20} className={section.iconColor} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{section.label}</h4>
                                                <p className="text-xs text-gray-500">{section.description}</p>
                                            </div>
                                        </div>

                                        {!isViewMode && (
                                            <div className="mb-3">
                                                <input
                                                    type="file"
                                                    accept={section.accept}
                                                    multiple
                                                    onChange={(e) => handleFileUpload(section.field, e.target.files)}
                                                    className="hidden"
                                                    id={`${section.field}-upload`}
                                                />
                                                <label
                                                    htmlFor={`${section.field}-upload`}
                                                    className={`block ${section.bgColor} ${section.borderColor} border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${section.hoverBg}`}
                                                >
                                                    <Upload size={24} className={`${section.iconColor} mx-auto mb-2`} />
                                                    <p className="text-sm font-medium text-gray-700">Click to upload</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {fileCount > 0 ? `${fileCount} file(s) uploaded` : "No files uploaded"}
                                                    </p>
                                                </label>
                                            </div>
                                        )}

                                        {/* File Preview Grid */}
                                        {fileCount > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {formData[section.field].map((url, index) => (
                                                    <div key={index} className="relative group aspect-square">
                                                        {section.field === "videoEvidence" ? (
                                                            <video
                                                                src={url}
                                                                controls
                                                                className="w-full h-full object-cover rounded-lg border border-gray-200"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={url}
                                                                alt={`${section.label} ${index + 1}`}
                                                                className="w-full h-full object-cover rounded-lg border border-gray-200"
                                                            />
                                                        )}

                                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
                                                                title="View"
                                                            >
                                                                <Eye size={12} />
                                                            </a>
                                                            {!isViewMode && (
                                                                <button
                                                                    onClick={() => handleRemoveFile(section.field, index)}
                                                                    className="bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition flex items-center justify-center"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {fileCount === 0 && (
                                            <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                {isViewMode ? "No files uploaded" : "Upload files to continue"}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Case Details Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <AlertCircle size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Case Details</h3>
                                <p className="text-sm text-gray-600">Provide detailed information about the warranty claim</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Issue Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.issueDescription}
                                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                    rows={4}
                                    disabled={isViewMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-700 transition"
                                    placeholder="Describe the issue in detail... (e.g., Battery not charging, dashboard warning lights, unusual sounds)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Number of Observations
                                </label>
                                <input
                                    type="number"
                                    value={formData.numberOfObservations}
                                    onChange={(e) => setFormData({ ...formData, numberOfObservations: e.target.value })}
                                    disabled={isViewMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-700 transition"
                                    placeholder="e.g., 3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Symptom
                                </label>
                                <input
                                    type="text"
                                    value={formData.symptom}
                                    onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                                    disabled={isViewMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-700 transition"
                                    placeholder="e.g., Not charging, Overheating"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Defect Part
                                </label>
                                <input
                                    type="text"
                                    value={formData.defectPart}
                                    onChange={(e) => setFormData({ ...formData, defectPart: e.target.value })}
                                    disabled={isViewMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-700 transition"
                                    placeholder="e.g., Battery pack, Motor controller, Front suspension"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-200 px-8 py-5 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                        {isViewMode ? "Close" : "Cancel"}
                    </button>
                    {!isViewMode && (
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <CheckCircle2 size={18} />
                            Save Documentation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
