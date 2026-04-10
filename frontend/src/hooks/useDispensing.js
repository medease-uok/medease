/**
 * useDispensing.js - Hook Aggregator
 * Re-exports individual hooks for backward compatibility
 * 
 * REFACTORED: Individual hooks split for single responsibility principle
 * - useDispensingRequests: Manages current dispensing requests
 * - useDispensingHistory: Manages historical data
 * - useMedicationAvailability: Manages inventory checks
 * 
 * Import from individual files for better tree-shaking:
 * import { useDispensingRequests } from './useDispensingRequests';
 * import { useDispensingHistory } from './useDispensingHistory';
 * import { useMedicationAvailability } from './useMedicationAvailability';
 */

export { useDispensingRequests } from './useDispensingRequests';
export { useDispensingHistory } from './useDispensingHistory';
export { useMedicationAvailability } from './useMedicationAvailability';

