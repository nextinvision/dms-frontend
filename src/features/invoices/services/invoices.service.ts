import { API_ENDPOINTS } from "@/config/api.config";
import { apiClient } from "@/core/api/client";
import type { ServiceCenterInvoice, ServiceCenterInvoiceItem, EnhancedServiceCenterInvoiceItem, PaymentStatus } from "@/shared/types/invoice.types";

interface CreateInvoicePayload {
    serviceCenterId: string;
    customerId: string;
    vehicleId: string;
    jobCardId?: string;
    items: {
        name: string;
        hsnSacCode?: string;
        unitPrice: number;
        quantity: number;
        gstRate: number;
    }[];
    placeOfSupply?: string;
}

interface InvoiceFilterParams {
    serviceCenterId?: string;
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
}

class InvoicesService {
    /**
     * Fetch all invoices with optional filtering
     */
    async getAll(params?: InvoiceFilterParams): Promise<ServiceCenterInvoice[]> {
        try {
            const response = await apiClient.get<any>(API_ENDPOINTS.INVOICES, { params: params as any });

            // API client does: result.data = responseData.data || responseData
            // Backend returns: { data: [], meta: {} } (PaginatedResult)
            // So:
            //   - If backend returns { data: [], meta: {} }
            //   - API client does: result.data = responseData.data || responseData
            //   - result.data = [] (the array) || { data: [], meta: {} } = [] (array wins)
            //   - So response.data should be the array directly!
            // However, if API wraps it again, we might get { data: [], meta: {} }

            let invoicesArray: any[] = [];

            // Check all possible response structures
            if (Array.isArray(response.data)) {
                // Case 1: API client unwrapped to array directly
                invoicesArray = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // Case 2: Still paginated object { data: [], meta: {} }
                if (Array.isArray(response.data.data)) {
                    invoicesArray = response.data.data;
                } else if (response.data.meta && Array.isArray(response.data.data)) {
                    // Another check for paginated format
                    invoicesArray = response.data.data;
                }
            }

            // Safety: if still empty, try response itself (shouldn't happen but just in case)
            if (invoicesArray.length === 0 && Array.isArray(response)) {
                invoicesArray = response;
            }

            // Log for debugging - always log to help diagnose
            console.log('[InvoicesService] Response structure analysis:', {
                responseType: typeof response,
                responseHasData: 'data' in (response || {}),
                dataType: typeof response?.data,
                isDataArray: Array.isArray(response?.data),
                hasDataData: response?.data?.data !== undefined,
                isDataDataArray: Array.isArray(response?.data?.data),
                dataKeys: response?.data ? Object.keys(response.data) : [],
                invoicesArrayLength: invoicesArray.length,
                firstInvoiceId: invoicesArray[0]?.id,
                firstInvoiceCustomer: invoicesArray[0]?.customer,
                firstInvoiceGrandTotal: invoicesArray[0]?.grandTotal
            });

            // Log raw response for debugging
            console.log('[InvoicesService] Raw API response structure:', {
                isArray: Array.isArray(response.data),
                hasDataField: response.data?.data !== undefined,
                invoicesCount: invoicesArray.length,
                firstInvoice: invoicesArray[0] ? {
                    id: invoicesArray[0].id,
                    invoiceNumber: invoicesArray[0].invoiceNumber,
                    customer: invoicesArray[0].customer,
                    vehicle: invoicesArray[0].vehicle,
                    grandTotal: invoicesArray[0].grandTotal,
                    createdAt: invoicesArray[0].createdAt,
                    status: invoicesArray[0].status
                } : null
            });

            // Transform backend data to frontend ServiceCenterInvoice type
            // First pass: transform all invoices
            let transformed = invoicesArray.map((invoice: any) => {
                return this.transformBackendToFrontend(invoice);
            });

            // Second pass: fetch missing job card numbers for invoices that have jobCardId but no jobCardNumber
            const invoicesNeedingJobCards = transformed
                .filter(inv => !inv.jobCardNumber && inv.jobCardId)
                .slice(0, 10); // Limit to first 10 to avoid performance issues

            if (invoicesNeedingJobCards.length > 0) {
                console.log(`[InvoicesService] Fetching job card numbers for ${invoicesNeedingJobCards.length} invoices`);

                // Fetch job card numbers in parallel
                const jobCardPromises = invoicesNeedingJobCards.map(async (invoice) => {
                    try {
                        const jobCardResponse = await apiClient.get<any>(API_ENDPOINTS.JOB_CARD(invoice.jobCardId!));
                        const jobCardData = jobCardResponse.data || jobCardResponse;
                        if (jobCardData?.jobCardNumber) {
                            invoice.jobCardNumber = jobCardData.jobCardNumber;
                            console.log(`[InvoicesService] Fetched job card number for invoice ${invoice.id}: ${jobCardData.jobCardNumber}`);
                        }
                    } catch (error) {
                        console.error(`[InvoicesService] Failed to fetch job card for ${invoice.jobCardId}:`, error);
                    }
                });

                await Promise.all(jobCardPromises);
            }

            return transformed;
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
            throw error;
        }
    }

