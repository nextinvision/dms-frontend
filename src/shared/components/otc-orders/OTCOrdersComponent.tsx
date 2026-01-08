"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ShoppingCart,
  PlusCircle,
  Search,
  X,
  Trash2,
  Percent,
  FileText,
  CheckCircle,
  User,
  Car,
  Package,
} from "lucide-react";
import type { OTCPart, CartItem, CustomerInfo, InvoiceData } from "@/shared/types";
import { useToastStore } from "@/store/toastStore";
import { invoiceService } from "@/features/inventory/services/invoice.service";
import { customerService } from "@/features/customers/services/customer.service";
import { getServiceCenterContext } from "@/shared/lib/serviceCenter";
import { apiClient } from "@/core/api/client";
import { useAuthStore } from "@/store/authStore";
import { partsMasterService } from "@/features/inventory/services/partsMaster.service";
import type { Part } from "@/features/inventory/types/inventory.types";

export default function OTCOrdersComponent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCart, setShowCart] = useState<boolean>(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    phone: "",
    name: "",
    vehicleNumber: "",
    vin: "",
  });
  const [discount, setDiscount] = useState<number>(0);
  const [invoiceType, setInvoiceType] = useState<'OTC_ORDER' | 'JOB_CARD'>('OTC_ORDER');
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState<boolean>(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [customerFound, setCustomerFound] = useState<boolean>(false);
  const [availableParts, setAvailableParts] = useState<OTCPart[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState<boolean>(true);
  const { showSuccess, showError, showWarning } = useToastStore();
  const { userRole } = useAuthStore();
  const isInventoryManager = userRole === 'inventory_manager';

  // Fetch parts from parts master
  useEffect(() => {
    const fetchParts = async () => {
      try {
        setIsLoadingParts(true);
        const parts: Part[] = await partsMasterService.getAll();

        // Map Part to OTCPart
        const otcParts: OTCPart[] = parts.map((part, index) => {
          // Generate a unique numeric ID from the string ID
          // Use hash of the string ID to ensure uniqueness
          let numericId = index + 1;
          if (part.id) {
            // Create a hash from the string ID
            const hash = part.id.split('').reduce((acc, char) => {
              return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
            }, 0);
            numericId = Math.abs(hash) || index + 1;
          }

          return {
            id: numericId,
            name: part.partName,
            hsnCode: part.oemPartNumber || part.partNumber || part.partId || `PART-${numericId}`,
            price: part.unitPrice || part.price || 0,
            stock: part.stockQuantity || 0,
            category: part.category || "Uncategorized",
          };
        });

        setAvailableParts(otcParts);
      } catch (error) {
        console.error("Failed to fetch parts:", error);
        showError("Failed to load parts. Please try again.");
        setAvailableParts([]);
      } finally {
        setIsLoadingParts(false);
      }
    };

    fetchParts();
  }, [showError]);

  const filteredParts = availableParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.hsnCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (part: OTCPart): void => {
    const existingItem = cart.find((item) => item.id === part.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...part, quantity: 1 }]);
    }
    setShowCart(true);
  };

  const removeFromCart = (id: number): void => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(
      cart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const tax = ((subtotal - discountAmount) * 18) / 100; // 18% GST
  const total = subtotal - discountAmount + tax;

  // Debounced customer search
  const searchCustomerByPhone = useCallback(async (phone: string) => {
    // Clean phone number but preserve digits
    const cleanedPhone = phone.replace(/[\s-+().]/g, "").trim();

    // Only search if phone has at least 3 digits
    if (cleanedPhone.length < 3) {
      setCustomerSearchResults([]);
      setCustomerFound(false);
      return;
    }

    setIsSearchingCustomer(true);
    try {
      // Use cleaned phone for search
      const customers = await customerService.search(cleanedPhone, 'phone');

      // Ensure customers is an array
      const customersArray = Array.isArray(customers) ? customers : [];

      if (customersArray.length > 0) {
        // Customer found - auto-populate name
        const foundCustomer = customersArray[0];
        setCustomerInfo(prev => ({
          ...prev,
          name: foundCustomer.name || prev.name,
        }));
        setCustomerFound(true);
        setCustomerSearchResults(customersArray);
      } else {
        // Customer not found - will be created automatically
        setCustomerFound(false);
        setCustomerSearchResults([]);
      }
    } catch (error: any) {
      // Handle 403 errors gracefully - backend may need restart
      if (error?.status === 403 || error?.code === 'HTTP_403') {
        // Silently fail - user can still proceed with manual entry
        // The customer will be created during invoice save if they have permission
        console.warn("Customer search permission denied. Backend may need restart to apply permission changes.");
        setCustomerFound(false);
        setCustomerSearchResults([]);
      } else {
        console.warn("Customer search failed:", error);
        setCustomerFound(false);
        setCustomerSearchResults([]);
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  }, []);

  // Debounce timer ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle phone number change with debounced search
  const handlePhoneChange = useCallback((phone: string) => {
    setCustomerInfo(prev => ({ ...prev, phone }));
    setCustomerFound(false);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      searchCustomerByPhone(phone);
    }, 500); // Wait 500ms after user stops typing
  }, [searchCustomerByPhone]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleGenerateInvoice = useCallback((): void => {
    if (cart.length === 0) {
      showWarning("Cart is empty!");
      return;
    }
    // Generate invoice data only when handler is called (not during render)
    const now = Date.now();
    const currentDate = new Date();
    const invoice: InvoiceData = {
      invoiceNumber: `OTC-${now}`,
      date: currentDate.toLocaleDateString("en-IN"),
      customer: customerInfo,
      items: cart,
      subtotal,
      discount,
      discountAmount,
      tax,
      total,
      invoiceType: invoiceType,
    };
    setInvoiceData(invoice);
    setShowInvoice(true);
  }, [cart, customerInfo, subtotal, discount, discountAmount, tax, total, invoiceType]);

  const handlePaymentMethodSelect = (method: string): void => {
    setSelectedPaymentMethod(method);
    setShowConfirmDialog(true);
  };

  const handleConfirmPayment = async (): Promise<void> => {
    if (!invoiceData) return;

    setIsSaving(true);

    let invoicePayload: any = null;

    try {
      const context = getServiceCenterContext();
      if (!context.serviceCenterId) {
        throw new Error("Service Center ID not found. Please ensure you are assigned to a service center.");
      }

      // Ensure serviceCenterId is a string
      const serviceCenterId = String(context.serviceCenterId);

      // Find or create customer
      let customerId: string | undefined;

      // Clean phone number for search
      const cleanedPhone = invoiceData.customer.phone.replace(/[\s-+().]/g, "").trim();
      if (!cleanedPhone || cleanedPhone.length < 10) {
        throw new Error("Customer phone number is required (minimum 10 digits)");
      }

      // Get customer name - use provided name or default
      const customerName = invoiceData.customer.name?.trim() || 'Walk-in Customer';

      // Try to find existing customer first
      let customerFound = false;
      let searchAttempted = false;
      let lastSearchError: any = null;

      // First, try searching by phone number
      try {
        searchAttempted = true;
        const customers = await customerService.search(cleanedPhone, 'phone');
        const customersArray = Array.isArray(customers) ? customers : [];

        if (customersArray.length > 0) {
          customerId = String(customersArray[0].id);
          customerFound = true;
          console.log("Customer found by phone:", customerId);
        } else {
          console.log("Customer search returned no results for phone:", cleanedPhone);

          // If phone search fails and we have a customer name, try searching by name
          if (customerName && customerName.trim() && customerName !== 'Walk-in Customer') {
            try {
              console.log("Trying to search customer by name:", customerName);
              const nameCustomers = await customerService.search(customerName.trim(), 'name');
              const nameCustomersArray = Array.isArray(nameCustomers) ? nameCustomers : [];

              // Try to find a match that also has the same phone (if available in results)
              const matchingCustomer = nameCustomersArray.find((c: any) =>
                c.phone && c.phone.replace(/[\s-+().]/g, "").trim() === cleanedPhone
              ) || nameCustomersArray[0];

              if (matchingCustomer) {
                customerId = String(matchingCustomer.id);
                customerFound = true;
                console.log("Customer found by name:", customerId);
              }
            } catch (nameSearchError: any) {
              console.warn("Customer search by name also failed:", nameSearchError);
            }
          }
        }
      } catch (searchError: any) {
        searchAttempted = true;
        lastSearchError = searchError;
        // If search fails due to permission (403), handle based on role
        if ((searchError?.status === 403 || searchError?.code === 'HTTP_403') && isInventoryManager) {
          throw new Error("You don't have permission to search customers. Please contact your administrator.");
        }
        // For other errors, log but continue
        console.warn("Customer search failed:", searchError);
      }

      // If customer not found, automatically create customer for all roles
      if (!customerFound) {
        // Automatically create customer with provided name and phone
        try {
          console.log("Customer not found, creating new customer:", { name: customerName, phone: cleanedPhone });
          const newCustomer = await customerService.create({
            name: customerName,
            phone: cleanedPhone,
            customerType: 'B2C',
          });
          customerId = String(newCustomer.id);
          console.log("Customer created successfully:", customerId);
        } catch (createError: any) {
          // Check if it's a permission error
          if (createError?.status === 403 || createError?.code === 'HTTP_403') {
            const phoneDisplay = cleanedPhone.length >= 10
              ? `${cleanedPhone.substring(0, 3)}****${cleanedPhone.substring(cleanedPhone.length - 3)}`
              : cleanedPhone;
            throw new Error(
              `You don't have permission to create customers. ` +
              `Customer not found for phone: ${phoneDisplay}${customerName && customerName !== 'Walk-in Customer' ? ` and name: ${customerName}` : ''}. ` +
              `Please contact your administrator or ensure the customer exists in the system.`
            );
          }
          const errorMsg = createError?.response?.data?.message || createError?.message || 'Unknown error';
          console.error("Failed to create customer:", createError);
          throw new Error(`Failed to create customer: ${errorMsg}`);
        }
      }

      // Ensure customerId is set before proceeding
      if (!customerId) {
        throw new Error("Failed to get or create customer ID");
      }

      // Find or create vehicle
      let vehicleId: string;
      try {
        if (invoiceData.customer.vehicleNumber && invoiceData.customer.vehicleNumber.trim()) {
          try {
            const vehiclesResponse = await apiClient.get<{ data?: any[] } | any[]>('/vehicles', {
              params: { search: invoiceData.customer.vehicleNumber.trim() },
            });

            // Handle response structure - backend returns { data: [], pagination: {} } or direct array
            let vehicles: any[] = [];
            if (Array.isArray(vehiclesResponse.data)) {
              vehicles = vehiclesResponse.data;
            } else if (vehiclesResponse.data && typeof vehiclesResponse.data === 'object') {
              if ('data' in vehiclesResponse.data && Array.isArray(vehiclesResponse.data.data)) {
                vehicles = vehiclesResponse.data.data;
              } else if (Array.isArray((vehiclesResponse.data as any).data)) {
                vehicles = (vehiclesResponse.data as any).data;
              }
            }

            const existingVehicle = vehicles.find(
              (v: any) => v.registration?.toLowerCase() === invoiceData.customer.vehicleNumber.toLowerCase().trim()
            );

            if (existingVehicle) {
              vehicleId = String(existingVehicle.id);
            } else {
              // Vehicle not found - create new vehicle automatically for all roles
              try {
                console.log("Vehicle not found, creating new vehicle:", invoiceData.customer.vehicleNumber);
                const newVehicleResponse = await apiClient.post<any>('/vehicles', {
                  customerId,
                  registration: invoiceData.customer.vehicleNumber.trim(),
                  vin: invoiceData.customer.vin || `VIN-${Date.now()}`,
                  vehicleMake: 'Unknown',
                  vehicleModel: 'Unknown',
                  vehicleYear: new Date().getFullYear(),
                });
                vehicleId = String(newVehicleResponse.data?.id || newVehicleResponse.data);
                console.log("Vehicle created successfully:", vehicleId);
              } catch (createError: any) {
                if (createError?.status === 403 || createError?.code === 'HTTP_403') {
                  throw new Error("You don't have permission to create vehicles. Please contact your administrator.");
                }
                const errorMsg = createError?.response?.data?.message || createError?.message || 'Unknown error';
                throw new Error(`Failed to create vehicle: ${errorMsg}`);
              }
            }
          } catch (searchError: any) {
            // Check if it's a permission error
            if (searchError?.status === 403 || searchError?.code === 'HTTP_403') {
              // If search fails due to permission, try to create vehicle anyway
              console.warn("Vehicle search permission denied, attempting to create vehicle:", searchError);
            } else {
              // For other errors, log but try to create vehicle
              console.warn("Vehicle search failed, attempting to create vehicle:", searchError);
            }

            // Try to create vehicle even if search fails (for all roles)
            try {
              const newVehicleResponse = await apiClient.post<any>('/vehicles', {
                customerId,
                registration: invoiceData.customer.vehicleNumber.trim(),
                vin: invoiceData.customer.vin || `VIN-${Date.now()}`,
                vehicleMake: 'Unknown',
                vehicleModel: 'Unknown',
                vehicleYear: new Date().getFullYear(),
              });
              vehicleId = String(newVehicleResponse.data?.id || newVehicleResponse.data);
              console.log("Vehicle created after search failure:", vehicleId);
            } catch (createError: any) {
              if (createError?.status === 403 || createError?.code === 'HTTP_403') {
                throw new Error("You don't have permission to create vehicles. Please contact your administrator.");
              }
              const errorMsg = createError?.response?.data?.message || createError?.message || 'Unknown error';
              throw new Error(`Failed to create vehicle: ${errorMsg}`);
            }
          }
        } else {
          // Vehicle number is optional for OTC orders - create a default vehicle for walk-in customers
          try {
            console.log("No vehicle number provided, creating default walk-in vehicle");
            const newVehicleResponse = await apiClient.post<any>('/vehicles', {
              customerId,
              registration: `WALK-IN-${Date.now()}`,
              vin: `VIN-WALK-IN-${Date.now()}`,
              vehicleMake: 'Unknown',
              vehicleModel: 'Unknown',
              vehicleYear: new Date().getFullYear(),
            });
            vehicleId = String(newVehicleResponse.data?.id || newVehicleResponse.data);
            console.log("Default vehicle created successfully:", vehicleId);
          } catch (createError: any) {
            // Check if it's a permission error
            if (createError?.status === 403 || createError?.code === 'HTTP_403') {
              throw new Error(
                `You don't have permission to create vehicles. ` +
                `Please provide a vehicle number or contact your administrator.`
              );
            }
            const errorMsg = createError?.response?.data?.message || createError?.message || 'Unknown error';
            console.error("Failed to create default vehicle:", createError);
            throw new Error(`Failed to create vehicle: ${errorMsg}`);
          }
        }
      } catch (vehicleError: any) {
        console.error("Failed to find/create vehicle:", vehicleError);
        const errorMsg = vehicleError?.message || vehicleError?.response?.data?.message || 'Unknown error';
        throw new Error(`Failed to find/create vehicle: ${errorMsg}`);
      }

      // Prepare invoice items for backend
      const invoiceItems = invoiceData.items.map((item) => {
        const itemDto: any = {
          name: String(item.name),
          unitPrice: Number(item.price), // Ensure it's a number
          quantity: Number(item.quantity), // Ensure it's a number
          gstRate: 18, // 18% GST
        };
        // Only add hsnSacCode if it exists and is not empty
        if (item.hsnCode && item.hsnCode.trim()) {
          itemDto.hsnSacCode = String(item.hsnCode.trim());
        }
        return itemDto;
      });

      // Validate invoice items
      if (!invoiceItems || invoiceItems.length === 0) {
        throw new Error("Invoice must have at least one item");
      }

      // Validate all required fields are present
      if (!serviceCenterId || !customerId || !vehicleId) {
        throw new Error("Missing required fields: serviceCenterId, customerId, or vehicleId");
      }

      // Save invoice to database
      invoicePayload = {
        serviceCenterId: serviceCenterId,
        customerId: String(customerId),
        vehicleId: String(vehicleId),
        invoiceType: (invoiceData.invoiceType || 'OTC_ORDER') as 'OTC_ORDER' | 'JOB_CARD',
        items: invoiceItems,
      };

      console.log("Creating invoice with payload:", JSON.stringify(invoicePayload, null, 2));

      // Validate payload before sending
      if (!invoicePayload.serviceCenterId || !invoicePayload.customerId || !invoicePayload.vehicleId) {
        throw new Error("Invalid invoice payload: missing required IDs");
      }
      if (!invoicePayload.items || invoicePayload.items.length === 0) {
        throw new Error("Invalid invoice payload: no items");
      }

      const savedInvoice = await invoiceService.createInvoice(invoicePayload);
      console.log("Invoice saved successfully:", savedInvoice);

      // Show success toast
      showSuccess("Invoice saved successfully!");

      // Reset everything
      setCart([]);
      setCustomerInfo({ phone: "", name: "", vehicleNumber: "", vin: "" });
      setDiscount(0);
      setInvoiceType('OTC_ORDER');
      setShowInvoice(false);
      setShowCart(false);
      setSelectedPaymentMethod(null);
      setShowConfirmDialog(false);
      setInvoiceData(null);
    } catch (error: any) {
      console.error("Failed to save invoice:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        userRole: userRole,
        payload: invoicePayload,
      });

      // Handle 403 Forbidden errors specifically
      if (error?.status === 403 || error?.code === 'HTTP_403' || error?.response?.status === 403) {
        const roleMessage = userRole ? `Your role: ${userRole}. ` : '';
        showError(`${roleMessage}You don't have permission to create invoices. Please contact your administrator or ensure your role has invoice creation permissions.`);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || error?.response?.data?.error || "Failed to save invoice. Please try again.";
        showError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPayment = (): void => {
    setSelectedPaymentMethod(null);
    setShowConfirmDialog(false);
  };

  return (
    <div className="bg-[#f9f9fb] min-h-screen">
      <div className="pt-6 pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">OTC Orders</h1>
          <p className="text-gray-500">Over-the-counter parts sales - Quick transaction processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parts Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search parts by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Parts List */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Available Parts {isLoadingParts && <span className="text-sm text-gray-500">(Loading...)</span>}
              </h2>
              {isLoadingParts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Loading parts...</span>
                </div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="mx-auto mb-2" size={48} />
                  <p className="text-sm">
                    {searchQuery ? "No parts found matching your search." : "No parts available in inventory."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredParts.map((part) => (
                    <div
                      key={part.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="text-gray-400" size={20} />
                            <div>
                              <p className="font-semibold text-gray-800">{part.name}</p>
                              <p className="text-xs text-gray-500">
                                HSN Code: {part.hsnCode} • {part.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-semibold text-gray-800">₹{part.price}</span>
                            <span
                              className={`${part.stock > 0 ? "text-green-600" : "text-red-600"
                                }`}
                            >
                              Stock: {part.stock}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(part)}
                          disabled={part.stock === 0}
                          className={`px-4 py-2 rounded-lg font-medium transition ${part.stock > 0
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart & Customer Info */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" size={24} />
                  Cart ({cart.length})
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="mx-auto mb-2" size={48} />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">HSN Code: {item.hsnCode}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({discount}%)</span>
                    <span className="font-medium text-green-600">
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total</span>
                    <span className="text-blue-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="text-purple-600" size={24} />
                Customer Information
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Type *
                </label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as 'OTC_ORDER' | 'JOB_CARD')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="OTC_ORDER">OTC Order Invoice</option>
                  <option value="JOB_CARD">Job Card Invoice</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the type of invoice being generated
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="10-digit phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {customerFound && !isSearchingCustomer && customerInfo.phone.length >= 3 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="text-green-600" size={18} />
                      </div>
                    )}
                  </div>
                  {customerFound && !isSearchingCustomer && (
                    <p className="text-xs text-green-600 mt-1">✓ Customer found in database</p>
                  )}
                  {!customerFound && !isSearchingCustomer && customerInfo.phone.length >= 10 && (
                    <p className="text-xs text-blue-600 mt-1">ℹ New customer will be created automatically</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    placeholder="Enter customer name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerInfo.vehicleNumber}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        vehicleNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., PB10AB1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setDiscount(5)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      5%
                    </button>
                    <button
                      onClick={() => setDiscount(10)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      10%
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max discount: 15% (Inventory Manager approval needed above 5%)
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Invoice Button */}
            {cart.length > 0 && (
              <button
                onClick={handleGenerateInvoice}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2"
              >
                <FileText size={20} />
                Generate Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative z-[10000]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Invoice</h2>
              <button
                onClick={() => setShowInvoice(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="border-b border-gray-200 pb-4">
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-xl font-bold text-gray-800">{invoiceData.invoiceNumber}</p>
                <p className="text-sm text-gray-600 mt-1">Date: {invoiceData.date}</p>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Customer Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Name:</strong> {invoiceData.customer.name || "Walk-in Customer"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Phone:</strong> {invoiceData.customer.phone || "N/A"}
                  </p>
                  {invoiceData.customer.vehicleNumber && (
                    <p className="text-sm text-gray-700">
                      <strong>Vehicle:</strong> {invoiceData.customer.vehicleNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                          Item
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                          Price
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoiceData.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-center text-gray-700">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700">
                            ₹{item.price}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-800">
                            ₹{item.price * item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{invoiceData.subtotal.toFixed(2)}</span>
                </div>
                {invoiceData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({invoiceData.discount}%)</span>
                    <span className="font-medium text-green-600">
                      -₹{invoiceData.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{invoiceData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{invoiceData.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["Cash", "Card", "UPI", "Online"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => handlePaymentMethodSelect(method)}
                      disabled={isSaving}
                      className={`px-4 py-2 border rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${selectedPaymentMethod === method
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-blue-50 hover:border-blue-500"
                        }`}
                    >
                      {isSaving && selectedPaymentMethod === method ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </span>
                      ) : (
                        method
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && invoiceData && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[10001] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative z-[10002]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Confirm Payment</h3>
                <p className="text-sm text-gray-500">Please confirm the payment method</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{invoiceData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice Type:</span>
                <span className="font-medium">
                  {invoiceData.invoiceType === 'OTC_ORDER' ? 'OTC Order Invoice' : 'Job Card Invoice'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{selectedPaymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-blue-600">₹{invoiceData.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPayment}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

