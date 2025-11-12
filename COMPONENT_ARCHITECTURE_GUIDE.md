# Component Architecture Guide

## 🎯 Quick Reference

### Component Import Patterns

```typescript
// ✅ UI Components (from shared library)
import { Button, Modal, Table, Card } from '@/components/ui';

// ✅ Layout Components
import { Navbar, Sidebar, SCSidebar } from '@/components/layout';

// ✅ Feature Components (from feature module)
import { 
  JobCardKanban, 
  JobCardDetails,
  useJobCards,
  type JobCard 
} from '@/features/job-card';

// ✅ Shared Hooks & Utils
import { useLocalStorage, useDebounce } from '@/shared/hooks';
import { formatCurrency, formatDate } from '@/shared/utils';
```

### Component Structure Template

```typescript
// features/job-card/components/JobCardKanban/JobCardKanban.tsx
import { Card } from '@/components/ui';
import { StatusBadge } from '@/components/data-display';
import { useJobCards } from '@/features/job-card';
import type { JobCard } from '@/features/job-card/types';

interface JobCardKanbanProps {
  jobCards: JobCard[];
  onStatusChange?: (id: string, status: JobCardStatus) => void;
}

export function JobCardKanban({ jobCards, onStatusChange }: JobCardKanbanProps) {
  // Component implementation
}
```

## 📦 Component Categories Quick Reference

| Category | Location | Reusability | Example |
|----------|----------|-------------|---------|
| UI Components | `components/ui/` | 100% | Button, Modal, Table |
| Layout Components | `components/layout/` | App-wide | Navbar, Sidebar |
| Form Components | `components/forms/` | High | FormField, FormSelect |
| Data Display | `components/data-display/` | High | DataTable, StatusBadge |
| Feature Components | `features/[feature]/components/` | Feature-specific | JobCardKanban |

## 🚀 Migration Quick Start

1. **Create UI Components** → `components/ui/`
2. **Create Feature Modules** → `features/[feature]/`
3. **Extract Components** → Move to feature modules
4. **Update Imports** → Use barrel exports
5. **Add Types** → TypeScript interfaces

---

**See `FINAL_COMPONENT_MODULAR_ARCHITECTURE.md` for complete details.**

