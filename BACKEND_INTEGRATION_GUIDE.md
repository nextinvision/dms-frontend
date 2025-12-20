# DMS Backend Integration Guide - Production Ready

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-20  
> **Stack**: NestJS + Prisma + PostgreSQL + Redis  
> **Status**: ✅ Production Ready for Implementation

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Complete API Specification](#complete-api-specification)
4. [Database Schema](#database-schema)
5. [Security & Multi-Tenancy](#security--multi-tenancy)
6. [Performance Optimizations](#performance-optimizations)
7. [Complete Workflows](#complete-workflows)
8. [Integration Checklist](#integration-checklist)

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.x
PostgreSQL >= 14.x
Redis >= 6.x (optional but recommended)
Docker (optional)
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dms
DATABASE_READ_URL=postgresql://user:password@localhost:5433/dms_replica

# Redis Cache
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3001
API_PREFIX=/api

# File Upload
AWS_S3_BUCKET=dms-files
AWS_S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
MAX_FILE_SIZE=10485760  # 10MB

# External Services
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your-whatsapp-api-key

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Cache
CACHE_TTL=300  # 5 minutes
CACHE_MAX=1000
```

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations
npx prisma migrate deploy

# 4. Seed database (optional)
npx prisma db seed

# 5. Start server
npm run start:prod
```

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│                     dms-frontend:3000                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST + WebSocket
                     │
┌────────────────────┴────────────────────────────────────────┐
│                    API Gateway (NestJS)                      │
│                    dms-backend:3001/api                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Auth Module  │  │ Customer     │  │ JobCard      │    │
│  │ (JWT)        │  │ Module       │  │ Module       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Inventory    │  │ Central Inv  │  │ Analytics    │    │
│  │ Module       │  │ Module       │  │ Module       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Global Middleware Layer                     │  │
│  │  • Tenant Isolation                                  │  │
│  │  • Rate Limiting                                     │  │
│  │  • Request Logging                                   │  │
│  │  • Error Handling                                    │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼───────────┐
│ PostgreSQL   │ │  Redis  │ │ S3/Storage   │
│ (Primary)    │ │ (Cache) │ │ (Files)      │
│              │ │         │ │              │
│ + Read       │ │         │ │              │
│   Replica    │ │         │ │              │
└──────────────┘ └─────────┘ └──────────────┘
```

### Request Flow

```
1. Frontend → API Gateway
2. API Gateway → Auth Middleware (JWT Validation)
3. Auth Middleware → Tenant Isolation Middleware (Auto-filter by SC)
4. Tenant Middleware → Rate Limiter
5. Rate Limiter → Cache Layer (Check Redis)
6. Cache Miss → Controller → Service
7. Service → Prisma → PostgreSQL
8. Response → Cache → Client
```

---

## 📡 COMPLETE API SPECIFICATION

### 1. Standard Response Format

**ALL responses must follow this format:**

```typescript
// Success Response
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: true;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Error Response
interface ApiErrorResponse {
  message: string;
  code: string;
  status: number;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
  requestId: string;
}

// Paginated Response
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: true;
}
```

### 2. Global Query Parameters

**Available on ALL endpoints:**

```typescript
// Pagination
?page=1
?limit=20

// Field Selection (Sparse Fieldsets)
?fields=id,name,phone,email

// Expansion (Populate Relations)
?expand=customer,vehicle
?expand=vehicles.serviceHistory

// Expansion with Limits
?expand=vehicles&vehicles.limit=5

// Sorting
?sort=createdAt    // Ascending
?sort=-createdAt   // Descending
?sort=status,-createdAt  // Multi-field

// Filtering
?filter[status]=ACTIVE
?filter[createdAt][gte]=2025-01-01
?filter[createdAt][lte]=2025-12-31

// Search (Full-text)
?search=john+doe
?searchFields=name,email,phone
```

### 3. Authentication & Authorization

#### POST `/api/auth/login`
```typescript
Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "sc_manager",
      "serviceCenterId": "uuid",
      "permissions": ["job_cards:create", "job_cards:read"]
    }
  },
  "success": true
}

Error: 401 Unauthorized
{
  "message": "Invalid credentials",
  "code": "INVALID_CREDENTIALS",
  "status": 401
}
```

#### POST `/api/auth/refresh`
```typescript
Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200 OK
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

#### POST `/api/auth/logout`
```typescript
Headers: Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Logged out successfully",
  "success": true
}
```

#### GET `/api/auth/me`
```typescript
Headers: Authorization: Bearer {token}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "sc_manager",
    "serviceCenterId": "uuid",
    "permissions": ["job_cards:create", "job_cards:read"],
    "serviceCenter": {  // If expand=serviceCenter
      "id": "uuid",
      "name": "SC001 - Mumbai",
      "code": "SC001"
    }
  },
  "success": true
}
```

---

### 4. Customers API

#### POST `/api/customers`
```typescript
Request:
{
  "name": "John Doe",
  "phone": "+919876543210",
  "whatsappNumber": "+919876543210",
  "alternateNumber": "+919876543211",
  "email": "john@example.com",
  "address": "123 Main St",
  "cityState": "Mumbai, Maharashtra",
  "pincode": "400001",
  "customerType": "B2C"
}

Validation:
- name: required, min 2, max 100
- phone: required, regex: ^\\+91[6-9]\\d{9}$
- email: optional, valid email

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-0001",  // Auto-generated
    "name": "John Doe",
    "phone": "+919876543210",
    "whatsappNumber": "+919876543210",
    "alternateNumber": "+919876543211",
    "email": "john@example.com",
    "address": "123 Main St",
    "cityState": "Mumbai, Maharashtra",
    "pincode": "400001",
    "customerType": "B2C",
    "lastServiceCenterId": null,
    "lastServiceDate": null,
    "lastInvoiceNumber": null,
    "createdAt": "2025-12-20T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

#### GET `/api/customers/{id}`
```typescript
Query Params:
?expand=vehicles,lastServiceCenter
?expand=vehicles.serviceHistory&vehicles.limit=5&serviceHistory.limit=10
?fields=id,name,phone,email

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "customerNumber": "CUST-0001",
    "name": "John Doe",
    "phone": "+919876543210",
    "whatsappNumber": "+919876543210",
    "email": "john@example.com",
    "lastServiceCenterId": "uuid",
    "lastServiceCenter": {  // If expanded
      "id": "uuid",
      "name": "SC001 - Mumbai",
      "code": "SC001"
    },
    "vehicles": [  // If expanded
      {
        "id": "uuid",
        "registration": "MH01AB1234",
        "vehicleMake": "Tesla",
        "vehicleModel": "Model 3",
        "serviceHistory": [...]  // If nested expanded
      }
    ]
  },
  "success": true
}
```

#### GET `/api/customers`
```typescript
Query Params:
?page=1&limit=20
?search=john
?filter[customerType]=B2C
?sort=-createdAt
?expand=vehicles

