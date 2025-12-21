import { describe, it, expect } from 'vitest';
import {
  normalizeServiceCenterId,
  getServiceCenterCode,
  SERVICE_CENTER_CODE_MAP,
} from "@/shared/utils/service-center.utils";

describe('service-center.utils', () => {
  describe('normalizeServiceCenterId', () => {
    it('returns sc-001 for null/undefined', () => {
      expect(normalizeServiceCenterId(null)).toBe('sc-001');
      expect(normalizeServiceCenterId(undefined)).toBe('sc-001');
    });

    it('preserves sc- prefix format', () => {
      expect(normalizeServiceCenterId('sc-001')).toBe('sc-001');
      expect(normalizeServiceCenterId('sc-123')).toBe('sc-123');
    });

    it('normalizes numeric IDs', () => {
      expect(normalizeServiceCenterId(1)).toBe('sc-001');
      expect(normalizeServiceCenterId(123)).toBe('sc-123');
      expect(normalizeServiceCenterId('1')).toBe('sc-001');
      expect(normalizeServiceCenterId('123')).toBe('sc-123');
    });

    it('extracts digits from mixed strings', () => {
      expect(normalizeServiceCenterId('sc001')).toBe('sc-001');
      expect(normalizeServiceCenterId('SC-001')).toBe('sc-001');
      expect(normalizeServiceCenterId('service-center-1')).toBe('sc-001');
    });

    it('handles strings without digits', () => {
      expect(normalizeServiceCenterId('invalid')).toBe('sc-001');
      expect(normalizeServiceCenterId('')).toBe('sc-001');
    });

    it('pads single digits', () => {
      expect(normalizeServiceCenterId(1)).toBe('sc-001');
      expect(normalizeServiceCenterId(5)).toBe('sc-005');
    });
  });

  describe('getServiceCenterCode', () => {
    it('returns SC001 for sc-001', () => {
      expect(getServiceCenterCode('sc-001')).toBe('SC001');
    });

    it('returns SC002 for sc-002', () => {
      expect(getServiceCenterCode('sc-002')).toBe('SC002');
    });

    it('returns SC003 for sc-003', () => {
      expect(getServiceCenterCode('sc-003')).toBe('SC003');
    });

    it('returns SC001 for numeric ID 1', () => {
      expect(getServiceCenterCode(1)).toBe('SC001');
      expect(getServiceCenterCode('1')).toBe('SC001');
    });

    it('returns SC002 for numeric ID 2', () => {
      expect(getServiceCenterCode(2)).toBe('SC002');
      expect(getServiceCenterCode('2')).toBe('SC002');
    });

    it('defaults to SC001 for unknown IDs', () => {
      expect(getServiceCenterCode('sc-999')).toBe('SC001');
      expect(getServiceCenterCode(999)).toBe('SC001');
      expect(getServiceCenterCode(null)).toBe('SC001');
      expect(getServiceCenterCode(undefined)).toBe('SC001');
    });

    it('uses SERVICE_CENTER_CODE_MAP', () => {
      expect(SERVICE_CENTER_CODE_MAP['sc-001']).toBe('SC001');
      expect(SERVICE_CENTER_CODE_MAP['sc-002']).toBe('SC002');
      expect(SERVICE_CENTER_CODE_MAP['1']).toBe('SC001');
    });
  });
});

