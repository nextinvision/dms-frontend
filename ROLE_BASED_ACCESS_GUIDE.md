# Role-Based Access Guide

## How to Access Different Roles

The system now supports role-based authentication with automatic routing to the appropriate dashboard.

### Login Methods

#### Method 1: Quick Role Selector
1. On the login page, click the "Quick Login (Select Role)" dropdown
2. Select a role from the list
3. The email and password fields will auto-fill
4. Click "Sign in"

#### Method 2: Manual Login
Enter credentials directly:

### Demo Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **Admin** | admin@service.com | admin123 | `/dashboarda` (Admin Panel) |
| **SC Manager** | scmanager@service.com | sc123 | `/sc/dashboard` (Service Center Dashboard) |
| **SC Staff** | scstaff@service.com | staff123 | `/sc/dashboard` (Service Center Dashboard) |
| **Service Engineer** | engineer@service.com | eng123 | `/sc/dashboard` (Service Center Dashboard) |
| **Service Advisor** | advisor@service.com | adv123 | `/sc/dashboard` (Service Center Dashboard) |
| **Call Center** | callcenter@service.com | cc123 | `/sc/dashboard` (Service Center Dashboard) |

### Role-Based Features

#### Admin Role
- **Access**: Full system access
- **Dashboard**: Admin Dashboard (`/dashboarda`)
- **Sidebar**: Admin Sidebar with all modules
- **Features**: 
  - Service Center Management
  - User & Role Management
  - Global Inventory
  - Approvals (all levels)
  - Finance & Reports
  - Complaints Management
  - Audit Logs

#### SC Manager Role
- **Access**: Service Center-specific operations
- **Dashboard**: Service Center Dashboard (`/sc/dashboard`)
- **Sidebar**: Service Center Sidebar
- **Features**:
  - Vehicle Search
  - Service Request Management
  - Job Card Management
  - Workshop Operations
  - SC Inventory Management
  - OTC Orders
  - Home Service Management
  - Invoicing
  - Appointments
  - Technician Management
  - Complaints
  - Reports (SC-specific)
  - Approvals (up to ₹5,000)

#### SC Staff Role
- **Access**: Operational tasks at service center
- **Dashboard**: Service Center Dashboard (`/sc/dashboard`)
- **Sidebar**: Limited Service Center Sidebar
- **Features**:
  - Vehicle Search
  - Create Service Requests
  - Job Card Management (limited)
  - Workshop View
  - Inventory View
  - OTC Order Processing
  - Invoice Generation
  - Appointment Scheduling

#### Service Engineer Role
- **Access**: Job execution and updates
- **Dashboard**: Service Center Dashboard (`/sc/dashboard`)
- **Sidebar**: Engineer-specific Sidebar
- **Features**:
  - My Jobs (assigned jobs only)
  - Home Service Execution
  - Parts Request
  - Job Status Updates
  - Mobile-friendly interface

#### Service Advisor Role
- **Access**: Customer consultation and estimates
- **Dashboard**: Service Center Dashboard (`/sc/dashboard`)
- **Sidebar**: Advisor-specific Sidebar
- **Features**:
  - Vehicle Search
  - Service Request Creation
  - Lead Management
  - Quotation Generation
  - Appointment Scheduling

#### Call Center Role
- **Access**: Customer service and appointment scheduling
- **Dashboard**: Service Center Dashboard (`/sc/dashboard`)
- **Sidebar**: Call Center Sidebar
- **Features**:
  - Service Request Creation
  - Appointment Scheduling
  - Complaint Logging
  - Follow-up Management

### How It Works

1. **Login Process**:
   - User enters credentials or selects role from dropdown
   - System validates credentials
   - User role is stored in `localStorage`
   - User is redirected to appropriate dashboard

2. **Role Detection**:
   - Layout component reads role from `localStorage`
   - Shows appropriate sidebar (Admin or Service Center)
   - Navbar title updates based on role

3. **Route Protection**:
   - Admin users can access `/dashboarda` and admin routes
   - Service Center users are redirected to `/sc/dashboard`
   - Sidebar menu items are filtered based on role permissions

### Testing Different Roles

1. **Login as Admin**:
   ```
   Email: admin@service.com
   Password: admin123
   ```
   → Redirects to Admin Dashboard

2. **Login as SC Manager**:
   ```
   Email: scmanager@service.com
   Password: sc123
   ```
   → Redirects to Service Center Dashboard with full SC Manager menu

3. **Login as Service Engineer**:
   ```
   Email: engineer@service.com
   Password: eng123
   ```
   → Redirects to Service Center Dashboard with Engineer menu (My Jobs, Parts Request, etc.)

### Logout

- Click the "Logout" button in the sidebar or navbar
- All authentication data is cleared from `localStorage`
- User is redirected to login page

### Notes

- All roles are stored in `localStorage` for demo purposes
- In production, this should be replaced with secure JWT tokens and API authentication
- Role-based access control is enforced at the component level
- Each role sees only the menu items they have permission to access

