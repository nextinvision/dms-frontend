"use client";

import { useState, useEffect } from "react";
import { X, Upload, Video, Image as ImageIcon, FileText, Trash2, Eye, CheckCircle2, AlertCircle } from "lucide-react";

interface WarrantyDocumentationData {
    videoEvidence: string[];
    vinImage: string[];
    odoImage: string[];
    damageImages: string[];
    issueDescription: string;
    numberOfObservations: string;
    symptom: string;
    defectPart: string;
}

interface WarrantyDocumentationModalProps {
    open: boolean;
    onClose: () => void;
    itemDescription: string;
    initialData?: WarrantyDocumentationData;
    onSave: (data: WarrantyDocumentationData) => void;
    mode?: "upload" | "view";
}

export default function WarrantyDocumentationModal({
    open,
    onClose,
    itemDescription,
    initialData,
    onSave,
    mode = "upload",
}: WarrantyDocumentationModalProps) {
    const [formData, setFormData] = useState<WarrantyDocumentationData>({
        videoEvidence: [],
        vinImage: [],
        odoImage: [],
        damageImages: [],
        issueDescription: "",
        numberOfObservations: "",
        symptom: "",
        defectPart: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleFileUpload = (
        field: keyof Pick<WarrantyDocumentationData, "videoEvidence" | "vinImage" | "odoImage" | "damageImages">,
        files: FileList | null
    ) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const fileUrls = fileArray.map((file) => URL.createObjectURL(file));

        setFormData((prev) => ({
            ...prev,
            [field]: [...prev[field], ...fileUrls],
        }));
    };

    const handleRemoveFile = (
        field: keyof Pick<WarrantyDocumentationData, "videoEvidence" | "vinImage" | "odoImage" | "damageImages">,
        index: number
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const handleSave = () => {
        onSave(formData);
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
            description: "Upload videos showing the issue (MP4, AVI, MOV)"
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
            description: "Clear image of VIN/Chassis number"
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
            description: "Current odometer/kilometer reading"
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
            description: "Multiple angles of the damaged part"
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
                                                        {!isViewMode && (
                                                            <button
                                                                onClick={() => handleRemoveFile(section.field, index)}
                                                                className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
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
