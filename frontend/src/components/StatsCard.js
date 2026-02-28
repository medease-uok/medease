import './StatsCard.css';

export default function StatsCard({ label, value, accentColor = '#3182ce' }) {
  return (
    <div className="stats-card">
      <div className="stats-card-accent" style={{ backgroundColor: accentColor }} />
      <div className="stats-card-label">{label}</div>
      <div className="stats-card-value">{value}</div>
    </div>
  );
}
