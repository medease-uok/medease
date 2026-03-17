import './DetailCard.css';

export default function DetailCard({ title, fields, titleAs: TitleTag = 'h2' }) {
  return (
    <div className="detail-card">
      {title && <TitleTag className="detail-card-title">{title}</TitleTag>}
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