Response: 200 OK
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "success": true
}
```

#### GET `/api/customers/search`
```typescript
Query Params:
?query=9876543210
?type=auto  // auto | phone | name | email | vin
?expand=vehicles

Auto-Detection Logic:
- Starts with +91 or 10 digits → phone
- Contains @ → email
- Alphanumeric with 2+ letters → name
- Vehicle registration pattern → vin

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "customerNumber": "CUST-0001",
      "name": "John Doe",
      "phone": "+919876543210",
      "vehicles": [...]  // If expanded
    }
  ],
  "success": true
}
```

#### PATCH `/api/customers/{id}`
```typescript
Request:
{
  "email": "newemail@example.com",
  "address": "456 New St"
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "email": "newemail@example.com",
    // ... updated data
  },
  "success": true
}
```

#### DELETE `/api/customers/{id}`
```typescript
// Soft delete
Response: 200 OK
{
  "message": "Customer deleted successfully",
  "success": true
}
```

---

### 5. Vehicles API

#### POST `/api/vehicles`
```typescript
Request:
{
  "customerId": "uuid",
  "registration": "MH01AB1234",
  "vin": "VIN123456789",
  "vehicleMake": "Tesla",
  "vehicleModel": "Model 3",
  "vehicleYear": 2023,
  "variant": "Long Range",
  "vehicleColor": "Pearl White",
  "motorNumber": "MTR123456",
  "chargerSerialNumber": "CHG789012",
  "purchaseDate": "2023-01-15",
  "warrantyStatus": "Active",
  "insuranceStartDate": "2023-01-15",
  "insuranceEndDate": "2024-01-15",
  "insuranceCompanyName": "HDFC ERGO"
}

Validation:
- customerId: required, must exist
- registration: required, unique, regex: ^[A-Z]{2}\\d{2}[A-Z]{1,2}\\d{4}$
- vin: required, unique

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "registration": "MH01AB1234",
    // ... all fields
    "currentStatus": "AVAILABLE",
    "activeJobCardId": null,
    "lastServiceDate": null,
    "totalServices": 0,
    "totalSpent": "0",
    "createdAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

#### GET `/api/vehicles/{id}/service-history`
```typescript
Query Params:
?page=1&limit=20
?filter[date][gte]=2024-01-01

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "jobCardId": "uuid",
      "jobCardNumber": "SC001-2024-001",
      "date": "2024-11-20",
      "serviceType": "Regular Service",
      "engineerName": "Mike Johnson",
      "serviceCenterName": "SC001 - Mumbai",
      "parts": ["Battery Check", "Brake Replacement"],
      "partsCost": "8500",
      "laborCost": "2500",
      "totalCost": "11000",
      "invoiceNumber": "INV-2024-001",
      "status": "COMPLETED",
      "odometerReading": "25000",
      "customerFeedback": "Excellent",
      "feedbackRating": 5
    }
  ],
  "pagination": {...},
  "success": true
}
```

