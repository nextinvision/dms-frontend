import { Quotation } from "@/shared/types/quotation.types";
import { CustomerWithVehicles, Vehicle } from "@/shared/types/vehicle.types";
import { CreateJobCardForm, JobCardPart2Item } from "../types/job-card.types";

/**
 * Adapter to map various source data (Quotations, Customers, Vehicles) 
 * into a Job Card Form structure.
 */
export const jobCardAdapter = {
    /**
     * Initialize a form with common defaults
     */
    createEmptyForm: (): CreateJobCardForm => ({
        vehicleId: "",
        customerId: "",
        customerName: "",
        vehicleRegistration: "",
        vehicleMake: "",
        vehicleModel: "",
        description: "",
        selectedParts: [],
        part2Items: [],
        fullName: "",
        mobilePrimary: "",
        customerType: "",
        vehicleBrand: "",
        vinChassisNumber: "",
        variantBatteryCapacity: "",
        warrantyStatus: "",
        estimatedDeliveryDate: "",
        customerAddress: "",
        customerFeedback: "",
        technicianObservation: "",
        insuranceStartDate: "",
        insuranceEndDate: "",
        insuranceCompanyName: "",
        batterySerialNumber: "",
        mcuSerialNumber: "",
        vcuSerialNumber: "",
        otherPartSerialNumber: "",
        videoEvidence: { urls: [], publicIds: [], metadata: [] },
        vinImage: { urls: [], publicIds: [], metadata: [] },
        odoImage: { urls: [], publicIds: [], metadata: [] },
        damageImages: { urls: [], publicIds: [], metadata: [] },
        customerIdProof: { urls: [], publicIds: [], metadata: [] },
        vehicleRCCopy: { urls: [], publicIds: [], metadata: [] },
        warrantyCardServiceBook: { urls: [], publicIds: [], metadata: [] },
        photosVideos: { urls: [], publicIds: [], metadata: [] },
        issueDescription: "",
        numberOfObservations: "",
        symptom: "",
        defectPart: "",
    }),

    /**
     * Map an approved Quotation and its associated Customer/Vehicle to Job Card Form
     */
    mapQuotationToForm: (
        quotation: Quotation,
        customer: CustomerWithVehicles,
        vehicle?: Vehicle
    ): Partial<CreateJobCardForm> => {
        const vehicleToUse = vehicle ||
            customer.vehicles?.find(v => quotation.vehicleId && v.id.toString() === quotation.vehicleId) ||
            (customer.vehicles && customer.vehicles.length > 0 ? customer.vehicles[0] : undefined);

        const customerName = quotation.customer
            ? `${quotation.customer.firstName || ""} ${quotation.customer.lastName || ""}`.trim()
            : customer.name || "";

        const part2Items: JobCardPart2Item[] = (quotation.items || []).map((item, index) => ({
            srNo: index + 1,
            partWarrantyTag: false,
            partName: item?.partName || "",
            partCode: item?.partNumber || "",
            qty: item?.quantity || 0,
            amount: item?.amount || 0,
            technician: "",
            labourCode: "Auto Select With Part",
            itemType: "part" as const,
        }));

        return {
            customerId: customer.id.toString(),
            customerName: customerName,
            fullName: customerName,
            mobilePrimary: quotation.customer?.phone || customer.phone || "",
            customerType: customer.customerType || "",
            customerAddress: quotation.customer?.address || customer.address || "",
            vehicleId: vehicleToUse?.id?.toString() || quotation.vehicleId || "",
            vehicleRegistration: quotation.vehicle?.registration || vehicleToUse?.registration || "",
            vehicleMake: quotation.vehicle?.make || vehicleToUse?.vehicleMake || "",
            vehicleModel: quotation.vehicle?.model || vehicleToUse?.vehicleModel || "",
            vehicleBrand: quotation.vehicle?.make || vehicleToUse?.vehicleMake || "",
            vinChassisNumber: quotation.vehicle?.vin || vehicleToUse?.vin || "",
            variantBatteryCapacity: vehicleToUse?.variant || "",
            warrantyStatus: vehicleToUse?.warrantyStatus || "",
            description: quotation.notes || quotation.customNotes || "",
            customerFeedback: quotation.customNotes || quotation.notes || "",
            part2Items,
            insuranceCompanyName: (quotation as any).insurer?.name || "",
            insuranceStartDate: quotation.insuranceStartDate || "",
            insuranceEndDate: quotation.insuranceEndDate || "",
            batterySerialNumber: quotation.batterySerialNumber || "",
        };
    },

    /**
     * Map a Customer and optional Vehicle to Job Card Form
     */
    mapCustomerToForm: (
        customer: CustomerWithVehicles,
        vehicle?: Vehicle
    ): Partial<CreateJobCardForm> => {
        const vehicleToUse = vehicle || (customer.vehicles && customer.vehicles.length > 0 ? customer.vehicles[0] : undefined);

        return {
            customerId: customer.id.toString(),
            customerName: customer.name,
            fullName: customer.name,
            mobilePrimary: customer.phone,
            whatsappNumber: customer.whatsappNumber,
            alternateNumber: customer.alternateNumber,
            email: customer.email,
            customerType: customer.customerType || "",
            customerAddress: customer.address || "",
            vehicleId: vehicleToUse?.id?.toString() || "",
            vehicleRegistration: vehicleToUse?.registration || "",
            vehicleMake: vehicleToUse?.vehicleMake || "",
            vehicleModel: vehicleToUse?.vehicleModel || "",
            vehicleBrand: vehicleToUse?.vehicleMake || "",
            vinChassisNumber: vehicleToUse?.vin || "",
            variantBatteryCapacity: vehicleToUse?.variant || "",
            warrantyStatus: vehicleToUse?.warrantyStatus || "",
            vehicleYear: vehicleToUse?.vehicleYear,
            motorNumber: vehicleToUse?.motorNumber,
            chargerSerialNumber: vehicleToUse?.chargerSerialNumber,
            dateOfPurchase: vehicleToUse?.purchaseDate,
            vehicleColor: vehicleToUse?.vehicleColor,
            insuranceCompanyName: "",
            insuranceStartDate: vehicleToUse?.insuranceStartDate || "",
            insuranceEndDate: vehicleToUse?.insuranceEndDate || "",
        };
    },

    /**
     * Map Form data back to a JobCard object for saving
     */
    mapFormToJobCard: (
        form: CreateJobCardForm,
        serviceCenterId: string,
        serviceCenterCode: string,
        existingJobCard?: any
    ): any => {
        const { generateJobCardNumber } = require("@/shared/utils/job-card.utils");
        const { generateSrNoForPart2Items } = require("./jobCardUtils");

        const jobCardNumber = existingJobCard?.jobCardNumber || generateJobCardNumber(serviceCenterId);

        // Construct Part 1
        const part1 = {
            fullName: form.fullName || form.customerName,
            mobilePrimary: form.mobilePrimary,
            customerType: form.customerType,
            vehicleBrand: form.vehicleBrand || form.vehicleMake,
            vehicleModel: form.vehicleModel,
            registrationNumber: form.vehicleRegistration,
            vinChassisNumber: form.vinChassisNumber,
            variantBatteryCapacity: form.variantBatteryCapacity,
            warrantyStatus: form.warrantyStatus,
            estimatedDeliveryDate: form.estimatedDeliveryDate,
            customerAddress: form.customerAddress,
            jobCardNumber: jobCardNumber,
            customerFeedback: form.customerFeedback || form.description,
            technicianObservation: form.technicianObservation,
            insuranceStartDate: form.insuranceStartDate,
            insuranceEndDate: form.insuranceEndDate,
            insuranceCompanyName: form.insuranceCompanyName,
            batterySerialNumber: form.batterySerialNumber,
            mcuSerialNumber: form.mcuSerialNumber,
            vcuSerialNumber: form.vcuSerialNumber,
            otherPartSerialNumber: form.otherPartSerialNumber,
            // Operational fields
            whatsappNumber: form.whatsappNumber,
            alternateNumber: form.alternateNumber,
            email: form.email,
            vehicleYear: form.vehicleYear,
            motorNumber: form.motorNumber,
            chargerSerialNumber: form.chargerSerialNumber,
            dateOfPurchase: form.dateOfPurchase,
            vehicleColor: form.vehicleColor,
            previousServiceHistory: form.previousServiceHistory,
            odometerReading: form.odometerReading,
            pickupDropRequired: form.pickupDropRequired,
            pickupAddress: form.pickupAddress,
            pickupState: form.pickupState,
            pickupCity: form.pickupCity,
            pickupPincode: form.pickupPincode,
            dropAddress: form.dropAddress,
            dropState: form.dropState,
            dropCity: form.dropCity,
            dropPincode: form.dropPincode,
            preferredCommunicationMode: form.preferredCommunicationMode,
            arrivalMode: form.arrivalMode,
            checkInNotes: form.checkInNotes,
            checkInSlipNumber: form.checkInSlipNumber,
            checkInDate: form.checkInDate,
            checkInTime: form.checkInTime,
        };


        // Construct Part 2
        const part2 = generateSrNoForPart2Items(form.part2Items);

        // Construct Part 2A
        const part2A = {
            videoEvidence: (form.videoEvidence.urls && form.videoEvidence.urls.length > 0) ? "Yes" : "No",
            vinImage: (form.vinImage.urls && form.vinImage.urls.length > 0) ? "Yes" : "No",
            odoImage: (form.odoImage.urls && form.odoImage.urls.length > 0) ? "Yes" : "No",
            damageImages: (form.damageImages.urls && form.damageImages.urls.length > 0) ? "Yes" : "No",
            issueDescription: form.issueDescription || "",
            numberOfObservations: form.numberOfObservations || "",
            symptom: form.symptom || "",
            defectPart: form.defectPart || "",
            // Additional metadata for DTO mapping
            videoEvidenceMetadata: form.videoEvidence?.metadata || [],
            vinImageMetadata: form.vinImage?.metadata || [],
            odoImageMetadata: form.odoImage?.metadata || [],
            damageImagesMetadata: form.damageImages?.metadata || [],
        };

        return {
            ...(existingJobCard || {}),
            id: existingJobCard?.id || `JC-${Date.now()}`,
            jobCardNumber,
            serviceCenterId,
            serviceCenterCode,
            customerId: form.customerId,
            customerName: form.customerName,
            vehicleId: form.vehicleId,
            vehicle: `${form.vehicleMake} ${form.vehicleModel}`.trim(),
            registration: form.vehicleRegistration,
            vehicleMake: form.vehicleMake,
            vehicleModel: form.vehicleModel,
            customerType: form.customerType || "B2C",
            serviceType: form.description || "General Service",
            description: form.description,
            status: existingJobCard?.status || "Created",
            priority: existingJobCard?.priority || "Normal",
            createdAt: existingJobCard?.createdAt || new Date().toISOString(),
            parts: form.selectedParts,

            // Additional fields
            customerWhatsappNumber: form.whatsappNumber,
            customerAlternateMobile: form.alternateNumber,
            customerEmail: form.email,
            vehicleYear: form.vehicleYear,
            motorNumber: form.motorNumber,
            chargerSerialNumber: form.chargerSerialNumber,
            dateOfPurchase: form.dateOfPurchase,
            vehicleColor: form.vehicleColor,
            previousServiceHistory: form.previousServiceHistory,
            odometerReading: form.odometerReading,
            pickupDropRequired: form.pickupDropRequired,
            pickupAddress: form.pickupAddress,
            pickupState: form.pickupState,
            pickupCity: form.pickupCity,
            pickupPincode: form.pickupPincode,
            dropAddress: form.dropAddress,
            dropState: form.dropState,
            dropCity: form.dropCity,
            dropPincode: form.dropPincode,
            preferredCommunicationMode: form.preferredCommunicationMode,
            arrivalMode: form.arrivalMode,
            checkInNotes: form.checkInNotes,
            checkInSlipNumber: form.checkInSlipNumber,
            checkInDate: form.checkInDate,
            checkInTime: form.checkInTime,

            // Structured Data
            part1,
            part2,
            part2A,
        };
    },
    /**
     * Map a JobCard object back to Form data for editing
     */
    mapJobCardToForm: (jobCard: any): Partial<CreateJobCardForm> => {
        const formatDate = (date: any) => {
            if (!date) return "";
            try {
                const d = new Date(date);
                if (isNaN(d.getTime())) return "";
                return d.toISOString().split('T')[0];
            } catch {
                return "";
            }
        };

        const mapFiles = (categories: string | string[]) => {

            if (!jobCard.files || !Array.isArray(jobCard.files)) return { urls: [], publicIds: [], metadata: [] };

            const categoryList = Array.isArray(categories) ? categories : [categories];
            const filtered = jobCard.files.filter((f: any) => categoryList.includes(f.category));

            return {
                urls: filtered.map((f: any) => f.url),
                publicIds: filtered.map((f: any) => f.publicId),
                metadata: filtered.map((f: any) => ({
                    url: f.url,
                    publicId: f.publicId,
                    filename: f.filename,
                    format: f.format,
                    bytes: f.bytes,
                    fileId: f.id,
                    id: f.id, // Support both fileId and id
                    uploadedAt: f.createdAt ? f.createdAt.toString() : new Date().toISOString()
                }))
            };
        };

        return {
            // Document sections
            customerIdProof: mapFiles('customer_id_proof'),
            vehicleRCCopy: mapFiles('vehicle_rc'),
            warrantyCardServiceBook: mapFiles(['warranty_card', 'warranty_card_service_book']),
            photosVideos: mapFiles(['photos_videos', 'vehicle_photos']),

            // Warranty Documentation (Part 2A)
            videoEvidence: mapFiles('warranty_video'),
            vinImage: mapFiles(['warranty_vin', 'vehicle_vin_image']),
            odoImage: mapFiles(['warranty_odo', 'vehicle_odo_image']),
            damageImages: mapFiles(['warranty_damage', 'vehicle_damage_image']),

            // Basic details
            customerId: jobCard.customerId || "",
            customerName: jobCard.customerName || "",
            fullName: jobCard.part1?.fullName || jobCard.part1Data?.fullName || jobCard.customerName || "",
            mobilePrimary: jobCard.part1?.mobilePrimary || jobCard.part1Data?.mobilePrimary || "",
            whatsappNumber: jobCard.part1?.whatsappNumber || jobCard.part1Data?.whatsappNumber || jobCard.customerWhatsappNumber || jobCard.customer?.whatsappNumber || "",
            alternateNumber: jobCard.part1?.alternateNumber || jobCard.part1Data?.alternateNumber || jobCard.customerAlternateMobile || jobCard.customer?.alternateNumber || "",
            email: jobCard.part1?.email || jobCard.part1Data?.email || jobCard.customerEmail || jobCard.customer?.email || "",
            customerType: jobCard.part1?.customerType || jobCard.part1Data?.customerType || jobCard.customerType || "",
            customerAddress: jobCard.part1?.customerAddress || jobCard.part1Data?.customerAddress || "",
            vehicleId: jobCard.vehicleId || "",
            vehicleRegistration: jobCard.part1?.registrationNumber || jobCard.part1Data?.registrationNumber || jobCard.vehicle?.registration || jobCard.registration || "",
            vehicleMake: jobCard.part1?.vehicleMake || jobCard.part1Data?.vehicleMake || jobCard.vehicle?.vehicleMake || jobCard.vehicleMake || "",
            vehicleModel: jobCard.part1?.vehicleModel || jobCard.part1Data?.vehicleModel || jobCard.vehicle?.vehicleModel || jobCard.vehicleModel || "",
            vehicleBrand: jobCard.part1?.vehicleBrand || jobCard.part1Data?.vehicleBrand || jobCard.vehicle?.vehicleMake || jobCard.vehicleMake || "",
            vinChassisNumber: jobCard.part1?.vinChassisNumber || jobCard.part1Data?.vinChassisNumber || jobCard.vehicle?.vin || "",
            variantBatteryCapacity: jobCard.part1?.variantBatteryCapacity || jobCard.part1Data?.variantBatteryCapacity || jobCard.vehicle?.variant || "",
            warrantyStatus: jobCard.part1?.warrantyStatus || jobCard.part1Data?.warrantyStatus || jobCard.vehicle?.warrantyStatus || "",
            vehicleYear: jobCard.part1?.vehicleYear || jobCard.part1Data?.vehicleYear || jobCard.vehicle?.vehicleYear || jobCard.vehicleYear,
            motorNumber: jobCard.part1?.motorNumber || jobCard.part1Data?.motorNumber || jobCard.vehicle?.motorNumber || jobCard.motorNumber,
            chargerSerialNumber: jobCard.part1?.chargerSerialNumber || jobCard.part1Data?.chargerSerialNumber || jobCard.vehicle?.chargerSerialNumber || jobCard.chargerSerialNumber,
            dateOfPurchase: formatDate(jobCard.part1?.dateOfPurchase || jobCard.part1Data?.dateOfPurchase || jobCard.vehicle?.purchaseDate || jobCard.dateOfPurchase),
            vehicleColor: jobCard.part1?.vehicleColor || jobCard.part1Data?.vehicleColor || jobCard.vehicle?.vehicleColor || jobCard.vehicleColor,




            // Service details
            description: jobCard.description || "",
            customerFeedback: jobCard.part1?.customerFeedback || jobCard.part1Data?.customerFeedback || "",
            technicianObservation: jobCard.part1?.technicianObservation || jobCard.part1Data?.technicianObservation || "",
            insuranceStartDate: formatDate(jobCard.part1?.insuranceStartDate || jobCard.part1Data?.insuranceStartDate || jobCard.vehicle?.insuranceStartDate || ""),
            insuranceEndDate: formatDate(jobCard.part1?.insuranceEndDate || jobCard.part1Data?.insuranceEndDate || jobCard.vehicle?.insuranceEndDate || ""),
            insuranceCompanyName: jobCard.part1?.insuranceCompanyName || jobCard.part1Data?.insuranceCompanyName || jobCard.vehicle?.insuranceCompanyName || "",
            batterySerialNumber: jobCard.part1?.batterySerialNumber || jobCard.part1Data?.batterySerialNumber || "",
            mcuSerialNumber: jobCard.part1?.mcuSerialNumber || jobCard.part1Data?.mcuSerialNumber || "",
            vcuSerialNumber: jobCard.part1?.vcuSerialNumber || jobCard.part1Data?.vcuSerialNumber || "",
            otherPartSerialNumber: jobCard.part1?.otherPartSerialNumber || jobCard.part1Data?.otherPartSerialNumber || "",



            // Part 2
            part2Items: jobCard.part2 || [],

            // Part 2A Case details
            issueDescription: jobCard.part2A?.issueDescription || jobCard.part2AData?.issueDescription || "",
            numberOfObservations: jobCard.part2A?.numberOfObservations || jobCard.part2AData?.numberOfObservations || "",
            symptom: jobCard.part2A?.symptom || jobCard.part2AData?.symptom || "",
            defectPart: jobCard.part2A?.defectPart || jobCard.part2AData?.defectPart || "",


            // Others
            estimatedDeliveryDate: formatDate(jobCard.part1?.estimatedDeliveryDate || jobCard.part1Data?.estimatedDeliveryDate || jobCard.appointment?.estimatedDeliveryDate || ""),
            previousServiceHistory: jobCard.part1?.previousServiceHistory || jobCard.part1Data?.previousServiceHistory || jobCard.appointment?.previousServiceHistory || jobCard.previousServiceHistory || "",
            odometerReading: jobCard.part1?.odometerReading || jobCard.part1Data?.odometerReading || jobCard.appointment?.odometerReading || jobCard.odometerReading || "",
            arrivalMode: jobCard.part1?.arrivalMode || jobCard.part1Data?.arrivalMode || jobCard.appointment?.arrivalMode || jobCard.arrivalMode || "vehicle_present",
            checkInNotes: jobCard.part1?.checkInNotes || jobCard.part1Data?.checkInNotes || jobCard.appointment?.checkInNotes || jobCard.checkInNotes || "",
            pickupDropRequired: jobCard.part1?.pickupDropRequired || jobCard.part1Data?.pickupDropRequired || jobCard.appointment?.pickupDropRequired || jobCard.pickupDropRequired || false,
            pickupAddress: jobCard.part1?.pickupAddress || jobCard.part1Data?.pickupAddress || jobCard.appointment?.pickupAddress || jobCard.pickupAddress || "",
            pickupState: jobCard.part1?.pickupState || jobCard.part1Data?.pickupState || jobCard.appointment?.pickupState || jobCard.pickupState || "",
            pickupCity: jobCard.part1?.pickupCity || jobCard.part1Data?.pickupCity || jobCard.appointment?.pickupCity || jobCard.pickupCity || "",
            pickupPincode: jobCard.part1?.pickupPincode || jobCard.part1Data?.pickupPincode || jobCard.appointment?.pickupPincode || jobCard.pickupPincode || "",
            dropAddress: jobCard.part1?.dropAddress || jobCard.part1Data?.dropAddress || jobCard.appointment?.dropAddress || jobCard.dropAddress || "",
            dropState: jobCard.part1?.dropState || jobCard.part1Data?.dropState || jobCard.appointment?.dropState || jobCard.dropState || "",
            dropCity: jobCard.part1?.dropCity || jobCard.part1Data?.dropCity || jobCard.appointment?.dropCity || jobCard.dropCity || "",
            dropPincode: jobCard.part1?.dropPincode || jobCard.part1Data?.dropPincode || jobCard.appointment?.dropPincode || jobCard.dropPincode || "",
            preferredCommunicationMode: jobCard.part1?.preferredCommunicationMode || jobCard.part1Data?.preferredCommunicationMode || jobCard.appointment?.preferredCommunicationMode || jobCard.preferredCommunicationMode || "WhatsApp",
            checkInSlipNumber: jobCard.part1?.checkInSlipNumber || jobCard.part1Data?.checkInSlipNumber || jobCard.appointment?.checkInSlipNumber || jobCard.checkInSlipNumber || "",
            checkInDate: formatDate(jobCard.part1?.checkInDate || jobCard.part1Data?.checkInDate || jobCard.appointment?.checkInDate || jobCard.checkInDate || ""),
            checkInTime: jobCard.part1?.checkInTime || jobCard.part1Data?.checkInTime || jobCard.appointment?.checkInTime || jobCard.checkInTime || "",

        };
    }
};
