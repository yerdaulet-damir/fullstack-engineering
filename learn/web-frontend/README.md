# Web Frontend Engineering

**Last verified:** 2026-09-09

This playbook teaches the browser platform first, then TypeScript and React, then Next.js. Accessibility, testing, and performance are part of each project rather than cleanup work added at the end.

Do not try to finish every linked resource. Read enough to make the next decision, build the project, and use the proof steps to expose gaps.

## Route by level

| Level | Learn | Finish when |
| --- | --- | --- |
| 1 — Web foundations | Semantic HTML, resilient CSS, browser JavaScript, basic accessibility, loading performance | [Project 01 — responsive launch page](../../projects/01-launch-page/) meets its acceptance criteria without a framework |
| 2 — Typed interfaces | JavaScript data flow, TypeScript, React state, runtime validation, component tests | [Project 02 — React data dashboard](../../projects/02-data-dashboard/) handles unreliable data without stale or unchecked output |
| 3 — Full-stack frontend | Next.js App Router, server/client boundaries, sessions, mutations, end-to-end tests, production performance | [Project 04 — authenticated issue tracker](../../projects/04-issue-tracker/) enforces account boundaries on the server |

The order matters. React is easier to debug when DOM events and browser requests are familiar. Next.js is easier to reason about when React state and rendering are already clear.

## Level 1 — Web foundations

HTML defines meaning and interaction before CSS or JavaScript runs. CSS should adapt to content and available space instead of a list of popular device widths. JavaScript should enhance a usable document, not replace links, buttons, labels, or form behavior that HTML already provides.

### Read

Use one curriculum as the main route and the other sources as references for the project in front of you.

