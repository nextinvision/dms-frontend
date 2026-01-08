# Invoice Fix Instructions

## Changes Needed in page.tsx

### 1. In handleGenerateInvoice function (around lines 406-436):

Replace the existing ID fetching logic with:

```typescript
// Get service center details
const contextServiceCenterId = String(serviceCenterContext.serviceCenterId ?? "1");

// Use IDs from form state (already populated when creating from job card)
const customerId = invoiceForm.customerId;
const vehicleId = invoiceForm.vehicleId;

// Get job card ID from query params if creating from job card
let jobCardIdUUID: string | undefined;
const createFromJobCardId = searchParams?.get("createFromJobCard");
if (createFromJobCardId) {
  jobCardIdUUID = createFromJobCardId;
}

// If we don't have the required IDs, show error
if (!customerId || !vehicleId) {
  alert("Missing customer or vehicle information. Please create the invoice from a completed job card.");
  return;
}
```

### 2. In the form reset (around line 465):

Add the two new fields to the reset:

```typescript
setInvoiceForm({
  customerName: "",
  vehicle: "",
  jobCardId: "",
  customerId: "",  // ADD THIS
  vehicleId: "",   // ADD THIS  
  date: new Date().toISOString().split("T")[0],
  dueDate: "",
  items: [{ name: "", qty: 1, price: "", hsnSacCode: "", gstRate: 18 }],
  paymentMethod: "",
  gstRequirement: false,
  businessNameForInvoice: "",
  customerGstNumber: "",
  customerPanNumber: "",
  customerAddress: "",
  customerState: "",
  placeOfSupply: "",
  discount: 0,
});
```

## Summary of Changes

1. Added `customerId` and `vehicleId` to form state (DONE ✓)
2. Populated these IDs when loading from job card (DONE ✓) 
3. Use these stored IDs instead of fetching from job card again (NEEDS MANUAL FIX)
4. Add these fields to form reset (NEEDS MANUAL FIX)
5. Removed all localStorage usage (NEEDS MANUAL FIX - Remove lines that use safeStorage)

## Next Steps

The customer and vehicle IDs are now being stored in the form. The issue is that the handleGenerateInvoice function still tries to fetch the job card again instead of using the stored IDs.

Please manually update lines 409-430 to use the simpler logic shown in section 1 above.
