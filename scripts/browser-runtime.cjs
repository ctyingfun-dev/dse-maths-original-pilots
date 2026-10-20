const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let playwright;
try {
  playwright = require("playwright");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
  const bundled = path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
  if (!fs.existsSync(bundled)) {
    throw new Error("Run npm ci, then npx playwright install chromium before browser checks.");
  }
  playwright = require(bundled);
}

function launchBrowser() {
  const options = {headless: true};
  if (process.env.BROWSER_CHANNEL) options.channel = process.env.BROWSER_CHANNEL;
  else if (!fs.existsSync(playwright.chromium.executablePath()) && process.platform === "win32") options.channel = "msedge";
  return playwright.chromium.launch(options);
}

module.exports = {launchBrowser};