---

### 6. Job Cards API

#### POST `/api/job-cards`
```typescript
Request:
{
  "serviceCenterId": "uuid",
  "customerId": "uuid",
  "vehicleId": "uuid",
  "appointmentId": "uuid",  // Optional
  "serviceType": "Regular Service",
  "description": "Customer complaint",
  "priority": "MEDIUM",
  "location": "STATION",
  "estimatedCost": 5000,
  "part1Data": {
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
    "customerAddress": "123 Main St",
    "jobCardNumber": "SC001-2025-12-0001",  // Optional, auto-generated
    "customerFeedback": "Strange noise",
    "technicianObservation": "Initial inspection",
    "insuranceStartDate": "2023-01-15",
    "insuranceEndDate": "2024-01-15",
    "insuranceCompanyName": "HDFC ERGO",
    "batterySerialNumber": "BAT123",
    "mcuSerialNumber": "MCU456",
    "vcuSerialNumber": "VCU789",
    "otherPartSerialNumber": "OTH012"
  }
}

Automatic Actions:
1. Generate job card number: {scCode}-{YYYY}-{MM}-{SEQ}
2. Set status to "CREATED"
3. Update vehicle.currentStatus to "ACTIVE_JOB_CARD"
4. Update vehicle.activeJobCardId

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "jobCardNumber": "SC001-2025-12-0001",
    "serviceCenterId": "uuid",
    "customerId": "uuid",
    "vehicleId": "uuid",
    "status": "CREATED",
    "part1Data": {...},
    "createdAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

#### POST `/api/job-cards/{id}/assign-engineer`
```typescript
Request:
{
  "engineerId": "uuid"
}

Automatic Actions:
1. Set assignedEngineerId
2. Update status to "ASSIGNED"
3. Send notification to engineer

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "jobCardNumber": "SC001-2025-12-0001",
    "assignedEngineerId": "uuid",
    "status": "ASSIGNED"
  },
  "success": true
}
```

#### PATCH `/api/job-cards/{id}/status`
```typescript
Request:
{
  "status": "IN_PROGRESS",
  "notes": "Started working on vehicle"
}

Validation:
- Must follow valid status transitions
- CREATED → ASSIGNED
- ASSIGNED → IN_PROGRESS
- IN_PROGRESS → PARTS_PENDING | COMPLETED
- PARTS_PENDING → IN_PROGRESS
- COMPLETED → INVOICED

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "updatedAt": "2025-12-20T11:00:00Z"
  },
  "success": true
}

Error: 400 Bad Request
{
  "message": "Invalid status transition from CREATED to COMPLETED",
  "code": "INVALID_STATUS_TRANSITION",
  "status": 400
}
```

#### POST `/api/job-cards/{id}/request-parts`
```typescript
Request:
{
  "parts": [
    {
      "inventoryPartId": "uuid",
      "requestedQty": 2,
      "isWarranty": false
    }
  ],
  "urgency": "HIGH",
  "notes": "Urgent requirement"
}

Automatic Actions:
1. Create parts request
2. Update job card status to "PARTS_PENDING"
3. Notify inventory manager

Response: 201 Created
{
  "data": {
    "partsRequestId": "uuid",
    "jobCardId": "uuid",
    "status": "PENDING"
  },
  "success": true
}
```

---

### 7. COMPLETE Inventory Management

#### 7.1 Service Center Inventory

##### GET `/api/inventory`
```typescript
Query Params:
?serviceCenterId=uuid  // Auto-filtered for SC users
?page=1&limit=20
?filter[stockQuantity][lte]=10  // Low stock
?search=brake+pad

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "partId": "PART-0001",
      "partName": "Brake Pad",
      "partNumber": "BP001",
      "partCode": "BRK-PAD-001",
      "category": "Brakes",
      "unitPrice": 2500,
      "costPrice": 2000,
      "gstRate": 18,
      "stockQuantity": 50,
      "minStockLevel": 10,
      "maxStockLevel": 100,
      "reorderPoint": 15,
      "location": "Rack A-5",
      "serviceCenterId": "uuid",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-12-20T10:00:00Z"
    }
  ],
  "pagination": {...},
  "success": true
}
```

##### POST `/api/inventory/parts`
```typescript
Request:
{
  "partName": "Battery Module",
  "partNumber": "BAT-MOD-001",
  "partCode": "BM001",
  "category": "Battery",
  "unitPrice": 50000,
  "costPrice": 40000,
  "gstRate": 18,
  "stockQuantity": 10,
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "location": "Warehouse Section B",
  "supplierId": "uuid"  // Optional
}

