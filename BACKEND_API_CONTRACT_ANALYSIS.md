# Backend API Contract - Critical Analysis & Optimization

> **Analysis Date**: 2025-12-20
> **Status**: Critical Gaps Identified
> **Priority**: HIGH - Must Address Before Implementation

---

## 🚨 CRITICAL ISSUES

### 1. **MISSING: Complete Inventory Management System**

The current contract has minimal inventory endpoints. Missing:

#### Central Inventory APIs (CRITICAL)
```typescript
// MISSING: Central inventory stock management
GET /api/central-inventory?page=1&limit=20
POST /api/central-inventory/parts
PUT /api/central-inventory/parts/{id}
DELETE /api/central-inventory/parts/{id}

// MISSING: Purchase Order workflow
POST /api/purchase-orders
GET /api/purchase-orders/{id}
PATCH /api/purchase-orders/{id}/approve
PATCH /api/purchase-orders/{id}/receive

// MISSING: Parts transfer between central and service centers
POST /api/parts-issues  // Issue parts from central to SC
GET /api/parts-issues/{id}
PATCH /api/parts-issues/{id}/approve  // Admin approval
PATCH /api/parts-issues/{id}/receive  // SC receives parts

// MISSING: Stock adjustments
POST /api/stock-adjustments
GET /api/stock-adjustments
```

#### Service Center Inventory APIs
```typescript
// Current: Only GET /api/inventory?serviceCenterId={id}

// MISSING:
POST /api/inventory/parts  // Add part to SC inventory
PUT /api/inventory/parts/{id}  // Update part details
PATCH /api/inventory/parts/{id}/adjust-stock  // Adjust stock levels
GET /api/inventory/low-stock  // Get low stock alerts
GET /api/inventory/parts/{partId}/transactions  // Stock transaction history
```

---

## ⚠️ PERFORMANCE BOTTLENECKS

### 1. **Nested Expansion Without Limits**

**Problem:**
```typescript
// This could return MASSIVE payload
GET /api/customers/{id}?expand=vehicles.serviceHistory

// Customer with 10 vehicles × 50 services each = 500+ records
// Response size: Potentially 5MB+ of JSON
```

**Solution: Add Pagination to Nested Expands**
```typescript
// Limit nested results
GET /api/customers/{id}?expand=vehicles&vehicles.limit=5&expand=serviceHistory&serviceHistory.limit=10

// Or separate endpoint
GET /api/vehicles/{id}/service-history?page=1&limit=20
```

**Recommendation:**
```typescript
// Add to contract:
interface ExpandOptions {
  expand?: string;  // "vehicles,serviceHistory"
  expandLimit?: Record<string, number>;  // { vehicles: 5, serviceHistory: 10 }
}

// Response with pagination metadata for nested expands
{
  "data": {
    "vehicles": [...],
    "vehiclesPagination": {
      "returned": 5,
      "total": 10,
      "hasMore": true
    }
  }
}
```

### 2. **No Cursor-Based Pagination for Large Datasets**

**Current:**
```typescript
// Offset-based pagination - SLOW for large datasets
GET /api/job-cards?page=500&limit=20
// Database has to skip 9,980 records!
```

**Solution: Add Cursor-Based Pagination**
```typescript
GET /api/job-cards?cursor=uuid&limit=20

// Response
{
  "data": [...],
  "pagination": {
    "nextCursor": "uuid-next",
    "hasMore": true
  }
}
```

### 3. **Missing Field Selection (Sparse Fieldsets)**

**Problem:**
```typescript
// Returns ALL fields even if only need name and phone
GET /api/customers/{id}

// Wastes bandwidth and processing
```

**Solution:**
```typescript
GET /api/customers/{id}?fields=id,name,phone,email

// Returns only requested fields
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com"
  }
}
```

### 4. **No Caching Strategy**

**Missing:**
- Redis caching layer
- Cache invalidation strategy
- Cache-Control headers
- ETag support

**Add to Contract:**
```typescript
// Response Headers
{
  "Cache-Control": "max-age=300, must-revalidate",
  "ETag": "hash-of-response",
  "X-Cache-Status": "HIT" | "MISS"
}

// Client sends
{
  "If-None-Match": "hash-of-response"
}

// Server responds
304 Not Modified
```

---

## 🔒 SECURITY GAPS

### 1. **Missing Multi-Tenant Isolation**

