# Create Job Card Form - Comprehensive Analysis

## Executive Summary

The **Create Job Card Form** is a complex, multi-section form designed to capture comprehensive vehicle service information. It follows a structured approach aligned with physical service documentation, organized into distinct "Parts" that mirror the actual Job Card format used in service centers.

---

## Form Architecture

### Component Structure

```
JobCardFormModal (Main Container)
├── Search Section (Create mode only)
├── CustomerVehicleSection (Part 1)
├── Part2ItemsSection (Part 2)
├── DocumentationSection (Part 2A - Warranty/Insurance)
└── CheckInSection (Part 3 - Operational)
```

### State Management Flow

```
1. Initialize Form → useJobCardForm hook
2. Search Integration → Customer/Vehicle/Quotation lookup
3. Hydration (Edit mode) → useHydratedJobCard hook
4. Form Editing → Individual field updates
5. Submission → jobCardAdapter.mapFormToJobCard
6. Normalization → jobCardService (strips redundant data)
7. Persistence → localStorage
```

---

## Detailed Field Analysis

### **Section 1: Customer & Vehicle Information (Part 1)**
**Purpose**: Capture core customer and vehicle master data
**Visual Tag**: Blue circle with "1"

#### Customer Fields (Required *)
| Field | Type | Validation | Purpose |
|-------|------|------------|---------|
| `fullName` * | text | required | Primary customer contact name |
| `customerName` * | text | required | Synced with fullName |
| `mobilePrimary` * | tel | required, 10 digits | Primary contact number |
| `whatsappNumber` | tel | optional | WhatsApp communication |
| `alternateMobile` | tel | optional | Secondary contact |
| `email` | email | optional | Email communication |
| `customerType` | select | B2C/B2B | Business classification |
| `customerAddress` | textarea | optional | Full postal address |

#### Vehicle Identification Fields (Required *)
| Field | Type | Validation | Purpose |
|-------|------|------------|---------|
| `vehicleBrand` * | text | required | Vehicle manufacturer (synced with vehicleMake) |
| `vehicleMake` * | text | required | Same as brand, legacy compatibility |
| `vehicleModel` * | text | required | Vehicle model name |
| `vehicleRegistration` * | text | required, uppercase | License plate number |
| `vinChassisNumber` | text | uppercase | VIN/Chassis for identification |
| `variantBatteryCapacity` | text | optional | EV variant specification |
| `vehicleYear` | number | 1900-2100 | Manufacturing year |

####Additional Vehicle Details
| Field | Type | Purpose |
|-------|------|---------|
| `motorNumber` | text | Electric motor serial number |
| `chargerSerialNumber` | text | Charger unit serial |
| `dateOfPurchase` | date | Original purchase date |
| `vehicleColor` | text | Vehicle color description |
| `warrantyStatus` | text | Active/Expired warranty status |

#### Service Metadata
| Field | Type | Purpose |
|-------|------|---------|
| `customerFeedback` | textarea | Customer complaints/concerns |
| `technicianObservation` | textarea | Initial technician assessment |
| `estimatedDeliveryDate` | date | Expected completion date |

#### Insurance Information
| Field | Type | Purpose |
|-------|------|---------|
| `insuranceStartDate` | date | Insurance policy start |
| `insuranceEndDate` | date | Insurance policy expiry |
| `insuranceCompanyName` | text | Insurance provider |

#### Component Serial Numbers (EV-Specific)
| Field | Type | Purpose |
|-------|------|---------|
| `batterySerialNumber` | text | Battery pack serial |
| `mcuSerialNumber` | text | Motor Control Unit serial |
| `vcuSerialNumber` | text | Vehicle Control Unit serial |
| `otherPartSerialNumber` | text | Other critical component serial |

---

### **Section 2: Parts & Work Items List (Part 2)**
**Purpose**: Document parts to be replaced and labor to be performed
**Visual Tag**: Blue circle with "2"

#### Part2Item Structure
Each item in the `part2Items` array contains:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `srNo` | number | Auto | Sequential number (auto-generated) |
| `itemType` | enum | Yes | "part" or "work_item" |
| `description` | text | Yes | Combined input for parsing |
| `partCode` | text | Yes | Part number/SKU (extracted from description) |
| `partName` | text | Yes | Part description (extracted from description) |
| `partWarrantyTag` | text | No | Warranty tracking number |
| `qty` | number | Yes | Quantity (min: 1) |
| `amount` | number | Yes | Price in ₹ (min: 0) |
| `technician` | text | No | Assigned technician name |
| `labourCode` | text | Auto | "Auto Select With Part" for parts, custom for work items |

