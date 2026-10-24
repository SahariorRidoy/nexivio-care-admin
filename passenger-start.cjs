
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextBin = path.join(
  __dirname,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const port = process.env.PORT || "3000";

const child = spawn(
  process.execPath,
  [nextBin, "start", "-p", port],
  {
    cwd: __dirname,
    env: process.env,
    stdio: "inherit",
  }
);

child.on("error", (error) => {
  console.error("Failed to start Next.js:", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Next.js exited with signal: ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
