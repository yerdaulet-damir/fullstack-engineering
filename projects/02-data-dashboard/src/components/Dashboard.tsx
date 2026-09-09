import type { DashboardData } from '../types';

export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="dashboard">
      <section aria-labelledby="metrics-title">
        <div className="section-heading"><h2 id="metrics-title">Today</h2><span>Updated {data.generatedAt.slice(11, 16)} UTC</span></div>
        <ul className="metric-grid">
          {data.metrics.map((metric) => (
            <li key={metric.id}>
              <span>{metric.label}</span>
              <strong>{metric.value.toLocaleString()}</strong>
              <small className={metric.change < 0 ? 'negative' : 'positive'}>{metric.change > 0 ? '+' : ''}{metric.change}%</small>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="activity-title">
        <div className="section-heading"><h2 id="activity-title">Recent activity</h2><span>{data.activity.length} events</span></div>
        {data.activity.length === 0 ? (
          <p className="inline-empty">No activity matches this filter.</p>
        ) : (
          <ul className="activity-list">
            {data.activity.map((item) => (
              <li key={item.id}>
                <span className={`health ${item.status}`} aria-label={item.status} />
                <div><strong>{item.title}</strong><span>{item.owner}</span></div>
                <time>{item.occurredAt}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