- **Course and official reference:** [MDN Learn Web Development](https://developer.mozilla.org/en-US/docs/Learn_web_development) — work through structuring content, forms, CSS styling, layout, responsive design, and dynamic scripting. Its exercises are small enough to repeat without copying.
- **Course:** [web.dev Learn CSS](https://web.dev/learn/css/) — use the cascade, box model, sizing, Flexbox, Grid, logical properties, and responsive design modules while implementing the launch page.
- **Book and interactive reference:** [Every Layout, 3rd Edition](https://every-layout.dev/) by Heydon Pickering and Andy Bell — study intrinsic sizing and composable layout primitives after basic Flexbox and Grid. Several sections are readable without purchasing the full book.
- **JavaScript course and reference:** [The Modern JavaScript Tutorial](https://javascript.info/) — read JavaScript Fundamentals, Document, Introduction to Events, Forms and Controls, and Network Requests before adding richer browser behavior.
- **Book:** [Eloquent JavaScript, 4th Edition](https://eloquentjavascript.net/) by Marijn Haverbeke — use the exercises to test whether functions, objects, arrays, modules, and asynchronous code make sense without a framework.
- **Official accessibility tutorials:** [W3C WAI Web Accessibility Tutorials](https://www.w3.org/WAI/tutorials/) — open the page structure, menus, images, and forms tutorials when those elements appear in the project.
- **Performance course:** [web.dev Learn Performance](https://web.dev/learn/performance/) — begin with critical rendering path, resource loading, image performance, and Core Web Vitals.

### Watch

Video is useful for seeing layout and accessibility behavior, but the implementation should still be checked against documentation.

- [HTML & CSS for Absolute Beginners: Introduction](https://www.youtube.com/watch?v=1L2YiWdaUDM) — Kevin Powell’s 2025 course introduction and linked series; use it to see a responsive page built from plain HTML and CSS.
- [5 Simple Tips to Making Responsive Layouts the Easy Way](https://www.youtube.com/watch?v=VQraviuwbzU) — Kevin Powell demonstrates content-led sizing, avoiding fixed dimensions, and adding media queries only when the layout needs them.
- [Introduction to Web Accessibility and W3C Standards](https://www.youtube.com/watch?v=20SHvU2PKsM) — W3C WAI’s short orientation to accessibility and standards work.

### Build

Complete [Project 01 — responsive launch page](../../projects/01-launch-page/). Read its [brief](../../projects/01-launch-page/brief.md) before changing code.

The practical milestone is a dependency-free launch page that:

- keeps the document readable and navigable before JavaScript runs;
- uses one `main`, useful landmarks, a skip link, headings in a meaningful order, and a labelled signup form;
- remains usable at narrow widths without horizontal scrolling or fixed device assumptions;
- reports invalid, duplicate, and valid submissions without navigation or reload;
- respects reduced-motion preferences and avoids layout shifts caused by unsized media.

Do not add React, a component library, or a CSS framework. The point is to learn what those tools eventually abstract.

### Prove

Use the project’s [acceptance criteria](../../projects/01-launch-page/acceptance.md) as the contract.

- Run the supplied test suite and keep it passing.
- Navigate the entire page with the keyboard. Confirm that focus is visible and reaches controls in a sensible order.
- Disable JavaScript and confirm that the content, navigation, benefits, FAQ, and form purpose remain understandable.
- Inspect the page at narrow and wide widths; verify that text does not clip and controls remain operable.
- Record a Lighthouse or PageSpeed Insights baseline. Name the largest content element and identify any layout shift before changing performance code.

## Level 2 — Typed React interfaces

TypeScript checks assumptions that can be expressed statically; it does not validate data arriving over the network. React renders state into an interface; it should not become a second storage system for values that can be calculated from props or existing state. Project 02 combines those distinctions through an intentionally unreliable API.

### Read

Start with the language and React’s own mental model. Add reference material when a concrete type or state boundary becomes difficult.

- **Official documentation:** [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) — read The Basics, Everyday Types, Narrowing, More on Functions, Object Types, and Modules. Use the TSConfig reference when changing compiler options.
- **Exercise course:** [Total TypeScript Tutorials](https://www.totaltypescript.com/tutorials) by Matt Pocock — begin with the beginner exercises, then use the React and type-transformation material when the project requires it.
- **Book:** [Effective TypeScript, 2nd Edition](https://effectivetypescript.com/) by Dan Vanderkam — use it after the first strict TypeScript project. Focus on type design, inference, `any`, runtime boundaries, and generics rather than reading all 83 items first.
- **Official React course:** [React Learn](https://react.dev/learn) — cover Describing the UI, Adding Interactivity, Managing State, and Escape Hatches.
- **Official React guide:** [Thinking in React](https://react.dev/learn/thinking-in-react) — use it to separate data, derived values, state ownership, and components before writing JSX.
- **Official React guide:** [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — check this before using an effect for derived data, event handling, or resetting state.
- **University course:** [Full Stack Open](https://fullstackopen.com/en/) — Parts 0–2 provide additional React practice with forms, server data, state, and debugging.
- **Testing documentation:** [React Testing Library — Introduction](https://testing-library.com/docs/react-testing-library/intro/) and [Guiding Principles](https://testing-library.com/docs/guiding-principles/) — test visible behavior through DOM roles, names, text, and real interactions instead of component internals.
- **Test runner documentation:** [Vitest — Writing Tests](https://vitest.dev/guide/learn/writing-tests) — use the project’s existing runner for focused logic and component tests.

### Watch

Use these to observe the compiler and React state model in motion. Pause and reproduce examples locally rather than treating completion as evidence of skill.

- [TypeScript Crash Course with Matt Pocock](https://learn.microsoft.com/en-us/shows/vs-code-livestreams/typescript-crash-course-with-matt-pocock) — a Microsoft-hosted video covering diagnostics, unions, inference, and practical editor feedback.
- [React Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe) — an interactive official tutorial rather than a passive video; use it to see lifted state, immutable updates, and state history in one small system.

### Build

Complete [Project 02 — React data dashboard](../../projects/02-data-dashboard/). Read its [brief](../../projects/02-data-dashboard/brief.md) before implementing the marked exercises.

The practical milestone is a typed dashboard that:

- treats every API response as unknown until runtime validation succeeds;
- presents explicit loading, error, empty, and success states;
- retries the same active filter after the deterministic failure;
- prevents an older request from overwriting a newer filter result;
- keeps derived display values out of state;
- uses strict TypeScript without solving uncertainty through `any` or unchecked assertions.

Keep the fake API deterministic. Random failures make both debugging and tests less informative.

### Prove

Use the project’s [acceptance criteria](../../projects/02-data-dashboard/acceptance.md) as the contract.

- Run the tests and production build.
- Trigger every third-request failure and prove that retry uses the same filter.
- Change filters quickly and prove that late responses cannot replace newer data.
- Feed malformed data into the boundary and prove that unchecked fields never render.
- Write tests for loading, error, empty, success, retry, and stale-response behavior using accessible queries.
- Explain why each effect synchronizes with an external system. Remove effects that only calculate render data or respond to a click.

## Level 3 — Next.js product frontend

Next.js adds a server execution environment, routing conventions, streaming, mutations, caching, and deployment choices to React. A Client Component is not automatically safer, and hiding a control in the browser is not authorization. Project 04 makes the server boundary visible by putting two accounts in the same application.

### Read

Next.js changes faster than the browser platform. Use current App Router documentation as the source of truth and treat older tutorial code as historical unless it matches the current docs.

- **Official course:** [Learn Next.js](https://nextjs.org/learn) — the dashboard course covers layouts, navigation, data fetching, rendering, streaming, mutations, error handling, accessibility, authentication, and metadata through one application.
- **Official documentation:** [Next.js App Router — Getting Started](https://nextjs.org/docs/app/getting-started) — use the current pages for project structure, layouts, data fetching, Server and Client Components, cache behavior, error handling, and deployment.
- **Official guides:** [Next.js App Router Guides](https://nextjs.org/docs/app/guides) — consult the focused guides when adding authentication, content security policy, testing, analytics, or other production concerns.
- **Accessibility course:** [web.dev Learn Accessibility](https://web.dev/learn/accessibility/) — apply the modules on semantic HTML, keyboard focus, JavaScript, images, forms, contrast, and testing to dynamic application states.
- **Book:** [Inclusive Components](https://book.inclusive-components.design/) by Heydon Pickering — study the relevant component chapter before implementing a disclosure, menu, dialog, notification, or data table.
- **End-to-end testing documentation:** [Playwright — Writing Tests](https://playwright.dev/docs/writing-tests) and [Best Practices](https://playwright.dev/docs/best-practices) — use user-visible locators, isolated tests, web-first assertions, and traces rather than fixed delays.
- **Performance documentation:** [web.dev Core Web Vitals](https://web.dev/explore/learn-core-web-vitals) — use the current definitions and diagnostic guides for LCP, INP, and CLS.

### Watch

These videos establish the quality vocabulary used during the final proof pass.

- [Understanding Performance with Core Web Vitals](https://www.youtube.com/watch?v=F0NYT7DIlDQ) — Chrome for Developers explains how user-centred metrics connect measurement and debugging.
- [Introduction to Web Accessibility and W3C Standards](https://www.youtube.com/watch?v=20SHvU2PKsM) — revisit the W3C overview before manual keyboard and assistive-technology checks.

### Build

Complete [Project 04 — authenticated issue tracker](../../projects/04-issue-tracker/). Read its [brief](../../projects/04-issue-tracker/brief.md) before deciding which work belongs in the browser and which belongs on the server.

The practical milestone is an App Router application that:

- creates an opaque, HTTP-only, same-site session cookie after sign-in;
- resolves every private project read and write through the authenticated owner;
- returns the same not-found response for missing and unauthorized private resources;
- lets the browser sign in, list projects, and create an issue without holding credentials or authorization secrets;
- prepares uploads with an expiring object URL, accepted content type, and maximum size rather than returning storage credentials;
- gives pending, success, empty, validation, unauthorized, and failure states accessible names and predictable focus behavior.

Before deployment, add the production persistence, CSRF protection, session expiry, upload storage, metadata, and browser coverage named by the project contract.

### Prove

Use the project’s [acceptance criteria](../../projects/04-issue-tracker/acceptance.md) as the contract.

- Run the starter check and all project tests.
- Sign in as both supplied users and prove that cross-user reads and writes return the same `404` response as missing resources.
- Inspect the browser’s cookie storage and confirm that the session cookie is opaque and unavailable to client-side JavaScript.
- Add an end-to-end test for sign-in, project listing, issue creation, and sign-out. Use role- or label-based locators and no fixed sleeps.
- Navigate validation errors and successful mutations by keyboard. Confirm that focus and status announcements make each result discoverable.
- Record LCP, INP, and CLS for the main user journey. Attribute a weak metric to a specific element, request, or interaction before optimizing it.

## Reference repositories

Reading maintained source code teaches conventions that API snippets omit: file boundaries, tests, naming, review constraints, and how examples evolve. Start with the smallest relevant directory; do not copy an entire architecture into a project that does not need it.

- [mdn/learning-area](https://github.com/mdn/learning-area) — runnable examples and exercises that accompany MDN’s web-development curriculum.
- [javascript-tutorial/en.javascript.info](https://github.com/javascript-tutorial/en.javascript.info) — source chapters, tasks, and solutions for The Modern JavaScript Tutorial.
- [typescript-cheatsheets/react](https://github.com/typescript-cheatsheets/react) — maintained examples for React props, hooks, events, refs, reducers, and migration patterns in TypeScript.
- [vercel/next-learn](https://github.com/vercel/next-learn) — starter and completed code for the official Next.js courses, including the App Router dashboard.
- [w3c/aria-practices](https://github.com/w3c/aria-practices) — source and tests for the WAI-ARIA Authoring Practices Guide. Study its keyboard behavior and review notes, not only its ARIA attributes.
- [GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals) — the measurement library and examples for collecting Core Web Vitals in real browsers.

## Completion standard

The route is complete when Projects 01, 02, and 04 satisfy their linked acceptance criteria and you can explain the evidence:

- why the chosen HTML elements match the content and interaction;
- how the CSS responds to content, viewport, zoom, and user preferences;
- where browser JavaScript reads input, changes state, and updates the document;
- which guarantees come from TypeScript and which require runtime validation;
- why each piece of React state exists and where it is owned;
- which Next.js code executes on the server and which reaches the browser;
- how keyboard use, accessible names, focus, and status messages were checked;
- what unit, component, and end-to-end tests each prove;
- which measurements support each performance change.
