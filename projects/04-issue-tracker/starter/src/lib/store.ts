import { TrackerStore } from "./tracker-store";

const globalStore = globalThis as typeof globalThis & { issueTrackerStore?: TrackerStore };

export const store = globalStore.issueTrackerStore ?? new TrackerStore();

if (process.env.NODE_ENV !== "production") globalStore.issueTrackerStore = store;
