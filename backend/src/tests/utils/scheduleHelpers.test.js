const { SLOT_DURATION_MINUTES, generateSlots } = require('../../utils/scheduleHelpers');

describe('SLOT_DURATION_MINUTES', () => {
  test('is 20 minutes', () => {
    expect(SLOT_DURATION_MINUTES).toBe(20);
  });
});

describe('generateSlots', () => {
  test('generates correct slots for 08:00–09:00', () => {
    const slots = generateSlots('08:00', '09:00');
    expect(slots).toEqual(['08:00', '08:20', '08:40']);
  });

  test('generates correct slots for 08:00–17:00', () => {
    const slots = generateSlots('08:00', '17:00');
    // 9 hours = 540 minutes / 20 = 27 slots
    expect(slots).toHaveLength(27);
    expect(slots[0]).toBe('08:00');
    expect(slots[slots.length - 1]).toBe('16:40');
  });

  test('returns empty array when start equals end', () => {
    const slots = generateSlots('08:00', '08:00');
    expect(slots).toEqual([]);
  });

  test('returns empty array when end is before slot boundary', () => {
    // 08:00 to 08:10 — not enough for a full 20-min slot
    const slots = generateSlots('08:00', '08:10');
    expect(slots).toEqual([]);
  });

  test('slots are in HH:MM format', () => {
    const slots = generateSlots('09:00', '10:00');
    for (const slot of slots) {
      expect(slot).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  test('pads hours and minutes with leading zeros', () => {
    const slots = generateSlots('08:00', '08:40');
    expect(slots).toContain('08:00');
    expect(slots).toContain('08:20');
  });

  test('handles non-zero start minutes', () => {
    const slots = generateSlots('08:20', '09:00');
    expect(slots).toEqual(['08:20', '08:40']);
  });

  test('last slot ends exactly at endTime', () => {
    const slots = generateSlots('08:00', '08:40');
    // Last slot is 08:20, ends at 08:40 = exactly endTime
    expect(slots).toEqual(['08:00', '08:20']);
  });
});
