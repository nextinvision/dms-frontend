import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInitialAppointmentForm,
  resetForm,
} from '@/shared/utils/form.utils';
import { getCurrentDate, getCurrentTime } from '@/shared/utils/date';

// Mock date utils
vi.mock('@/shared/utils/date', () => ({
  getCurrentDate: vi.fn(() => '2024-01-15'),
  getCurrentTime: vi.fn(() => '10:00'),
}));

// Mock INITIAL_APPOINTMENT_FORM
vi.mock('@/app/(service-center)/sc/components/appointment/types', () => ({
  INITIAL_APPOINTMENT_FORM: {
    customerName: '',
    phone: '',
    vehicle: '',
    serviceType: '',
    notes: '',
    date: '',
    time: '',
  },
}));

describe('form.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInitialAppointmentForm', () => {
    it('returns form with current date and time', () => {
      const form = getInitialAppointmentForm();

      expect(form.date).toBe('2024-01-15');
      expect(form.time).toBe('10:00');
      expect(getCurrentDate).toHaveBeenCalled();
      expect(getCurrentTime).toHaveBeenCalled();
    });

    it('includes all initial form fields', () => {
      const form = getInitialAppointmentForm();

      expect(form).toHaveProperty('customerName');
      expect(form).toHaveProperty('phone');
      expect(form).toHaveProperty('vehicle');
      expect(form).toHaveProperty('serviceType');
      expect(form).toHaveProperty('notes');
      expect(form).toHaveProperty('date');
      expect(form).toHaveProperty('time');
    });

    it('overrides defaults with initialData', () => {
      const initialData = {
        customerName: 'John Doe',
        phone: '+1234567890',
        date: '2024-02-20',
      };

      const form = getInitialAppointmentForm(initialData);

      expect(form.customerName).toBe('John Doe');
      expect(form.phone).toBe('+1234567890');
      expect(form.date).toBe('2024-02-20');
      expect(form.time).toBe('10:00'); // Still uses current time
    });

    it('preserves prefilled data pattern', () => {
      const initialData = {
        customerName: 'Jane Doe',
        vehicle: 'Tesla Model 3',
      };

      const form = getInitialAppointmentForm(initialData);

      expect(form.customerName).toBe('Jane Doe');
      expect(form.vehicle).toBe('Tesla Model 3');
      expect(form.date).toBe('2024-01-15');
      expect(form.time).toBe('10:00');
    });
  });

  describe('resetForm', () => {
    it('resets form to initial state', () => {
      const initialForm = {
        name: '',
        email: '',
        age: 0,
      };

      const currentForm = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const reset = resetForm(initialForm);

      expect(reset).toEqual(initialForm);
      expect(reset.name).toBe('');
      expect(reset.email).toBe('');
      expect(reset.age).toBe(0);
    });

    it('merges initial data with reset form', () => {
      const initialForm = {
        name: '',
        email: '',
        age: 0,
      };

      const initialData = {
        name: 'John',
        email: 'john@example.com',
      };

      const reset = resetForm(initialForm, initialData);

      expect(reset.name).toBe('John');
      expect(reset.email).toBe('john@example.com');
      expect(reset.age).toBe(0);
    });

    it('handles complex form structures', () => {
      const initialForm = {
        personal: {
          name: '',
          age: 0,
        },
        contact: {
          email: '',
          phone: '',
        },
        preferences: [],
      };

      const initialData = {
        personal: {
          name: 'John',
        },
      };

      const reset = resetForm(initialForm, initialData);

      expect(reset.personal.name).toBe('John');
      expect(reset.personal.age).toBe(0);
      expect(reset.contact.email).toBe('');
    });

    it('preserves prefilled data pattern', () => {
      const initialForm = {
        customerId: '',
        vehicleId: '',
        status: 'draft',
      };

      const initialData = {
        customerId: 'cust-1',
        vehicleId: 'veh-1',
      };

      const reset = resetForm(initialForm, initialData);

      expect(reset.customerId).toBe('cust-1');
      expect(reset.vehicleId).toBe('veh-1');
      expect(reset.status).toBe('draft');
    });
  });
});

