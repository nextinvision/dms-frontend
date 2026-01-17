# Inventory Architecture Fix - Central vs Service Center Inventory

**Date:** January 16, 2026  
**Issue:** Clarification of inventory logic and separation of concerns

---

## Problem Statement

The DMS system has **two distinct inventory systems** that need to be clearly separated:

1. **Central Inventory** - Global inventory NOT tied to any service center
2. **Service Center Inventory** - Unique inventory for each individual service center

---

## Current Architecture (✅ CORRECT)

### Backend Schema

The Prisma schema is **already correctly designed**:

#### **Service Center Inventory (Inventory Model)**
```prisma
model Inventory {
  id              String        @id @default(uuid())
  serviceCenterId String        // ✅ REQUIRED - Tied to specific service center
  serviceCenter   ServiceCenter @relation(fields: [serviceCenterId], references: [id])
  
  // Part Information
  oemPartNumber   String?
  partName        String
  partNumber      String
  category        String
  stockQuantity   Int
  minStockLevel   Int
  maxStockLevel   Int
  
  // Pricing
  costPrice       Decimal
  unitPrice       Decimal
  gstRate         Int
  
  // ... other fields
  
  @@index([serviceCenterId, stockQuantity])
}
```

**Key Points:**
- ✅ Has `serviceCenterId` field (REQUIRED)
- ✅ Each service center has its own unique inventory
- ✅ Same part can exist in multiple service centers with different stock levels
- ✅ Managed by **Service Center Inventory Manager**

---

#### **Central Inventory (CentralInventory Model)**
```prisma
model CentralInventory {
  id            String   @id @default(uuid())
  // ❌ NO serviceCenterId - This is GLOBAL
  
  partName      String
  partNumber    String   @unique  // ✅ Unique across entire central inventory
  category      String
  stockQuantity Int
  allocated     Int      @default(0)  // Parts allocated to pending requests
  available     Int      // Computed: stockQuantity - allocated
  minStockLevel Int
  
  // Pricing
  unitPrice     Decimal
  costPrice     Decimal
  gstRate       Int
  
  @@index([partNumber])
}
```

**Key Points:**
- ✅ NO `serviceCenterId` field - it's global
- ✅ Centralized stock for the entire organization
- ✅ Tracks allocated vs available stock
- ✅ Managed by **Central Inventory Manager**

---

## User Roles & Access

### 1. Central Inventory Manager
**Location:** `/central-inventory/*`

**Responsibilities:**
- Manage global central inventory (CentralInventory model)
- View total stock across organization
- Issue parts to service centers
- Purchase orders from suppliers
- NOT tied to any specific service center

**Access:**
- ✅ Can view ALL central inventory
- ✅ Can issue parts to ANY service center
- ❌ CANNOT directly access service center inventory
- ❌ NOT assigned to any `serviceCenterId`

---

### 2. Service Center Inventory Manager
**Location:** `/inventory-manager/*` (when role = `inventory_manager`)

**Responsibilities:**
- Manage local service center inventory (Inventory model)
- Request parts from central inventory
- Assign parts to technicians
- Track service center stock levels
- TIED to a specific service center

**Access:**
- ✅ Can view only THEIR service center's inventory (filtered by `serviceCenterId`)
- ✅ Can request parts from central inventory
- ✅ Can manage local stock (add, update, delete)
- ❌ CANNOT see other service centers' inventory
- ✅ Assigned to specific `serviceCenterId`

---

### 3. Service Advisor / Technician
**Location:** `/sc/inventory` (VIEW ONLY)

**Responsibilities:**
- View available parts at their service center
- Request parts for job cards
- Check stock availability

**Access:**
- ✅ VIEW-ONLY access to their service center's inventory
- ✅ Can request parts (creates request for inventory manager)
- ❌ CANNOT modify inventory
- ✅ Assigned to specific `serviceCenterId`

---

## Data Flow

### Flow 1: Service Center Requests Parts from Central