**Critical Issue:**
```typescript
// Current: No mention of tenant isolation
GET /api/job-cards  // Could return ALL job cards across ALL service centers!
```

**Solution: Enforce Tenant Scoping**
```typescript
// Add to EVERY endpoint:
// Backend MUST filter by user's serviceCenterId automatically

// For admin: Can access all
// For SC users: Auto-filter by their SC

// Middleware
async function tenantFilter(request) {
  const user = request.user;
  
  if (user.role !== 'admin') {
    // Auto-add serviceCenterId filter
    request.filters.serviceCenterId = user.serviceCenterId;
  }
}
```

### 2. **No Rate Limiting**

**Add to Contract:**
```typescript
// Response Headers
{
  "X-RateLimit-Limit": "100",
  "X-RateLimit-Remaining": "95",
  "X-RateLimit-Reset": "1640000000"
}

// Error Response (429)
{
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "status": 429,
  "retryAfter": 60
}
```

### 3. **Missing Input Validation Details**

**Add Validation Rules:**
```typescript
// Customer Creation
{
  "name": {
    "required": true,
    "minLength": 2,
    "maxLength": 100,
    "pattern": "^[a-zA-Z\\s]+$"
  },
  "phone": {
    "required": true,
    "pattern": "^\\+91[6-9]\\d{9}$"  // Indian mobile
  },
  "email": {
    "optional": true,
    "format": "email",
    "maxLength": 255
  }
}
```

---

## 📊 MISSING ADVANCED FEATURES

### 1. **No Bulk Operations**

**Add:**
```typescript
// Bulk create
POST /api/customers/bulk
{
  "customers": [
    { "name": "John", "phone": "+919876543210" },
    { "name": "Jane", "phone": "+919876543211" }
  ]
}

// Response
{
  "data": {
    "created": 2,
    "failed": 0,
    "results": [...]
  }
}

// Bulk update
PATCH /api/job-cards/bulk
{
  "updates": [
    { "id": "uuid1", "status": "COMPLETED" },
    { "id": "uuid2", "status": "IN_PROGRESS" }
  ]
}

// Bulk delete (soft delete)
DELETE /api/customers/bulk
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

### 2. **No Search/Filter Documentation**

**Current:** Only basic search mentioned

**Add Comprehensive Filtering:**
```typescript
// Advanced filtering
GET /api/job-cards?filters[status]=IN_PROGRESS&filters[serviceCenterId]=uuid&filters[createdAt][gte]=2025-01-01

// Sorting
GET /api/job-cards?sort=-createdAt,status  // - means descending

// Full-text search
GET /api/customers/search?q=John+Doe&fields=name,email,phone

// Fuzzy search
GET /api/vehicles/search?q=MH01AB&fuzzy=true
```

### 3. **No Aggregation/Analytics Endpoints**

**Add:**
```typescript
// Dashboard stats
GET /api/analytics/dashboard?serviceCenterId=uuid&dateRange=2025-01-01,2025-12-31

Response:
{
  "data": {
    "totalRevenue": "₹1,50,000",
    "totalJobs": 150,
    "avgJobValue": "₹1,000",
    "completionRate": 95,
    "topServices": ["Battery Service", "Brake Replacement"],
    "monthlyTrend": [...]
  }
}

// Inventory analytics
GET /api/analytics/inventory?serviceCenterId=uuid

// Customer analytics
GET /api/analytics/customers?metrics=retention,ltv,frequency
```

---

## 🔄 MISSING CRITICAL WORKFLOWS

### 1. **Complete Central Inventory Workflow**

```typescript
/**
 * WORKFLOW: Purchase Order → Receive → Issue to SC → Receive at SC
 */

// Step 1: Create Purchase Order (Central Inventory Manager)
POST /api/purchase-orders
{
  "supplierId": "uuid",
  "items": [
    {
      "partName": "Battery Module",
      "quantity": 100,
      "unitPrice": 5000,
      "gstRate": 18
    }
  ]
}

// Step 2: Admin Approval
PATCH /api/purchase-orders/{id}/approve
{
  "approvedBy": "admin-uuid",
  "notes": "Approved"
}

// Step 3: Receive Stock (when supplier delivers)
PATCH /api/purchase-orders/{id}/receive
{
  "receivedItems": [
    {
      "partId": "uuid",
      "receivedQty": 100,
      "condition": "Good"
    }
  ],
  "receivedBy": "manager-uuid",
  "invoiceNumber": "INV-001"
}
// Backend auto-updates central_inventory.stockQuantity += 100