    /**
     * Create a new invoice
     */
    async create(payload: CreateInvoicePayload): Promise<ServiceCenterInvoice> {
        try {
            const response = await apiClient.post<any>(API_ENDPOINTS.INVOICES, payload);
            // apiClient.post returns ApiResponse<T> with { data, message, success }
            // We need to pass response.data to the transformer, not the entire response object
            const backendData = response.data || response;
            return this.transformBackendToFrontend(backendData);
        } catch (error) {
            console.error("Failed to create invoice:", error);
            throw error;
        }
    }

    /**
     * Get a single invoice by ID
     */
    async getById(id: string): Promise<ServiceCenterInvoice> {
        try {
            console.log('[InvoicesService] getById called for invoice ID:', id);
            const response = await apiClient.get<any>(API_ENDPOINTS.INVOICE(id));
            console.log('[InvoicesService] getById raw response:', {
                responseType: typeof response,
                hasData: 'data' in (response || {}),
                responseData: response?.data,
                responseKeys: response ? Object.keys(response) : []
            });

            // apiClient.get returns ApiResponse<T> with { data, message, success }
            // We need to pass response.data to the transformer, not the entire response object
            const backendData = response.data || response;
            console.log('[InvoicesService] getById backendData:', {
                id: backendData?.id,
                invoiceNumber: backendData?.invoiceNumber,
                itemsCount: backendData?.items?.length || 0,
                items: backendData?.items,
                itemsType: typeof backendData?.items,
                isItemsArray: Array.isArray(backendData?.items)
            });

            const transformed = this.transformBackendToFrontend(backendData);
            console.log('[InvoicesService] getById transformed invoice:', {
                id: transformed.id,
                invoiceNumber: transformed.invoiceNumber,
                enhancedItemsCount: transformed.enhancedItems?.length || 0,
                itemsCount: transformed.items?.length || 0,
                serviceCenterId: transformed.serviceCenterId,
                serviceCenterName: transformed.serviceCenterName,
                hasServiceCenterDetails: !!transformed.serviceCenterDetails,
                serviceCenterDetails: transformed.serviceCenterDetails
            });

            // If service center details are missing but we have serviceCenterId, fetch them
            if (!transformed.serviceCenterDetails && transformed.serviceCenterId) {
                try {
                    console.log('[InvoicesService] Service center details missing, fetching separately for ID:', transformed.serviceCenterId);
                    const scResponse = await apiClient.get<any>(API_ENDPOINTS.SERVICE_CENTER(transformed.serviceCenterId));
                    const scData = scResponse.data || scResponse;
                    if (scData) {
                        transformed.serviceCenterDetails = {
                            name: scData.name || '',
                            address: scData.address || '',
                            city: scData.city || '',
                            state: scData.state || '',
                            pincode: scData.pinCode || scData.pincode || '',
                            gstNumber: scData.gstNumber || '',
                            panNumber: scData.panNumber || '',
                            phone: scData.phone || '',
                            email: scData.email || '',
                        };
                        console.log('[InvoicesService] Fetched and populated service center details:', transformed.serviceCenterDetails);
                    }
                } catch (scError) {
                    console.error('[InvoicesService] Failed to fetch service center details:', scError);
                }
            }

            return transformed;
        } catch (error) {
            console.error(`[InvoicesService] Failed to fetch invoice ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update invoice status (e.g. mark as PAID)
     */
    async updateStatus(id: string, status: "PAID" | "CANCELLED", paymentMethod?: string): Promise<ServiceCenterInvoice> {
        try {
            // Note: Backend endpoint is PATCH /invoices/:id/status
            // We pass paymentMethod if provided, as the backend might support it (or we hope it does)
            const payload = paymentMethod ? { status, paymentMethod } : { status };
            const response = await apiClient.patch<any>(`${API_ENDPOINTS.INVOICES}/${id}/status`, payload);
            return this.transformBackendToFrontend(response);
        } catch (error) {
            console.error(`Failed to update invoice status ${id}:`, error);
            throw error;
        }
    }

    /**
     * Transform backend invoice entity to frontend ServiceCenterInvoice type
     */
    private transformBackendToFrontend(backendInvoice: any): ServiceCenterInvoice {
        // Log raw backend invoice for debugging (always log to help diagnose)
        console.log('[InvoicesService] Transforming invoice:', {
            id: backendInvoice.id,
            invoiceNumber: backendInvoice.invoiceNumber,
            customer: backendInvoice.customer,
            customerType: typeof backendInvoice.customer,
            customerName: backendInvoice.customerName,
            vehicle: backendInvoice.vehicle,
            vehicleType: typeof backendInvoice.vehicle,
            createdAt: backendInvoice.createdAt,
            grandTotal: backendInvoice.grandTotal,
            status: backendInvoice.status,
            itemsCount: backendInvoice.items?.length || 0
        });
        // Map items
        console.log('[InvoicesService] transformBackendToFrontend - items processing:', {
            hasItems: !!backendInvoice.items,
            itemsType: typeof backendInvoice.items,
            isItemsArray: Array.isArray(backendInvoice.items),
            itemsLength: backendInvoice.items?.length || 0,
            items: backendInvoice.items
        });

        const enhancedItems: EnhancedServiceCenterInvoiceItem[] = (backendInvoice.items && Array.isArray(backendInvoice.items))
            ? backendInvoice.items.map((item: any, index: number) => {
                console.log(`[InvoicesService] Processing item ${index}:`, item);
                const unitPrice = Number(item.unitPrice || 0);
                const quantity = Number(item.quantity || 0);
                const gstRate = Number(item.gstRate || 0);
                const taxable = unitPrice * quantity;
                const taxAmount = (taxable * gstRate) / 100;

                // Calculate CGST/SGST/IGST split
                // If placeOfSupply is different from service center state, use IGST
                // Otherwise, split GST equally between CGST and SGST
                // For now, defaulting to CGST/SGST split (IGST would need place of supply logic)
                const cgstAmount = taxAmount / 2;
                const sgstAmount = taxAmount / 2;
                const igstAmount = 0; // Set if place of supply is different

                const transformedItem = {
                    name: item.name || 'Item',
                    hsnSacCode: item.hsnSacCode,
                    unitPrice: unitPrice,
                    quantity: quantity,
                    taxableAmount: taxable,
                    gstRate: gstRate,
                    cgstAmount: cgstAmount,
                    sgstAmount: sgstAmount,
                    igstAmount: igstAmount,
                    totalAmount: taxable + taxAmount
                };

                console.log(`[InvoicesService] Transformed item ${index}:`, transformedItem);
                return transformedItem;
            })
            : [];

        console.log('[InvoicesService] Final enhancedItems:', {
            count: enhancedItems.length,
            items: enhancedItems
        });

        // Legacy items for display compatibility
        const legacyItems: ServiceCenterInvoiceItem[] = enhancedItems.map(item => ({
            name: item.name,
            qty: item.quantity,
            price: `₹${(item.totalAmount || 0).toLocaleString('en-IN')}`,
            // optional extended fields
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalAmount: item.totalAmount
        }));

        // Extract customer name - handle multiple possible formats
        // Backend returns: customer: { name: string, phone: string }
        // Make sure we check customer.name first since that's what backend returns
        let customerName = "Unknown Customer";

        console.log('[InvoicesService] Extracting customer name from:', {
            customer: backendInvoice.customer,
            customerType: typeof backendInvoice.customer,
            customerName: backendInvoice.customerName,
            customer_name: backendInvoice.customer_name,
            hasCustomerName: backendInvoice.customer?.name !== undefined
        });

        if (backendInvoice.customer) {
            if (typeof backendInvoice.customer === 'object' && backendInvoice.customer.name) {
                customerName = backendInvoice.customer.name;
                console.log('[InvoicesService] Found customer name from customer.name:', customerName);
            } else if (typeof backendInvoice.customer === 'string') {
                customerName = backendInvoice.customer;
                console.log('[InvoicesService] Found customer name from customer string:', customerName);
            }
        }

        // Fallback to other fields if customer object doesn't have name
        if (customerName === "Unknown Customer") {
            customerName = backendInvoice.customerName ||
                backendInvoice.customer_name ||
                "Unknown Customer";
            console.log('[InvoicesService] Using fallback customer name:', customerName);
        }

        console.log('[InvoicesService] Final customer name:', customerName);

        // Extract vehicle info - handle multiple possible formats
        // Backend returns: vehicle: { registration: string }
        const vehicleInfo = backendInvoice.vehicle?.registration ||
            (backendInvoice.vehicle && typeof backendInvoice.vehicle === 'object' ?
                (backendInvoice.vehicle.registration || backendInvoice.vehicle.model || backendInvoice.vehicle.make) : null) ||
            (typeof backendInvoice.vehicle === 'string' ? backendInvoice.vehicle : null) ||
            backendInvoice.vehicleRegistration ||
            "Unknown Vehicle";

        // Extract dates - backend uses createdAt, no invoiceDate/dueDate in schema
        const invoiceDate = backendInvoice.invoiceDate ||
            backendInvoice.date ||
            backendInvoice.createdAt;
        const dueDateField = backendInvoice.dueDate ||
            backendInvoice.due_date;

        console.log('[InvoicesService] Extracting dates from:', {
            invoiceDate: invoiceDate,
            dueDateField: dueDateField,
            createdAt: backendInvoice.createdAt,
            invoiceDate_field: backendInvoice.invoiceDate,
            date_field: backendInvoice.date
        });

        const formattedDate = invoiceDate
            ? (new Date(invoiceDate).toISOString().split('T')[0])
            : (new Date().toISOString().split('T')[0]);
        const formattedDueDate = dueDateField
            ? (new Date(dueDateField).toISOString().split('T')[0])
            : (new Date(new Date(invoiceDate || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        console.log('[InvoicesService] Formatted dates:', {
            formattedDate: formattedDate,
            formattedDueDate: formattedDueDate
        });

        // Extract amounts - backend returns grandTotal, subtotal, cgst, sgst
        const grandTotal = Number(backendInvoice.grandTotal || backendInvoice.totalAmount || backendInvoice.amount || 0);
        const paidAmountValue = backendInvoice.status === 'PAID' ? grandTotal : Number(backendInvoice.paidAmount || 0);
        const balanceValue = Math.max(0, grandTotal - paidAmountValue);

        console.log('[InvoicesService] Extracting amounts from:', {
            grandTotal_raw: backendInvoice.grandTotal,
            totalAmount: backendInvoice.totalAmount,
            amount: backendInvoice.amount,
            status: backendInvoice.status,
            paidAmount: backendInvoice.paidAmount,
            grandTotal_calculated: grandTotal,
            paidAmountValue: paidAmountValue,
            balanceValue: balanceValue
        });

        // Extract job card number from jobCard relation if available
        const rawJobCard = backendInvoice.jobCard;
        // Check multiple possible field names for job card number
        const rawJobCardNumber = rawJobCard?.jobCardNumber ||
            rawJobCard?.job_card_number ||
            rawJobCard?.number ||
            null;

        console.log('[InvoicesService] Job card extraction for invoice:', backendInvoice.id, {
            hasJobCard: !!rawJobCard,
            jobCardType: typeof rawJobCard,
            jobCardIsNull: rawJobCard === null,
            jobCardIsUndefined: rawJobCard === undefined,
            jobCardValue: rawJobCard,
            jobCardKeys: rawJobCard ? Object.keys(rawJobCard) : [],
            jobCardNumberRaw: rawJobCardNumber,
            jobCardNumberDirect: rawJobCard?.jobCardNumber,
            jobCardId: backendInvoice.jobCardId || backendInvoice.job_card_id,
            hasJobCardId: !!(backendInvoice.jobCardId || backendInvoice.job_card_id)
        });

        const jobCardNumber = rawJobCardNumber ||
            backendInvoice.jobCardNumber ||
            backendInvoice.job_card_number ||
            null;

        console.log('[InvoicesService] Final extracted jobCardNumber:', jobCardNumber, 'for invoice:', backendInvoice.id);

        // Log service center data for debugging
        console.log('[InvoicesService] Service center data from backend:', {
            hasServiceCenter: !!backendInvoice.serviceCenter,
            serviceCenter: backendInvoice.serviceCenter,
            serviceCenterType: typeof backendInvoice.serviceCenter,
            serviceCenterKeys: backendInvoice.serviceCenter ? Object.keys(backendInvoice.serviceCenter) : [],
            serviceCenterId: backendInvoice.serviceCenterId || backendInvoice.service_center_id,
            serviceCenterName: backendInvoice.serviceCenter?.name,
            serviceCenterAddress: backendInvoice.serviceCenter?.address
        });

        const result: ServiceCenterInvoice = {
            id: backendInvoice.id,
            invoiceNumber: backendInvoice.invoiceNumber || backendInvoice.invoice_number,
            jobCardId: backendInvoice.jobCardId || backendInvoice.job_card_id,
            jobCardNumber: jobCardNumber || undefined, // Add job card number (use undefined instead of null for cleaner checks)
            customerId: backendInvoice.customerId || backendInvoice.customer_id,
            vehicleId: backendInvoice.vehicleId || backendInvoice.vehicle_id,

            // Customer and vehicle information
            customerName: customerName,
            vehicle: vehicleInfo,

            // Dates
            date: formattedDate,
            dueDate: formattedDueDate,

            // Amounts - ensure they're formatted as currency strings
            amount: `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            paidAmount: `₹${paidAmountValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            balance: `₹${balanceValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,

            // Status mapping
            status: (backendInvoice.status === 'PAID' ? 'Paid' :
                backendInvoice.status === 'CANCELLED' ? 'Overdue' :
                    backendInvoice.status === 'UNPAID' ? 'Unpaid' :
                        'Unpaid') as PaymentStatus,
            paymentMethod: backendInvoice.paymentMethod || backendInvoice.payment_method || null,

            serviceCenterId: backendInvoice.serviceCenterId || backendInvoice.service_center_id,
            serviceCenterName: backendInvoice.serviceCenter?.name || backendInvoice.service_center_name,

            // Service center details for invoice display
            // Note: Prisma schema uses pinCode (camelCase), so check both variants
            serviceCenterDetails: backendInvoice.serviceCenter ? {
                name: backendInvoice.serviceCenter.name || '',
                address: backendInvoice.serviceCenter.address || '',
                city: backendInvoice.serviceCenter.city || '',
                state: backendInvoice.serviceCenter.state || '',
                pincode: backendInvoice.serviceCenter.pinCode || backendInvoice.serviceCenter.pincode || '',
                gstNumber: backendInvoice.serviceCenter.gstNumber || '',
                panNumber: backendInvoice.serviceCenter.panNumber || '',
                phone: backendInvoice.serviceCenter.phone || '',
                email: backendInvoice.serviceCenter.email || '',
            } : undefined,

            items: legacyItems,
            enhancedItems: enhancedItems, // Always include even if empty to maintain type consistency

            // Extended fields
            subtotal: Number(backendInvoice.subtotal || 0),
            totalTax: (Number(backendInvoice.cgst || 0) + Number(backendInvoice.sgst || 0) + Number(backendInvoice.igst || 0)),
            grandTotal: grandTotal,
            totalCgst: Number(backendInvoice.cgst || 0),
            totalSgst: Number(backendInvoice.sgst || 0),
            totalIgst: Number(backendInvoice.igst || 0),
        };

        // Log final transformation
        console.log('[InvoicesService] Final transformed invoice:', {
            id: result.id,
            invoiceNumber: result.invoiceNumber,
            enhancedItemsCount: result.enhancedItems?.length || 0,
            legacyItemsCount: result.items?.length || 0,
            hasEnhancedItems: (result.enhancedItems?.length || 0) > 0,
            hasLegacyItems: (result.items?.length || 0) > 0,
            enhancedItems: result.enhancedItems,
            items: result.items
        });

        return result;
    }
}

export const invoicesService = new InvoicesService();
