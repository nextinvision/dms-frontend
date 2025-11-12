# TypeScript Sample Type Definitions

## Preview of Type Definitions

This document shows sample type definitions that will be created during migration.

### 1. Authentication Types (`types/auth.types.ts`)

```typescript
/**
 * User roles in the system
 */
export type UserRole = 
  | "admin" 
  | "super_admin" 
  | "sc_manager" 
  | "sc_staff" 
  | "service_engineer" 
  | "service_advisor" 
  | "call_center";

/**
 * User information interface
 */
export interface UserInfo {
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  serviceCenter?: string | null;
  id?: string;
}

/**
 * Authentication context type
 */
export interface AuthContextType {
  userRole: UserRole;
  userInfo: UserInfo | null;
  updateRole: (role: UserRole, user: UserInfo) => void;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}
```

### 2. Job Card Types (`types/job-card.types.ts`)

```typescript
import { LucideIcon } from "lucide-react";

/**
 * Service types available in the system
 */
export type ServiceType = 
  | "Routine Maintenance" 
  | "Repair" 
  | "Inspection" 
  | "Warranty";

/**
 * Job card status workflow
 */
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

/**
 * Priority levels for job cards
 */
export type Priority = "Low" | "Normal" | "High" | "Critical";

/**
 * Service location type
 */
export type ServiceLocation = "Station" | "Home Service";

/**
 * Job card interface
 */
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
  location: ServiceLocation;
  serviceLocation?: string; // For home service
}

/**
 * Service engineer interface
 */
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

### 3. Invoice Types (`types/invoice.types.ts`)

```typescript
/**
 * Payment status types
 */
export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue";

/**
 * Payment method types
 */
export type PaymentMethod = 
  | "Cash" 
  | "Card" 
  | "UPI" 
  | "Online" 
  | "Cheque" 
  | null;

/**
 * Invoice item interface
 */
export interface InvoiceItem {
  name: string;
  qty: number;
  price: string;
}

/**
 * Invoice interface
 */
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

### 4. Component Props Types (`interfaces/component-props.types.ts`)

```typescript
import { ReactNode } from "react";
import { UserRole } from "@/types/auth.types";

/**
 * Navbar component props
 */
export interface NavbarProps {
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isLoggedIn?: boolean;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

/**
 * Service Center Sidebar props
 */
export interface SCSidebarProps extends SidebarProps {
  role?: UserRole;
}

/**
 * Role provider props
 */
export interface RoleProviderProps {
  children: ReactNode;
}
```

### 5. Common Types (`types/common.types.ts`)

```typescript
import { LucideIcon } from "lucide-react";

/**
 * Dashboard card configuration
 */
export interface DashboardCard {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  text: string;
}

/**
 * Alert notification interface
 */
export interface Alert {
  icon: LucideIcon;
  color: string;
  title: string;
  time: string;
  action?: string;
  link?: string;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  label: string;
  icon: LucideIcon;
  bg: string;
  link: string;
}

/**
 * Menu item configuration
 */
export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
  children?: MenuItem[];
}

/**
 * Filter option type
 */
export type FilterOption = "all" | string;
```

### 6. Example Component Usage

**Before (JavaScript):**
```javascript
export default function JobCards() {
  const [jobCards, setJobCards] = useState([]);
  const [filter, setFilter] = useState("all");
  
  // No type safety
}
```

**After (TypeScript):**
```typescript
import { JobCard, JobCardStatus } from "@/types/job-card.types";
import { FilterOption } from "@/types/common.types";

export default function JobCards() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [filter, setFilter] = useState<FilterOption>("all");
  
  // Full type safety with autocomplete
}
```

### 7. Example Hook Usage

**New Custom Hook (`hooks/useLocalStorage.ts`):**
```typescript
import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

**Usage:**
```typescript
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { UserRole } from "@/types/auth.types";

function MyComponent() {
  const [userRole, setUserRole] = useLocalStorage<UserRole>("userRole", "admin");
  // Type-safe localStorage with autocomplete
}
```

---

These are sample type definitions. Full type definitions will be created during the migration process.

