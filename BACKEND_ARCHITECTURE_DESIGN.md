# DMS Backend Architecture - NestJS + Prisma + PostgreSQL

## Executive Summary

Based on comprehensive analysis of your DMS frontend, this document provides a complete backend architecture design using **NestJS**, **Prisma ORM**, and **PostgreSQL**.

---

## 1. SYSTEM OVERVIEW

### 1.1 Technology Stack
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Authentication**: JWT + Refresh Tokens
- **File Storage**: AWS S3 / Local Storage
- **Real-time**: Socket.IO (for notifications)
- **Cache**: Redis (optional, for performance)
- **Queue**: Bull (for async tasks like email, WhatsApp)

### 1.2 Core Modules
1. **Authentication & Authorization**
2. **Customers & Vehicles**
3. **Appointments**
4. **Service Requests**
5. **Job Cards**
6. **Quotations**
7. **Invoices**
8. **Inventory Management** (Parts Master, Stock)
9. **Central Inventory** (Multi-warehouse)
10. **Workshop Management** (Engineers, Bays)
11. **Service Centers**
12. **Notifications** (WhatsApp, Email, SMS)
13. **Reports & Analytics**
14. **File Management**

---

## 2. DATABASE SCHEMA (Prisma)

### 2.1 Core Entities

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION & USERS
// ============================================

enum UserRole {
  ADMIN
  SUPER_ADMIN
  SC_MANAGER
  SERVICE_ENGINEER
  SERVICE_ADVISOR
  CALL_CENTER
  INVENTORY_MANAGER
  CENTRAL_INVENTORY_MANAGER
}

model User {
  id                String   @id @default(uuid())
  email             String   @unique
  password          String
  name              String
  role              UserRole
  serviceCenterId   String?
  serviceCenter     ServiceCenter? @relation(fields: [serviceCenterId], references: [id])
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  createdJobCards   JobCard[] @relation("CreatedBy")
  assignedJobCards  JobCard[] @relation("AssignedEngineer")
  createdQuotations Quotation[] @relation("CreatedBy")
  
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@map("refresh_tokens")
}

// ============================================
// SERVICE CENTERS
// ============================================

model ServiceCenter {
  id            String   @id @default(uuid())
  code          String   @unique // SC001, SC002
  name          String
  address       String
  city          String
  state         String
  pincode       String
  phone         String?
  email         String?
  gstNumber     String?
  panNumber     String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  users         User[]
  customers     Customer[]
  vehicles      Vehicle[]
  appointments  Appointment[]
  jobCards      JobCard[]
  quotations    Quotation[]
  invoices      Invoice[]
  inventory     InventoryItem[]
  purchaseOrders PurchaseOrder[]
  
  @@map("service_centers")
}

// ============================================
// CUSTOMERS & VEHICLES
// ============================================

enum CustomerType {
  B2C
  B2B
}

enum ServiceType {
  WALK_IN
  HOME_SERVICE
}

model Customer {
  id                    String        @id @default(uuid())
  customerNumber        String        @unique
  name                  String
  phone                 String
  whatsappNumber        String?
  alternateMobile       String?
  email                 String?
  address               String?
  cityState             String?
  pincode               String?
  customerType          CustomerType  @default(B2C)
  serviceType           ServiceType   @default(WALK_IN)
  addressType           String?       // home, work
  workAddress           String?
  pickupDropRequired    Boolean       @default(false)
  pickupAddress         String?
  dropAddress           String?
  serviceCenterId       String?
  serviceCenter         ServiceCenter? @relation(fields: [serviceCenterId], references: [id])
  lastServiceCenterId   String?
  lastServiceDate       DateTime?
  isActive              Boolean       @default(true)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  
  // Relations
  vehicles              Vehicle[]
  appointments          Appointment[]
  jobCards              JobCard[]
  quotations            Quotation[]
  invoices              Invoice[]
  
  @@index([phone])
  @@index([customerNumber])
  @@map("customers")
}

enum VehicleStatus {
  AVAILABLE
  ACTIVE_JOB_CARD
  IN_SERVICE
}

model Vehicle {
  id                    String         @id @default(uuid())
  customerId            String
  customer              Customer       @relation(fields: [customerId], references: [id])
  serviceCenterId       String?
  serviceCenter         ServiceCenter? @relation(fields: [serviceCenterId], references: [id])
  registration          String         @unique
  vin                   String         @unique
  vehicleMake           String
  vehicleModel          String
  vehicleYear           Int?
  vehicleColor          String?
  variant               String?
  motorNumber           String?
  chargerSerialNumber   String?
  purchaseDate          DateTime?
  warrantyStatus        String?
  insuranceStartDate    DateTime?
  insuranceEndDate      DateTime?
  insuranceCompanyName  String?
  currentStatus         VehicleStatus  @default(AVAILABLE)
  activeJobCardId       String?
  lastServiceDate       DateTime?
  lastServiceCenterId   String?
  totalServices         Int            @default(0)
  totalSpent            Decimal        @default(0) @db.Decimal(10, 2)
  isActive              Boolean        @default(true)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  
  // Relations
  appointments          Appointment[]
  jobCards              JobCard[]
  quotations            Quotation[]
  invoices              Invoice[]
  serviceHistory        ServiceHistory[]
  
  @@index([registration])
  @@index([vin])
  @@index([customerId])
  @@map("vehicles")
}

