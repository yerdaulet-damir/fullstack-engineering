import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("projects/catalog.json", root), "utf8"));
let progress;

try {
  progress = JSON.parse(await readFile(new URL(".progress.json", root), "utf8"));
} catch {
  console.error("Create your progress file first: cp .progress.example.json .progress.json");
  process.exit(1);
}

const next = catalog.find((project) => progress.projects[project.id]?.status !== "done");

if (!next) {
  console.log("All projects are marked done. Publish the capstone evidence from ROADMAP.md.");
} else {
  console.log(`${next.id} — ${next.title}`);
  console.log(`Open: projects/${next.id}-${next.slug}/README.md`);
  console.log(`Run:  ${next.command}`);
}
