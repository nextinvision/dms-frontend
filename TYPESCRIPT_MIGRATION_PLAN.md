# TypeScript Migration Plan - DMS Frontend

## 📋 Executive Summary

This document outlines the complete TypeScript migration strategy for the DMS (Dealer Management System) frontend. The project currently has **36 JavaScript files** that need to be migrated to TypeScript with proper type definitions.

## 🎯 Migration Goals

1. **Type Safety**: Add comprehensive type definitions for all data models
2. **Developer Experience**: Improve IDE autocomplete and error detection
3. **Maintainability**: Make codebase more maintainable with explicit types
4. **Scalability**: Prepare for future API integration with typed interfaces
5. **Zero Breaking Changes**: Maintain 100% backward compatibility during migration

## 📁 Proposed TypeScript File Architecture (Modular & Scalable)

**⚠️ IMPORTANT**: This architecture is optimized for scalability and large user bases. See `TYPESCRIPT_SCALABLE_ARCHITECTURE.md` for the complete modular structure.

```
src/
├── features/                       # 📁 Feature-Based Modules (MODULAR)
│   ├── auth/                       # Authentication feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── job-card/                   # Job card feature
│   ├── inventory/                  # Inventory feature
│   ├── invoice/                    # Invoice feature
│   └── [other features]/           # Other feature modules
│
├── shared/                         # 📁 Shared Resources
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Base components
│   │   ├── layout/                 # Layout components
│   │   └── forms/                  # Form components
│   ├── hooks/                      # Shared hooks
│   ├── utils/                      # Shared utilities
│   ├── types/                      # Shared types
│   └── constants/                  # Shared constants
│
├── app/                            # Next.js App Router (with route groups)
│   ├── (admin)/                    # Admin route group (code-split)
│   │   └── [admin pages]/
│   └── (service-center)/           # SC route group (code-split)
│       └── sc/[sc pages]/
│
├── contexts/                       # React contexts
│   ├── AuthContext.tsx
│   └── RoleContext.tsx
│
└── config/                         # Configuration
    ├── routes.config.ts
    └── menu.config.ts
```

**Note**: For complete modular structure, see `TYPESCRIPT_SCALABLE_ARCHITECTURE.md`

## 🔧 TypeScript Configuration

### Required Files

1. **tsconfig.json** - Main TypeScript configuration
2. **next-env.d.ts** - Next.js type definitions (auto-generated)
3. **types/global.d.ts** - Global type augmentations

## 📝 Type Definitions Structure

### 1. Authentication & User Types (`types/auth.types.ts`)

```typescript
// User roles enum
export type UserRole = 
  | "admin" 
  | "super_admin" 
  | "sc_manager" 
  | "sc_staff" 
  | "service_engineer" 
  | "service_advisor" 
  | "call_center";

// User information interface
export interface UserInfo {
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  serviceCenter?: string | null;
  id?: string;
}

// Authentication context interface
export interface AuthContextType {
  userRole: UserRole;
  userInfo: UserInfo | null;
  updateRole: (role: UserRole, user: UserInfo) => void;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}
```

### 2. Service Center Types (`types/service-center.types.ts`)

```typescript
export interface ServiceCenter {
  id: string | number;
  name: string;
  location: string;
  address?: string;
  phone?: string;
  email?: string;
  operatingHours?: {
    open: string;
    close: string;
  };
  totalBays?: number;
  status?: "active" | "inactive";
}

export interface ServiceCenterStats {
  totalBays: number;
  occupiedBays: number;
  availableBays: number;
  activeJobs: number;
  completedToday: number;
  averageServiceTime: string;
  utilizationRate: number;
}
```

### 3. Vehicle & Customer Types (`types/vehicle.types.ts`)

```typescript
export interface Customer {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string | number;
  customerId: string | number;
  make: string;
  model: string;
  year: number;
  registration: string;
  vin: string;
  color: string;
  lastServiceDate?: string;
  totalServices?: number;
  totalSpent?: string;
}

export interface ServiceHistory {
  id: string | number;
  vehicleId: string | number;
  date: string;
  type: ServiceType;
  engineer: string;
  parts: string[];
  labor: string;
  partsCost: string;
  total: string;
  invoice: string;
  status: "completed" | "pending" | "cancelled";
  odometer: string;
}
```

