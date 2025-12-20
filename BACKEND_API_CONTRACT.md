# DMS Backend API Contract - Ready for Integration

> **Purpose**: Complete API specification following database normalization principles
> **Backend Stack**: NestJS + Prisma + PostgreSQL
> **Design Principle**: Foreign keys for relationships, expand/populate on read
> **Last Updated**: 2025-12-20

---

## 1. API RESPONSE FORMAT (CRITICAL)

### Standard Response Wrapper
```typescript
// SUCCESS Response
{
  "data": T,              // Actual response data
  "message": "Success",   // Optional message
  "success": true
}

// ERROR Response (with appropriate HTTP status code)
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 400,
  "errors": {             // Optional validation errors
    "field1": ["error1", "error2"],
    "field2": ["error3"]
  }
}
```

### Pagination Response
```typescript
{
  "data": T[],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 2. AUTHENTICATION & AUTHORIZATION

### Auth Endpoints

#### POST `/api/auth/login`
```typescript
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "service_advisor",
      "serviceCenterId": "uuid"  // Foreign key reference only
    }
  },
  "success": true
}
```

#### POST `/api/auth/refresh`
```typescript
// Request
{
  "refreshToken": "refresh_token_here"
}

// Response
{
  "data": {
    "accessToken": "new_jwt_token"
  },
  "success": true
}
```

#### GET `/api/auth/me`
```typescript
// Headers: Authorization: Bearer {token}
// Response
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "service_advisor",
    "serviceCenterId": "uuid"
  },
  "success": true
}

// With expand: GET /api/auth/me?expand=serviceCenter
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "service_advisor",
    "serviceCenterId": "uuid",
    "serviceCenter": {
      "id": "uuid",
      "name": "SC001 - Main Center",
      "code": "SC001"
    }
  },
  "success": true
}
```

### Role-Based Access
```typescript
enum UserRole {
  ADMIN = "admin",
  SC_MANAGER = "sc_manager",
  SERVICE_ENGINEER = "service_engineer",
  SERVICE_ADVISOR = "service_advisor",
  CALL_CENTER = "call_center",
  INVENTORY_MANAGER = "inventory_manager",
  CENTRAL_INVENTORY_MANAGER = "central_inventory_manager"
}
```

---

## 3. CUSTOMERS API

### POST `/api/customers` - Create Customer
```typescript
// Request - ONLY required and new customer data
{
  "name": "John Doe",
  "phone": "+919876543210",
  "whatsappNumber": "+919876543210",  // Optional
  "alternateNumber": "+919876543210", // Optional
  "email": "john@example.com",        // Optional
  "address": "123 Main St",           // Optional
  "customerType": "B2C"               // Optional, default B2C
  // NO lastServiceCenterId - will be set when first service is created
}

