const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {spawnSync} = require("node:child_process");
const {files} = require("./scripts/publish.cjs");

const root = __dirname;
const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const release = `${date}-publish-test-${process.pid}-${crypto.randomBytes(8).toString("hex")}`;
const staging = path.join(root, "tmp", `publish-${release}`);
const manifestPath = path.join(root, "tmp", `publish-${release}-manifest.json`);
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
let ownsOutputs = false;

function inventory(directory, prefix = "") {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const relative = prefix + entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return inventory(absolute, relative + "/");
    assert.ok(entry.isFile(), `Unexpected non-regular staged file: ${relative}`);
    return [relative];
  }).sort();
}

function snapshot() {
  return Object.fromEntries(inventory(staging).map(file => [file, hash(fs.readFileSync(path.join(staging, file)))]));
}

function stage() {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/publish.cjs"), "stage", release], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.error) throw result.error;
  return result;
}

try {
  assert.ok(!fs.existsSync(staging), "Test release directory must be new");
  assert.ok(!fs.existsSync(manifestPath), "Test manifest must be new");
  const first = stage();
  ownsOutputs = first.status === 0;
  assert.equal(first.status, 0, first.stderr || first.stdout);
  assert.equal(first.signal, null);
  assert.deepEqual(inventory(staging), [...files].sort(), "Fresh stage must contain exactly the public allowlist");
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  assert.deepEqual(manifest.files.map(entry => entry.path), files);
  for (const entry of manifest.files) {
    const bytes = fs.readFileSync(path.join(staging, entry.path));
    assert.equal(bytes.length, entry.bytes, `${entry.path}: byte count`);
    assert.equal(hash(bytes), entry.sha256, `${entry.path}: manifest hash`);
  }

  const sentinel = "This test-created file must survive a rejected staging attempt.\n";
  fs.writeFileSync(path.join(staging, "audit-sentinel.txt"), sentinel, {flag: "wx"});
  // Also detect a retry that overwrites public assets before eventually rejecting.
  fs.appendFileSync(path.join(staging, "index.html"), "\n<!-- test-only retry sentinel -->\n");
  const before = snapshot();
  const second = stage();
  assert.equal(second.status, 1, second.stderr || second.stdout);
  assert.equal(second.signal, null);
  assert.match(second.stderr, /Staging directory already exists:/);
  assert.doesNotMatch(second.stdout, /Staged \d+ files/);
  assert.equal(fs.readFileSync(path.join(staging, "audit-sentinel.txt"), "utf8"), sentinel);
  assert.deepEqual(snapshot(), before, "Rejected stage must preserve every existing file");
  assert.deepEqual(fs.readFileSync(manifestPath), manifestBytes, "Rejected stage must preserve its manifest");
  console.log(`Publish regression passed: ${files.length} allowlisted assets; repeat stage rejected; sentinel, assets and manifest preserved.`);
} finally {
  // Only a successful first run establishes ownership of these unique test outputs.
  if (ownsOutputs) {
    fs.rmSync(staging, {recursive: true, force: true});
    fs.rmSync(manifestPath, {force: true});
  }
}
assert.ok(!fs.existsSync(staging));
assert.ok(!fs.existsSync(manifestPath));
console.log(`Removed only test-created outputs for ${release}.`);