#### Smart Parsing Logic
The section includes intelligent parsing:
- **Input Format**: `"2W0000000027_011 - Front Fender"`
- **Auto-extraction**: 
  - `partCode` → `"2W0000000027_011"`
  - `partName` → `"Front Fender"`
  
#### Table Display
Shows all added items with inline edit/delete actions:
- Edit: Pre-fills the form with item data
- Delete: Removes item and re-indexes remaining items
- Total calculation: Sum of all item amounts

---

### **Section 3: Warranty/Insurance Case Details (Part 2A)**
**Purpose**: Document warranty claims and insurance cases with evidence
**Visual Tag**: Amber circle with "2A"

#### Documentation Upload Fields
| Field | Type | Accept | Purpose |
|-------|------|--------|---------|
| `videoEvidence` | File[] | video/* | Video documentation of issues |
| `vinImage` | File[] | image/* | VIN plate photograph |
| `odoImage` | File[] | image/* | Odometer reading photograph |
| `damageImages` | File[] | image/* | Damage/defect photographs |

**Note**: Each field stores both:
- `files`: Array of File objects for upload
- `urls`: Array of URLs for existing uploaded files

#### Case Detail Fields
| Field | Type | Purpose |
|-------|------|---------|
| `issueDescription` | textarea | Detailed problem description |
| `numberOfObservations` | text | Count of documented issues |
| `symptom` | textarea | Observed symptoms |
| `defectPart` | text | Identified defective component |

---

### **Section 4: Operational & Check-in Details (Part 3)**
**Purpose**: Capture operational logistics and check-in information
**Visual Tag**: Blue circle with "3"

#### Pickup/Drop Service
| Field | Type | Conditional | Purpose |
|-------|------|-------------|---------|
| `pickupDropRequired` | boolean | - | Enable pickup/drop fields |
| `pickupAddress` | textarea | If enabled | Pickup location |
| `pickupState` | text | If enabled | Pickup state |
| `pickupCity` | text | If enabled | Pickup city |
| `pickupPincode` | text | If enabled | Pickup postal code |
| `dropAddress` | textarea | If enabled | Drop location |
| `dropState` | text | If enabled | Drop state |
| `dropCity` | text | If enabled | Drop city |
| `dropPincode` | text | If enabled | Drop postal code |

#### Check-in Information
| Field | Type | Options | Purpose |
|-------|------|---------|---------|
| `arrivalMode` | select | vehicle_present / vehicle_absent / check_in_only | How vehicle arrived |
| `checkInNotes` | textarea | - | Additional check-in notes |
| `checkInSlipNumber` | text | - | Generated slip reference |
| `checkInDate` | date | - | Date of check-in |
| `checkInTime` | time | - | Time of check-in |

#### Additional Operational Fields (Not visible but captured)
| Field | Type | Purpose |
|-------|------|---------|
| `previousServiceHistory` | text | Historical service records |
| `odometerReading` | text | Current odometer reading |
| `preferredCommunicationMode` | enum | Phone/Email/SMS/WhatsApp |

---

## Data Flow & Transformations

### 1. **Initialization Flow**

#### Create Mode
```javascript
useJobCardForm() 
  └→ jobCardAdapter.createEmptyForm()
      └→ Returns: CreateJobCardForm with empty/default values
```

#### Edit Mode with Hydration
```javascript
useEffect (load existing JobCard)
  └→ migrateAllJobCards() // Get all job cards
     └→ setExistingJobCard(foundJobCard)

useHydratedJobCard(existingJobCard)
  └→ useQuery(customer data via customerId)
     └→ Merge live customer/vehicle data with JobCard snapshot
        └→ Return hydratedJobCard

useEffect (hydration update)
  └→ jobCardAdapter.mapJobCardToForm(hydratedCard)
     └→ setForm(mappedFormData)
```

**Key Insight**: Edit mode prioritizes live master data over stale snapshots.

### 2. **Search & Pre-fill Flow**

```javascript
// User types in search box
onChange(searchQuery)
  └→ useEffect (debounced 300ms)
      ├→ Search approved Quotations
      │   └→ Filter by quotationNumber
      │      └→ Fetch associated Customer & Vehicle
      │         └→ Create search result { type: 'quotation', quotation, customer, vehicle }
      │
      └→ Search Customers directly
          └→ customerService.search(query)
             └→ Create search result { type: 'customer', customer, vehicle }

// User selects a result
onClick(result)
  ├→ If type === 'quotation'
  │   └→ handleSelectQuotation(quotation, customer, vehicle)
  │       └→ jobCardAdapter.mapQuotationToForm()
  │          └→ Updates form with quotation line items → part2Items
  │                customer details → Part 1 fields
  │                vehicle details → Part 1 fields
  │
  └→ If type === 'customer'
      └→ handleSelectCustomer(customer, vehicle)
          └→ jobCardAdapter.mapCustomerToForm()
             └→ Updates form with customer details → Part 1 fields
                                  vehicle details → Part 1 fields
```

### 3. **Submission & Persistence Flow**

```javascript
handleSubmit(e)
  └→ Validate required fields (customerName, description)
     └→ jobCardAdapter.mapFormToJobCard(form, serviceCenterId, serviceCenterCode, existingJobCard)
        ├→ Generate jobCardNumber (if new)
        ├→ Construct Part 1 object from form fields
        ├→ Construct Part 2 array (part2Items with srNo)
        ├→ Construct Part 2A object (documentation metadata)
        └→ Construct Part 3 object (operational details)
        
        └→ Returns: Complete JobCard object
           ├─ Legacy fields (customerId, customerName, vehicle, registration...)
           ├─ Master data snapshot (customerWhatsappNumber, vehicleYear...)
           ├─ part1 (CustomerFeedback, vinChassisNumber, warranties...)
           ├─ part2 (Array of part items)
           ├─ part2A (Evidence metadata)
           └─ part3 (Operational logistics)

     └→ jobCardService.create/update(jobCard)
        └→ normalizeJobCard(jobCard) // Strip redundant master data
           └→ Removes: customerName, vehicle, registration, vehicleMake/Model, 
                       customerEmail, customerWhatsappNumber, customerAlternateMobile
           └→ Keeps: All process data + reference IDs (customerId, vehicleId)
        
        └→ localStorage.setItem("jobCards", updatedArray)
```

### 4. **Normalization Strategy** (New)

**Purpose**: After implementing normalized data flow, the service layer auto-strips redundant fields.

**What gets normalized out**:
- Customer master data: `customerName`, `customerEmail`, `customerWhatsappNumber`, `customerAlternateMobile`
- Vehicle master data: `vehicle`, `registration`, `vehicleMake`, `vehicleModel`

**What remains**:
- Reference IDs: `customerId`, `vehicleId`
- Process data: All Part 1, 2, 2A fields that are specific to this service instance
- Workflow data: Status, assigned technician, timestamps

**Benefit**: When displaying a Job Card, the app fetches live customer/vehicle data using the IDs.

---

## Smart Features

### 1. **Auto-fill from Quotations**
When a quotation is selected:
- Pre-populates all customer/vehicle fields
- Maps quotation line items → `part2Items`
- Includes insurance details if present
- Sets quotation-specific notes as descriptions

### 2. **Customer Search Integration**
- Searches by: Name, Phone, VIN, Quotation Number
- Debounced (300ms) to reduce API calls
- Shows both quotations and direct customers
- Visual differentiation: Green badge (Quotation), Blue badge (Customer)

### 3. **Part Description Parsing**
- Smart extraction from format: `CODE - Name`
- Autocompletes `partCode` and `partName` fields
- Reduces manual data entry errors

### 4. **Check-in Slip Generation**
- Button: "Generate Check-in Slip"
- Creates printable slip with:
  - Auto-generated slip number (format: `CIS-SC001-2025-0001`)
  - Customer & vehicle info
  - Current date/time
  - Service type
- Opens in modal for printing

### 5. **Conditional Pickup/Drop Fields**
- Toggle: `pickupDropRequired` checkbox
- Shows/hides pickup and drop address fields dynamically
- Saves form space when not needed

### 6. **Real-time Job Card Number Preview**
- Displays in header: "Job Card: JC-SC001-2025-0001"
- Auto-generates using service center context
- Different for create (new number) vs edit (existing number)

---

## Validation Rules

### Client-Side Validation
1. **Required Fields**:
   - `customerName` / `fullName`
   - `mobilePrimary`
   - `vehicleBrand` / `vehicleMake`
   - `vehicleModel`
   - `vehicleRegistration`
   - `description` (service type/feedback)

2. **Format Validation**:
   - Phone numbers: 10 digits
   - Vehicle registration: Uppercase auto-conversion
   - VIN: Uppercase auto-conversion
   - Vehicle year: 1900-2100 range
   - Numeric fields: qty (min: 1), amount (min: 0)

3. **Part 2 Item Validation**:
   - `partName` and `partCode` required before adding
   - Error message shown if missing

### Server-Side/Business Rules  
- Job Card number must be unique
- Duplicate `vinChassisNumber` may trigger warning
- Service center context must be valid

---

## Integration Points

### API/Service Dependencies
1. **customerService.getById()** - Fetch customer master data
2. **customerService.search()** - Search customers by query
3. **jobCardService.create()** - Create new job card (with normalization)
4. **jobCardService.update()** - Update existing job card (with normalization)
5. **createPartsRequestFromJobCard()** - Generate parts requisition from selectedParts

### Context Dependencies
1. **serviceCenterContext** - Determines service center ID for job card numbering
2. **userRole** - (Not visible in form, but affects permissions)

### Storage Dependencies
1. **localStorage** - Used for:
   - `"jobCards"` - All job card records
   - `"quotations"` - For search integration
   - `"customers"` - Customer master data

---

## UI/UX Design Patterns

### Visual Hierarchy
1. **Section Markers**: Colored numbered badges (1, 2, 2A, 3)
2. **Color Coding**:
   - Blue: Standard sections (1, 3)
   - Amber: Warranty/Insurance section (2A)
   - Green: Action buttons ("Add Item")
   - Gray: Cancel/secondary actions

### Responsive Design
- Grid layouts: `grid-cols-1 lg:grid-cols-2`
- Mobile-first approach
- Scrollable form body with sticky header/footer
- Max height: 90vh with overflow handling

### Interactive Elements
1. **File Upload**: 
   - Drag-and-drop zones (dashed borders)
   - Visual feedback on file count
   - Accept attributes for file type filtering

2. **Table Actions**:
   - Inline edit/delete buttons with icons
   - Hover states for better UX
   - Color-coded item types (Part: green, Work Item: purple)

3. **Modal Management**:
   - Fixed overlay with backdrop blur
   - Z-index: 50 (high priority)
   - Click outside to close (handled by parent)

---

## Technical Debt & Improvement Opportunities

### Current Issues
1. **Media Handling**: Files stored in browser memory, not uploaded to server
2. **Snapshot Data**: Despite normalization layer, form still captures all master data
3. **Search Performance**: No pagination in search results
4. **Part Code Parsing**: Regex-based, may fail on non-standard formats

### Recommended Enhancements
1. **File Upload Integration**: 
   - Implement file upload to blob storage (S3, Azure Blob)
   - Store URLs instead of File objects
   - Add progress indicators

2. **Advanced Part Search**:
   - Integrate with parts master catalog
   - Auto-suggest part codes as user types
   - Real-time price lookup

3. **Validation Improvements**:
   - Real-time VIN validation (check-digit algorithm)
   - Duplicate registration warning
   - Customer phone number conflict detection

4. **Accessibility**:
   - ARIA labels for screen readers
   - Keyboard navigation improvements
   - Focus management in modals

5. **Performance**:
   - Virtual scrolling for large part lists
   - Code splitting for section components
   - Memoization of expensive computations

---

## Summary

The Create Job Card Form is a **comprehensive, production-grade form system** that:
- ✅ Handles complex multi-section data capture
- ✅ Integrates seamlessly with customer/vehicle/quotation data
- ✅ Implements smart auto-fill and parsing features
- ✅ Supports both create and edit workflows with data hydration
- ✅ Normalizes data to prevent redundancy and staleness
- ✅ Provides rich UI/UX with conditionalrendering and validation
- ⚠️ Has some technical debt around file handling and validation

**Total Field Count**: **70+ fields** across 4 major sections
**Mandatory Fields**: **6 fields** (customer name, mobile, vehicle brand, model, registration, description)
**Optional Fields**: **64+ fields** for comprehensive documentation

This form serves as the **central data entry point** for all service workflows, ensuring complete, accurate, and auditable service records.
