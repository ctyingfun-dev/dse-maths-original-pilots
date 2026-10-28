const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {execFileSync} = require("node:child_process");
const {files} = require("./publish.cjs");
const root = path.resolve(__dirname, "..");
const required = [...files, "AGENTS.md", "HANDOFF.md", "SOLUTION_STYLE.md", "CODEX_PROMPT.txt", "server.cjs", "package.json", "package-lock.json", "scripts/browser-runtime.cjs", "scripts/publish.cjs", "build-solutions-pdf.cjs", "scripts/solution-pdf.css", "scripts/solution-pdf-math.js", "scripts/solution-pdf-roots.js", "scripts/test-solution-pdf-math.cjs", "qa-solutions-pdf.py", "qa-solutions-download.cjs"];
assert.equal(new Set(files).size, files.length, "Duplicate public files");
for (const file of required) {
  assert.ok(fs.statSync(path.join(root, file)).isFile(), `Missing file: ${file}`);
}
const fingerprint = crypto.createHash("sha256");
for (const file of files) {
  const raw = fs.readFileSync(path.join(root, file));
  // Git can normalize text line endings between Windows and macOS.
  const bytes = /\.(?:html|css|js|json|txt|svg)$/.test(file) ? Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n")) : raw;
  fingerprint.update(file + "\0").update(bytes).update("\0");
}
for (const file of ["verify-2016.cjs", "verify-2017.cjs", "verify-2018.cjs", "verify-2019.cjs", "verify-2020.cjs", "verify-2021.cjs", "verify-2022.cjs", "verify-2023.cjs", "verify-2024.cjs", "verify-2025.cjs", "verify-2026.cjs", "verify-notation.cjs", "verify-solution-layout.cjs", "verify-similarity.cjs"]) {
  execFileSync(process.execPath, [file], {cwd: root, stdio: "inherit"});
}
console.log(`Handoff complete: ${files.length} public assets and required editing documents exist.`);
console.log(`Website fingerprint (normalized text): ${fingerprint.digest("hex")}`);
