# Frontend File Structure

## Project Overview
- **Framework**: Next.js 16.0.1
- **Language**: TypeScript (with some JavaScript files in migration)
- **Styling**: Tailwind CSS 4
- **UI Library**: Custom components with Lucide React icons

## Directory Structure

```
dms-frontend/
├── public/                          # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── (admin)/                 # Admin route group
│   │   │   ├── dashboarda/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (service-center)/        # Service Center route group
│   │   │   ├── layout.tsx
│   │   │   └── sc/
│   │   │       └── dashboard/
│   │   │           └── page.tsx
│   │   │
│   │   ├── approvals/
│   │   │   └── page.js
│   │   │
│   │   ├── audit-logs/
│   │   │   ├── page.js
│   │   │   └── page.tsx
│   │   │
│   │   ├── complaints/
│   │   │   ├── page.js
│   │   │   └── page.tsx
│   │   │
│   │   ├── dashboarda/              # Admin dashboard
│   │   │
│   │   ├── finance/
│   │   │   └── page.js
│   │   │
│   │   ├── inventory/
│   │   │   └── page.js
│   │   │
│   │   ├── reports/
│   │   │   ├── page.js
│   │   │   └── page.tsx
│   │   │
│   │   ├── sc/                      # Service Center pages
│   │   │   ├── appointments/
│   │   │   │   └── page.tsx
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx
│   │   │   ├── complaints/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── follow-ups/
│   │   │   │   └── page.tsx
│   │   │   ├── home-service/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   └── page.tsx
│   │   │   ├── job-cards/
│   │   │   │   └── page.tsx
│   │   │   ├── leads/
│   │   │   │   └── page.tsx
│   │   │   ├── otc-orders/
│   │   │   │   └── page.tsx
│   │   │   ├── parts-request/
│   │   │   │   └── page.tsx
│   │   │   ├── quotations/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── service-requests/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── technicians/
│   │   │   │   └── page.tsx
│   │   │   ├── vehicle-search/
│   │   │   │   └── page.tsx
│   │   │   └── workshop/
│   │   │       └── page.tsx
│   │   │
│   │   ├── servicecenters/
│   │   │   ├── [id]/
│   │   │   │   └── page.js
│   │   │   └── page.js
│   │   │
│   │   ├── user&roles/
│   │   │   └── page.js
│   │   │
│   │   ├── favicon.ico
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home page
│   │
│   ├── components/                  # React components
│   │   ├── data-display/           # Data visualization components
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   └── index.ts
│   │   │   ├── PriorityIndicator/
│   │   │   │   ├── index.ts
│   │   │   │   └── PriorityIndicator.tsx
│   │   │   ├── StatsCard/
│   │   │   │   ├── index.ts
│   │   │   │   └── StatsCard.tsx
│   │   │   ├── StatusBadge/
│   │   │   │   ├── index.ts
│   │   │   │   └── StatusBadge.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── forms/                  # Form components
│   │   │   ├── FormDatePicker/
│   │   │   │   ├── FormDatePicker.tsx
│   │   │   │   └── index.ts
│   │   │   ├── FormField/
│   │   │   │   ├── FormField.tsx
│   │   │   │   └── index.ts
│   │   │   ├── FormSelect/
│   │   │   │   ├── FormSelect.tsx
│   │   │   │   └── index.ts
│   │   │   ├── FormTextarea/
│   │   │   │   ├── FormTextarea.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── Navbar/
│   │   │   │   ├── index.ts
│   │   │   │   └── Navbar.tsx
│   │   │   ├── SCSidebar/
│   │   │   │   ├── index.ts
│   │   │   │   └── SCSidebar.tsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── index.ts
│   │   │   │   └── Sidebar.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── ui/                     # UI primitives
│   │   │   ├── Badge/
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── CardBody.tsx
│   │   │   │   ├── CardFooter.tsx
│   │   │   │   ├── CardHeader.tsx
│   │   │   │   └── index.ts
│   │   │   ├── EmptyState/
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── index.ts
│   │   │   ├── FilterBar/
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   │   ├── index.ts
│   │   │   │   └── Input.tsx
│   │   │   ├── LoadingSpinner/
│   │   │   │   ├── index.ts
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── Modal/
│   │   │   │   ├── index.ts
│   │   │   │   └── Modal.tsx
│   │   │   ├── SearchBar/
│   │   │   │   ├── index.ts
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── Table/
│   │   │   │   ├── index.ts
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── TableCell.tsx
│   │   │   │   ├── TableHeader.tsx
│   │   │   │   └── TableRow.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                # Component barrel exports
│   │
│   ├── config/                     # Configuration files
│   │   ├── api.config.ts           # API endpoints configuration
│   │   ├── index.ts
│   │   ├── menu.config.ts          # Menu/navigation configuration
│   │   └── routes.config.ts        # Route configuration
│   │
│   ├── contexts/                   # React Context providers
│   │   ├── AuthContext.tsx         # Authentication context
│   │   ├── RoleContext.tsx         # Role-based access context
│   │   └── index.ts
│   │
│   ├── shared/                     # Shared utilities and types
│   │   ├── constants/              # Application constants
│   │   │   ├── index.ts
│   │   │   ├── menu-items.ts       # Menu item definitions
│   │   │   ├── roles.ts            # Role definitions
│   │   │   ├── routes.ts           # Route constants
│   │   │   └── status.ts           # Status constants
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── index.ts
│   │   │   ├── useDebounce.ts      # Debounce hook
│   │   │   ├── useFilter.ts        # Filtering hook
│   │   │   ├── useLocalStorage.ts  # LocalStorage hook
│   │   │   ├── usePagination.ts    # Pagination hook
│   │   │   └── useRole.ts          # Role management hook
│   │   │
│   │   ├── lib/                    # Library utilities
│   │   │   └── localStorage.ts     # LocalStorage helpers
│   │   │
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── api.types.ts        # API response types
│   │   │   ├── auth.types.ts       # Authentication types
│   │   │   ├── common.types.ts     # Common shared types
│   │   │   ├── home-service.types.ts
│   │   │   ├── index.ts
│   │   │   ├── inventory.types.ts
│   │   │   ├── invoice.types.ts
│   │   │   ├── job-card.types.ts
│   │   │   ├── otc.types.ts
│   │   │   ├── service-request.types.ts
│   │   │   ├── vehicle.types.ts
│   │   │   └── workshop.types.ts
│   │   │
│   │   └── utils/                  # Utility functions
│   │       ├── currency.ts         # Currency formatting
│   │       ├── date.ts             # Date utilities
│   │       ├── format.ts           # Formatting utilities
│   │       ├── index.ts
│   │       ├── roleRedirect.ts     # Role-based redirects
│   │       └── validation.ts       # Validation utilities
│   │
│   └── utils/                      # Additional utilities
│       └── roleRedirect.ts
│
├── .eslintrc.json                  # ESLint configuration (if exists)
├── eslint.config.mjs               # ESLint configuration
├── jsconfig.json                   # JavaScript configuration
├── next.config.mjs                 # Next.js configuration
├── next-env.d.ts                   # Next.js TypeScript definitions
├── package.json                    # Dependencies and scripts
├── postcss.config.mjs              # PostCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── tsconfig.json.example           # TypeScript config example

## Key Features

### Route Groups
- `(admin)`: Admin-specific routes with shared layout
- `(service-center)`: Service center routes with shared layout

### Component Organization
- **Modular structure**: Each component has its own folder with component file and index.ts
- **Barrel exports**: index.ts files for clean imports
- **Categorized**: Components grouped by purpose (ui, forms, layout, data-display)

### Type Safety
- Comprehensive TypeScript types in `shared/types/`
- Domain-specific types for each module (inventory, invoice, job-card, etc.)

### State Management
- React Context for authentication and role management
- Custom hooks for reusable logic

### Configuration
- Centralized config files for API, routes, and menus
- Constants for roles, statuses, and menu items

## Migration Status
- Some pages still in JavaScript (`.js`) - migration to TypeScript in progress
- Most new components are TypeScript (`.tsx`)