// ============================================
// APPOINTMENTS
// ============================================

enum AppointmentStatus {
  CONFIRMED
  PENDING
  CANCELLED
  IN_PROGRESS
  COMPLETED
}

model Appointment {
  id                      String             @id @default(uuid())
  appointmentNumber       String             @unique
  customerId              String
  customer                Customer           @relation(fields: [customerId], references: [id])
  vehicleId               String
  vehicle                 Vehicle            @relation(fields: [vehicleId], references: [id])
  serviceCenterId         String
  serviceCenter           ServiceCenter      @relation(fields: [serviceCenterId], references: [id])
  serviceType             String
  appointmentDate         DateTime
  appointmentTime         String
  duration                String?
  status                  AppointmentStatus  @default(PENDING)
  customerComplaint       String?
  previousServiceHistory  String?
  estimatedCost           Decimal?           @db.Decimal(10, 2)
  estimatedTime           String?
  location                String             @default("Station") // Station, Home
  pickupAddress           String?
  pickupState             String?
  pickupCity              String?
  pickupPincode           String?
  dropAddress             String?
  dropState               String?
  dropCity                String?
  dropPincode             String?
  customerArrivalTime     DateTime?
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt
  
  // Relations
  jobCards                JobCard[]
  quotations              Quotation[]
  
  @@index([customerId])
  @@index([vehicleId])
  @@index([serviceCenterId])
  @@index([appointmentDate])
  @@map("appointments")
}

// ============================================
// JOB CARDS
// ============================================

enum JobCardStatus {
  ARRIVAL_PENDING
  JOB_CARD_PENDING_VEHICLE
  JOB_CARD_ACTIVE
  CHECK_IN_ONLY
  NO_RESPONSE_LEAD
  MANAGER_QUOTE
  AWAITING_QUOTATION_APPROVAL
  CREATED
  ASSIGNED
  IN_PROGRESS
  PARTS_PENDING
  COMPLETED
  INVOICED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model JobCard {
  id                        String        @id @default(uuid())
  jobCardNumber             String        @unique // SC001-2025-12-0001
  serviceCenterId           String
  serviceCenter             ServiceCenter @relation(fields: [serviceCenterId], references: [id])
  customerId                String
  customer                  Customer      @relation(fields: [customerId], references: [id])
  vehicleId                 String
  vehicle                   Vehicle       @relation(fields: [vehicleId], references: [id])
  appointmentId             String?
  appointment               Appointment?  @relation(fields: [appointmentId], references: [id])
  quotationId               String?
  quotation                 Quotation?    @relation(fields: [quotationId], references: [id])
  serviceType               String
  description               String
  status                    JobCardStatus @default(CREATED)
  priority                  Priority      @default(MEDIUM)
  location                  String        @default("Station")
  isTemporary               Boolean       @default(false)
  arrivalMode               String?       // vehicle_present, vehicle_absent, check_in_only
  
  // Assignment
  createdById               String
  createdBy                 User          @relation("CreatedBy", fields: [createdById], references: [id])
  assignedEngineerId        String?
  assignedEngineer          User?         @relation("AssignedEngineer", fields: [assignedEngineerId], references: [id])
  
  // Estimates
  estimatedCost             Decimal?      @db.Decimal(10, 2)
  estimatedTime             String?
  estimatedDeliveryDate     DateTime?
  
  // Workflow
  submittedToManager        Boolean       @default(false)
  submittedAt               DateTime?
  workflowState             JobCardStatus?
  partRequestStatus         String?       // pending, service_manager_approved, inventory_manager_approved, n/a
  partsPending              Boolean       @default(false)
  workCompletionNotified    Boolean       @default(false)
  
  // Timestamps
  startTime                 DateTime?
  completedAt               DateTime?
  customerArrivalTimestamp  DateTime?
  createdAt                 DateTime      @default(now())
  updatedAt                 DateTime      @updatedAt
  
  // Invoice
  invoiceId                 String?
  invoice                   Invoice?      @relation(fields: [invoiceId], references: [id])
  
  // JSON fields for structured data
  part1Data                 Json?         // Customer & Vehicle Information
  draftIntakeData           Json?         // Draft service intake data
  checkInSlipData           Json?         // Check-in slip information
  
  // Relations
  parts                     JobCardPart[]
  workItems                 JobCardWorkItem[]
  part2AData                JobCardPart2A?
  part3Data                 JobCardPart3[]
  partsRequests             PartsRequest[]
  documents                 JobCardDocument[]
  statusHistory             JobCardStatusHistory[]
  
  @@index([jobCardNumber])
  @@index([customerId])
  @@index([vehicleId])
  @@index([serviceCenterId])
  @@index([status])
  @@index([assignedEngineerId])
  @@map("job_cards")
}

// PART 2: Parts & Work Items
model JobCardPart {
  id                  String   @id @default(uuid())
  jobCardId           String
  jobCard             JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)
  srNo                Int
  partId              String?
  part                InventoryItem? @relation(fields: [partId], references: [id])
  partName            String
  partCode            String?
  partWarrantyTag     String?
  qty                 Int
  amount              Decimal  @default(0) @db.Decimal(10, 2)
  technician          String?
  labourCode          String?
  itemType            String   // part, work_item
  serialNumber        String?
  isWarranty          Boolean  @default(false)
  createdAt           DateTime @default(now())
  
  @@index([jobCardId])
  @@map("job_card_parts")
}