Response: 201 Created
```

##### PATCH `/api/inventory/parts/{id}/adjust-stock`
```typescript
Request:
{
  "adjustmentType": "ADD" | "SUBTRACT" | "SET",
  "quantity": 10,
  "reason": "STOCK_RECEIVED" | "STOCK_DAMAGED" | "STOCK_COUNT" | "RETURNED",
  "notes": "Received from central inventory",
  "referenceNumber": "PI-2025-001"  // Parts issue number
}

Automatic Actions:
1. Create stock transaction record
2. Update stockQuantity
3. Check if below minStockLevel → create alert

Response: 200 OK
{
  "data": {
    "partId": "uuid",
    "previousStock": 50,
    "newStock": 60,
    "adjustmentQuantity": 10
  },
  "success": true
}
```

##### GET `/api/inventory/low-stock`
```typescript
Response: 200 OK
{
  "data": [
    {
      "partId": "uuid",
      "partName": "Brake Pad",
      "stockQuantity": 8,
      "minStockLevel": 10,
      "deficit": 2,
      "lastRestocked": "2025-11-01"
    }
  ],
  "success": true
}
```

##### GET `/api/inventory/parts/{partId}/transactions`
```typescript
Query Params:
?page=1&limit=20
?filter[transactionType]=ISSUE

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "partId": "uuid",
      "transactionType": "ISSUE" | "RECEIVE" | "ADJUST" | "RETURN",
      "quantity": 2,
      "previousStock": 50,
      "newStock": 48,
      "reason": "Job card parts issue",
      "referenceId": "uuid",  // Job card, parts request, etc.
      "referenceType": "JOB_CARD",
      "performedBy": "uuid",
      "notes": "Issued for JC-2025-001",
      "createdAt": "2025-12-20T10:00:00Z"
    }
  ],
  "pagination": {...},
  "success": true
}
```

#### 7.2 Central Inventory

##### GET `/api/central-inventory`
```typescript
// Only accessible to admin and central_inventory_manager

Query Params:
?page=1&limit=20
?search=battery
?filter[stockQuantity][lte]=100

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "partName": "Battery Module",
      "partNumber": "BAT-MOD-001",
      "partCode": "BM001",
      "category": "Battery",
      "unitPrice": 50000,
      "costPrice": 40000,
      "gstRate": 18,
      "stockQuantity": 500,
      "minStockLevel": 100,
      "allocated": 50,  // Allocated to pending issues
      "available": 450,  // Available = stock - allocated
      "location": "Central Warehouse A",
      "supplierId": "uuid",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {...},
  "success": true
}
```

##### POST `/api/central-inventory/parts`
```typescript
Request:
{
  "partName": "Battery Module",
  "partNumber": "BAT-MOD-001",
  "category": "Battery",
  "unitPrice": 50000,
  "costPrice": 40000,
  "gstRate": 18,
  "stockQuantity": 0,  // Initial stock
  "minStockLevel": 100,
  "location": "Central Warehouse A",
  "supplierId": "uuid"
}

Response: 201 Created
```

#### 7.3 Purchase Orders

##### POST `/api/purchase-orders`
```typescript
Request:
{
  "supplierId": "uuid",
  "orderDate": "2025-12-20",
  "expectedDeliveryDate": "2025-12-27",
  "items": [
    {
      "centralInventoryPartId": "uuid",
      "partName": "Battery Module",
      "partNumber": "BAT-MOD-001",
      "quantity": 100,
      "unitPrice": 40000,
      "gstRate": 18,
      "amount": 4000000
    }
  ],
  "notes": "Urgent order for restocking",
  "paymentTerms": "Net 30 days"
}

Automatic Actions:
1. Generate PO number: PO-{YYYY}-{SEQ}
2. Calculate totals (subtotal, GST, total)
3. Set status to "DRAFT"

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "poNumber": "PO-2025-0001",
    "supplierId": "uuid",
    "status": "DRAFT",
    "subtotal": 4000000,
    "cgst": 360000,
    "sgst": 360000,
    "totalAmount": 4720000,
    "items": [...],
    "createdAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

##### PATCH `/api/purchase-orders/{id}/submit`
```typescript
// Submit for approval
Request: {}

Automatic Actions:
1. Update status to "PENDING_APPROVAL"
2. Notify admin

Response: 200 OK
```

##### PATCH `/api/purchase-orders/{id}/approve`
```typescript
// Admin only
Request:
{
  "approvedBy": "uuid",  // Auto-filled from JWT
  "notes": "Approved"
}

Automatic Actions:
1. Update status to "APPROVED"
2. Notify requester
3. Send to supplier (if integration exists)

Response: 200 OK
```

