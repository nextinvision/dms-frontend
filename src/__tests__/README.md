# Centralized Test Directory

All test files are located in this directory, organized by feature/component type.

## Structure

```
__tests__/
├── components/          # UI and feature components
├── features/            # Feature-specific tests
├── shared/              # Shared utilities and helpers
├── core/                # Core API and repositories
└── pages/               # Page-level tests
```

## Running Tests

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Import Paths

Tests use the same import paths as source files:
- `@/components/ui/Button` - imports from source
- `@/features/job-cards/services/jobCard.service` - imports from source
- `@/test/utils/render` - test utilities

## Naming Convention

- Component tests: `ComponentName.test.tsx`
- Service tests: `serviceName.service.test.ts`
- Hook tests: `useHookName.test.tsx`
- Utility tests: `utilityName.test.ts`

