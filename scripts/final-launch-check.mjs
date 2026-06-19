#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const runEmbed = process.argv.includes("--with-embed");

function run(label, command, args) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("Production environment gate", "node", ["scripts/check-launch-env.mjs", "--production"]);
run("ESLint", "npm", ["run", "lint"]);
run("Production build", "npm", ["run", "build"]);

if (runEmbed) {
  run("Embed smoke test", "npm", ["run", "verify:embed"]);
} else {
  console.log("\nSkipped embed smoke test. Start the app and run `npm run launch:check:embed` to include it.");
}

console.log("\nFinal launch check passed.");