// Step 4: Issue Parts to Service Center
POST /api/parts-issues
{
  "fromCentralInventory": true,
  "toServiceCenterId": "sc-uuid",
  "items": [
    {
      "partId": "uuid",
      "requestedQty": 50
    }
  ],
  "requestedBy": "sc-manager-uuid"
}

// Step 5: Admin Approval for Parts Issue
PATCH /api/parts-issues/{id}/approve
{
  "approvedBy": "admin-uuid",
  "approvedQty": 50
}
// Backend auto-updates:
// - central_inventory.stockQuantity -= 50
// - parts_issue.status = "APPROVED"

// Step 6: SC Receives Parts
PATCH /api/parts-issues/{id}/receive
{
  "receivedBy": "sc-inventory-manager-uuid",
  "receivedItems": [
    {
      "partId": "uuid",
      "receivedQty": 50
    }
  ]
}
// Backend auto-updates:
// - service_center_inventory.stockQuantity += 50
// - parts_issue.status = "COMPLETED"
```

### 2. **Parts Request from Job Card to Inventory**

```typescript
/**
 * WORKFLOW: Engineer requests parts → Inventory Manager approves → Parts issued
 */

// Step 1: Engineer creates parts request from job card
POST /api/job-cards/{id}/request-parts
{
  "parts": [
    {
      "inventoryPartId": "uuid",
      "requestedQty": 2,
      "isWarranty": false
    }
  ],
  "urgency": "HIGH"
}

// Step 2: SC Manager or Inventory Manager Review
GET /api/parts-requests?status=PENDING&serviceCenterId=uuid

// Step 3: Approve and Issue
PATCH /api/parts-requests/{id}/approve
{
  "approvedBy": "manager-uuid",
  "items": [
    {
      "partId": "uuid",
      "approvedQty": 2,
      "issuedFrom": "SC-INV-001"
    }
  ]
}
// Backend auto-updates:
// - inventory.stockQuantity -= 2
// - job_card_items created/updated
// - parts_request.status = "ISSUED"
```

---

## 🚀 OPTIMIZATION RECOMMENDATIONS

### 1. **Database Indexing (CRITICAL)**

**Add to Prisma Schema:**
```prisma
model JobCard {
  // ... existing fields
  
  @@index([serviceCenterId, status, createdAt])  // Composite for filtering
  @@index([customerId, createdAt])  // Customer history queries
  @@index([vehicleId, createdAt])   // Vehicle history queries
  @@index([status, assignedEngineerId])  // Engineer workload
}

model ServiceHistory {
  @@index([vehicleId, date(sort: Desc)])  // Fast service history lookup
  @@index([customerId, date(sort: Desc)])
  @@index([serviceCenterId, date(sort: Desc)])
}

model Inventory {
  @@index([serviceCenterId, stockQuantity])  // Low stock queries
  @@index([partNumber])  // Part lookup
}
```

### 2. **Read Replicas for Heavy Queries**

```typescript
// Configure in DATABASE_URL
DATABASE_URL=postgresql://write@primary:5432/dms
DATABASE_READ_URL=postgresql://read@replica:5432/dms

// In Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      replica: process.env.DATABASE_READ_URL
    }
  }
});

// Use read replica for GET requests
await prisma.$replica.customer.findMany();
```

### 3. **Query Result Caching with Redis**

```typescript
// Cache expensive queries
async function getCustomerWithVehicles(id: string) {
  const cacheKey = `customer:${id}:vehicles`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await prisma.customer.findUnique({
    where: { id },
    include: { vehicles: true }
  });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}

// Invalidate on update
async function updateCustomer(id: string, data: any) {
  await prisma.customer.update({ where: { id }, data });
  
  // Invalidate cache
  await redis.del(`customer:${id}:vehicles`);
}
```

### 4. **Connection Pooling**

```typescript
// Add to Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling
  pool_size = 20
  connection_limit = 100
  pool_timeout = 30
}

// Use PgBouncer for connection pooling
// DATABASE_URL=postgresql://user:pass@pgbouncer:6432/dms?pgbouncer=true
```

### 5. **Batch Data Loader (N+1 Query Prevention)**

```typescript
// Without DataLoader (N+1 problem)
async function getJobCardsWithCustomers(ids: string[]) {
  const jobCards = await prisma.jobCard.findMany({ where: { id: { in: ids } } });
  
  // N queries!
  for (const jc of jobCards) {
    jc.customer = await prisma.customer.findUnique({ where: { id: jc.customerId } });
  }
}