##### PATCH `/api/purchase-orders/{id}/receive`
```typescript
Request:
{
  "receivedItems": [
    {
      "itemId": "uuid",  // PO item ID
      "receivedQty": 100,
      "acceptedQty": 98,  // May differ if damaged
      "rejectedQty": 2,
      "condition": "GOOD" | "DAMAGED" | "PARTIAL",
      "notes": "2 units damaged in transit"
    }
  ],
  "receivedBy": "uuid",  // Auto-filled from JWT
  "receivedDate": "2025-12-27",
  "invoiceNumber": "SUP-INV-001",
  "invoiceDate": "2025-12-27",
  "invoiceAmount": 4720000
}

Automatic Actions:
1. Update PO status to "RECEIVED" or "PARTIALLY_RECEIVED"
2. Update central_inventory.stockQuantity += acceptedQty
3. Create stock transaction records
4. If all items received → status = "COMPLETED"

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "poNumber": "PO-2025-0001",
    "status": "COMPLETED",
    "receivedDate": "2025-12-27"
  },
  "success": true
}
```

##### GET `/api/purchase-orders`
```typescript
Query Params:
?status=PENDING_APPROVAL
?filter[orderDate][gte]=2025-01-01
?expand=supplier,items

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "poNumber": "PO-2025-0001",
      "supplier": {  // If expanded
        "id": "uuid",
        "name": "ABC Parts Supplier",
        "contactPerson": "John Smith"
      },
      "status": "APPROVED",
      "totalAmount": 4720000,
      "items": [...]  // If expanded
    }
  ],
  "pagination": {...},
  "success": true
}
```

#### 7.4 Parts Issue (Central to Service Center)

##### POST `/api/parts-issues`
```typescript
Request:
{
  "toServiceCenterId": "uuid",
  "requestedBy": "uuid",  // SC Manager
  "items": [
    {
      "centralInventoryPartId": "uuid",
      "partName": "Battery Module",
      "partNumber": "BAT-MOD-001",
      "requestedQty": 50
    }
  ],
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "notes": "Urgent requirement for pending jobs"
}

Automatic Actions:
1. Generate issue number: PI-{YYYY}-{SEQ}
2. Set status to "PENDING_APPROVAL"
3. Reserve stock (allocated += requestedQty)
4. Notify admin

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "issueNumber": "PI-2025-0001",
    "toServiceCenterId": "uuid",
    "status": "PENDING_APPROVAL",
    "items": [...],
    "createdAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

##### PATCH `/api/parts-issues/{id}/approve`
```typescript
// Admin only
Request:
{
  "approvedItems": [
    {
      "itemId": "uuid",
      "approvedQty": 50  // May differ from requested
    }
  ],
  "approvedBy": "uuid",  // Auto-filled
  "notes": "Approved"
}

Automatic Actions:
1. Update status to "APPROVED"
2. Update central_inventory:
   - allocated -= requestedQty
   - stockQuantity -= approvedQty
3. Create stock transaction
4. Notify SC manager

Response: 200 OK
```

##### PATCH `/api/parts-issues/{id}/dispatch`
```typescript
Request:
{
  "dispatchedDate": "2025-12-20",
  "transportDetails": {
    "vehicleNumber": "MH01AB1234",
    "driverName": "John Doe",
    "driverPhone": "+919876543210"
  },
  "estimatedArrival": "2025-12-21",
  "trackingNumber": "TRK-123456"
}

Automatic Actions:
1. Update status to "DISPATCHED"
2. Notify SC manager with tracking details

Response: 200 OK
```

##### PATCH `/api/parts-issues/{id}/receive`
```typescript
// SC Inventory Manager
Request:
{
  "receivedItems": [
    {
      "itemId": "uuid",
      "receivedQty": 50,
      "condition": "GOOD",
      "notes": ""
    }
  ],
  "receivedBy": "uuid",  // Auto-filled
  "receivedDate": "2025-12-21"
}

Automatic Actions:
1. Update status to "COMPLETED"
2. Update service_center_inventory.stockQuantity += receivedQty
3. Create stock transaction
4. Check if parts were requested for job cards → notify engineers

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "issueNumber": "PI-2025-0001",
    "status": "COMPLETED",
    "receivedDate": "2025-12-21"
  },
  "success": true
}
```

##### GET `/api/parts-issues`
```typescript
Query Params:
?status=PENDING_APPROVAL
?toServiceCenterId=uuid  // Auto-filtered for SC users
?expand=items,toServiceCenter

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "issueNumber": "PI-2025-0001",
      "toServiceCenter": {  // If expanded
        "id": "uuid",
        "name": "SC001 - Mumbai",
        "code": "SC001"
      },
      "status": "APPROVED",
      "items": [...],
      "createdAt": "2025-12-20T10:00:00Z"
    }
  ],
  "pagination": {...},
  "success": true
}
```

---

### 8. Analytics & Reports

##### GET `/api/analytics/dashboard`
```typescript
Query Params:
?serviceCenterId=uuid  // Auto-filtered for SC users
?dateFrom=2025-01-01
?dateTo=2025-12-31

