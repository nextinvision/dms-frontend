# Job Card Parts Documentation

## Complete Job Card Data Structure

The job card follows a multi-part structure based on the physical job card form used in the service center:

---

## Part 1 - Customer & Vehicle Information (Snapshot)

**Storage**: JSON field `part1Data` in JobCard table

**Purpose**: Denormalized snapshot captured at job card creation to preserve historical accuracy. This data does NOT update if customer or vehicle information changes later.

### Complete Fields:

```typescript
{
  // LEFT SIDE - Primary Information
  "fullName": "John Doe",
  "mobilePrimary": "+919876543210",
  "customerType": "B2C" | "B2B",
  "vehicleBrand": "Tesla",
  "vehicleModel": "Model 3",
  "registrationNumber": "MH01AB1234",
  "vinChassisNumber": "VIN12345",
  "variantBatteryCapacity": "Long Range",
  "warrantyStatus": "Active" | "Expired" | "Not Applicable",
  "estimatedDeliveryDate": "2025-12-25",
  
  // RIGHT SIDE
  "customerAddress": "123 Main St, Mumbai, Maharashtra - 400001",
  "jobCardNumber": "SC001-2025-12-0001",
  
  // DETAILS - Text Blocks
  "customerFeedback": "Customer concerns: Strange noise from motor",
  "technicianObservation": "Initial inspection notes",
  "insuranceStartDate": "2023-01-15",
  "insuranceEndDate": "2024-01-15",
  "insuranceCompanyName": "HDFC ERGO",
  
  // MANDATORY SERIAL DATA (EV specific - only if applicable)
  "batterySerialNumber": "BAT123456",
  "mcuSerialNumber": "MCU789012",
  "vcuSerialNumber": "VCU345678",
  "otherPartSerialNumber": "OTH901234"
}
```

---

## Part 2 - Parts & Work Items List

**Storage**: Separate `JobCardItem` table with FK to `jobCardId`

**API**: `GET /api/job-cards/{id}/items` or use `expand=items`

### Fields per Item:

```typescript
{
  "id": "uuid",
  "jobCardId": "uuid",  // FK
  "srNo": 1,  // Auto-increment from 1
  "partWarrantyTag": true,  // Boolean: Under warranty?
  "partName": "Battery Health Check",
  "partCode": "BHC001",
  "qty": 1,
  "amount": 5000,
  "technician": "Mike Johnson",
  "labourCode": "Auto Select With Part" | "LBR-CODE",
  "itemType": "part" | "work_item",
  "serialNumber": "BAT123456",  // Required for warranty parts
  "isWarranty": true
}
```

---

## Part 2A - Warranty/Insurance Case Details

**Storage**: JSON field `part2AData` in JobCard table

**Condition**: Only populated if job card is a warranty or insurance case

### Fields:

```typescript
{
  "videoEvidence": "Yes" | "No",
  "vinImage": "Yes" | "No",
  "odoImage": "Yes" | "No",
  "damageImages": "Yes" | "No",
  "issueDescription": "Motor making unusual noise during acceleration",
  "numberOfObservations": "3",
  "symptom": "High pitched whine during acceleration",
  "defectPart": "Motor Assembly"
}
```

---

## Part 3 - Part Requisition & Issue Details

**Storage**: JSON field `part3Data` in JobCard table

**Purpose**: Tracks parts requested and issued from inventory

### Fields:

```typescript
{
  // Basic Info (duplicated for form reference)
  "customerType": "B2C",
  "vehicleBrand": "Tesla",
  "vehicleModel": "Model 3",
  "registrationNumber": "MH01AB1234",
  "vinChassisNumber": "VIN12345",
  "jobCardNumber": "SC001-2025-12-0001",
  
  // Requisition & Issue Details
  "issueNumber": "ISS-001",
  "issueDate": "2025-12-20",
  "requisitionNumber": "REQ-001",
  "requisitionDate": "2025-12-20",
  "receivedBy": "John Smith",
  "issuedBy": "Inventory Manager",
  
  // Parts tracking
  "parts": [
    {
      "srNo": 1,
      "partName": "Battery Module",
      "partCode": "BM123",
      "requestedQty": 1,
      "issuedQty": 1,
      "returnedQty": 0
    }
  ]
}
```

---

## API Endpoints for Job Card Parts

### Update Part 2A (Warranty Case Details)
```
PATCH /api/job-cards/{id}/warranty-details
Body: { "part2AData": {...} }
```

### Update Part 3 (Requisition Details)
```
PATCH /api/job-cards/{id}/requisition-details
Body: { "part3Data": {...} }
```

### Get Complete Job Card with All Parts
```
GET /api/job-cards/{id}?expand=items,customer,vehicle,engineer

Response includes:
- part1Data (JSON)
- items (array from JobCardItem table)
- part2AData (JSON, if applicable)
- part3Data (JSON, if applicable)
- Expanded relations (customer, vehicle, etc.)
```

---

## Database Schema

```prisma
model JobCard {
  id                 String        @id @default(uuid())
  jobCardNumber      String        @unique
  serviceCenterId    String
  customerId         String
  vehicleId          String
  
  // Part 1 - Snapshot data
  part1Data          Json?
  
  // Part 2 - Relationship to items
  items              JobCardItem[]
  
  // Part 2A - Warranty case data (optional)
  part2AData         Json?
  
  // Part 3 - Requisition data (optional)
  part3Data          Json?
  
  status             JobCardStatus
}

model JobCardItem {
  id              String  @id @default(uuid())
  jobCardId       String
  jobCard         JobCard @relation(fields: [jobCardId], references: [id])
  srNo            Int
  partWarrantyTag Boolean
  partName        String
  partCode        String
  qty             Int
  amount          Decimal
  technician      String?
  labourCode      String?
  itemType        String  // "part" or "work_item"
  serialNumber    String?
  isWarranty      Boolean @default(false)
  
  @@index([jobCardId])
}
```

---

**Key Principle**: Part 1 is a historical snapshot (never updated), while Parts 2, 2A, and 3 can be updated as the job progresses.
