/**
 * Mock data factories and utilities
 */

import type {
  CustomerWithVehicles,
  Vehicle,
  JobCard,
  Quotation,
  Appointment,
  Part,
  Invoice,
  ServiceCenterInfo,
  UserInfo,
} from '@/shared/types';

// Customer Mocks
export const createMockCustomer = (
  overrides?: Partial<CustomerWithVehicles>
): CustomerWithVehicles => ({
  id: '1',
  customerNumber: 'CUST-001',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john.doe@example.com',
  address: '123 Main St',
  cityState: 'New York, NY',
  pincode: '10001',
  customerType: 'B2C',
  vehicles: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockVehicle = (overrides?: Partial<Vehicle>): Vehicle => ({
  id: '1',
  customerId: '1',
  phone: '+1234567890',
  registration: 'ABC123',
  vin: 'VIN123456789',
  customerName: 'John Doe',
  customerEmail: 'john.doe@example.com',
  customerAddress: '123 Main St',
  vehicleMake: 'Tesla',
  vehicleModel: 'Model 3',
  vehicleYear: 2023,
  vehicleColor: 'Red',
  lastServiceDate: new Date().toISOString(),
  totalServices: 0,
  totalSpent: '0',
  currentStatus: 'Available',
  activeJobCardId: null,
  purchaseDate: new Date().toISOString(),
  ...overrides,
});

// Job Card Mocks
export const createMockJobCard = (overrides?: Partial<JobCard>): JobCard => ({
  id: '1',
  jobCardNumber: 'SC-001-2024-01-0001',
  serviceCenterId: 'sc-001',
  serviceCenterCode: 'SC-001',
  serviceCenterName: 'Service Center 1',
  customerId: '1',
  customerName: 'John Doe',
  vehicleId: '1',
  vehicle: 'Tesla Model 3',
  registration: 'ABC123',
  vehicleMake: 'Tesla',
  vehicleModel: 'Model 3',
  customerType: 'B2C',
  serviceType: 'General Service',
  description: 'Test description',
  status: 'Created',
  priority: 'Normal',
  assignedEngineer: null,
  estimatedCost: '1000',
  estimatedTime: '2 hours',
  createdAt: new Date().toISOString(),
  parts: [],
  location: 'Station',
  part1: {
    fullName: 'John Doe',
    mobilePrimary: '+1234567890',
    customerType: 'B2C',
    vehicleBrand: 'Tesla',
    vehicleModel: 'Model 3',
    registrationNumber: 'ABC123',
    vinChassisNumber: 'VIN123456789',
    variantBatteryCapacity: '',
    warrantyStatus: '',
    estimatedDeliveryDate: '',
    customerAddress: '123 Main St',
    jobCardNumber: 'SC-001-2024-01-0001',
    customerFeedback: '',
    technicianObservation: '',
    insuranceStartDate: '',
    insuranceEndDate: '',
    insuranceCompanyName: '',
    batterySerialNumber: '',
    mcuSerialNumber: '',
    vcuSerialNumber: '',
    otherPartSerialNumber: '',
  },
  part2: [],
  ...overrides,
});

// Quotation Mocks
export const createMockQuotation = (
  overrides?: Partial<Quotation>
): Quotation => ({
  id: '1',
  quotationNumber: 'QT-001-2024-01-0001',
  customerId: '1',
  vehicleId: '1',
  serviceCenterId: 'sc-001',
  documentType: 'Quotation',
  quotationDate: new Date().toISOString(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  hasInsurance: false,
  subtotal: 1000,
  discount: 0,
  discountPercent: 0,
  preGstAmount: 1000,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  totalAmount: 1000,
  status: 'draft',
  passedToManager: false,
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Appointment Mocks
export const createMockAppointment = (
  overrides?: Partial<Appointment>
): Appointment => ({
  id: '1',
  customerId: '1',
  customerName: 'John Doe',
  phone: '+1234567890',
  vehicle: 'Tesla Model 3',
  serviceType: 'General Service',
  date: new Date().toISOString(),
  time: '10:00',
  status: 'Pending',
  serviceCenterId: 'sc-001',
  serviceCenterName: 'Service Center 1',
  ...overrides,
});

// Part Mocks
export const createMockPart = (overrides?: Partial<Part>): Part => ({
  id: '1',
  partId: 'PART-001',
  partName: 'Brake Pad',
  partNumber: 'BP-001',
  category: 'Brakes',
  price: 100,
  stockQuantity: 50,
  minStockLevel: 10,
  unit: 'piece',
  ...overrides,
});

// Invoice Mocks
export const createMockInvoice = (overrides?: Partial<Invoice>): Invoice => ({
  id: '1',
  invoiceNumber: 'INV-001-2024-01-0001',
  serviceCenterId: 'sc-001',
  serviceCenterName: 'Service Center 1',
  partsIssueId: 'pi-001',
  partsIssueNumber: 'PI-001',
  issuedBy: 'Manager',
  issuedAt: new Date().toISOString(),
  status: 'draft',
  items: [],
  subtotal: 1000,
  totalAmount: 1000,
  createdAt: new Date().toISOString(),
  createdBy: 'Manager',
  ...overrides,
});

// Service Center Mocks
export const createMockServiceCenter = (
  overrides?: Partial<ServiceCenterInfo>
): ServiceCenterInfo => ({
  id: 'sc-001',
  name: 'Service Center 1',
  location: '123 Main St, New York, NY 10001',
  contactPerson: 'John Manager',
  contactEmail: 'sc1@example.com',
  contactPhone: '+1234567890',
  active: true,
  ...overrides,
});

// User Mocks
export const createMockUser = (overrides?: Partial<UserInfo>): UserInfo => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'service_advisor',
  initials: 'TU',
  serviceCenter: 'Service Center 1',
  ...overrides,
});

// Array generators
export const createMockCustomers = (count: number): CustomerWithVehicles[] =>
  Array.from({ length: count }, (_, i) =>
    createMockCustomer({ id: String(i + 1), name: `Customer ${i + 1}` })
  );

export const createMockJobCards = (count: number): JobCard[] =>
  Array.from({ length: count }, (_, i) =>
    createMockJobCard({
      id: String(i + 1),
      jobCardNumber: `SC-001-2024-01-${String(i + 1).padStart(4, '0')}`,
    })
  );

export const createMockQuotations = (count: number): Quotation[] =>
  Array.from({ length: count }, (_, i) =>
    createMockQuotation({
      id: String(i + 1),
      quotationNumber: `QT-001-2024-01-${String(i + 1).padStart(4, '0')}`,
    })
  );

// Parts Issue Mocks
export const createMockPartsIssue = (overrides?: Partial<any>): any => ({
  id: 'issue-1',
  issueNumber: 'PI-001',
  serviceCenterId: 'sc-001',
  serviceCenterName: 'Service Center 1',
  status: 'pending_admin_approval',
  items: [],
  totalAmount: 10000,
  issuedBy: 'Manager',
  issuedAt: new Date().toISOString(),
  ...overrides,
});

// Wait utilities
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