Response: 200 OK
{
  "data": {
    "revenue": {
      "today": 45000,
      "thisWeek": 245000,
      "thisMonth": 890000,
      "growth": 15.5  // % growth vs last month
    },
    "jobCards": {
      "total": 150,
      "pending": 10,
      "inProgress": 25,
      "completed": 115,
      "avgCompletionTime": "4.5 hours"
    },
    "inventory": {
      "lowStockCount": 5,
      "totalValue": 5000000,
      "topMovingParts": [
        { "name": "Battery Module", "quantity": 50 }
      ]
    },
    "customers": {
      "total": 500,
      "new": 25,
      "returning": 125
    }
  },
  "success": true
}
```

##### GET `/api/reports/revenue`
```typescript
Query Params:
?serviceCenterId=uuid
?dateFrom=2025-01-01
?dateTo=2025-12-31
?groupBy=day|week|month
?format=json|excel|pdf

Response: 200 OK (JSON)
{
  "data": {
    "reportId": "uuid",
    "summary": {
      "totalRevenue": 1500000,
      "totalJobs": 150,
      "avgJobValue": 10000
    },
    "breakdown": [
      {
        "period": "2025-01",
        "revenue": 890000,
        "jobs": 89,
        "avgValue": 10000
      }
    ]
  },
  "success": true
}

Response: 200 OK (Excel/PDF)
// File download
```

---

### 9. File Upload

##### POST `/api/files/upload`
```typescript
Content-Type: multipart/form-data

Form Data:
- file: <binary>
- category: "job_card_images" | "warranty_documents" | "invoices"
- relatedEntityId: "uuid"
- relatedEntityType: "job_card" | "vehicle" | "customer"

Validation:
- Max file size: 10MB
- Allowed types: jpg, jpeg, png, pdf, doc, docx

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "url": "https://cdn.example.com/files/uuid.jpg",
    "filename": "image.jpg",
    "originalName": "original_image.jpg",
    "mimetype": "image/jpeg",
    "size": 1024576,
    "category": "job_card_images",
    "relatedEntityId": "uuid",
    "relatedEntityType": "job_card",
    "uploadedBy": "uuid",
    "createdAt": "2025-12-20T10:00:00Z"
  },
  "success": true
}
```

##### GET `/api/files`
```typescript
Query Params:
?entityType=job_card
?entityId=uuid
?category=warranty_documents

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "url": "https://cdn.example.com/files/uuid.jpg",
      "filename": "image.jpg",
      "category": "job_card_images"
    }
  ],
  "success": true
}
```

##### DELETE `/api/files/{id}`
```typescript
Response: 200 OK
{
  "message": "File deleted successfully",
  "success": true
}
```

---

### 10. Bulk Operations

##### POST `/api/customers/bulk`
```typescript
Request:
{
  "customers": [
    {
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john@example.com"
    },
    {
      "name": "Jane Smith",
      "phone": "+919876543211",
      "email": "jane@example.com"
    }
  ]
}

Response: 201 Created
{
  "data": {
    "created": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "data": { "id": "uuid", "customerNumber": "CUST-0001" }
      },
      {
        "index": 1,
        "success": true,
        "data": { "id": "uuid", "customerNumber": "CUST-0002" }
      }
    ],
    "errors": []
  },
  "success": true
}
```

##### PATCH `/api/job-cards/bulk`
```typescript
Request:
{
  "updates": [
    { "id": "uuid1", "status": "COMPLETED" },
    { "id": "uuid2", "status": "IN_PROGRESS" }
  ]
}

Response: 200 OK
{
  "data": {
    "updated": 2,
    "failed": 0
  },
  "success": true
}
```

---

## 🔒 Security & Multi-Tenancy

### Tenant Isolation Middleware

**CRITICAL: Must be implemented for ALL endpoints**

```typescript
// tenant-isolation.middleware.ts

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user; // From JWT
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Admin can access all data
    if (user.role === 'admin' || user.role === 'central_inventory_manager') {
      return next();
    }
    
    // Auto-filter by service center for SC users
    if (user.serviceCenterId) {
      // Add to query filters
      req.tenantFilter = {
        serviceCenterId: user.serviceCenterId
      };
    }
    
    next();
  }
}

// Usage in controller
@Get()
async findAll(@Request() req, @Query() query) {
  const filters = {
    ...query.filters,
    ...req.tenantFilter  // Auto-injected by middleware
  };
  
  return this.service.findAll(filters);
}
```

### Role-Based Access Control (RBAC)

```typescript
// Decorator: @RequirePermission('job_cards:create')

