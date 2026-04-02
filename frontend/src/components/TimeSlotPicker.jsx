import { formatSlotTime } from '../utils/timeUtils'

/**
 * Reusable time slot picker component with grid layout
 * Displays available/booked slots with visual states
 */
export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  loading = false,
  emptyMessage = 'Doctor is not available on this day.',
  allBookedMessage = 'All slots are booked for this day.',
  allBookedSubMessage = null,
  allBookedAction = null,
  showAvailabilityCount = true,
}) {
  const availableSlots = slots.filter((s) => s.available)
  const allBooked = slots.length > 0 && availableSlots.length === 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-lg">
        {emptyMessage}
      </p>
    )
  }

  if (allBooked) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center space-y-3">
        <p className="text-sm text-amber-700 font-medium">{allBookedMessage}</p>
        {allBookedSubMessage && (
          <p className="text-xs text-slate-500">{allBookedSubMessage}</p>
        )}
        {allBookedAction}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelectSlot(slot.time)}
            className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
              selectedSlot === slot.time
                ? 'bg-primary text-white border-primary'
                : slot.available
                  ? 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary'
                  : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
            }`}
          >
            {formatSlotTime(slot.time)}
          </button>
        ))}
      </div>
      {showAvailabilityCount && (
        <p className="text-xs text-slate-400">
          {availableSlots.length} of {slots.length} slots available
        </p>
      )}
    </div>
  )
}
