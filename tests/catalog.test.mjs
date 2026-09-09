import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("projects/catalog.json", root), "utf8"));

const productSurfaces = {
  "01": ["index.html", "styles.css", "app.js", "server.mjs", "tests/starter.test.mjs"],
  "02": ["src/App.tsx", "src/hooks/useDashboard.ts", "src/components/Dashboard.tsx", "src/validation.ts", "src/__tests__/starter.test.tsx"],
  "03": ["starter/src/app.mjs", "starter/src/repository.mjs", "starter/migrations/001_init.sql", "starter/test/app.test.mjs"],
  "04": ["starter/src/app/page.tsx", "starter/src/components/issue-tracker-client.tsx", "starter/src/app/api/session/route.ts", "starter/src/lib/tracker-store.ts", "starter/test/routes.test.ts"],
  "05": ["starter/public/index.html", "starter/src/server.mjs", "starter/src/websocket.mjs", "starter/src/presence.mjs", "starter/test/server.test.mjs"],
  "06": ["starter/src/server.mjs", "starter/src/repository.mjs", "starter/src/authorization.mjs", "starter/src/jobs.mjs", "starter/src/webhooks.mjs", "starter/test/isolation.test.mjs"],
  "07": ["starter/public/index.html", "starter/src/server.ts", "starter/src/copilot.ts", "starter/src/retrieval.ts", "starter/src/run-evals.ts", "starter/tests/server.test.ts"],
  "08": ["starter/src/server.ts", "starter/src/workflow.ts", "starter/src/tool-registry.ts", "starter/src/store.ts", "starter/src/mcp-adapter.ts", "starter/tests/workflow.test.ts"]
};

async function hasRunnablePackage(base) {
  try {
    await access(new URL("starter/package.json", base));
  } catch {
    await access(new URL("package.json", base));
  }
}

test("the ladder has eight ordered projects", () => {
  assert.deepEqual(catalog.map((project) => project.id), ["01", "02", "03", "04", "05", "06", "07", "08"]);
});

test("the learning index and four domain playbooks exist", async () => {
  await Promise.all([
    access(new URL("learn/README.md", root)),
    access(new URL("learn/web-frontend/README.md", root)),
    access(new URL("learn/backend-data/README.md", root)),
    access(new URL("learn/systems-devops/README.md", root)),
    access(new URL("learn/ai-engineering/README.md", root))
  ]);
});

for (const project of catalog) {
  test(`${project.id} has a brief, acceptance checks, exercises, and starter code`, async () => {
    const base = new URL(`projects/${project.id}-${project.slug}/`, root);
    await Promise.all([
      access(new URL("README.md", base)),
      access(new URL("brief.md", base)),
      access(new URL("acceptance.md", base)),
      access(new URL("exercises.md", base)),
      hasRunnablePackage(base)
    ]);
  });

  test(`${project.id} keeps required implementation and test files`, async () => {
    const base = new URL(`projects/${project.id}-${project.slug}/`, root);
    await Promise.all(productSurfaces[project.id].map(async (file) => {
      const target = new URL(file, base);
      await access(target);
      const metadata = await stat(target);
      assert(metadata.size >= 80, `${project.id} product surface is only a placeholder: ${file}`);
    }));
  });
}
