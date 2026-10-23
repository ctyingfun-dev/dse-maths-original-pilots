const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const release = process.argv[3];
if (require.main === module) assert.ok(["stage", "verify"].includes(process.argv[2]), "Usage: node scripts/publish.cjs stage|verify YYYYMMDD-label");
if (require.main === module) assert.ok(release, "Provide a release label, e.g. 20261020-clear-glass");
if (require.main === module) assert.match(release, /^\d{8}(?:-[a-z0-9]+)*$/);
const staging = path.join(root, "tmp", `publish-${release}`);
const files = [
  "index.html",
  "year.js",
  "assets/dse-maths-logo.png",
  "assets/workspace.css",
  "assets/workspace.js",
  "assets/workspace-icons.svg",
  "assets/home.css",
  "assets/home.js",
  ...["300.css", "LICENSE.txt", "noto-sans-tc-115-300-normal.woff2", "noto-sans-tc-120-300-normal.woff2",
    "noto-sans-tc-121-300-normal.woff2", "noto-sans-tc-122-300-normal.woff2",
    "noto-sans-tc-123-300-normal.woff2", "noto-sans-tc-latin-300-normal.woff2"].map(file => `assets/fonts/noto-sans-tc/${file}`),
  ...["chiron-hei-hk","chiron-sung-hk"].flatMap(id => {
    const source = JSON.parse(fs.readFileSync(path.join(root,`assets/fonts/${id}/source.json`),"utf8"));
    return ["source.json",...source.files].map(file => `assets/fonts/${id}/${file}`);
  }),
  ...["three.module.min.js", "three.core.min.js", "ParametricFunctions.js", "LICENSE.txt"].map(file => `assets/vendor/three/${file}`),
  ...["index.html", "style.css", "app.js", "math.js", "data-2026.js", "data-2025.js", "data-2024.js", "diagrams-2024.js", "dse-topics.js"].map(file => `paper1/${file}`),
  ...["index.html", "style.css", "app.js", "math.js", "data-2026.js", "data-2025.js", "data-2024.js", "diagrams-2024.js", "diagrams-2025.js", "diagrams-2026.js", "dse-topics.js"].map(file => `paper2/${file}`),
  "output/pdf/dse-original-paper1-practice.pdf",
  "output/pdf/dse-original-2025-paper1-practice.pdf",
  "output/pdf/dse-original-2025-paper2-practice.pdf",
  "output/pdf/dse-original-2024-paper1-practice.pdf",
  "output/pdf/dse-original-2024-paper2-practice.pdf",
  "paper1/data-2023.js",
  "paper1/diagrams-2023.js",
  "paper2/data-2023.js",
  "paper2/diagrams-2023.js",
  "output/pdf/dse-original-2023-paper1-practice.pdf",
  "output/pdf/dse-original-2023-paper2-practice.pdf",
  "paper1/data-2022.js",
  "paper1/diagrams-2022.js",
  "paper2/data-2022.js",
  "paper2/diagrams-2022.js",
  "output/pdf/dse-original-2022-paper1-practice.pdf",
  "output/pdf/dse-original-2022-paper2-practice.pdf",
  "paper1/data-2021.js",
  "paper1/diagrams-2021.js",
  "paper2/data-2021.js",
  "paper2/diagrams-2021.js",
  "output/pdf/dse-original-2021-paper1-practice.pdf",
  "output/pdf/dse-original-2021-paper2-practice.pdf",
  "paper1/data-2020.js",
  "paper1/diagrams-2020.js",
  "paper2/data-2020.js",
  "paper2/diagrams-2020.js",
  "output/pdf/dse-original-2020-paper1-practice.pdf",
  "output/pdf/dse-original-2020-paper2-practice.pdf",
  "paper1/data-2019.js",
  "paper1/diagrams-2019.js",
  "paper2/data-2019.js",
  "paper2/diagrams-2019.js",
  "output/pdf/dse-original-2019-paper1-practice.pdf",
  "output/pdf/dse-original-2019-paper2-practice.pdf",
];
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

async function main() {
  assert.equal(new Set(files).size, files.length, "Duplicate release assets");
  if (process.argv[2] === "stage") {
    fs.mkdirSync(path.dirname(staging), { recursive: true });
    // Exclusive mkdir claims this release atomically, including against concurrent runs.
    try {
      fs.mkdirSync(staging);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      throw new Error(`Staging directory already exists: ${staging}. Choose a new release label; existing files were preserved.`, { cause: error });
    }
  }
  const manifest = [];
  for (const relative of files) {
    const local = fs.readFileSync(path.join(root, relative));
    const entry = { path: relative, bytes: local.length, sha256: hash(local) };
    if (process.argv[2] === "verify") {
      const response = await fetch(`https://dse-maths-original-pilots.pages.dev/${relative}?publish=${release}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      assert.equal(response.status, 200, `${relative}: HTTP status`);
      const remote = Buffer.from(await response.arrayBuffer());
      assert.equal(hash(remote), entry.sha256, `${relative}: published hash`);
      console.log(`MATCH ${relative}`);
    } else {
      const target = path.resolve(staging, relative);
      assert.ok(target.startsWith(staging + path.sep));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, relative), target, fs.constants.COPYFILE_EXCL);
    }
    manifest.push(entry);
  }
  fs.mkdirSync(path.join(root, "tmp"), { recursive: true });
  fs.writeFileSync(path.join(root, "tmp", `publish-${release}-${process.argv[2] === "verify" ? "verified" : "manifest"}.json`),
    JSON.stringify({ site: "https://dse-maths-original-pilots.pages.dev", checkedAt: new Date().toISOString(), files: manifest }, null, 2),
    process.argv[2] === "stage" ? { flag: "wx" } : undefined);
  console.log(`${process.argv[2] === "verify" ? "Verified" : "Staged"} ${files.length} files.`);
}

module.exports = {files};

if (require.main === module) main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
