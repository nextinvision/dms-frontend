# Component Hierarchy & Relationships

## 🏗️ Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        APP PAGES                             │
│  app/(admin)/dashboarda/page.tsx                            │
│  app/(service-center)/sc/job-cards/page.tsx                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Uses
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE MODULES                           │
│  features/job-card/components/JobCardKanban.tsx             │
│  features/invoice/components/InvoiceDetails.tsx             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Composed of
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              SHARED COMPONENT LIBRARY                       │
│  components/ui/Button.tsx                                    │
│  components/ui/Modal.tsx                                    │
│  components/data-display/StatusBadge.tsx                    │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Component Dependency Flow

```
Page Component
    │
    ├─→ Feature Component (JobCardKanban)
    │       │
    │       ├─→ UI Component (Card)
    │       ├─→ UI Component (Button)
    │       ├─→ Data Display (StatusBadge)
    │       └─→ Feature Hook (useJobCards)
    │
    └─→ Layout Component (Sidebar)
            │
            └─→ UI Component (Button)
```

## 🧩 Component Composition Example

### Job Card Kanban Component

```typescript
// Page Level
app/(service-center)/sc/job-cards/page.tsx
  │
  ├─→ features/job-card/components/JobCardKanban
  │       │
  │       ├─→ components/ui/Card
  │       ├─→ components/data-display/StatusBadge
  │       ├─→ components/data-display/PriorityIndicator
  │       ├─→ features/job-card/components/KanbanColumn
  │       │       └─→ features/job-card/components/KanbanCard
  │       │               ├─→ components/ui/Card
  │       │               └─→ components/data-display/StatusBadge
  │       │
  │       └─→ features/job-card/hooks/useJobCards
  │
  └─→ components/layout/SCSidebar
          └─→ components/ui/Button
```

## 📦 Component Reusability Matrix

| Component Type | Used In | Reusability | Example |
|----------------|---------|-------------|---------|
| **UI Components** | Everywhere | 100% | Button, Modal |
| **Layout Components** | App layouts | App-wide | Navbar, Sidebar |
| **Form Components** | All forms | High | FormField, FormSelect |
| **Data Display** | Data views | High | DataTable, StatusBadge |
| **Feature Components** | Feature pages | Feature-specific | JobCardKanban |

## 🔄 Import Flow

```typescript
// 1. Page imports feature component
import { JobCardKanban } from '@/features/job-card';

// 2. Feature component imports UI components
import { Card, Button } from '@/components/ui';
import { StatusBadge } from '@/components/data-display';

// 3. Feature component uses feature hook
import { useJobCards } from '@/features/job-card';

// 4. All components use shared types
import type { JobCard } from '@/features/job-card/types';
```

## 🎯 Component Organization Rules

### Rule 1: Component Location
- **UI Components** → `components/ui/`
- **Layout Components** → `components/layout/`
- **Feature Components** → `features/[feature]/components/`

### Rule 2: Component Naming
- **PascalCase** for components: `JobCardKanban.tsx`
- **Folder matches name**: `JobCardKanban/JobCardKanban.tsx`
- **Barrel export**: `JobCardKanban/index.ts`

### Rule 3: Component Props
- **Explicit interfaces**: `JobCardKanbanProps`
- **Type-safe**: No `any` types
- **Optional props**: Marked with `?`

### Rule 4: Component Composition
- **Compose, don't inherit**
- **Small, focused components**
- **Reuse UI components**

## 📈 Component Statistics

### By Category
- **UI Components**: 15 components
- **Layout Components**: 3 components
- **Form Components**: 5 components
- **Data Display**: 5 components
- **Feature Components**: 50+ components

### By Feature
- **Job Card**: 8 components
- **Vehicle**: 5 components
- **Invoice**: 6 components
- **Inventory**: 5 components
- **Dashboard**: 5 components
- **Other Features**: 20+ components

## ✅ Component Quality Checklist

- [ ] Component has explicit TypeScript interface
- [ ] Component is in correct location
- [ ] Component uses barrel exports
- [ ] Component is properly memoized (if needed)
- [ ] Component has proper error handling
- [ ] Component is testable
- [ ] Component follows naming conventions
- [ ] Component is documented

---

**This hierarchy ensures:**
- ✅ Clear component relationships
- ✅ Easy to find components
- ✅ Proper dependency management
- ✅ Optimal reusability
- ✅ Scalable architecture