model JobCardWorkItem {
  id                  String   @id @default(uuid())
  jobCardId           String
  jobCard             JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)
  srNo                Int
  description         String
  labourCode          String
  estimatedTime       String?
  amount              Decimal  @default(0) @db.Decimal(10, 2)
  technician          String?
  createdAt           DateTime @default(now())
  
  @@index([jobCardId])
  @@map("job_card_work_items")
}

// PART 2A: Warranty/Insurance Details
model JobCardPart2A {
  id                      String   @id @default(uuid())
  jobCardId               String   @unique
  jobCard                 JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)
  videoEvidence           String?  // Yes, No
  vinImage                String?
  odoImage                String?
  damageImages            String?
  issueDescription        String?
  numberOfObservations    String?
  symptom                 String?
  defectPart              String?
  createdAt               DateTime @default(now())
  
  @@map("job_card_part2a")
}

// PART 3: Part Requisition & Issue Details
model JobCardPart3 {
  id                  String   @id @default(uuid())
  jobCardId           String
  jobCard             JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)
  partCode            String
  partName            String
  qty                 Int
  issueQty            Int      @default(0)
  returnQty           Int      @default(0)
  warrantyTagNumber   String?
  returnPartNumber    String?
  approvalDetails     String?
  createdAt           DateTime @default(now())
  
  @@index([jobCardId])
  @@map("job_card_part3")
}

model JobCardDocument {
  id          String   @id @default(uuid())
  jobCardId   String
  jobCard     JobCard  @relation(fields: [jobCardId], references: [id], onDelete: Cascade)
  type        String   // id_proof, rc_copy, warranty_card, photo, video
  fileName    String
  fileUrl     String
  fileSize    Int?
  mimeType    String?
  uploadedAt  DateTime @default(now())
  
  @@index([jobCardId])
  @@map("job_card_documents")
}

model JobCardStatusHistory {
  id          String        @id @default(uuid())
  jobCardId   String
  jobCard     JobCard       @relation(fields: [jobCardId], references: [id], onDelete: Cascade)
  fromStatus  JobCardStatus?
  toStatus    JobCardStatus
  changedBy   String
  notes       String?
  changedAt   DateTime      @default(now())
  
  @@index([jobCardId])
  @@map("job_card_status_history")
}

// ============================================
// QUOTATIONS
// ============================================

enum QuotationStatus {
  DRAFT
  SENT_TO_CUSTOMER
  CUSTOMER_APPROVED
  CUSTOMER_REJECTED
  SENT_TO_MANAGER
  MANAGER_APPROVED
  MANAGER_REJECTED
  NO_RESPONSE_LEAD
  MANAGER_QUOTE
}

model Quotation {
  id                    String           @id @default(uuid())
  quotationNumber       String           @unique
  serviceCenterId       String
  serviceCenter         ServiceCenter    @relation(fields: [serviceCenterId], references: [id])
  customerId            String
  customer              Customer         @relation(fields: [customerId], references: [id])
  vehicleId             String?
  vehicle               Vehicle?         @relation(fields: [vehicleId], references: [id])
  appointmentId         String?
  appointment           Appointment?     @relation(fields: [appointmentId], references: [id])
  documentType          String           @default("Quotation") // Quotation, Proforma Invoice, Check-in Slip
  quotationDate         DateTime
  validUntil            DateTime?
  status                QuotationStatus  @default(DRAFT)
  
  // Insurance
  hasInsurance          Boolean          @default(false)
  insurerId             String?
  insurer               Insurer?         @relation(fields: [insurerId], references: [id])
  insuranceStartDate    DateTime?
  insuranceEndDate      DateTime?
  
  // Amounts
  subtotal              Decimal          @db.Decimal(10, 2)
  discount              Decimal          @default(0) @db.Decimal(10, 2)
  discountPercent       Decimal          @default(0) @db.Decimal(5, 2)
  preGstAmount          Decimal          @db.Decimal(10, 2)
  cgstAmount            Decimal          @default(0) @db.Decimal(10, 2)
  sgstAmount            Decimal          @default(0) @db.Decimal(10, 2)
  igstAmount            Decimal          @default(0) @db.Decimal(10, 2)
  totalAmount           Decimal          @db.Decimal(10, 2)
  
  // Notes
  notes                 String?
  batterySerialNumber   String?
  customNotes           String?
  noteTemplateId        String?
  vehicleLocation       String?          // with_customer, at_workshop
  
  // Approval Workflow
  passedToManager       Boolean          @default(false)
  passedToManagerAt     DateTime?
  sentToCustomer        Boolean          @default(false)
  sentToCustomerAt      DateTime?
  customerApproved      Boolean          @default(false)
  customerApprovedAt    DateTime?
  customerRejected      Boolean          @default(false)
  customerRejectedAt    DateTime?
  managerApproved       Boolean          @default(false)
  managerApprovedAt     DateTime?
  managerRejected       Boolean          @default(false)
  managerRejectedAt     DateTime?
  whatsappSent          Boolean          @default(false)
  whatsappSentAt        DateTime?
  
  // User tracking
  createdById           String
  createdBy             User             @relation("CreatedBy", fields: [createdById], references: [id])
  serviceAdvisorId      String?
  managerId             String?
  
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  
  // Relations
  items                 QuotationItem[]
  jobCards              JobCard[]
  
  @@index([quotationNumber])
  @@index([customerId])
  @@index([serviceCenterId])
  @@index([status])
  @@map("quotations")
}

