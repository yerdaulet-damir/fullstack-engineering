export type Metric = {
  id: string;
  label: string;
  value: number;
  change: number;
};

export type Activity = {
  id: string;
  title: string;
  owner: string;
  status: 'healthy' | 'attention';
  occurredAt: string;
};

export type DashboardData = {
  generatedAt: string;
  metrics: Metric[];
  activity: Activity[];
};

export type DashboardApi = {
  getDashboard(query: string): Promise<unknown>;
};
