import { spawnSync } from "node:child_process";

/** True if `cmd` resolves to an executable on PATH. */
export function commandExists(cmd: string): boolean {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [cmd], { stdio: "ignore" });
  return result.status === 0;
}

/** Runs `cmd` with inherited stdio (output streams straight to the terminal). Returns the exit code. */
export function run(cmd: string, args: string[], env?: NodeJS.ProcessEnv): number {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (result.error) {
    console.error(`[db script] Failed to run "${cmd}": ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

/** Runs `cmd` and captures stdout instead of streaming it. Returns null on any non-zero/empty result. */
export function runCapture(cmd: string, args: string[]): string | null {
  const result = spawnSync(cmd, args, { encoding: "utf-8" });
  if (result.status === 0 && result.stdout && result.stdout.trim().length > 0) {
    return result.stdout;
  }
  return null;
}

/** Prints `message` to stderr and exits the process with a non-zero code. Never returns. */
export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
