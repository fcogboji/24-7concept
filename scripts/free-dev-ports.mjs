#!/usr/bin/env node
/**
 * SIGTERM listeners on common Next dev ports so `npm run dev` can start.
 * macOS / Linux: uses lsof. Skip ports used by Playwright E2E (3199) unless you add it here.
 */
import { execSync } from "node:child_process";

const ports = [3000, 3001, 3002];

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
    if (!out) return [];
    return out.split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

let killed = 0;
for (const port of ports) {
  for (const pid of pidsOnPort(port)) {
    try {
      process.kill(Number(pid), "SIGTERM");
      killed++;
      console.log(`Stopped PID ${pid} on port ${port}`);
    } catch {
      /* ignore */
    }
  }
}

if (killed === 0) {
  console.log("No processes found on ports 3000–3002.");
} else {
  console.log(`Sent SIGTERM to ${killed} process(es). Wait a second, then run npm run dev.`);
}
