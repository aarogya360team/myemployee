import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
    cwd: root,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["tsx", "--test", "tests/language.test.ts", "tests/usp.test.ts", "tests/onboarding.test.ts", "tests/llm.test.ts"]);

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("postgres")) {
  console.warn(
    "Skipping tenant isolation tests (set DATABASE_URL to a postgres connection string).",
  );
  process.exit(0);
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "db", "push", "--skip-generate"]);
run("npx", ["tsx", "--test", "tests/tenant-isolation.test.ts"]);
