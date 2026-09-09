import { readFile } from "node:fs/promises";
import { createCopilot } from "./app.js";

type Fixture = {
  id: string;
  query: string;
  expectCitation?: string;
  expectText?: string;
  expectRefusal?: boolean;
  forbidText?: string;
};

const fixtures = JSON.parse(await readFile(new URL("../evals/fixtures.json", import.meta.url), "utf8")) as Fixture[];
const copilot = await createCopilot();
let failed = 0;

for (const fixture of fixtures) {
  const output = await copilot.answer(fixture.query);
  const passes =
    (!fixture.expectCitation || output.citationIds.includes(fixture.expectCitation)) &&
    (!fixture.expectText || output.answer.includes(fixture.expectText)) &&
    (!fixture.expectRefusal || !output.grounded) &&
    (!fixture.forbidText || !output.answer.includes(fixture.forbidText));
  console.log(`${passes ? "PASS" : "FAIL"} ${fixture.id}`);
  if (!passes) failed += 1;
}

console.log(`${fixtures.length - failed}/${fixtures.length} evals passed`);
if (failed > 0) process.exitCode = 1;
