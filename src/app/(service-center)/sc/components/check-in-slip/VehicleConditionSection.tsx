"use client";
import { useState, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import type { CheckInSlipFormData } from "@/shared/types/check-in-slip.types";
// import { useUpload } from "@/shared/hooks/useUpload"; // This hook was not actually used, useCloudinaryUpload was
import { localStorage as safeStorage } from "@/shared/lib/localStorage";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for local files

// Define FileCategory enum locally
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
  publicId: string; // This will now be a local identifier
  url: string; // This will be a local blob URL
  filename: string;
  format: string;
  bytes: number;
  uploadedAt: string;
  fileId?: string; // Database ID for deletion (optional)
  fileObject?: File; // The actual File object
}

interface VehicleConditionSectionProps {
  formData: CheckInSlipFormData;
  onUpdate: (updates: Partial<CheckInSlipFormData>) => void;
  vehicleId?: string;
  userId?: string;
  onPendingUploadsChange?: (files: { file: File; category: FileCategory; metadata: DocumentMetadata }[]) => void;
}

export function VehicleConditionSection({

  formData,

  onUpdate,

  vehicleId: propVehicleId,

  userId,

  onPendingUploadsChange,

}: VehicleConditionSectionProps) {

  // Use formData for initial state of imagePreviews

  const [imagePreviews, setImagePreviews] = useState<{

    front?: string;

    rear?: string;

    right?: string;

    left?: string;

    damages?: string[];

  }>(() => ({

    front: formData.vehicleImageFront,

    rear: formData.vehicleImageRear,

    right: formData.vehicleImageRight,

    left: formData.vehicleImageLeft,

    damages: formData.vehicleImageDamages || [],

  }));



  // Effect to update image previews when formData changes externally

  useEffect(() => {

    setImagePreviews({

      front: formData.vehicleImageFront,

      rear: formData.vehicleImageRear,

      right: formData.vehicleImageRight,

      left: formData.vehicleImageLeft,

      damages: formData.vehicleImageDamages || [],

    });

  }, [formData]);



  const vehicleId = propVehicleId || 'temp';



  const handleImageUpload = useCallback(

    async (

    field: "vehicleImageFront" | "vehicleImageRear" | "vehicleImageRight" | "vehicleImageLeft",

    file: File | null

  ) => {

    if (!file) return;



    try {

        const publicId = `vehicle-condition-${field}-${Date.now()}-${uuidv4()}`;

        const localUrl = URL.createObjectURL(file);



        const metadata: DocumentMetadata = {

            publicId: publicId,

            url: localUrl,

            filename: file.name,

            format: file.type.split('/').pop() || 'unknown',

            bytes: file.size,

            uploadedAt: new Date().toISOString(),

            fileObject: file,

        };



        // Update form data for display with local URL

        onUpdate({ [field]: localUrl });

        setImagePreviews((prev) => ({ ...prev, [field.replace("vehicleImage", "").toLowerCase()]: localUrl }));



        // Pass pending upload to parent

        if (onPendingUploadsChange) {

            onPendingUploadsChange([{ file, category: FileCategory.VEHICLE_CONDITION, metadata }]);

        }

      } catch (err) {

        console.error('Upload failed:', err);

        alert(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);

      }

    },

    [onUpdate, onPendingUploadsChange]

  );



  const handleDamageImageUpload = useCallback(

    async (file: File | null) => {

    if (!file) return;

    if ((formData.vehicleImageDamages?.length || 0) >= 5) {

      alert("Maximum 5 damage images allowed");

      return;

    }



      try {

        const publicId = `vehicle-condition-damage-${Date.now()}-${uuidv4()}`;

        const localUrl = URL.createObjectURL(file);



        const metadata: DocumentMetadata = {

            publicId: publicId,

            url: localUrl,

            filename: file.name,

            format: file.type.split('/').pop() || 'unknown',

            bytes: file.size,

            uploadedAt: new Date().toISOString(),

            fileObject: file,

        };



        // Update form data for display with local URL

        const currentDamages = formData.vehicleImageDamages || [];

        onUpdate({ vehicleImageDamages: [...currentDamages, localUrl] });

        setImagePreviews((prev) => ({

            ...prev,

            damages: [...(prev.damages || []), localUrl],

        }));



        // Pass pending upload to parent

        if (onPendingUploadsChange) {

            onPendingUploadsChange([{ file, category: FileCategory.VEHICLE_CONDITION, metadata }]);

        }

      } catch (err) {

        console.error('Upload failed:', err);

        alert(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);

      }

    },

    [formData.vehicleImageDamages, onUpdate, onPendingUploadsChange]

  );



  const removeDamageImage = (index: number) => {

    const currentDamages = formData.vehicleImageDamages || [];

    const updated = currentDamages.filter((_, i) => i !== index);

    onUpdate({ vehicleImageDamages: updated });



    // Also revoke the object URL if it exists in imagePreviews

    if (imagePreviews.damages && imagePreviews.damages[index]) {

      URL.revokeObjectURL(imagePreviews.damages[index]);

    }



    setImagePreviews((prev) => ({

      ...prev,

      damages: prev.damages?.filter((_, i) => i !== index) || [],

    }));

  };



  return (
    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-600 rounded"></span>
        2. Vehicle Image & Condition Check
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Front Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Image Front
          </label>
          {imagePreviews.front ? (
            <div className="relative">
              <img src={imagePreviews.front} alt="Front" className="w-full h-32 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  onUpdate({ vehicleImageFront: undefined });
                  setImagePreviews((prev) => ({ ...prev, front: undefined }));
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload("vehicleImageFront", e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        {/* Rear Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Image Rear
          </label>
          {imagePreviews.rear ? (
            <div className="relative">
              <img src={imagePreviews.rear} alt="Rear" className="w-full h-32 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  onUpdate({ vehicleImageRear: undefined });
                  setImagePreviews((prev) => ({ ...prev, rear: undefined }));
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload("vehicleImageRear", e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        {/* Right Side Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Image Right Side
          </label>
          {imagePreviews.right ? (
            <div className="relative">
              <img src={imagePreviews.right} alt="Right" className="w-full h-32 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  onUpdate({ vehicleImageRight: undefined });
                  setImagePreviews((prev) => ({ ...prev, right: undefined }));
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload("vehicleImageRight", e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        {/* Left Side Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Image Left Side
          </label>
          {imagePreviews.left ? (
            <div className="relative">
              <img src={imagePreviews.left} alt="Left" className="w-full h-32 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  onUpdate({ vehicleImageLeft: undefined });
                  setImagePreviews((prev) => ({ ...prev, left: undefined }));
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload("vehicleImageLeft", e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </div>

      {/* Other Damages Images (Max 5) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Other Damages Part Images (Max 5)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {formData.vehicleImageDamages?.map((img, index) => (
            <div key={index} className="relative">
              <img src={img} alt={`Damage ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeDamageImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {(formData.vehicleImageDamages?.length || 0) < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <ImageIcon className="w-6 h-6 text-gray-400" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleDamageImageUpload(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </div>

      {/* Charger Given */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="chargerGiven"
          checked={formData.chargerGiven || false}
          onChange={(e) => onUpdate({ chargerGiven: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="chargerGiven" className="text-sm font-medium text-gray-700">
          Charger given
        </label>
      </div>
    </div>
  );
}


