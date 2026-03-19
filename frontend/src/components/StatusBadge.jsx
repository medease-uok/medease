import { Badge } from './ui/badge';


const statusVariants = {
  scheduled: 'default',
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
  const label = labels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