model QuotationItem {
  id            String     @id @default(uuid())
  quotationId   String
  quotation     Quotation  @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  serialNumber  Int
  partName      String
  partNumber    String?
  hsnSacCode    String?
  quantity      Int
  rate          Decimal    @db.Decimal(10, 2)
  gstPercent    Decimal    @db.Decimal(5, 2)
  amount        Decimal    @db.Decimal(10, 2)
  
  @@index([quotationId])
  @@map("quotation_items")
}

model Insurer {
  id         String      @id @default(uuid())
  name       String
  address    String?
  gstNumber  String?
  phone      String?
  email      String?
  isActive   Boolean     @default(true)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  
  quotations Quotation[]
  
  @@map("insurers")
}

model NoteTemplate {
  id        String   @id @default(uuid())
  name      String
  content   String
  category  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("note_templates")
}

// ============================================
// INVOICES
// ============================================

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  PARTIALLY_PAID
  CANCELLED
}

model Invoice {
  id                    String         @id @default(uuid())
  invoiceNumber         String         @unique
  serviceCenterId       String
  serviceCenter         ServiceCenter  @relation(fields: [serviceCenterId], references: [id])
  customerId            String
  customer              Customer       @relation(fields: [customerId], references: [id])
  vehicleId             String?
  vehicle               Vehicle?       @relation(fields: [vehicleId], references: [id])
  invoiceDate           DateTime
  dueDate               DateTime?
  status                InvoiceStatus  @default(DRAFT)
  
  // Amounts
  subtotal              Decimal        @db.Decimal(10, 2)
  totalTaxableAmount    Decimal        @db.Decimal(10, 2)
  totalCgst             Decimal        @default(0) @db.Decimal(10, 2)
  totalSgst             Decimal        @default(0) @db.Decimal(10, 2)
  totalIgst             Decimal        @default(0) @db.Decimal(10, 2)
  totalTax              Decimal        @default(0) @db.Decimal(10, 2)
  discount              Decimal        @default(0) @db.Decimal(10, 2)
  roundOff              Decimal        @default(0) @db.Decimal(10, 2)
  grandTotal            Decimal        @db.Decimal(10, 2)
  paidAmount            Decimal        @default(0) @db.Decimal(10, 2)
  balance               Decimal        @db.Decimal(10, 2)
  
  // Additional details
  placeOfSupply         String?
  billingAddress        String?
  shippingAddress       String?
  amountInWords         String?
  termsAndConditions    String?
  
  // Payment
  paymentMethod         String?
  paymentReference      String?
  
  // Metadata
  createdBy             String?
  approvedBy            String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  
  // Relations
  items                 InvoiceItem[]
  jobCards              JobCard[]
  payments              Payment[]
  
  @@index([invoiceNumber])
  @@index([customerId])
  @@index([serviceCenterId])
  @@index([status])
  @@map("invoices")
}

model InvoiceItem {
  id              String   @id @default(uuid())
  invoiceId       String
  invoice         Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  name            String
  hsnSacCode      String?
  unitPrice       Decimal  @db.Decimal(10, 2)
  quantity        Int
  taxableAmount   Decimal  @db.Decimal(10, 2)
  gstRate         Decimal  @db.Decimal(5, 2)
  cgstAmount      Decimal  @db.Decimal(10, 2)
  sgstAmount      Decimal  @db.Decimal(10, 2)
  igstAmount      Decimal  @db.Decimal(10, 2)
  totalAmount     Decimal  @db.Decimal(10, 2)
  
  @@index([invoiceId])
  @@map("invoice_items")
}

model Payment {
  id                String   @id @default(uuid())
  invoiceId         String
  invoice           Invoice  @relation(fields: [invoiceId], references: [id])
  amount            Decimal  @db.Decimal(10, 2)
  paymentMethod     String
  paymentReference  String?
  paymentDate       DateTime
  notes             String?
  createdAt         DateTime @default(now())
  
  @@index([invoiceId])
  @@map("payments")
}

// ============================================
// INVENTORY (SERVICE CENTER)
// ============================================

model InventoryItem {
  id                    String        @id @default(uuid())
  partId                String        @unique
  partName              String
  partNumber            String?
  category              String?
  serviceCenterId       String
  serviceCenter         ServiceCenter @relation(fields: [serviceCenterId], references: [id])
  
  // Pricing
  price                 Decimal       @db.Decimal(10, 2)
  purchasePrice         Decimal?      @db.Decimal(10, 2)
  pricePreGst           Decimal?      @db.Decimal(10, 2)
  
  // GST
  gstRateInput          Decimal?      @db.Decimal(5, 2)
  gstRateOutput         Decimal?      @db.Decimal(5, 2)
  gstAmount             Decimal?      @db.Decimal(10, 2)
  totalPrice            Decimal?      @db.Decimal(10, 2)
  
  // Stock
  stockQuantity         Int           @default(0)
  minStockLevel         Int           @default(0)
  unit                  String        @default("pcs")
  
  // Part Details
  description           String?
  oemPartNumber         String?
  originType            String?       // OLD, NEW
  brandName             String?
  variant               String?
  partType              String?
  color                 String?
  
  // Labour
  estimatedLabour       String?
  estimatedLabourWorkTime String?
  labourRate            Decimal?      @db.Decimal(10, 2)
  labourGstRate         Decimal?      @db.Decimal(5, 2)
  labourPrice           Decimal?      @db.Decimal(10, 2)
  
  // Flags
  highValuePart         Boolean       @default(false)
  isActive              Boolean       @default(true)
  
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  
  // Relations
  jobCardParts          JobCardPart[]
  partsRequests         PartsRequest[]
  stockHistory          StockUpdateHistory[]
  
  @@index([partId])
  @@index([serviceCenterId])
  @@map("inventory_items")
}

