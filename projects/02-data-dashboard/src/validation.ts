import type { Activity, DashboardData, Metric } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMetric = (value: unknown): value is Metric =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.label === 'string' &&
  typeof value.value === 'number' &&
  Number.isFinite(value.value) &&
  typeof value.change === 'number' &&
  Number.isFinite(value.change);

const isActivity = (value: unknown): value is Activity =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.owner === 'string' &&
  // TODO: validate that status is one of the Activity union values.
  typeof value.status === 'string' &&
  typeof value.occurredAt === 'string';

export function parseDashboardData(value: unknown): DashboardData {
  if (
    !isRecord(value) ||
    typeof value.generatedAt !== 'string' ||
    !Array.isArray(value.metrics) ||
    !value.metrics.every(isMetric) ||
    !Array.isArray(value.activity) ||
    !value.activity.every(isActivity)
  ) {
    throw new Error('The server returned an invalid dashboard response.');
  }

  return value as DashboardData;
}
