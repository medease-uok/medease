import { Badge } from './ui/badge';

/**
 * ✨ MODERNIZED STATUS BADGE
 *
 * IMPROVEMENTS:
 * - Uses shadcn/ui Badge component
 * - Consistent with design system
 * - Semantic color variants
 * - Better accessibility
 * - No separate CSS file needed
 */

const statusVariants = {
  scheduled: 'default',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
  active: 'success',
  inactive: 'secondary',
  dispensed: 'default',
  expired: 'secondary',
  pending: 'warning',
};

const labels = {
  in_progress: 'In Progress',
  lab_technician: 'Lab Technician',
};

export default function StatusBadge({ status }) {
  const variant = statusVariants[status] || 'secondary';
  const label = labels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
