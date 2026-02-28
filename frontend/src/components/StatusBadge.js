import './StatusBadge.css';

const colors = {
  scheduled: { bg: '#ebf4ff', text: '#2b6cb0' },
  confirmed: { bg: '#e6ffed', text: '#22543d' },
  in_progress: { bg: '#fefcbf', text: '#744210' },
  completed: { bg: '#edf2f7', text: '#4a5568' },
  cancelled: { bg: '#fed7d7', text: '#9b2c2c' },
  active: { bg: '#e6ffed', text: '#22543d' },
  dispensed: { bg: '#ebf4ff', text: '#2b6cb0' },
  expired: { bg: '#edf2f7', text: '#4a5568' },
};

const labels = {
  in_progress: 'In Progress',
  lab_technician: 'Lab Technician',
};

export default function StatusBadge({ status }) {
  const color = colors[status] || { bg: '#edf2f7', text: '#4a5568' };
  const label = labels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className="status-badge"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {label}
    </span>
  );
}
