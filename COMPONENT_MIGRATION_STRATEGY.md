# Component Migration Strategy

## 🎯 Migration Approach

### Phase 1: Extract UI Components (Day 1-2)
**Goal**: Create reusable UI component library

**Steps**:
1. Identify common UI patterns
2. Extract to `components/ui/`
3. Create TypeScript interfaces
4. Add barrel exports
5. Update imports

**Components to Extract**:
- Button
- Input
- Modal
- Table
- Card
- Badge
- LoadingSpinner
- EmptyState

### Phase 2: Extract Layout Components (Day 3)
**Goal**: Create layout component library

**Steps**:
1. Extract Navbar to `components/layout/Navbar/`
2. Extract Sidebar to `components/layout/Sidebar/`
3. Extract SCSidebar to `components/layout/SCSidebar/`
4. Add TypeScript types
5. Update imports

### Phase 3: Create Feature Modules (Day 4-8)
**Goal**: Organize features with components

**For Each Feature**:
1. Create feature directory: `features/[feature]/`
2. Extract components to `features/[feature]/components/`
3. Extract hooks to `features/[feature]/hooks/`
4. Extract types to `features/[feature]/types/`
5. Create barrel export: `features/[feature]/index.ts`
6. Update page imports

**Features**:
- auth
- dashboard
- vehicle
- job-card
- inventory
- invoice
- service-request
- home-service
- otc
- workshop

### Phase 4: Update Pages (Day 9-12)
**Goal**: Use feature components in pages

**Steps**:
1. Update page imports
2. Use feature components
3. Remove duplicate code
4. Add TypeScript types
5. Test functionality

### Phase 5: Optimization (Day 13-14)
**Goal**: Optimize component loading

**Steps**:
1. Add lazy loading for heavy components
2. Add memoization where needed
3. Optimize bundle sizes
4. Test performance

## 📝 Component Extraction Pattern

### Before (Monolithic)
```typescript
// app/sc/job-cards/page.js
export default function JobCards() {
  // 500+ lines of code
  // Inline components
  // Mixed concerns
}
```

### After (Modular)
```typescript
// app/(service-center)/sc/job-cards/page.tsx
import { JobCardKanban, useJobCards } from '@/features/job-card';

export default function JobCardsPage() {
  const { jobCards } = useJobCards();
  return <JobCardKanban jobCards={jobCards} />;
}

// features/job-card/components/JobCardKanban/JobCardKanban.tsx
import { Card } from '@/components/ui';
import { StatusBadge } from '@/components/data-display';

export function JobCardKanban({ jobCards }: JobCardKanbanProps) {
  // Focused component logic
}
```

## 🔄 Component Migration Checklist

### UI Components
- [ ] Button
- [ ] Input
- [ ] Modal
- [ ] Table
- [ ] Card
- [ ] Badge
- [ ] LoadingSpinner
- [ ] EmptyState
- [ ] SearchBar
- [ ] FilterBar

### Layout Components
- [ ] Navbar
- [ ] Sidebar
- [ ] SCSidebar

### Feature Components
- [ ] Auth components
- [ ] Dashboard components
- [ ] Vehicle components
- [ ] Job Card components
- [ ] Inventory components
- [ ] Invoice components
- [ ] Service Request components
- [ ] Home Service components
- [ ] OTC components
- [ ] Workshop components

## ✅ Migration Benefits

1. **Modularity**: Each component is independent
2. **Reusability**: Components can be reused
3. **Maintainability**: Easy to find and update
4. **Testability**: Components can be tested in isolation
5. **Scalability**: Easy to add new features
6. **Performance**: Optimized bundle sizes
7. **Type Safety**: Full TypeScript support

---

**This strategy ensures smooth migration with zero downtime.**

