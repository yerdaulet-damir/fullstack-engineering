import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("projects/catalog.json", root), "utf8"));

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
}