### 4. Job Card Types (`types/job-card.types.ts`)

```typescript
export type ServiceType = 
  | "Routine Maintenance" 
  | "Repair" 
  | "Inspection" 
  | "Warranty";

export type JobCardStatus = 
  | "Created" 
  | "Approved" 
  | "Assigned" 
  | "In Progress" 
  | "Parts Pending" 
  | "Completed" 
  | "Quality Check" 
  | "Invoiced" 
  | "Delivered";

export type Priority = "Low" | "Normal" | "High" | "Critical";

export interface JobCard {
  id: string;
  customerName: string;
  phone: string;
  vehicle: string;
  registration: string;
  serviceType: ServiceType;
  description: string;
  status: JobCardStatus;
  priority: Priority;
  assignedEngineer: string | null;
  estimatedCost: string;
  estimatedTime: string;
  startTime?: string;
  createdAt: string;
  completedAt?: string;
  parts: string[];
  location: "Station" | "Home Service";
  serviceLocation?: string; // For home service
}

export interface Engineer {
  id: number | string;
  name: string;
  status: "Available" | "Busy" | "On Leave";
  currentJobs: number;
  completedToday: number;
  utilization: number;
  skills: string[];
  workload: "Low" | "Medium" | "High";
}
```

### 5. Inventory Types (`types/inventory.types.ts`)

```typescript
export type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface InventoryItem {
  id: number | string;
  partName: string;
  sku: string;
  category: string;
  currentQty: number;
  minStock: number;
  unitPrice: string;
  costPrice: string;
  supplier: string;
  location: string;
  status: InventoryStatus;
  warranty?: string;
}

export interface PartsRequest {
  id: string;
  partId: number | string;
  partName: string;
  quantity: number;
  urgency: "Normal" | "Urgent";
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Shipped" | "Received";
  requestedBy: string;
  requestedAt: string;
}
```

### 6. Invoice Types (`types/invoice.types.ts`)

```typescript
export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue";
export type PaymentMethod = "Cash" | "Card" | "UPI" | "Online" | "Cheque" | null;

export interface InvoiceItem {
  name: string;
  qty: number;
  price: string;
}

export interface Invoice {
  id: string;
  jobCardId?: string;
  customerName: string;
  vehicle: string;
  date: string;
  dueDate: string;
  amount: string;
  paidAmount: string;
  balance: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
}
```

### 7. Service Request Types (`types/service-request.types.ts`)

```typescript
export type RequestStatus = 
  | "Submitted" 
  | "Pending Approval" 
  | "Approved" 
  | "Rejected";

export type Urgency = "Low" | "Normal" | "Medium" | "High" | "Critical";

export interface ServiceRequest {
  id: string;
  customerName: string;
  phone: string;
  vehicle: string;
  registration: string;
  serviceType: ServiceType;
  description: string;
  location: "Station" | "Home Service";
  preferredDate: string;
  preferredTime: string;
  estimatedCost: string;
  status: RequestStatus;
  urgency: Urgency;
  createdAt: string;
  createdBy: string;
  rejectionReason?: string;
}
```

### 8. Home Service Types (`types/home-service.types.ts`)

```typescript
export type HomeServiceStatus = 
  | "Scheduled" 
  | "In Progress" 
  | "Completed" 
  | "Cancelled";

export interface HomeService {
  id: string;
  customerName: string;
  phone: string;
  vehicle: string;
  registration: string;
  address: string;
  serviceType: ServiceType;
  scheduledDate: string;
  scheduledTime: string;
  engineer: string;
  status: HomeServiceStatus;
  estimatedCost: string;
  startTime?: string;
  completedAt?: string;
  createdAt: string;
  location?: {
    lat?: number;
    lng?: number;
  };
}
```

### 9. OTC Order Types (`types/otc.types.ts`)

