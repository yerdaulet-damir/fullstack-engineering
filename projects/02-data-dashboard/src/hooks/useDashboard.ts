import { useCallback, useEffect, useState } from 'react';
import type { DashboardApi, DashboardData } from '../types';
import { parseDashboardData } from '../validation';

export type DashboardView =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DashboardData };

export function useDashboard(api: DashboardApi, activeQuery: string) {
  const [view, setView] = useState<DashboardView>({ status: 'loading' });

  const loadDashboard = useCallback(async () => {
    setView({ status: 'loading' });
    try {
      const payload = await api.getDashboard(activeQuery);
      // TODO: ignore this payload if a newer request has already started.
      setView({ status: 'ready', data: parseDashboardData(payload) });
    } catch (error) {
      setView({ status: 'error', message: error instanceof Error ? error.message : 'Unable to load dashboard.' });
    }
  }, [activeQuery, api]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return { view, retry: loadDashboard };
}
