import { execFileSync } from "node:child_process";

const checks = [];

function check(name, required, run) {
  try {
    checks.push({ name, required, value: run(), ok: true });
  } catch {
    checks.push({ name, required, value: "not found", ok: false });
  }
}

check("Node.js 22+", true, () => {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22) throw new Error("old node");
  return process.versions.node;
});
check("pnpm", true, () => execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim());
check("Git", true, () => execFileSync("git", ["--version"], { encoding: "utf8" }).trim());
check("Docker (projects 03+)", false, () => execFileSync("docker", ["--version"], { encoding: "utf8" }).trim());

for (const item of checks) {
  const mark = item.ok ? "PASS" : item.required ? "FAIL" : "LATER";
  console.log(`${mark.padEnd(5)} ${item.name}: ${item.value}`);
}

if (checks.some((item) => item.required && !item.ok)) process.exitCode = 1;
