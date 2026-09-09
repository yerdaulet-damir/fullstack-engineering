# Acceptance

- `npm run dev` opens a working dashboard.
- Every API payload passes runtime validation before rendering.
- Loading, error, empty, and success states are visible and testable.
- The fake API fails predictably on every third request.
- Retry requests the same filter again.
- Older responses cannot overwrite a newer filter result.
- `npm test` and `npm run build` pass.
