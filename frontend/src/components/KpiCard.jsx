import { Link } from 'react-router-dom';

export default function KpiCard({ label, value, tone = 'neutral', to }) {
  const content = (
    <div className={`kpi-card tone-${tone}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value mono">{value}</span>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="kpi-card-link">
        {content}
      </Link>
    );
  }
  return content;
}
