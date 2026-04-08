import { Badge } from './ui/badge';

export default function AppointmentStatusBadge({ status }) {
  const variants = {
    scheduled: 'default',
    completed: 'success',
    cancelled: 'destructive',
    pending: 'warning',
    in_progress: 'warning',
  };
  
  const statusLabels = {
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending: 'Pending',
    in_progress: 'In Progress',
  };

  const formattedStatus = statusLabels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : '');

  return (
    <Badge variant={variants[status] || 'default'}>
      {formattedStatus}
    </Badge>
  );
}