// With DataLoader (1+1 queries)
import DataLoader from 'dataloader';

const customerLoader = new DataLoader(async (ids: string[]) => {
  const customers = await prisma.customer.findMany({
    where: { id: { in: ids } }
  });
  
  return ids.map(id => customers.find(c => c.id === id));
});

// Use in resolver
jobCard.customer = await customerLoader.load(jobCard.customerId);
```

---

## 📝 ADDITIONAL REQUIRED ENDPOINTS

### 1. **File Upload & Management**

```typescript
POST /api/files/upload
Content-Type: multipart/form-data

{
  "file": <binary>,
  "category": "job_card_images" | "warranty_documents" | "invoices",
  "relatedEntityId": "uuid",
  "relatedEntityType": "job_card" | "vehicle" | "customer"
}

Response:
{
  "data": {
    "id": "uuid",
    "url": "https://cdn.example.com/files/uuid.jpg",
    "filename": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 1024576
  }
}

GET /api/files?entityType=job_card&entityId=uuid
DELETE /api/files/{id}
```

### 2. **Notifications & Alerts**

```typescript
GET /api/notifications?userId=uuid&unread=true
PATCH /api/notifications/{id}/mark-read
POST /api/notifications/mark-all-read

// WebSocket for real-time
ws://api.example.com/notifications?token=jwt

// Server sends
{
  "type": "LOW_STOCK_ALERT",
  "message": "Brake pads low stock: 2 units remaining",
  "data": { "partId": "uuid", "stockLevel": 2 }
}
```

### 3. **Reports & Exports**

```typescript
GET /api/reports/job-cards?format=pdf&dateRange=2025-01-01,2025-01-31
GET /api/reports/inventory?format=excel&serviceCenterId=uuid
GET /api/reports/revenue?format=csv&groupBy=month

POST /api/exports/job-cards
{
  "filters": { "status": "COMPLETED" },
  "format": "excel",
  "email": "user@example.com"
}

// Async export
Response:
{
  "data": {
    "exportId": "uuid",
    "status": "PROCESSING",
    "estimatedTime": "2 minutes"
  }
}

GET /api/exports/{id}/status
GET /api/exports/{id}/download
```

---

## 🎯 PRIORITY IMPLEMENTATION ORDER

### Phase 1: Critical Fixes (Week 1-2)
1. ✅ Add multi-tenant isolation middleware
2. ✅ Implement rate limiting
3. ✅ Add input validation schemas
4. ✅ Add pagination to nested expands
5. ✅ Add database indexes

### Phase 2: Inventory System (Week 3-4)
1. ✅ Central inventory APIs
2. ✅ Purchase order workflow
3. ✅ Parts issue workflow
4. ✅ Stock adjustment APIs
5. ✅ Low stock alerts

### Phase 3: Performance (Week 5-6)
1. ✅ Redis caching layer
2. ✅ Query optimization
3. ✅ Connection pooling
4. ✅ Read replicas (if needed)
5. ✅ Cursor-based pagination

### Phase 4: Advanced Features (Week 7-8)
1. ✅ Bulk operations
2. ✅ Advanced search/filtering
3. ✅ Analytics endpoints
4. ✅ File upload system
5. ✅ Notification system
6. ✅ Reports & exports

---

## ⚡ QUICK WINS (Implement First)

1. **Add serviceCenterId auto-filtering** - Prevents data leaks (2 hours)
2. **Add pagination limits** - Prevents memory issues (1 hour)
3. **Add database indexes** - 10x faster queries (2 hours)
4. **Add field selection** - Reduce bandwidth (3 hours)
5. **Add basic caching** - Reduce DB load (4 hours)

---

## 📋 UPDATED API CONTRACT SECTIONS NEEDED

### 1. Inventory Management (Complete Rewrite)
### 2. Search & Filtering (New Section)
### 3. Caching Strategy (New Section)
### 4. Security & Tenant Isolation (New Section)
### 5. File Upload (New Section)
### 6. Analytics & Reports (New Section)
### 7. Bulk Operations (New Section)
### 8. Notifications (New Section)

---

**RECOMMENDATION**: Before backend implementation, create detailed API specs for all missing sections above. Current contract is ~60% complete.
