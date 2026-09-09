import type { ReactNode } from 'react';

export function StatusPanel({ title, detail, busy = false, children }: { title: string; detail: string; busy?: boolean; children?: ReactNode }) {
  return (
    <section className="status-panel" aria-live="polite" aria-busy={busy}>
      <span className="status-dot" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{detail}</p>
      {children}
    </section>
  );
}