model StockUpdateHistory {
  id              String        @id @default(uuid())
  partId          String
  part            InventoryItem @relation(fields: [partId], references: [id])
  adjustmentType  String        // add, remove, adjust, transfer
  quantity        Int
  previousQty     Int
  newQty          Int
  reason          String
  referenceNumber String?
  adjustedBy      String
  notes           String?
  createdAt       DateTime      @default(now())
  
  @@index([partId])
  @@map("stock_update_history")
}

// ============================================
// PARTS REQUESTS (Job Card to Inventory)
// ============================================

enum PartsRequestStatus {
  PENDING
  SERVICE_MANAGER_APPROVED
  SERVICE_MANAGER_REJECTED
  INVENTORY_APPROVED
  INVENTORY_REJECTED
  ISSUED
  COMPLETED
}

model PartsRequest {
  id                      String             @id @default(uuid())
  requestNumber           String             @unique
  jobCardId               String
  jobCard                 JobCard            @relation(fields: [jobCardId], references: [id])
  status                  PartsRequestStatus @default(PENDING)
  requestedBy             String
  requestedAt             DateTime           @default(now())
  
  // Approval workflow
  serviceManagerApproved  Boolean            @default(false)
  serviceManagerApprovedBy String?
  serviceManagerApprovedAt DateTime?
  serviceManagerRejectedBy String?
  serviceManagerRejectedAt DateTime?
  serviceManagerNotes     String?
  
  inventoryApproved       Boolean            @default(false)
  inventoryApprovedBy     String?
  inventoryApprovedAt     DateTime?
  inventoryRejectedBy     String?
  inventoryRejectedAt     DateTime?
  inventoryNotes          String?
  
  issuedBy                String?
  issuedAt                DateTime?
  
  notes                   String?
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt
  
  // Relations
  items                   PartsRequestItem[]
  
  @@index([jobCardId])
  @@index([status])
  @@map("parts_requests")
}

model PartsRequestItem {
  id              String        @id @default(uuid())
  partsRequestId  String
  partsRequest    PartsRequest  @relation(fields: [partsRequestId], references: [id], onDelete: Cascade)
  partId          String
  part            InventoryItem @relation(fields: [partId], references: [id])
  requestedQty    Int
  approvedQty     Int?
  issuedQty       Int?
  notes           String?
  
  @@index([partsRequestId])
  @@map("parts_request_items")
}

// ============================================
// CENTRAL INVENTORY
// ============================================

model CentralStock {
  id                      String   @id @default(uuid())
  partId                  String   @unique
  partName                String
  partNumber              String?
  hsnCode                 String?
  category                String?
  currentQty              Int      @default(0)
  minStock                Int      @default(0)
  maxStock                Int      @default(100)
  unitPrice               Decimal  @db.Decimal(10, 2)
  costPrice               Decimal  @db.Decimal(10, 2)
  supplier                String?
  location                String?
  warehouse               String?
  status                  String   // In Stock, Low Stock, Out of Stock
  
  // Extended fields
  brandName               String?
  variant                 String?
  partType                String?  // NEW, OLD
  color                   String?
  preGstAmountToUs        Decimal? @db.Decimal(10, 2)
  gstRateInput            Decimal? @db.Decimal(5, 2)
  gstInputAmount          Decimal? @db.Decimal(10, 2)
  postGstAmountToUs       Decimal? @db.Decimal(10, 2)
  salePricePreGst         Decimal? @db.Decimal(10, 2)
  gstRateOutput           Decimal? @db.Decimal(5, 2)
  gstOutputAmount         Decimal? @db.Decimal(10, 2)
  postGstSaleAmount       Decimal? @db.Decimal(10, 2)
  associatedLabourName    String?
  associatedLabourCode    String?
  workTime                String?
  labourRate              Decimal? @db.Decimal(10, 2)
  labourGstRate           Decimal? @db.Decimal(5, 2)
  labourGstAmount         Decimal? @db.Decimal(10, 2)
  labourPostGstAmount     Decimal? @db.Decimal(10, 2)
  highValuePart           Boolean  @default(false)
  partSerialNumber        String?
  
  lastUpdated             DateTime @updatedAt
  lastUpdatedBy           String?
  notes                   String?
  isActive                Boolean  @default(true)
  createdAt               DateTime @default(now())
  
  // Relations
  purchaseOrderItems      PurchaseOrderItem[]
  partsIssueItems         PartsIssueItem[]
  adjustments             StockAdjustment[]
  
  @@index([partId])
  @@map("central_stocks")
}

enum PurchaseOrderStatus {
  PENDING
  APPROVED
  REJECTED
  PARTIALLY_FULFILLED
  FULFILLED
}