```
┌─────────────────────────────────────┐
│ SERVICE CENTER INVENTORY            │
│ (Low Stock Alert)                   │
│ Stock: 5 / Min: 10                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ SC Inventory Manager                │
│ Creates Parts Request               │
│ • Quantity: 20                      │
│ • Urgency: Normal/Urgent            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Request Sent to Central Inventory   │
│ Status: PENDING_APPROVAL            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Central Inventory Manager           │
│ Reviews Request                     │
│ • Checks central stock              │
│ • Approves or Rejects               │
└──────────────┬──────────────────────┘
               │
               ▼ (If Approved)
┌─────────────────────────────────────┐
│ CENTRAL INVENTORY                   │
│ Action: Allocate Stock              │
│ • allocate += 20                    │
│ • available -= 20                   │
│ Status: ADMIN_APPROVED              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Admin Approves                      │
│ Status: DISPATCHED                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Parts Delivered to SC               │
│ Status: COMPLETED                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ CENTRAL INVENTORY                   │
│ Action: Deduct Stock                │
│ • stockQuantity -= 20               │
│ • allocated -= 20                   │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ SERVICE CENTER INVENTORY            │
│ Action: Add Stock                   │
│ • stockQuantity += 20               │
│ New Stock: 25                       │
└─────────────────────────────────────┘
```

---

### Flow 2: Technician Uses Parts for Job

```
┌─────────────────────────────────────┐
│ TECHNICIAN                          │
│ Working on Job Card                 │
│ Needs: Brake Pad (Qty: 2)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Parts Request Created               │
│ Linked to Job Card                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ SC Inventory Manager                │
│ Approves \u0026 Assigns Parts            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ SERVICE CENTER INVENTORY            │
│ Action: Deduct Stock                │
│ • stockQuantity -= 2                │
│ • Assigned to technician            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ JOB CARD                            │
│ Parts Added (PART 2)                │
│ • Brake Pad x2                      │
│ • Cost: ₹3,000                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ QUOTATION \u0026 INVOICE                │
│ Includes used parts                 │
└─────────────────────────────────────┘
```

---

## Backend API Endpoints

### Central Inventory Endpoints
**Base:** `/api/central-inventory`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all central inventory | Central Inv Mgr, Admin |
| GET | `/:id` | Get specific item | Central Inv Mgr, Admin |
| POST | `/` | Add new part to central inventory | Central Inv Mgr, Admin |
| PATCH | `/:id/stock` | Update stock quantity | Central Inv Mgr |
| POST | `/:id/add-stock` | Add to stock (receiving) | Central Inv Mgr |
| GET | `/low-stock` | Get low stock items | Central Inv Mgr |

**Key Query Parameters:**
- `category`: Filter by category
- `search`: Search by name or part number
- ❌ NO `serviceCente rId` parameter - it's global!

---

### Service Center Inventory Endpoints
**Base:** `/api/inventory`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get inventory for a service center | SC Inv Mgr, SC Staff |
| GET | `/low-stock/:serviceCenterId` | Get low stock for SC | SC Inv Mgr |
| POST | `/` | Add part to SC inventory | SC Inv Mgr |
| PATCH | `/:id` | Update part details | SC Inv Mgr |
| POST | `/:id/adjust-stock` | Adjust stock (add/subtract/set) | SC Inv Mgr |
| DELETE | `/:id` | Remove part from inventory | SC Inv Mgr, Admin |

**Key Query Parameters:**
- ✅ `serviceCenterId`: REQUIRED for most operations
- `category`: Filter by category
- `search`: Search by name or part number
- `lowStock`: Filter for low stock items

---

## Frontend Pages Structure

### Central Inventory Manager

```
/central-inventory/
  ├── dashboard/          # Overview of central stock
  ├── stock/              # View/manage central inventory
  │   ├── issue/          # Issue parts to service centers
  │   └── update/         # Receive stock from suppliers
  ├── parts-issue-requests/ # Approve SC requests
  ├── purchase-orders/    # Purchase from suppliers
  └── invoices/           # Billing to service centers
```

**Key Features:**
- ✅ NO service center filter (views ALL stock)
- ✅ Can issue to any service center
- ✅ Manages global stock levels

---

### Service Center Inventory Manager

```
/inventory-manager/
  ├── dashboard/          # SC-specific inventory overview
  ├── parts-master/       # Manage SC inventory (CRUD)
  ├── parts-entry/        # Add new parts to SC inventory
  ├── parts-stock-update/ # Update SC stock levels
  ├── approvals/          # Approve technician parts requests
  └── otc-orders/         # Over-the-counter sales
```

**Key Features:**
- ✅ Filtered by user's `serviceCenterId`
- ✅ Can request from central inventory
- ✅ Manages only their SC stock

---

### Service Advisor / Technician

```
/sc/inventory/          # VIEW-ONLY inventory for SC
```