const PERMISSIONS = {
  admin: ['*'],  // All permissions
  
  sc_manager: [
    'job_cards:*',
    'customers:*',
    'vehicles:*',
    'appointments:*',
    'inventory:read',
    'inventory:request',
    'reports:read'
  ],
  
  service_engineer: [
    'job_cards:read',
    'job_cards:update',
    'parts_requests:create',
    'parts_requests:read'
  ],
  
  service_advisor: [
    'customers:*',
    'vehicles:*',
    'appointments:*',
    'quotations:*',
    'job_cards:create',
    'job_cards:read'
  ],
  
  call_center: [
    'customers:create',
    'customers:read',
    'appointments:create',
    'appointments:read'
  ],
  
  inventory_manager: [
    'inventory:*',
    'parts_requests:read',
    'parts_requests:approve',
    'parts_issues:receive'
  ],
  
  central_inventory_manager: [
    'central_inventory:*',
    'purchase_orders:*',
    'parts_issues:*'
  ]
};
```

### Rate Limiting

```typescript
// Global rate limiting
{
  ttl: 60,  // 60 seconds
  limit: 100  // 100 requests per minute
}

// Response headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000

// Error: 429 Too Many Requests
{
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "status": 429,
  "retryAfter": 60
}
```

---

## ⚡ Performance Optimizations

### 1. Redis Caching

```typescript
// Cache expensive queries
const CACHE_CONFIG = {
  // Static data - cache for 1 hour
  servicecenters: { ttl: 3600 },
  
  // Customer data - cache for 5 minutes
  customers: { ttl: 300 },
  
  // Inventory - cache for 1 minute (changes frequently)
  inventory: { ttl: 60 },
  
  // Analytics - cache for 15 minutes
  analytics: { ttl: 900 }
};

// Cache key pattern
customer:{id}
customer:{id}:vehicles
inventory:sc:{serviceCenterId}
analytics:dashboard:{serviceCenterId}:{date}
```

### 2. Database Indexes

```sql
-- Critical indexes for performance

-- Customers
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_number ON customers(customer_number);

-- Vehicles  
CREATE INDEX idx_vehicles_registration ON vehicles(registration);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);

-- Job Cards
CREATE INDEX idx_jobcards_number ON job_cards(job_card_number);
CREATE INDEX idx_jobcards_customer ON job_cards(customer_id);
CREATE INDEX idx_jobcards_vehicle ON job_cards(vehicle_id);
CREATE INDEX idx_jobcards_sc_status ON job_cards(service_center_id, status);
CREATE INDEX idx_jobcards_sc_created ON job_cards(service_center_id, created_at DESC);

-- Inventory
CREATE INDEX idx_inventory_sc ON inventory(service_center_id);
CREATE INDEX idx_inventory_sc_stock ON inventory(service_center_id, stock_quantity);
CREATE INDEX idx_inventory_part_number ON inventory(part_number);

-- Parts Issues
CREATE INDEX idx_parts_issues_sc ON parts_issues(to_service_center_id);
CREATE INDEX idx_parts_issues_status ON parts_issues(status);
```

### 3. Query Optimization

```typescript
// Use select to limit fields
prisma.customer.findMany({
  select: {
    id: true,
    name: true,
    phone: true
  }
});

// Use cursor-based pagination for large datasets
prisma.jobCard.findMany({
  take: 20,
  skip: 1,
  cursor: {
    id: lastId
  }
});

// Batch queries with DataLoader
const customerLoader = new DataLoader(async (ids) => {
  const customers = await prisma.customer.findMany({
    where: { id: { in: ids } }
  });
  return ids.map(id => customers.find(c => c.id === id));
});
```

---

## 🔄 Complete Workflows

### Workflow 1: Purchase Order → Stock Receive

```
1. Central Inventory Manager creates PO
   POST /api/purchase-orders
   
2. Submit for approval
   PATCH /api/purchase-orders/{id}/submit
   
3. Admin approves
   PATCH /api/purchase-orders/{id}/approve
   
4. Supplier delivers goods
   
5. Central Inventory Manager receives stock
   PATCH /api/purchase-orders/{id}/receive
   
Backend Auto-Updates:
- central_inventory.stockQuantity += receivedQty
- purchase_order.status = "COMPLETED"
- Create stock transaction record
```

### Workflow 2: Parts Transfer (Central → SC)

```
1. SC Manager requests parts
   POST /api/parts-issues
   
Backend Auto-Updates:
- central_inventory.allocated += requestedQty
- parts_issue.status = "PENDING_APPROVAL"

2. Admin approves
   PATCH /api/parts-issues/{id}/approve
   
Backend Auto-Updates:
- central_inventory.stockQuantity -= approvedQty
- central_inventory.allocated -= requestedQty
- parts_issue.status = "APPROVED"

3. Dispatch parts
   PATCH /api/parts-issues/{id}/dispatch
   
Backend Auto-Updates:
- parts_issue.status = "DISPATCHED"

4. SC Inventory Manager receives
   PATCH /api/parts-issues/{id}/receive
   