model PurchaseOrder {
  id                  String                @id @default(uuid())
  poNumber            String                @unique
  serviceCenterId     String
  serviceCenter       ServiceCenter         @relation(fields: [serviceCenterId], references: [id])
  requestedBy         String
  requestedByEmail    String?
  requestedAt         DateTime              @default(now())
  status              PurchaseOrderStatus   @default(PENDING)
  priority            String                @default("normal") // low, normal, high, urgent
  totalAmount         Decimal               @db.Decimal(10, 2)
  
  // Approval
  approvedBy          String?
  approvedAt          DateTime?
  rejectedBy          String?
  rejectedAt          DateTime?
  rejectionReason     String?
  
  // Fulfillment
  fulfilledBy         String?
  fulfilledAt         DateTime?
  
  notes               String?
  jobCardId           String?
  vehicleNumber       String?
  customerName        String?
  
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt
  
  // Relations
  items               PurchaseOrderItem[]
  partsIssues         PartsIssue[]
  
  @@index([poNumber])
  @@index([serviceCenterId])
  @@index([status])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id                String         @id @default(uuid())
  purchaseOrderId   String
  purchaseOrder     PurchaseOrder  @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  partId            String
  part              CentralStock   @relation(fields: [partId], references: [id])
  requestedQty      Int
  approvedQty       Int?
  issuedQty         Int            @default(0)
  unitPrice         Decimal        @db.Decimal(10, 2)
  totalPrice        Decimal        @db.Decimal(10, 2)
  status            String         @default("pending") // pending, approved, rejected, issued
  notes             String?
  
  @@index([purchaseOrderId])
  @@map("purchase_order_items")
}

enum PartsIssueStatus {
  PENDING
  PENDING_ADMIN_APPROVAL
  ADMIN_APPROVED
  ADMIN_REJECTED
  ISSUED
  RECEIVED
  CANCELLED
}

model PartsIssue {
  id                    String            @id @default(uuid())
  issueNumber           String            @unique
  serviceCenterId       String
  serviceCenterName     String
  purchaseOrderId       String?
  purchaseOrder         PurchaseOrder?    @relation(fields: [purchaseOrderId], references: [id])
  issuedBy              String
  issuedAt              DateTime          @default(now())
  status                PartsIssueStatus  @default(PENDING)
  totalAmount           Decimal           @db.Decimal(10, 2)
  
  // Admin approval
  sentToAdmin           Boolean           @default(false)
  sentToAdminAt         DateTime?
  adminApproved         Boolean           @default(false)
  adminApprovedBy       String?
  adminApprovedAt       DateTime?
  adminRejected         Boolean           @default(false)
  adminRejectedBy       String?
  adminRejectedAt       DateTime?
  adminRejectionReason  String?
  
  // Receiving
  receivedBy            String?
  receivedAt            DateTime?
  
  notes                 String?
  transportDetails      Json?
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  // Relations
  items                 PartsIssueItem[]
  
  @@index([issueNumber])
  @@index([serviceCenterId])
  @@index([status])
  @@map("parts_issues")
}

model PartsIssueItem {
  id            String       @id @default(uuid())
  partsIssueId  String
  partsIssue    PartsIssue   @relation(fields: [partsIssueId], references: [id], onDelete: Cascade)
  partId        String
  part          CentralStock @relation(fields: [partId], references: [id])
  quantity      Int
  unitPrice     Decimal      @db.Decimal(10, 2)
  totalPrice    Decimal      @db.Decimal(10, 2)
  fromStock     String       // Central stock ID
  
  @@index([partsIssueId])
  @@map("parts_issue_items")
}

model StockAdjustment {
  id              String       @id @default(uuid())
  stockId         String
  stock           CentralStock @relation(fields: [stockId], references: [id])
  adjustmentType  String       // add, remove, adjust, transfer
  quantity        Int
  previousQty     Int
  newQty          Int
  reason          String
  adjustedBy      String
  adjustedAt      DateTime     @default(now())
  notes           String?
  referenceNumber String?
  
  @@index([stockId])
  @@map("stock_adjustments")
}

// ============================================
// SERVICE HISTORY
// ============================================

model ServiceHistory {
  id                String   @id @default(uuid())
  vehicleId         String
  vehicle           Vehicle  @relation(fields: [vehicleId], references: [id])
  serviceCenterId   String
  serviceCenterName String
  jobCardId         String?
  serviceDate       DateTime
  serviceType       String
  engineer          String
  parts             String[] // Array of part names
  labor             Decimal  @db.Decimal(10, 2)
  partsCost         Decimal  @db.Decimal(10, 2)
  totalCost         Decimal  @db.Decimal(10, 2)
  invoiceNumber     String?
  status            String
  odometer          String?
  feedbackRating    Int?     // 1-5 stars
  createdAt         DateTime @default(now())
  
  @@index([vehicleId])
  @@index([serviceCenterId])
  @@map("service_history")
}

// ============================================
// NOTIFICATIONS
// ============================================

enum NotificationType {
  INFO
  WARNING
  SUCCESS
  ERROR
}

model Notification {
  id          String           @id @default(uuid())
  userId      String
  type        NotificationType @default(INFO)
  title       String
  message     String
  isRead      Boolean          @default(false)
  link        String?
  metadata    Json?
  createdAt   DateTime         @default(now())
  readAt      DateTime?
  
  @@index([userId])
  @@index([isRead])
  @@map("notifications")
}

// ============================================
// SYSTEM CONFIGURATIONS
// ============================================

