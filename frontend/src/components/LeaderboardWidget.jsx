function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function LeaderboardWidget({ title, rows, valueLabel }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="leaderboard-widget">
      <h3>{title}</h3>
      {rows.length === 0 && <p className="form-hint">No data for this period yet.</p>}
      {rows.length > 0 && (
        <ol className="leaderboard-list">
          {rows.map((row, index) => (
            <li key={row.id} className="leaderboard-row">
              <span className="leaderboard-rank mono">{index + 1}</span>
              <span className="avatar-circle avatar-sm">{initials(row.name)}</span>
              <div className="leaderboard-main">
                <span className="leaderboard-name">{row.name}</span>
                <div className="leaderboard-bar-track">
                  <div className="leaderboard-bar-fill" style={{ width: `${(row.value / max) * 100}%` }} />
                </div>
              </div>
              <span className="leaderboard-value mono">
                {row.value} {valueLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
