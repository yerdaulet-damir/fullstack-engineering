# Data Dashboard Starter

A React, TypeScript, and Vite starter for practicing unreliable data flows. It includes a deterministic fake API, runtime response validation, visible loading/error/empty/success states, and Vitest tests.

## Run

```bash
npm install
npm run dev
```

Use `npm test` for the suite, `npm run build` for a production check, or `npm run check:starter` for the starter contract.

The fake API fails every third request. Search for `TODO` to find the learner work.

## Included product surface

- `src/App.tsx` owns search input and chooses the visible application state.
- `src/hooks/useDashboard.ts` owns request lifecycle, validation, retry, and the stale-response exercise.
- `src/components/` contains the dashboard and accessible status components.
- `src/fakeApi.ts` provides deterministic latency, filtering, empty results, and failures.
- `src/validation.ts` is the runtime trust boundary for data that TypeScript cannot verify.
- `src/__tests__/` checks visible behavior rather than component internals.

## Open while building

- Start with the original explanations and proof checklist in the [typed React playbook](../../learn/web-frontend/#level-2--typed-react-interfaces).
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) for types, narrowing, and modules.
- [Thinking in React](https://react.dev/learn/thinking-in-react) for component and state boundaries.
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) before adding another effect.
- [Testing Library principles](https://testing-library.com/docs/guiding-principles/) for user-visible tests.

Read [`brief.md`](./brief.md), prove the result with [`acceptance.md`](./acceptance.md), then continue to [03 — PostgreSQL issue API](../03-issue-api/).