// Response
{
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-0001",
    "name": "John Doe",
    "phone": "+919876543210",
    "whatsappNumber": "+919876543210",
    "alternateNumber": "+919876543210",
    "email": "john@example.com",
    "address": "123 Main St",
    "customerType": "B2C",
    "lastServiceCenterId": null,  // null initially
    "lastServiceDate": null,      // null until first service
    "lastInvoiceNumber": null,    // null until first invoice
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

### GET `/api/customers/{id}` - Get Single Customer
```typescript
// Simple: GET /api/customers/{id}
{
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-0001",
    "name": "John Doe",
    "phone": "+919876543210",
    "whatsappNumber": "+919876543210",
    "alternateNumber": "+919876543210",
    "email": "john@example.com",
    "address": "123 Main St",
    "cityState": "Mumbai, Maharashtra",
    "pincode": "400001",
    "customerType": "B2C",
    "lastServiceCenterId": "uuid",  // Foreign key only
    "lastServiceDate": "2024-11-20",
    "lastInvoiceNumber": "INV-2024-001",
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}

// With basic expand: GET /api/customers/{id}?expand=vehicles,lastServiceCenter
{
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-0001",
    "name": "John Doe",
    "phone": "+919876543210",
    "whatsappNumber": "+919876543210",
    "alternateNumber": "+919876543210",
    "email": "john@example.com",
    "address": "123 Main St",
    "cityState": "Mumbai, Maharashtra",
    "pincode": "400001",
    "customerType": "B2C",
    "lastServiceCenterId": "uuid",
    "lastServiceCenter": {  // Populated when expanded
      "id": "uuid",
      "name": "SC001 - Main Center",
      "code": "SC001",
      "location": "Mumbai, Maharashtra"
    },
    "lastServiceDate": "2024-11-20",
    "lastInvoiceNumber": "INV-2024-001",
    "vehicles": [  // Populated when expanded (basic vehicle info)
      {
        "id": "uuid",
        "registration": "MH01AB1234",
        "vin": "VIN12345",
        "vehicleMake": "Tesla",
        "vehicleModel": "Model 3",
        "vehicleYear": 2023,
        "variant": "Long Range",
        "currentStatus": "AVAILABLE",
        "customerId": "uuid",  // Foreign key back to customer
        "lastServiceDate": "2024-11-20",
        "totalServices": 5,
        "totalSpent": "45000"
      }
    ],
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}

// With COMPLETE nested expand: GET /api/customers/{id}?expand=vehicles.serviceHistory,lastServiceCenter
// This shows COMPLETE vehicle information including service history
{
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-0001",
    "name": "John Doe",
    "phone": "+919876543210",
    "whatsappNumber": "+919876543210",
    "alternateNumber": "+919876543210",
    "email": "john@example.com",
    "address": "123 Main St",
    "cityState": "Mumbai, Maharashtra",
    "pincode": "400001",
    "customerType": "B2C",
    "vehicles": [  // COMPLETE vehicle information
      {
        "id": "uuid",
        "customerId": "uuid",
        "lastServiceCenter": {
          "id": "uuid",
          "name": "SC001 - Main Center",
          "code": "SC001",
          "location": "Mumbai, Maharashtra"
        },
        "lastServiceDate": "2024-11-20",
        "lastInvoiceNumber": "INV-2024-001",
        // Basic Vehicle Info
        "registration": "MH01AB1234",
        "vin": "VIN12345",
        "vehicleMake": "Tesla",
        "vehicleModel": "Model 3",
        "vehicleYear": 2023,
        
        // Additional Details
        "variant": "Long Range",
        "vehicleColor": "Pearl White",
        "motorNumber": "MTR123456",
        "chargerSerialNumber": "CHG789012",
        
        // Purchase & Ownership
        "purchaseDate": "2023-01-15",
        
        // Warranty & Insurance
        "warrantyStatus": "Active",
        "insuranceStartDate": "2023-01-15",
        "insuranceEndDate": "2024-01-15",
        "insuranceCompanyName": "HDFC ERGO",
        
        // Status & Service Tracking
        "currentStatus": "AVAILABLE",
        "activeJobCardId": null,
        "lastServiceDate": "2024-11-20",
        "lastServiceCenterId": "uuid",
        "nextServiceDate": "2025-05-20",
        "totalServices": 5,
        "totalSpent": "45000",
        
        // SERVICE HISTORY (when expanded)
        "serviceHistory": [
          {
            "id": "uuid",
            "jobCardId": "JC-2024-001",
            "jobCardNumber": "SC001-2024-11-0001",
            "date": "2024-11-20",
            "serviceType": "Regular Service",
            "engineerName": "Mike Johnson",
            "serviceCenterId": "uuid",
            "serviceCenterName": "SC001 - Main Center",
            "parts": ["Battery Health Check", "Brake Pad Replacement"],
            "partsCost": "8500",
            "laborCost": "2500",
            "total": "11000",
            "invoiceNumber": "INV-2024-001",
            "status": "Completed",
            "odometerReading": "25000",
            "customerFeedback": "Excellent service",
            "feedbackRating": 5
          },
          {
            "id": "uuid",
            "jobCardId": "JC-2024-002",
            "jobCardNumber": "SC001-2024-05-0001",
            "date": "2024-05-15",
            "serviceType": "Battery Service",
            "engineerName": "John Smith",
            "serviceCenterId": "uuid",
            "serviceCenterName": "SC001 - Main Center",
            "parts": ["Battery Calibration"],
            "partsCost": "5000",
            "laborCost": "1500",
            "total": "6500",
            "invoiceNumber": "INV-2024-002",
            "status": "Completed",
            "odometerReading": "15000",
            "customerFeedback": "Good service",
            "feedbackRating": 4
          }
          // ... more service history records
        ]
      }
    ],
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

### GET `/api/customers` - List Customers
```typescript
// Query: ?page=1&limit=20&expand=vehicles
{
  "data": [
    {
      "id": "uuid",
      "customerNumber": "CUST-0001",
      "name": "John Doe",
      "phone": "+919876543210",
      "lastServiceCenterId": "uuid",
      "vehicles": [...]  // Only if expand=vehicles
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "success": true
}
```

### GET `/api/customers/search?query={value}&type={phone|name|vin|auto}`
```typescript
// Backend auto-detects search type if type=auto
// Returns customers with optional vehicle expansion
```

---

## 4. VEHICLES API

### POST `/api/vehicles` - Create Vehicle
```typescript
// Request - Complete vehicle data with customerId FK
{
  "customerId": "uuid",  // FOREIGN KEY - Required
  
  // Basic Vehicle Info (Required)
  "registration": "MH01AB1234",
  "vin": "VIN12345",
  "vehicleMake": "Tesla",     // Brand
  "vehicleModel": "Model 3",
  "vehicleYear": 2023,
  
  // Additional Details (Optional)
  "variant": "Long Range",              // Variant / Battery Capacity
  "vehicleColor": "Pearl White",
  "motorNumber": "MTR123456",           // Motor Number (EV specific)
  "chargerSerialNumber": "CHG789012",   // Charger Serial Number (EV specific)
  
  // Purchase & Ownership (Optional)
  "purchaseDate": "2023-01-15",         // Date of Purchase
  
  // Warranty & Insurance (Optional)
  "warrantyStatus": "Active",           // Active / Expired / Not Applicable
  "insuranceStartDate": "2023-01-15",
  "insuranceEndDate": "2024-01-15",
  "insuranceCompanyName": "HDFC ERGO",
  
  // Status (Optional, default AVAILABLE)
  "currentStatus": "AVAILABLE"          // AVAILABLE / ACTIVE_JOB_CARD
}

// Response
{
  "data": {
    "id": "uuid",
    "customerId": "uuid",  // FK
    
    // Basic Info
    "registration": "MH01AB1234",
    "vin": "VIN12345",
    "vehicleMake": "Tesla",
    "vehicleModel": "Model 3",
    "vehicleYear": 2023,
    
    // Additional Details
    "variant": "Long Range",
    "vehicleColor": "Pearl White",
    "motorNumber": "MTR123456",
    "chargerSerialNumber": "CHG789012",
    
    // Purchase & Ownership
    "purchaseDate": "2023-01-15",
    
    // Warranty & Insurance
    "warrantyStatus": "Active",
    "insuranceStartDate": "2023-01-15",
    "insuranceEndDate": "2024-01-15",
    "insuranceCompanyName": "HDFC ERGO",
    
    // Status & Metadata
    "currentStatus": "AVAILABLE",
    "activeJobCardId": null,
    "lastServiceDate": null,
    "lastServiceCenterId": null,
    "nextServiceDate": null,
    "totalServices": 0,
    "totalSpent": "0",
    
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

### GET `/api/vehicles/{id}?expand=customer`
```typescript
{
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "customer": {  // Only when expand=customer
      "id": "uuid",
      "customerNumber": "CUST-0001",
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john@example.com"
    },
    
    // Basic Vehicle Info
    "registration": "MH01AB1234",
    "vin": "VIN12345",
    "vehicleMake": "Tesla",
    "vehicleModel": "Model 3",
    "vehicleYear": 2023,
    
    // Additional Details
    "variant": "Long Range",
    "vehicleColor": "Pearl White",
    "motorNumber": "MTR123456",
    "chargerSerialNumber": "CHG789012",
    
    // Purchase & Ownership
    "purchaseDate": "2023-01-15",
    
    // Warranty & Insurance
    "warrantyStatus": "Active",
    "insuranceStartDate": "2023-01-15",
    "insuranceEndDate": "2024-01-15",
    "insuranceCompanyName": "HDFC ERGO",
    
    // Status & Service History
    "currentStatus": "AVAILABLE",
    "activeJobCardId": null,
    "lastServiceDate": "2024-11-20",
    "lastServiceCenterId": "uuid",
    "nextServiceDate": "2025-05-20",
    "totalServices": 5,
    "totalSpent": "45000"
  },
  "success": true
}
```

---

## 5. APPOINTMENTS API

### POST `/api/appointments` - Create Appointment
```typescript
// Request - ONLY FKs and appointment-specific data
{
  "customerId": "uuid",        // FK - Required
  "vehicleId": "uuid",         // FK - Required
  "serviceCenterId": "uuid",   // FK - Required
  "serviceType": "Regular Service",
  "appointmentDate": "2025-12-25",
  "appointmentTime": "10:00 AM",
  "customerComplaint": "Strange noise",
  "location": "Station",  // or "Home"
  "estimatedCost": 5000   // Optional
}

// Response
{
  "data": {
    "id": "uuid",
    "appointmentNumber": "APT-2025-12-0001",
    "customerId": "uuid",       // FK only
    "vehicleId": "uuid",        // FK only
    "serviceCenterId": "uuid",  // FK only
    "serviceType": "Regular Service",
    "appointmentDate": "2025-12-25",
    "appointmentTime": "10:00 AM",
    "customerComplaint": "Strange noise",
    "location": "Station",
    "estimatedCost": 5000,
    "status": "PENDING",
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

### GET `/api/appointments/{id}?expand=customer,vehicle,serviceCenter`
```typescript
{
  "data": {
    "id": "uuid",
    "appointmentNumber": "APT-2025-12-0001",
    "customerId": "uuid",
    "customer": {  // Populated when expanded
      "id": "uuid",
      "name": "John Doe",
      "phone": "+919876543210"
    },
    "vehicleId": "uuid",
    "vehicle": {  // Populated when expanded
      "id": "uuid",
      "registration": "MH01AB1234",
      "vehicleMake": "Tesla",
      "vehicleModel": "Model 3"
    },
    "serviceCenterId": "uuid",
    "serviceCenter": {  // Populated when expanded
      "id": "uuid",
      "name": "SC001 - Main Center",
      "code": "SC001"
    },
    "serviceType": "Regular Service",
    "status": "PENDING"
  },
  "success": true
}
```

---

## 6. JOB CARDS API (CRITICAL)

### POST `/api/job-cards` - Create Job Card
```typescript
// Request - ONLY FKs and jobcard-specific data
{
  "serviceCenterId": "uuid",  // FK - Required
  "customerId": "uuid",       // FK - Required
  "vehicleId": "uuid",        // FK - Required
  "appointmentId": "uuid",    // FK - Optional
  "quotationId": "uuid",      // FK - Optional
  "serviceType": "Regular Service",
  "description": "Customer complaint",
  "priority": "MEDIUM",
  "location": "Station",
  "estimatedCost": 5000,
  
  // Part 1 data (stores denormalized snapshot for historical record)
  // Based on JobCardPart1 interface - Complete customer & vehicle information
  "part1Data": {
    // LEFT SIDE - Primary Information
    "fullName": "John Doe",
    "mobilePrimary": "+919876543210",
    "customerType": "B2C",
    "vehicleBrand": "Tesla",
    "vehicleModel": "Model 3",
    "registrationNumber": "MH01AB1234",
    "vinChassisNumber": "VIN12345",
    "variantBatteryCapacity": "Long Range",
    "warrantyStatus": "Active",
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
}

// Response - FK references only, use expand to get related data
{
  "data": {
    "id": "uuid",
    "jobCardNumber": "SC001-2025-12-0001",
    "serviceCenterId": "uuid",   // FK
    "customerId": "uuid",        // FK
    "vehicleId": "uuid",         // FK
    "appointmentId": "uuid",     // FK (nullable)
    "quotationId": "uuid",       // FK (nullable)
    "assignedEngineerId": null,  // FK (nullable)
    "serviceType": "Regular Service",
    "description": "Customer complaint",
    "priority": "MEDIUM",
    "location": "Station",
    "estimatedCost": 5000,
    "status": "CREATED",
    "part1Data": {...},  // Stored snapshot
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

### GET `/api/job-cards/{id}?expand=customer,vehicle,engineer,serviceCenter`
```typescript
{
  "data": {
    "id": "uuid",
    "jobCardNumber": "SC001-2025-12-0001",
    "serviceCenterId": "uuid",
    "serviceCenter": {  // Expanded
      "id": "uuid",
      "name": "SC001 - Main Center",
      "code": "SC001"
    },
    "customerId": "uuid",
    "customer": {  // Expanded
      "id": "uuid",
      "customerNumber": "CUST-0001",
      "name": "John Doe",
      "phone": "+919876543210"
    },
    "vehicleId": "uuid",
    "vehicle": {  // Expanded
      "id": "uuid",
      "registration": "MH01AB1234",
      "vehicleMake": "Tesla",
      "vehicleModel": "Model 3"
    },
    "assignedEngineerId": "uuid",
    "assignedEngineer": {  // Expanded
      "id": "uuid",
      "name": "Mike Johnson",
      "email": "mike@example.com"
    },
    "status": "IN_PROGRESS",
    "part1Data": {...}
  },
  "success": true
}
```

### POST `/api/job-cards/{id}/assign-engineer`
```typescript
// Request
{
  "engineerId": "uuid"  // FK to User table where role=service_engineer
}

// Response - Returns updated job card with FK only
{
  "data": {
    "id": "uuid",
    "jobCardNumber": "SC001-2025-12-0001",
    "assignedEngineerId": "uuid",  // FK updated
    "status": "ASSIGNED"
  },
  "success": true
}
```

---

## 7. QUOTATIONS API

### POST `/api/quotations` - Create Quotation
```typescript
// Request - ONLY FKs and quotation data
{
  "serviceCenterId": "uuid",  // FK
  "customerId": "uuid",       // FK
  "vehicleId": "uuid",        // FK
  "appointmentId": "uuid",    // FK (optional)
  "documentType": "Quotation",
  "quotationDate": "2025-12-20",
  "validUntilDays": 30,
  "hasInsurance": false,
  "items": [
    {
      "serialNumber": 1,
      "partName": "Front Brake Pad",
      "partNumber": "BP001",
      "quantity": 2,
      "rate": 2500,
      "gstPercent": 18,
      "amount": 5000
    }
  ],
  "discount": 500
}

// Response - FKs only
{
  "data": {
    "id": "uuid",
    "quotationNumber": "QTN-2025-12-0001",
    "serviceCenterId": "uuid",  // FK
    "customerId": "uuid",       // FK
    "vehicleId": "uuid",        // FK
    "appointmentId": "uuid",    // FK (nullable)
    "status": "draft",
    "subtotal": 5000,
    "discount": 500,
    "cgstAmount": 405,
    "sgstAmount": 405,
    "totalAmount": 5310
  },
  "success": true
}
```

### GET `/api/quotations/{id}?expand=customer,vehicle,serviceCenter`
```typescript
{
  "data": {
    "id": "uuid",
    "quotationNumber": "QTN-2025-12-0001",
    "customerId": "uuid",
    "customer": {  // Expanded
      "id": "uuid",
      "name": "John Doe",
      "phone": "+919876543210"
    },
    "vehicleId": "uuid",
    "vehicle": {  // Expanded
      "id": "uuid",
      "registration": "MH01AB1234"
    },
    "serviceCenterId": "uuid",
    "serviceCenter": {  // Expanded
      "id": "uuid",
      "name": "SC001",
      "code": "SC001"
    },
    "items": [...],
    "status": "draft",
    "totalAmount": 5310
  },
  "success": true
}
```

---

## 8. INVOICES API

### POST `/api/invoices` - Create Invoice
```typescript
// Request - ONLY FKs
{
  "serviceCenterId": "uuid",  // FK
  "customerId": "uuid",       // FK
  "vehicleId": "uuid",        // FK
  "jobCardId": "uuid",        // FK (optional)
  "invoiceDate": "2025-12-20",
  "dueDate": "2025-12-27",
  "items": [
    {
      "name": "Service Charge",
      "hsnSacCode": "998314",
      "unitPrice": 5000,
      "quantity": 1,
      "gstRate": 18
    }
  ],
  "discount": 0,
  "placeOfSupply": "Maharashtra"
}

// Response - FKs only
{
  "data": {
    "id": "uuid",
    "invoiceNumber": "INV-SC001-2025-0001",
    "serviceCenterId": "uuid",  // FK
    "customerId": "uuid",       // FK
    "vehicleId": "uuid",        // FK
    "jobCardId": "uuid",        // FK (nullable)
    "status": "DRAFT",
    "subtotal": 5000,
    "totalCgst": 450,
    "totalSgst": 450,
    "grandTotal": 5900,
    "balance": 5900
  },
  "success": true
}
```

---

## 9. INVENTORY API

### GET `/api/inventory?serviceCenterId={id}`
```typescript
// Returns inventory items for a service center
{
  "data": [
    {
      "id": "uuid",
      "partId": "PART-0001",
      "partName": "Brake Pad",
      "partNumber": "BP001",
      "price": 2500,
      "stockQuantity": 50,
      "minStockLevel": 10,
      "serviceCenterId": "uuid"  // FK
    }
  ],
  "success": true
}
```

---

## 10. PARTS REQUESTS API

### POST `/api/parts-requests` - Create Parts Request
```typescript
// Request - ONLY FKs
{
  "jobCardId": "uuid",  // FK - Required
  "requestedBy": "uuid", // FK to User (service_engineer)
  "items": [
    {
      "partId": "uuid",  // FK to Part/Inventory
      "requestedQty": 2
    }
  ],
  "notes": "Urgent requirement"
}

// Response
{
  "data": {
    "id": "uuid",
    "requestNumber": "PR-2025-12-0001",
    "jobCardId": "uuid",       // FK
    "requestedById": "uuid",   // FK
    "status": "PENDING",
    "createdAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

---

## 10A. SERVICE HISTORY API

### GET `/api/vehicles/{vehicleId}/service-history`
```typescript
// Returns complete service history for a vehicle
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "uuid",
      "jobCardId": "uuid",
      "jobCardNumber": "SC001-2024-11-0001",
      "serviceCenterId": "uuid",
      "serviceCenterName": "SC001 - Main Center",
      "date": "2024-11-20",
      "serviceType": "Regular Service",
      "engineerId": "uuid",
      "engineerName": "Mike Johnson",
      "description": "Battery health check and brake pad replacement",
      "parts": [
        {
          "name": "Battery Health Check",
          "cost": "5000"
        },
        {
          "name": "Brake Pad Replacement",
          "cost": "3500"
        }
      ],
      "partsCost": "8500",
      "laborCost": "2500",
      "totalCost": "11000",
      "invoiceId": "uuid",
      "invoiceNumber": "INV-2024-001",
      "status": "Completed",
      "odometerReading": "25000",
      "customerFeedback": "Excellent service",
      "feedbackRating": 5,
      "nextServiceDate": "2025-05-20",
      "createdAt": "2024-11-20T10:00:00Z",
      "completedAt": "2024-11-20T16:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  },
  "success": true
}
```

### GET `/api/customers/{customerId}/service-history`
```typescript
// Returns service history across ALL customer vehicles
// Useful for customer profile page
{
  "data": [
    {
      "id": "uuid",
      "vehicleId": "uuid",
      "vehicleRegistration": "MH01AB1234",
      "vehicleMake": "Tesla",
      "vehicleModel": "Model 3",
      "jobCardId": "uuid",
      "jobCardNumber": "SC001-2024-11-0001",
      "serviceCenterName": "SC001 - Main Center",
      "date": "2024-11-20",
      "serviceType": "Regular Service",
      "totalCost": "11000",
      "status": "Completed"
    }
  ],
  "success": true
}
```

---

## 11. EXPAND/POPULATE QUERY PARAMETER

### Usage Pattern
```typescript
// Single expand
GET /api/job-cards/123?expand=customer

// Multiple expands (comma-separated)
GET /api/job-cards/123?expand=customer,vehicle,engineer,serviceCenter

// Nested expand (IMPORTANT for complete data)
GET /api/customers/123?expand=vehicles.serviceHistory
GET /api/job-cards/123?expand=customer.vehicles

// Multiple nested expands
GET /api/customers/123?expand=vehicles.serviceHistory,lastServiceCenter

// Default behavior (no expand)
// Returns ONLY foreign key IDs
```

### Real-World Examples

#### Example 1: Complete Customer Search (Click on Vehicle)
```typescript
// Frontend: User searches for customer, clicks on vehicle to see complete info
GET /api/customers/search?query=9876543210&expand=vehicles.serviceHistory,lastServiceCenter

// Returns:
// - Customer basic info
// - All vehicles with COMPLETE details (year, color, motor, insurance, etc.)
// - Service history for each vehicle
// - Last service center details

// ONE API CALL = Complete information!
```

#### Example 2: Job Card with Complete Context
```typescript
// Frontend: Open job card, need all related info
GET /api/job-cards/123?expand=customer,vehicle.serviceHistory,engineer,serviceCenter

// Returns:
// - Job card details
// - Customer info
// - Vehicle info WITH service history
// - Assigned engineer info
// - Service center info
```

### Implementation (NestJS)
```typescript
// DTO for query params
class FindOneQueryDto {
  @IsOptional()
  @IsString()
  expand?: string;  // "customer,vehicle.serviceHistory,engineer"
}

// In service
async findOne(id: string, expand?: string) {
  const includes = {};
  
  if (expand) {
    const relations = expand.split(',');
    relations.forEach(rel => {
      const parts = rel.trim().split('.');
      
      if (parts.length === 1) {
        // Simple expand: expand=customer
        includes[parts[0]] = true;
      } else {
        // Nested expand: expand=vehicles.serviceHistory
        includes[parts[0]] = {
          include: {
            [parts[1]]: true
          }
        };
      }
    });
  }
  
  return this.prisma.customer.findUnique({
    where: { id },
    include: includes
  });
}
```

---

## 12. DATABASE SCHEMA PRINCIPLES

### Foreign Key Relationships
```prisma
model Customer {
  id                  String   @id @default(uuid())
  customerNumber      String   @unique
  name                String
  phone               String
  whatsappNumber      String?
  alternateNumber     String?
  email               String?
  address             String?
  cityState           String?
  pincode             String?
  customerType        String?  @default("B2C")
  
  // Last Service Tracking (nullable, updated on service completion)
  lastServiceCenterId String?  // FK - nullable, updated on service
  lastServiceCenter   ServiceCenter? @relation(fields: [lastServiceCenterId], references: [id])
  lastServiceDate     DateTime?      // Updated when service completed
  lastInvoiceNumber   String?        // Last invoice number for quick reference
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations (reverse)
  vehicles            Vehicle[]
  appointments        Appointment[]
  jobCards            JobCard[]
  quotations          Quotation[]
  invoices            Invoice[]
  
  @@index([phone])
  @@index([customerNumber])
  @@index([lastServiceCenterId])
}

model Vehicle {
  id           String   @id @default(uuid())
  customerId   String   // FK - required
  customer     Customer @relation(fields: [customerId], references: [id])
  
  // Basic Vehicle Info (Required)
  registration String   @unique
  vin          String   @unique
  vehicleMake  String   // Brand
  vehicleModel String
  vehicleYear  Int
  
  // Additional Details (Optional)
  variant              String?  // Variant / Battery Capacity
  vehicleColor         String?
  motorNumber          String?  // Motor Number (EV specific)
  chargerSerialNumber  String?  // Charger Serial Number (EV specific)
  
  // Purchase & Ownership
  purchaseDate         DateTime?
  
  // Warranty & Insurance
  warrantyStatus       String?   // Active / Expired / Not Applicable
  insuranceStartDate   DateTime?
  insuranceEndDate     DateTime?
  insuranceCompanyName String?
  
  // Status & Service Tracking
  currentStatus       VehicleStatus @default(AVAILABLE)
  activeJobCardId     String?
  lastServiceDate     DateTime?
  lastServiceCenterId String?       // FK to ServiceCenter
  lastServiceCenter   ServiceCenter? @relation(fields: [lastServiceCenterId], references: [id])
  nextServiceDate     DateTime?
  totalServices       Int         @default(0)
  totalSpent          Decimal     @default(0)
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations (reverse)
  appointments Appointment[]
  jobCards     JobCard[]
  quotations   Quotation[]
  invoices     Invoice[]
  
  @@index([customerId])
  @@index([registration])
  @@index([vin])
  @@index([lastServiceCenterId])
}

enum VehicleStatus {
  AVAILABLE
  ACTIVE_JOB_CARD
}

model JobCard {
  id                 String        @id @default(uuid())
  jobCardNumber      String        @unique
  serviceCenterId    String        // FK
  serviceCenter      ServiceCenter @relation(fields: [serviceCenterId], references: [id])
  customerId         String        // FK
  customer           Customer      @relation(fields: [customerId], references: [id])
  vehicleId          String        // FK
  vehicle            Vehicle       @relation(fields: [vehicleId], references: [id])
  assignedEngineerId String?       // FK - nullable
  assignedEngineer   User?         @relation(fields: [assignedEngineerId], references: [id])
  appointmentId      String?       // FK - nullable
  appointment        Appointment?  @relation(fields: [appointmentId], references: [id])
  quotationId        String?       // FK - nullable
  quotation          Quotation?    @relation(fields: [quotationId], references: [id])
  
  status             JobCardStatus
  part1Data          Json?         // Snapshot data
}
```

---

## 13. CRITICAL BUSINESS RULES

### 1. Foreign Key Validation
- Backend MUST validate all FK references exist before creation
- Return `404` if referenced entity not found

### 2. Cascading Updates
- When customer data changes, it does NOT update historical snapshots (part1Data)
- Use snapshots for historical accuracy
- **Auto-update on service completion**: When job card status changes to "COMPLETED" or invoice is generated:
  ```typescript
  // Backend automatically updates:
  customer.lastServiceCenterId = jobCard.serviceCenterId
  customer.lastServiceDate = new Date()
  customer.lastInvoiceNumber = invoice.invoiceNumber
  ```

### 3. Nullable vs Required FKs
```typescript
// Required FKs (NOT NULL)
- customerId in Vehicle, JobCard, Appointment, Quotation, Invoice
- vehicleId in JobCard, Appointment, Quotation, Invoice
- serviceCenterId in all service-related entities

// Optional FKs (NULLABLE)
- lastServiceCenterId in Customer (null for new customers)
- assignedEngineerId in JobCard (null until assigned)
- appointmentId in JobCard (null if created without appointment)
- quotationId in JobCard (null if created without quotation)
```

### 4. Expand Performance
- Use database joins, not N+1 queries
- Implement pagination when expanding collections
- Cache frequently expanded data (service centers, parts)

---

## 14. STATUS WORKFLOW VALIDATION

```typescript
// Backend MUST validate status transitions
const VALID_TRANSITIONS = {
  CREATED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["PARTS_PENDING", "COMPLETED"],
  PARTS_PENDING: ["IN_PROGRESS"],
  COMPLETED: ["INVOICED"]
};

// Reject invalid transitions with 400 error
if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
  throw new BadRequestException('Invalid status transition');
}
```

---

## 15. BULK OPERATIONS

### GET `/api/job-cards?serviceCenterId={id}&expand=customer,vehicle`
```typescript
// Efficiently loads multiple records with relations
{
  "data": [
    {
      "id": "uuid",
      "jobCardNumber": "SC001-2025-12-0001",
      "customerId": "uuid",
      "customer": {...},  // Expanded
      "vehicleId": "uuid",
      "vehicle": {...}    // Expanded
    }
  ],
  "pagination": {...}
}
```

---

## 16. ENVIRONMENT VARIABLES

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_API=false

# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/dms
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## 17. DATABASE INDEXES (PERFORMANCE)

```sql
-- Foreign Key Indexes (automatically created by Prisma)
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_job_cards_customer ON job_cards(customer_id);
CREATE INDEX idx_job_cards_vehicle ON job_cards(vehicle_id);
CREATE INDEX idx_job_cards_service_center ON job_cards(service_center_id);
CREATE INDEX idx_job_cards_engineer ON job_cards(assigned_engineer_id);

-- Search Indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_vehicles_registration ON vehicles(registration);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);

-- Composite Indexes for common queries
CREATE INDEX idx_job_cards_sc_status ON job_cards(service_center_id, status);
```

---

## 18. EXAMPLE: COMPLETE FLOW

### Create Customer → Vehicle → Appointment → Job Card

```typescript
// 1. Create Customer
POST /api/customers
{
  "name": "John Doe",
  "phone": "+919876543210"
}
// Response: { "id": "customer-uuid", "lastServiceCenterId": null }

// 2. Create Vehicle (linked to customer)
POST /api/vehicles
{
  "customerId": "customer-uuid",  // FK from step 1
  "registration": "MH01AB1234",
  "vin": "VIN12345",
  "vehicleMake": "Tesla",
  "vehicleModel": "Model 3"
}
// Response: { "id": "vehicle-uuid", "customerId": "customer-uuid" }

// 3. Create Appointment
POST /api/appointments
{
  "customerId": "customer-uuid",      // FK
  "vehicleId": "vehicle-uuid",        // FK
  "serviceCenterId": "sc-uuid",       // FK
  "serviceType": "Regular Service",
  "appointmentDate": "2025-12-25"
}
// Response: { "id": "appointment-uuid", "status": "PENDING" }

// 4. Create Job Card
POST /api/job-cards
{
  "customerId": "customer-uuid",      // FK
  "vehicleId": "vehicle-uuid",        // FK
  "serviceCenterId": "sc-uuid",       // FK
  "appointmentId": "appointment-uuid", // FK
  "serviceType": "Regular Service"
}
// Response: { "id": "jobcard-uuid", "jobCardNumber": "SC001-2025-12-0001" }

// Backend automatically updates customer.lastServiceCenterId = "sc-uuid"

// 5. Retrieve with all relations
GET /api/job-cards/jobcard-uuid?expand=customer,vehicle,serviceCenter,appointment

// Returns complete object with all expanded relations
```

---

## 19. ERROR CODES

```typescript
{
  "VALIDATION_ERROR": 400,       // Invalid data
  "UNAUTHORIZED": 401,
  "FORBIDDEN": 403,
  "NOT_FOUND": 404,             // FK reference not found
  "CONFLICT": 409,              // Duplicate (e.g., registration number)
  "INVALID_TRANSITION": 400,    // Invalid status transition
  "INSUFFICIENT_STOCK": 400,
  "FOREIGN_KEY_VIOLATION": 400  // Referenced entity doesn't exist
}
```

---

## 20. QUICK START CHECKLIST

### Phase 1: Core Setup ✓
- [ ] Setup NestJS + Prisma
- [ ] Define Prisma schema with proper FKs
- [ ] Implement JWT auth
- [ ] Create base CRUD with expand support

### Phase 2: Essential APIs ✓
- [ ] Customers (no lastServiceCenterId initially)
- [ ] Vehicles (with customerId FK)
- [ ] Service Centers
- [ ] Appointments (with all FKs)

### Phase 3: Core Business Logic ✓
- [ ] Job Cards with FK references
- [ ] Auto-update customer.lastServiceCenterId
- [ ] Status transition validation
- [ ] Engineer assignment (FK update)

### Phase 4: Advanced ✓
- [ ] Expand/populate implementation
- [ ] Bulk operations with pagination
- [ ] File uploads
- [ ] WhatsApp integration

---

**KEY PRINCIPLE**: Store only FKs, expand on read. Never duplicate data except for historical snapshots.

---

## Support & Questions

Backend should follow **normalization** principles:
- Store FKs, not nested objects
- Use `expand` query param for populated responses
- Validate FK references on write
- Use database joins, not application-layer joins
