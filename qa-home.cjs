const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { pathToFileURL } = require("node:url");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const output = path.join(__dirname, "output/playwright/home-starlight");
const ready = page => page.locator('canvas[data-ready="true"]').waitFor();
const image = page => page.locator("canvas").evaluate(c => c.toDataURL());
async function sample(page, remember = false) {
  return page.locator("canvas").evaluate((canvas, remember) => {
    const gl = canvas.getContext("webgl2");
    const w = canvas.width, h = canvas.height, dpr = w / innerWidth;
    const data = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
    let lit = 0, moved = 0;
    const quadrants = [0, 0, 0, 0], tiles = new Array(36 * 24).fill(0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const on = Math.max(data[i], data[i + 1], data[i + 2]) > 36;
      if (on) {
        lit++;
        quadrants[(y > h / 2 ? 2 : 0) + (x > w / 2 ? 1 : 0)]++;
        tiles[Math.floor(y / h * 24) * 36 + Math.floor(x / w * 36)]++;
      }
      if (window.previousPixels && on !== (Math.max(...window.previousPixels.subarray(i, i + 3)) > 36)) moved++;
    }
    if (remember) window.previousPixels = data;
    const tileArea = w * h / tiles.length;
    const dense = tiles.flatMap((n, i) => n / tileArea > .045 ? [{ x: i % 36, y: Math.floor(i / 36) }] : []);
    return { lit: lit / (dpr * dpr), moved: moved / (dpr * dpr), quadrants, dense, width: innerWidth, height: innerHeight };
  }, remember);
}
async function layout(page, width, height) {
  assert.equal(await page.locator("header,button,select,.scene-controls,.scene-caption").count(), 0);
  assert.equal(await page.locator("a").count(), 1);
  for (const selector of ["canvas", "#enter-paper"]) assert.deepEqual(await page.locator(selector).boundingBox(), { x: 0, y: 0, width, height });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight), false);
  assert.equal(await page.locator(".identity").evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
  const identity = await page.locator(".identity").boundingBox();
  assert.ok(identity.x >= 0 && identity.x + identity.width <= width && identity.y + identity.height <= height);
  const result = await sample(page);
  assert.ok(result.lit > 900, `Blank or faint scene: ${JSON.stringify(result)}`);
  assert.ok(result.quadrants.every(count => count > 60), "Star background does not cover the screen");
  assert.ok(result.dense.length > 12, "Star ribbon is not visibly distinct from the background");
  const top = Math.min(...result.dense.map(t => t.y)), bottom = Math.max(...result.dense.map(t => t.y));
  assert.ok((24 - top) / 24 * height < identity.y, "Star ribbon overlaps title");
  assert.ok(top >= 1 && bottom < 23, "Star ribbon clips the viewport");
  console.log(`${width}x${height}: ${Math.round(result.lit)} lit pixels, ${result.dense.length} dense ribbon tiles, full-screen link and no header.`);
}
(async () => {
  const { mobius } = await import(pathToFileURL(path.join(__dirname, "assets/vendor/three/ParametricFunctions.js")));
  const point = { set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
  for (const lane of [-1.1, -.4, .6, 1.1]) {
    mobius(lane + .5, 0, point);
    const initial = { ...point };
    mobius(lane + .5, 2, point);
    assert.ok(Math.hypot(point.x - initial.x, point.y - initial.y, point.z - initial.z) < 1e-10);
    mobius(lane + .5, 1, point);
    const opposite = { ...point };
    mobius(-lane + .5, 0, point);
    assert.ok(Math.hypot(point.x - opposite.x, point.y - opposite.y, point.z - opposite.z) < 1e-10);
  }
  await fs.mkdir(output, { recursive: true });
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
    for (const [width, height] of [[1920, 1080], [1440, 900], [1056, 892], [768, 892], [390, 844], [320, 640], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}/?year=2024`);
      await ready(page);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("canvas").getAttribute("data-motion"), "paused");
      await layout(page, width, height);
      const frozen = await image(page);
      await page.waitForTimeout(160);
      assert.equal(await image(page), frozen);
      await sample(page, true);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      const moving = await sample(page);
      assert.ok(moving.moved > width * height * .0002, `Orbit stars did not move: ${moving.moved}`);
      await page.keyboard.press("Escape");
      await page.screenshot({ path: path.join(output, `starlight-${width}.png`) });
      for (const [x, y] of [[4, 4], [width - 4, height - 4], [width / 2, height / 2]]) {
        await page.mouse.click(x, y);
        await page.locator(".paper-directory").waitFor();
        assert.equal(new URL(page.url()).pathname, "/paper1/");
        assert.ok(page.url().includes("year=2024"));
        await page.goto(`${base}/?year=2024`);
        await ready(page);
      }
      if (width <= 390) {
        await page.touchscreen.tap(width * .8, height * .3);
        await page.locator(".paper-directory").waitFor();
        assert.ok(page.url().includes("/paper1/?year=2024"));
      }
    }
    for (const year of [2016,2017,2018,2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) for (const paper of [1, 2]) {
      await page.goto(`${base}/paper${paper}/?year=${year}#find`);
      const key = `dse-original-pilot-paper${paper}-${year}-v2`;
      const progress = await page.evaluate(({ key, paper, year }) => {
        const questionRevision = paper === 1 ? ([2016,2017,2018,2019,2020,2021,2022,2023].includes(year) ? 1 : 2) : ([2016,2017,2018,2019,2020,2021,2023,2024].includes(year) ? 1 : [2022,2025].includes(year) ? 2 : 5);
        const progress = { schema: 2, paper, year, progress: { answers: { "1": "A" }, checked: { "1": true }, hints: { "1": 1 }, saved: [2], startedAt: null, deadline: null, mode: "untimed", finished: false, questionRevision } };
        localStorage.setItem(key, JSON.stringify(progress));
        return localStorage.getItem(key);
      }, { key, paper, year });
      await page.getByRole("link", { name: "主頁", exact: true }).click();
      await ready(page);
      assert.ok((await page.locator("#enter-paper").getAttribute("href")).includes(`year=${year}`));
      assert.equal(await page.evaluate(key => localStorage.getItem(key), key), progress);
      await page.locator("#enter-paper").focus();
      assert.equal(await page.locator("#enter-paper").evaluate(el => getComputedStyle(el).outlineStyle), "solid");
      await page.keyboard.press("Enter");
      await page.locator(".paper-directory").waitFor();
      assert.ok(page.url().includes(`/paper1/?year=${year}`));
      assert.equal(await page.evaluate(key => localStorage.getItem(key), key), progress, "Homepage changed existing progress");
    }
    await page.goto(`${base}/?year=1900`);
    await ready(page);
    assert.equal(await page.locator("#enter-paper").getAttribute("href"), "./paper1/?year=2026#papers", "Unsupported year must use the 2026 default");
    await context.close();
    const quiet = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const reduced = await quiet.newPage();
    await reduced.goto(base);
    await ready(reduced);
    assert.equal(await reduced.locator("canvas").getAttribute("data-motion"), "paused");
    const still = await image(reduced);
    await reduced.waitForTimeout(200);
    assert.equal(await image(reduced), still);
    await layout(reduced, 390, 844);
    assert.equal(await reduced.locator("canvas").evaluate(c => c.width), 780);
    await reduced.keyboard.press("Escape");
    await reduced.waitForTimeout(250);
    assert.notEqual(await image(reduced), still);
    await reduced.keyboard.press("Escape");
    await reduced.evaluate(() => {
      window.contextTest = document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context");
      window.contextTest.loseContext();
    });
    await reduced.waitForFunction(() => document.querySelector("#scene-status").textContent.includes("中斷"));
    await reduced.waitForTimeout(150);
    await reduced.evaluate(() => window.contextTest.restoreContext());
    await reduced.waitForFunction(() => document.querySelector("#scene-status").textContent === "");
    assert.ok((await sample(reduced)).lit > 900);
    await quiet.close();
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await noJS.newPage();
    await fallback.goto(base);
    await fallback.mouse.click(2, 2);
    await fallback.waitForURL("**/paper1/?year=2026#papers");
    await noJS.close();
    const unavailable = await browser.newContext();
    const no3d = await unavailable.newPage();
    await no3d.route("**/assets/vendor/three/three.module.min.js", route => route.abort());
    await no3d.goto(`${base}/?year=2025`);
    await no3d.waitForFunction(() => document.querySelector("#scene-status").textContent.includes("未能"));
    await no3d.mouse.click(2, 2);
    await no3d.locator(".paper-directory").waitFor();
    assert.ok(no3d.url().includes("/paper1/?year=2025"));
    await unavailable.close();
    assert.deepEqual(errors, []);
    console.log("Two-turn Mobius continuity, star motion, full-screen corner/center/touch/keyboard entry, years, progress isolation, reduced motion, DPR, context restoration and fallback links passed.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
