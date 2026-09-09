import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { fakeApi } from './fakeApi';
import type { DashboardApi, DashboardData } from './types';
import { parseDashboardData } from './validation';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardData };

type AppProps = { api?: DashboardApi };

export default function App({ api = fakeApi }: AppProps) {
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [view, setView] = useState<ViewState>({ status: 'loading' });

  const loadDashboard = useCallback(async () => {
    setView({ status: 'loading' });
    try {
      const payload = await api.getDashboard(activeQuery);
      // TODO: ignore this payload if a newer request has already started.
      setView({ status: 'ready', data: parseDashboardData(payload) });
    } catch (error) {
      setView({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to load dashboard.'
      });
    }
  }, [activeQuery, api]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveQuery(queryInput);
  };

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations / Live overview</p>
          <h1>Pulse</h1>
        </div>
        <form className="search" onSubmit={submitSearch}>
          <label htmlFor="activity-search">Filter activity</label>
          <div>
            <input
              id="activity-search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Owner or event"
            />
            <button type="submit">Apply</button>
          </div>
        </form>
      </header>

      {view.status === 'loading' && <StatusPanel title="Loading dashboard" detail="Checking the latest operations data…" busy />}

      {view.status === 'error' && (
        <StatusPanel title="Dashboard unavailable" detail={view.message}>
          <button type="button" onClick={() => void loadDashboard()}>Try again</button>
        </StatusPanel>
      )}

      {view.status === 'ready' && view.data.metrics.length === 0 && view.data.activity.length === 0 && (
        <StatusPanel title="No matching data" detail="Try another filter or clear the current one." />
      )}

      {view.status === 'ready' && (view.data.metrics.length > 0 || view.data.activity.length > 0) && (
        <Dashboard data={view.data} />
      )}
    </main>
  );
}

function StatusPanel({ title, detail, busy = false, children }: { title: string; detail: string; busy?: boolean; children?: React.ReactNode }) {
  return (
    <section className="status-panel" aria-live="polite" aria-busy={busy}>
      <span className="status-dot" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{detail}</p>
      {children}
    </section>
  );
}

function Dashboard({ data }: { data: DashboardData }) {
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
