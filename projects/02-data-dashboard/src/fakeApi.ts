import type { DashboardApi, DashboardData } from './types';

const dashboard: DashboardData = {
  generatedAt: '2026-09-09T08:00:00.000Z',
  metrics: [
    { id: 'revenue', label: 'Revenue', value: 84200, change: 12.4 },
    { id: 'orders', label: 'Orders', value: 1284, change: 5.1 },
    { id: 'refunds', label: 'Refunds', value: 31, change: -2.8 }
  ],
  activity: [
    { id: 'a1', title: 'Enterprise renewal completed', owner: 'Mina Park', status: 'healthy', occurredAt: '08:42' },
    { id: 'a2', title: 'Payment retries increased', owner: 'Sam Rivera', status: 'attention', occurredAt: '08:16' },
    { id: 'a3', title: 'EU queue returned to baseline', owner: 'Jo Chen', status: 'healthy', occurredAt: '07:54' }
  ]
};

type FakeApiOptions = {
  failEvery?: number;
  latencyMs?: number;
};

export function createFakeApi({ failEvery = 3, latencyMs = 450 }: FakeApiOptions = {}): DashboardApi {
  let requestCount = 0;

  return {
    async getDashboard(query: string) {
      requestCount += 1;
      const currentRequest = requestCount;
      await new Promise((resolve) => window.setTimeout(resolve, latencyMs));

      if (currentRequest % failEvery === 0) {
        throw new Error(`Deterministic outage on request ${currentRequest}.`);
      }

      if (query.trim().toLowerCase() === 'empty') {
        return { ...dashboard, metrics: [], activity: [] };
      }

      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return structuredClone(dashboard);

      return {
        ...dashboard,
        activity: dashboard.activity.filter((item) =>
          `${item.title} ${item.owner}`.toLowerCase().includes(normalizedQuery)
        )
      };
    }
  };
}

export const fakeApi = createFakeApi();