**Key Features:**
- ✅ VIEW-ONLY access
- ✅ Filtered by their `serviceCenterId`
- ✅ Can request parts (creates request for SC Inv Mgr)

---

## Current Implementation Status

### ✅ What's Working Correctly

1. **Schema Design**
   - ✅ Inventory model has `serviceCenterId`
   - ✅ CentralInventory model has NO `serviceCenterId`
   - ✅ Proper indexing

2. **Backend Services**
   - ✅ `inventory.service.ts` filters by `serviceCenterId`
   - ✅ `central-inventory.service.ts` has NO service center filtering
   - ✅ Stock allocation logic (allocated/available)

3. **User Roles**
   - ✅ `central_inventory_manager` is global role (no SC assignment)
   - ✅ `inventory_manager` requires `serviceCenterId`

---

### ⚠️ Areas That Need Attention

1. **Frontend Service Center Inventory Page**
   - **Current:** `/sc/inventory/page.tsx` loads from `partsMasterService.getAll()`
   - **Issue:** Should filter by current user's `serviceCenterId`
   - **Fix Needed:** Add service center filtering

2. **Parts Master Service**
   - **Current:** May not be consistently filtering by service center
   - **Fix Needed:** Ensure all queries include `serviceCenterId` parameter

3. **Central Inventory Issue Flow**
   - **Status:** Needs testing to ensure stock properly transfers
   - **Fix Needed:** Verify allocation/deduction logic

---

## Recommended Fixes

### Fix 1: Update Service Center Inventory Page

**File:** `/home/fortytwoev/dms-frontend/src/app/(service-center)/sc/inventory/page.tsx`

**Current (Line 59):**
```typescript
const parts: Part[] = await partsMasterService.getAll();
```

**Should Be:**
```typescript
const serviceCenterId = getServiceCenterContext().serviceCenterId;
const parts: Part[] = await partsMasterService.getAll({ serviceCenterId });
```

---

### Fix 2: Update Parts Master Service

**File:** `/home/fortytwoev/dms-frontend/src/features/inventory/services/partsMaster.service.ts`

Ensure `getAll()` method accepts and uses `serviceCenterId`:

```typescript
async getAll(options?: { serviceCenterId?: string }) {
  const params: any = {};
  if (options?.serviceCenterId) {
    params.serviceCenterId = options.serviceCenterId;
  }
  
  const response = await api.get('/inventory', { params });
  return response.data;
}
```

---

### Fix 3: Backend Inventory Service Validation

**File:** `/home/fortytwoev/dms-backend/src/modules/inventory/inventory.service.ts`

Add validation to ensure `serviceCenterId` is always provided:

```typescript
async findAll(query: any) {
  const { serviceCenterId, category, search, lowStock } = query;
  
  // ✅ Enforce serviceCenterId for regular inventory queries
  if (!serviceCenterId) {
    throw new BadRequestException(
      'serviceCenterId is required for service center inventory queries'
    );
  }
  
  const where: any = { serviceCenterId };
  
  // ... rest of logic
}
```

---

## Summary

### Architecture Principles

1. **Central Inventory**
   - ❌ NO `serviceCenterId`
   - ✅ Global stock for entire organization
   - ✅ One source of truth
   - ✅ Managed by Central Inventory Manager

2. **Service Center Inventory**
   - ✅ REQUIRES `serviceCenterId`
   - ✅ Unique per service center
   - ✅ Independent stock management
   - ✅ Managed by SC Inventory Manager

3. **Stock Transfer**
   - ✅ From Central → Service Center (via Parts Issue)
   - ✅ From Service Center → Technician (via Parts Request)
   - ✅ From Service Center → Customer (via Job Card/Invoice)

4. **User Access**
   - ✅ Central Inv Mgr: Global role, no SC assignment
   - ✅ SC Inv Mgr: Requires SC assignment, sees only their SC
   - ✅ Technician/Advisor: Requires SC assignment, VIEW-ONLY

---

**Status:** Schema ✅ CORRECT | Frontend ⚠️ NEEDS FILTERING | Backend ✅ MOSTLY CORRECT

**Next Steps:**
1. Implement service center filtering on frontend inventory pages
2. Add validation on backend to enforce `serviceCenterId` requirement
3. Test parts issue flow from Central to Service Center
4. Document the complete inventory lifecycle

---

**Document Created:** 2026-01-16T18:55:51Z  
**Author:** DMS Development Team