Backend Auto-Updates:
- service_center_inventory.stockQuantity += receivedQty
- parts_issue.status = "COMPLETED"
- Create stock transaction record
```

### Workflow 3: Job Card Parts Request

```
1. Engineer requests parts from job card
   POST /api/job-cards/{id}/request-parts
   
Backend Auto-Updates:
- Create parts request
- job_card.status = "PARTS_PENDING"
- Notify inventory manager

2. Inventory Manager reviews
   GET /api/parts-requests?status=PENDING
   
3. Approve and issue parts
   PATCH /api/parts-requests/{id}/approve
   
Backend Auto-Updates:
- inventory.stockQuantity -= approvedQty
- Create job_card_items
- parts_request.status = "ISSUED"
- Notify engineer

4. Engineer continues work
   PATCH /api/job-cards/{id}/status
   { "status": "IN_PROGRESS" }
```

### Workflow 4: Complete Job → Invoice → Customer Update

```
1. Engineer completes job
   PATCH /api/job-cards/{id}/status
   { "status": "COMPLETED" }
   
2. Create invoice
   POST /api/invoices
   
3. Mark invoice as paid
   PATCH /api/invoices/{id}/status
   { "status": "PAID" }
   
Backend Auto-Updates:
- customer.lastServiceCenterId = job_card.serviceCenterId
- customer.lastServiceDate = NOW()
- customer.lastInvoiceNumber = invoice.invoiceNumber
- vehicle.lastServiceDate = NOW()
- vehicle.lastServiceCenterId = job_card.serviceCenterId
- vehicle.totalServices += 1
- vehicle.totalSpent += invoice.grandTotal
- vehicle.currentStatus = "AVAILABLE"
- vehicle.activeJobCardId = null
```

---

## ✅ Integration Checklist

### Phase 1: Core Setup (Week 1)
- [ ] Setup NestJS project
- [ ] Configure Prisma with PostgreSQL
- [ ] Setup Redis connection
- [ ] Implement JWT authentication
- [ ] Create global middleware (tenant isolation, rate limiting, logging)
- [ ] Setup error handling
- [ ] Configure CORS
- [ ] Setup file upload (AWS S3 or local)

### Phase 2: Database & Schema (Week 1-2)
- [ ] Create complete Prisma schema
- [ ] Run migrations
- [ ] Add all database indexes
- [ ] Create seed data
- [ ] Setup database backup strategy

### Phase 3: Authentication & Authorization (Week 2)
- [ ] Implement login endpoint
- [ ] Implement refresh token endpoint
- [ ] Create RBAC system
- [ ] Add permission decorators
- [ ] Test role-based access

### Phase 4: Core Business Logic (Week 2-4)
- [ ] Customers CRUD with search
- [ ] Vehicles CRUD with service history
- [ ] Service Centers CRUD
- [ ] Appointments CRUD
- [ ] Job Cards CRUD with status workflow
- [ ] Quotations CRUD
- [ ] Invoices CRUD

### Phase 5: Inventory System (Week 3-5)
- [ ] Service Center Inventory CRUD
- [ ] Central Inventory CRUD
- [ ] Purchase Orders workflow
- [ ] Parts Issue workflow
- [ ] Stock adjustments
- [ ] Low stock alerts
- [ ] Parts requests
- [ ] Stock transaction history

### Phase 6: Advanced Features (Week 5-6)
- [ ] Implement caching layer
- [ ] Add field selection support
- [ ] Add advanced filtering
- [ ] Add cursor-based pagination
- [ ] Implement bulk operations
- [ ] Add analytics endpoints
- [ ] Add reports generation
- [ ] File upload & management

### Phase 7: Performance & Optimization (Week 6-7)
- [ ] Setup connection pooling
- [ ] Implement query optimization
- [ ] Add DataLoader for N+1 prevention
- [ ] Setup read replicas (if needed)
- [ ] Load testing
- [ ] Performance monitoring

### Phase 8: Integration & Testing (Week 7-8)
- [ ] API documentation (Swagger)
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] Frontend integration testing
- [ ] Security audit
- [ ] Performance testing
- [ ] Production deployment

---

## 🚀 Production Deployment

### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: dms
      POSTGRES_USER: dms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://dms_user:${DB_PASSWORD}@postgres:5432/dms
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Health Check Endpoint
```typescript
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-12-20T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  },
  "version": "1.0.0"
}
```

---

## 📞 Support

For integration issues or questions:
- Documentation: See BACKEND_API_CONTRACT.md
- Gap Analysis: See BACKEND_API_CONTRACT_ANALYSIS.md
- Job Card Parts: See JOB_CARD_PARTS_REFERENCE.md

---

**Status**: ✅ Ready for Backend Development  
**Estimated Timeline**: 8 weeks for complete implementation  
**Priority**: Start with Phase 1-3 for MVP (4 weeks)
