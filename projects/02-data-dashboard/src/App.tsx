import { useState, type FormEvent } from 'react';
import { Dashboard } from './components/Dashboard';
import { StatusPanel } from './components/StatusPanel';
import { fakeApi } from './fakeApi';
import { useDashboard } from './hooks/useDashboard';
import type { DashboardApi } from './types';

type AppProps = { api?: DashboardApi };

export default function App({ api = fakeApi }: AppProps) {
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const { view, retry } = useDashboard(api, activeQuery);

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
          <button type="button" onClick={() => void retry()}>Try again</button>
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
