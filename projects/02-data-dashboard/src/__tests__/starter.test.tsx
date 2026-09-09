import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { createFakeApi } from '../fakeApi';
import type { DashboardApi, DashboardData } from '../types';
import { parseDashboardData } from '../validation';

const validData: DashboardData = {
  generatedAt: '2026-09-09T08:00:00.000Z',
  metrics: [{ id: 'orders', label: 'Orders', value: 12, change: 2 }],
  activity: [{ id: 'one', title: 'Order received', owner: 'Ari', status: 'healthy', occurredAt: '08:00' }]
};

describe('starter contract', () => {
  it('validates data at runtime', () => {
    expect(parseDashboardData(validData)).toEqual(validData);
    expect(() => parseDashboardData({ metrics: 'many' })).toThrow(/invalid dashboard response/i);
  });

  it('fails fake requests deterministically', async () => {
    const api = createFakeApi({ failEvery: 3, latencyMs: 0 });
    await expect(api.getDashboard('')).resolves.toBeTruthy();
    await expect(api.getDashboard('')).resolves.toBeTruthy();
    await expect(api.getDashboard('')).rejects.toThrow('request 3');
    await expect(api.getDashboard('')).resolves.toBeTruthy();
  });

  it('renders loading and success states', async () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    const api: DashboardApi = { getDashboard: () => new Promise((resolve) => { resolveRequest = resolve; }) };
    render(<App api={api} />);
    expect(screen.getByRole('heading', { name: 'Loading dashboard' })).toBeTruthy();
    resolveRequest(validData);
    expect(await screen.findByText('Order received')).toBeTruthy();
  });

  it('renders an error and retries the same request', async () => {
    let attempts = 0;
    const api: DashboardApi = {
      async getDashboard() {
        attempts += 1;
        if (attempts === 1) throw new Error('Service is resting.');
        return validData;
      }
    };
    render(<App api={api} />);
    expect(await screen.findByText('Service is resting.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('Order received')).toBeTruthy());
    expect(attempts).toBe(2);
  });

  it('renders the full empty state', async () => {
    const api: DashboardApi = { getDashboard: async () => ({ ...validData, metrics: [], activity: [] }) };
    render(<App api={api} />);
    expect(await screen.findByRole('heading', { name: 'No matching data' })).toBeTruthy();
  });
});
