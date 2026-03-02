import './DetailCard.css';

export default function DetailCard({ title, fields }) {
  return (
    <div className="detail-card">
      {title && <h2 className="detail-card-title">{title}</h2>}
      <div className="detail-card-grid">
        {fields.map((field, i) => (
          <div key={i} className="detail-card-field">
            <div className="detail-card-label">{field.label}</div>
            <div className="detail-card-value">{field.value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