```typescript
export interface OTCPart {
  id: number | string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
}

export interface OTCCartItem extends OTCPart {
  quantity: number;
}

export interface OTCCustomer {
  phone: string;
  name: string;
  vehicleNumber?: string;
  vin?: string;
}

export interface OTCOrder {
  id: string;
  customer: OTCCustomer;
  items: OTCCartItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}
```

### 10. Common Types (`types/common.types.ts`)

```typescript
import { LucideIcon } from "lucide-react";

export interface DashboardCard {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  text: string;
}

export interface Alert {
  icon: LucideIcon;
  color: string;
  title: string;
  time: string;
  action?: string;
  link?: string;
}

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  bg: string;
  link: string;
}

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
  children?: MenuItem[];
}

export type FilterOption = "all" | string;
```

### 11. Component Props Types (`interfaces/component-props.types.ts`)

```typescript
import { ReactNode } from "react";
import { UserRole } from "@/types/auth.types";

export interface NavbarProps {
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isLoggedIn?: boolean;
}

export interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

export interface SCSidebarProps extends SidebarProps {
  role?: UserRole;
}

export interface RoleProviderProps {
  children: ReactNode;
}
```

### 12. API Types (`types/api.types.ts`)

```typescript
// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

## 🔄 Migration Strategy

### Phase 1: Setup & Configuration (Day 1)
1. ✅ Install TypeScript dependencies
2. ✅ Create `tsconfig.json`
3. ✅ Create type definition files structure
4. ✅ Update `package.json` scripts

### Phase 2: Type Definitions (Day 2-3)
1. ✅ Create all type definition files
2. ✅ Define interfaces for all data models
3. ✅ Create component prop types
4. ✅ Set up global types

### Phase 3: Core Files Migration (Day 4-5)
1. ✅ Migrate `layout.tsx`
2. ✅ Migrate `page.tsx` (login)
3. ✅ Migrate contexts (`RoleContext.tsx`)
4. ✅ Migrate utilities (`roleRedirect.ts`)

### Phase 4: Components Migration (Day 6-7)
1. ✅ Migrate `Navbar.tsx`
2. ✅ Migrate `Sidebar.tsx`
3. ✅ Migrate `SCSidebar.tsx`

### Phase 5: Admin Pages Migration (Day 8-10)
1. ✅ Migrate admin dashboard
2. ✅ Migrate service centers pages
3. ✅ Migrate user & roles page
4. ✅ Migrate other admin pages

### Phase 6: Service Center Pages Migration (Day 11-15)
1. ✅ Migrate SC dashboard
2. ✅ Migrate vehicle search
3. ✅ Migrate service requests
4. ✅ Migrate job cards
5. ✅ Migrate workshop
6. ✅ Migrate inventory
7. ✅ Migrate OTC orders
8. ✅ Migrate home service
9. ✅ Migrate invoices
10. ✅ Migrate remaining SC pages

### Phase 7: Testing & Refinement (Day 16-17)
1. ✅ Type checking
2. ✅ Fix type errors
3. ✅ Test all pages
4. ✅ Update documentation

## 📦 Required Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

## ⚙️ TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🎯 Key Benefits

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Autocomplete, refactoring, navigation
3. **Self-Documenting**: Types serve as documentation
4. **Easier Refactoring**: Safe code changes with type checking
5. **API Integration Ready**: Typed interfaces for backend integration

## 📊 Migration Statistics

- **Total Files to Migrate**: 36
- **Type Definition Files**: 12
- **Estimated Migration Time**: 17 days
- **Lines of Code**: ~15,000+ lines
- **Type Definitions**: ~2,000+ lines

## ✅ Pre-Migration Checklist

- [ ] Review current codebase structure
- [ ] Identify all data models
- [ ] Document all component props
- [ ] List all API endpoints (future)
- [ ] Review Next.js 16 TypeScript requirements
- [ ] Backup current codebase
- [ ] Create feature branch for migration

## 🚀 Post-Migration Checklist

- [ ] All files converted to TypeScript
- [ ] No type errors
- [ ] All pages functional
- [ ] Build successful
- [ ] Type definitions complete
- [ ] Documentation updated
- [ ] Team training completed

---

**Status**: 📋 Ready for Review
**Next Step**: Review and approve migration plan before starting Phase 1

