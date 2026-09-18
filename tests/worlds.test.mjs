import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
const exec = promisify(execFile); const root = path.resolve(import.meta.dirname, "..");
test("builds the Pixel Port demo world", async () => {
  await exec("node", ["src/build.mjs"], { cwd: root });
  await access(path.join(root, "dist", "index.html")); await access(path.join(root, "dist", "worlds", "future-store", "index.html"));
  const html = await readFile(path.join(root, "dist", "worlds", "future-store", "index.html"), "utf8");
  assert.match(html, /未来商店/); assert.match(html, /Student001/); assert.match(html, /进入体验/);
});