model SystemConfig {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  category  String?
  updatedAt DateTime @updatedAt
  updatedBy String?
  
  @@map("system_configs")
}
```

---

## 3. NESTJS MODULE STRUCTURE

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── interfaces/
│       └── pagination.interface.ts
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── aws.config.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── refresh-token.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── customers/
│   ├── customers.module.ts
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   └── dto/
│       ├── create-customer.dto.ts
│       └── search-customer.dto.ts
├── vehicles/
│   ├── vehicles.module.ts
│   ├── vehicles.controller.ts
│   ├── vehicles.service.ts
│   └── dto/
│       ├── create-vehicle.dto.ts
│       └── update-vehicle.dto.ts
├── appointments/
│   ├── appointments.module.ts
│   ├── appointments.controller.ts
│   ├── appointments.service.ts
│   └── dto/
│       ├── create-appointment.dto.ts
│       └── update-appointment.dto.ts
├── job-cards/
│   ├── job-cards.module.ts
│   ├── job-cards.controller.ts
│   ├── job-cards.service.ts
│   └── dto/
│       ├── create-job-card.dto.ts
│       ├── update-job-card.dto.ts
│       ├── add-parts.dto.ts
│       └── update-status.dto.ts
├── quotations/
│   ├── quotations.module.ts
│   ├── quotations.controller.ts
│   ├── quotations.service.ts
│   └── dto/
│       ├── create-quotation.dto.ts
│       └── update-quotation.dto.ts
├── invoices/
│   ├── invoices.module.ts
│   ├── invoices.controller.ts
│   ├── invoices.service.ts
│   └── dto/
│       ├── create-invoice.dto.ts
│       └── record-payment.dto.ts
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts
│   └── dto/
│       ├── create-part.dto.ts
│       └── update-stock.dto.ts
├── central-inventory/
│   ├── central-inventory.module.ts
│   ├── central-stocks/
│   │   ├── central-stocks.controller.ts
│   │   └── central-stocks.service.ts
│   ├── purchase-orders/
│   │   ├── purchase-orders.controller.ts
│   │   └── purchase-orders.service.ts
│   └── parts-issues/
│       ├── parts-issues.controller.ts
│       └── parts-issues.service.ts
├── parts-requests/
│   ├── parts-requests.module.ts
│   ├── parts-requests.controller.ts
│   └── parts-requests.service.ts
├── service-centers/
│   ├── service-centers.module.ts
│   ├── service-centers.controller.ts
│   └── service-centers.service.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.gateway.ts (WebSocket)
│   ├── notifications.service.ts
│   └── providers/
│       ├── whatsapp.service.ts
│       ├── email.service.ts
│       └── sms.service.ts
├── files/
│   ├── files.module.ts
│   ├── files.controller.ts
│   └── files.service.ts
└── reports/
    ├── reports.module.ts
    ├── reports.controller.ts
    └── reports.service.ts
```

---

## 4. API ENDPOINTS

### 4.1 Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

### 4.2 Customers
```
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PATCH  /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/search?query=&type=
GET    /api/customers/:id/vehicles
GET    /api/customers/:id/service-history
```

### 4.3 Vehicles
```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PATCH  /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/search?registration=&vin=
```

### 4.4 Appointments
```
GET    /api/appointments
GET    /api/appointments/:id
POST   /api/appointments
PATCH  /api/appointments/:id
DELETE /api/appointments/:id
PATCH  /api/appointments/:id/status
POST   /api/appointments/:id/customer-arrived
```

### 4.5 Job Cards
```
GET    /api/job-cards
GET    /api/job-cards/:id
POST   /api/job-cards
PATCH  /api/job-cards/:id
DELETE /api/job-cards/:id
PATCH  /api/job-cards/:id/status
POST   /api/job-cards/:id/assign-engineer
POST   /api/job-cards/:id/parts (Add parts)
POST   /api/job-cards/:id/work-items
PATCH  /api/job-cards/:id/part2a
POST   /api/job-cards/:id/part3
POST   /api/job-cards/:id/submit-to-manager
POST   /api/job-cards/:id/complete
POST   /api/job-cards/:id/documents
GET    /api/job-cards/search?query=&status=
```

### 4.6 Quotations
```
GET    /api/quotations
GET    /api/quotations/:id
POST   /api/quotations
PATCH  /api/quotations/:id
DELETE /api/quotations/:id
POST   /api/quotations/:id/send-to-customer
POST   /api/quotations/:id/customer-approve
POST   /api/quotations/:id/customer-reject
POST   /api/quotations/:id/send-to-manager
POST   /api/quotations/:id/manager-approve
POST   /api/quotations/:id/manager-reject
POST   /api/quotations/:id/whatsapp
GET    /api/quotations/:id/pdf
```

### 4.7 Invoices
```
GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices
PATCH  /api/invoices/:id
DELETE /api/invoices/:id
POST   /api/invoices/:id/payments
GET    /api/invoices/:id/pdf
POST   /api/invoices/:id/send
```

### 4.8 Inventory (Service Center)
```
GET    /api/inventory
GET    /api/inventory/:id
POST   /api/inventory
PATCH  /api/inventory/:id
DELETE /api/inventory/:id
POST   /api/inventory/:id/adjust-stock
GET    /api/inventory/:id/history
GET    /api/inventory/low-stock
```

### 4.9 Parts Requests
```
GET    /api/parts-requests
GET    /api/parts-requests/:id
POST   /api/parts-requests
PATCH  /api/parts-requests/:id/service-manager-approve
PATCH  /api/parts-requests/:id/inventory-approve
POST   /api/parts-requests/:id/issue
```

### 4.10 Central Inventory
```
GET    /api/central-inventory/stocks
POST   /api/central-inventory/stocks
PATCH  /api/central-inventory/stocks/:id
POST   /api/central-inventory/stocks/:id/adjust

GET    /api/central-inventory/purchase-orders
POST   /api/central-inventory/purchase-orders
PATCH  /api/central-inventory/purchase-orders/:id/approve
PATCH  /api/central-inventory/purchase-orders/:id/reject

GET    /api/central-inventory/parts-issues
POST   /api/central-inventory/parts-issues
PATCH  /api/central-inventory/parts-issues/:id/send-to-admin
PATCH  /api/central-inventory/parts-issues/:id/admin-approve
PATCH  /api/central-inventory/parts-issues/:id/receive
```

### 4.11 Service Centers
```
GET    /api/service-centers
GET    /api/service-centers/:id
POST   /api/service-centers
PATCH  /api/service-centers/:id
```

### 4.12 Reports
```
GET    /api/reports/dashboard-stats
GET    /api/reports/job-cards-summary
GET    /api/reports/revenue
GET    /api/reports/inventory
GET    /api/reports/engineer-performance
```

---

## 5. KEY IMPLEMENTATION DETAILS

### 5.1 Job Card Number Generation
```typescript
// job-cards/job-cards.service.ts
async generateJobCardNumber(serviceCenterId: string): Promise<string> {
  const serviceCenter = await this.prisma.serviceCenter.findUnique({
    where: { id: serviceCenterId },
  });
  
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get count of job cards for this service center, year, and month
  const count = await this.prisma.jobCard.count({
    where: {
      serviceCenterId,
      jobCardNumber: {
        startsWith: `${serviceCenter.code}-${year}-${month}`,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `${serviceCenter.code}-${year}-${month}-${sequence}`;
}
```

### 5.2 Role-Based Access Control
```typescript
// common/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// Usage in controller
@Get()
@Roles('service_advisor', 'sc_manager')
async findAll() { ... }
```

### 5.3 Status Transition Validation
```typescript
// job-cards/job-cards.service.ts
const VALID_TRANSITIONS: Record<JobCardStatus, JobCardStatus[]> = {
  CREATED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['PARTS_PENDING', 'COMPLETED'],
  PARTS_PENDING: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED: ['INVOICED'],
  INVOICED: [],
};

async updateStatus(id: string, newStatus: JobCardStatus) {
  const jobCard = await this.prisma.jobCard.findUnique({ where: { id } });
  
  const validTransitions = VALID_TRANSITIONS[jobCard.status];
  if (!validTransitions.includes(newStatus)) {
    throw new BadRequestException(
      `Invalid status transition from ${jobCard.status} to ${newStatus}`
    );
  }
  
  // Create status history
  await this.prisma.jobCardStatusHistory.create({
    data: {
      jobCardId: id,
      fromStatus: jobCard.status,
      toStatus: newStatus,
      changedBy: currentUser.id,
    },
  });
  
  return this.prisma.jobCard.update({
    where: { id },
    data: { status: newStatus },
  });
}
```

### 5.4 WhatsApp Integration
```typescript
// notifications/providers/whatsapp.service.ts
@Injectable()
export class WhatsAppService {
  async sendQuotation(quotation: Quotation, phoneNumber: string) {
    const pdfUrl = await this.generateQuotationPDF(quotation);
    
    // Using WhatsApp Business API or third-party service
    await this.whatsappClient.sendMessage({
      to: phoneNumber,
      template: 'quotation_template',
      parameters: {
        customer_name: quotation.customer.name,
        quotation_number: quotation.quotationNumber,
        amount: quotation.totalAmount,
        pdf_url: pdfUrl,
      },
    });
    
    await this.prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        whatsappSent: true,
        whatsappSentAt: new Date(),
      },
    });
  }
}
```

---

## 6. NEXT STEPS

### Phase 1: Setup (Week 1)
1. Initialize NestJS project
2. Set up Prisma with PostgreSQL
3. Implement authentication module
4. Create base CRUD operations

### Phase 2: Core Modules (Weeks 2-3)
1. Customers & Vehicles
2. Appointments
3. Job Cards
4. Service Centers

### Phase 3: Business Logic (Weeks 4-5)
1. Quotations with approval workflow
2. Invoices with payment tracking
3. Parts requests workflow
4. Status transitions

### Phase 4: Inventory (Week 6)
1. Service center inventory
2. Central inventory
3. Purchase orders
4. Parts issues

### Phase 5: Integrations (Week 7)
1. WhatsApp notifications
2. Email service
3. File upload/storage
4. PDF generation

### Phase 6: Polish (Week 8)
1. Reports & analytics
2. Real-time notifications (WebSocket)
3. Performance optimization
4. Testing & documentation

---

## 7. RECOMMENDED PACKAGES

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "aws-sdk": "^2.1400.0",
    "bull": "^4.11.0",
    "@nestjs/bull": "^10.0.0",
    "redis": "^4.6.0",
    "pdfkit": "^0.13.0",
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^3.0.9",
    "@types/bcrypt": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

**This architecture is production-ready and scales with your business needs!**
