const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4284";
const output = path.join(__dirname, "output/playwright/glass");

async function ready(page) {
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready === "true");
}
async function frame(page, time) {
  await page.evaluate(t => window.__stepFrame(t), time);
}
async function pixels(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2");
    const all = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, all);
    const sampled = [];
    for (let y = 0; y < canvas.height; y += 4) for (let x = 0; x < canvas.width; x += 4) {
      const offset = (y * canvas.width + x) * 4;
      sampled.push(all[offset], all[offset + 1], all[offset + 2]);
    }
    return sampled;
  });
}
async function installFrameControl(page) {
  await page.addInitScript(() => {
    let id = 0;
    const queued = new Map();
    window.requestAnimationFrame = callback => { queued.set(++id, callback); return id; };
    window.cancelAnimationFrame = key => queued.delete(key);
    window.__stepFrame = time => {
      const callbacks = [...queued.values()];
      queued.clear();
      callbacks.forEach(callback => callback(time));
    };
  });
}

(async () => {
  await fs.mkdir(output, {recursive: true});
  const browser = await launchBrowser();
  const report = [];
  try {
    for (let round = 1; round <= 3; round++) {
      const context = await browser.newContext({viewport: {width: 1056, height: 892}});
      const errors = [];
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      for (const paper of [1, 2]) {
        await page.goto(`${base}/paper${paper}/?year=2026#papers`);
        await page.evaluate(() => document.fonts.ready);
        const card = page.locator(".paper-intro");
        const box = await card.boundingBox();
        await page.mouse.move(box.x + box.width * .86, box.y + box.height * .23);
        await page.waitForFunction(() => !!document.querySelector(".paper-intro[data-glass-active]")?.style.getPropertyValue("--tilt-x"));
        const effect = await card.evaluate(el => {
          const style = getComputedStyle(el);
          return {
            angle: Math.hypot(parseFloat(style.getPropertyValue("--tilt-x")), parseFloat(style.getPropertyValue("--tilt-y"))),
            blur: style.backdropFilter,
            x: parseFloat(style.getPropertyValue("--glow-x")),
            y: parseFloat(style.getPropertyValue("--glow-y")),
            light: getComputedStyle(el, "::before").backgroundImage,
            border: getComputedStyle(el, "::after").maskComposite
          };
        });
        assert.ok(effect.angle > .5 && effect.angle <= 4, JSON.stringify(effect));
        assert.ok(effect.blur.includes("blur(18px)"));
        assert.equal(effect.light, "none", "Card interiors must not have a pointer-following spotlight");
        assert.ok(effect.border.split(",").every(mode => mode.trim() === "exclude"));
        assert.ok(Math.abs(effect.x - box.width * .86) < 3);
        await page.mouse.move(4, 400);
        await page.waitForFunction(() => {
          const el = document.querySelector(".paper-intro");
          const matrix = new DOMMatrix(getComputedStyle(el).transform);
          return !el.hasAttribute("data-glass-active") && Math.abs(matrix.m13) < .00001 && Math.abs(matrix.m23) < .00001;
        });
        // Re-rendering while a card is active must not strand the transformed old node.
        await page.getByRole("link", {name: "題目庫", exact: true}).click();
        await page.locator(".result").first().hover();
        await page.locator("[data-topic-filter]").nth(1).click();
        assert.ok(await page.locator(".result").count());
        assert.equal(await page.locator('[data-glass-active="true"]').count(), 0);
        await page.locator("[data-topic-filter]").first().click();
        await page.locator('[data-result="1"] [data-open]').click();
        await page.locator('[data-result="1"] [data-hint]').click();
        assert.ok(await page.locator('[data-result="1"] .hints').isVisible());
        if (round === 1) {
          await page.mouse.move(4, 400);
          await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))));
          await page.screenshot({path: path.join(output, `paper${paper}-find.png`), fullPage: true});
          await page.getByRole("link", {name: "模擬試卷", exact: true}).click();
          await page.screenshot({path: path.join(output, `paper${paper}-papers.png`)});
          await page.locator(".paper-intro").hover({position: {x: 140, y: 85}});
          await page.waitForTimeout(200);
          await page.screenshot({path: path.join(output, `paper${paper}-hover.png`)});
        }
      }
      await context.close();

      const scene = await browser.newContext({viewport: {width: 1056, height: 892}});
      const active = await scene.newPage();
      const control = await scene.newPage();
      await installFrameControl(active);
      await installFrameControl(control);
      await active.goto(base);
      await control.goto(base);
      await ready(active);
      await ready(control);
      let time = 100;
      await frame(active, time);
      await frame(control, time);
      assert.deepEqual(await pixels(active), await pixels(control), "Matched unplucked scenes must render identically");
      await active.mouse.move(3, 3);
      time += 16;
      await frame(active, time);
      await frame(control, time);
      assert.equal(await active.locator("canvas").getAttribute("data-plucks"), "0", "Empty sky must not pluck the ribbon");
      let contact;
      for (let y = 120; y < 620 && !contact; y += 70) for (let x = 80; x < 990 && !contact; x += 70) {
        await active.mouse.move(x, y);
        time += 16;
        await frame(active, time);
        await frame(control, time);
        if (Number(await active.locator("canvas").getAttribute("data-plucks"))) contact = {x, y};
      }
      assert.ok(contact, "Pointer must be able to touch the visible ribbon");
      const contactTime = time;
      const motion = [];
      async function stepMotion() {
        time += 16;
        await frame(active, time);
        await frame(control, time);
        motion.push(await active.locator("canvas").evaluate((el, age) => ({
          age, offset: Number(el.dataset.pluckOffset), energy: Number(el.dataset.pluckEnergy)
        }), (time - contactTime) / 1000));
      }
      for (let n = 0; n < 10; n++) await stepMotion();
      const energy = Number(await active.locator("canvas").getAttribute("data-pluck-energy"));
      assert.ok(energy > .025 && energy <= .16, `Pluck strength ${energy}`);
      const actual = await pixels(active);
      const expected = await pixels(control);
      let changed = 0;
      for (let i = 0; i < actual.length; i += 3) {
        if (Math.abs(actual[i] - expected[i]) + Math.abs(actual[i + 1] - expected[i + 1]) + Math.abs(actual[i + 2] - expected[i + 2]) > 12) changed++;
      }
      assert.ok(changed > 200, `Pluck must visibly displace stars, changed samples: ${changed}`);
      assert.equal(await active.locator("canvas").getAttribute("data-plucks"), "1", "A stationary pointer must not repeatedly pluck");
      if (round === 1) await active.screenshot({path: path.join(output, "home-pluck.png")});
      // Repeatedly crossing the ribbon must not turn one gesture into rapid impacts.
      for (let n = 0; n < 12; n++) {
        await active.mouse.move(3, 3);
        await stepMotion();
        await active.mouse.move(contact.x, contact.y);
        await stepMotion();
      }
      assert.equal(await active.locator("canvas").getAttribute("data-plucks"), "1", "Rapid re-entry must not produce a burst of plucks");
      // Once the wave has decayed, compare the actual rendered pixels with an unplucked control.
      for (let n = 0; n < 250; n++) await stepMotion();
      const crossings = [];
      let previous = motion[0];
      for (const sample of motion.slice(1)) {
        if (sample.offset * previous.offset < 0) crossings.push(sample.age);
        if (sample.offset !== 0) previous = sample;
      }
      assert.ok(crossings.length >= 2 && crossings.length <= 5, `Expected a few gentle rebounds: ${crossings}`);
      assert.ok(crossings[0] >= .65, `First recoil reversed too quickly: ${crossings[0]}`);
      for (let n = 1; n < crossings.length; n++) assert.ok(crossings[n] - crossings[n - 1] >= .65, "Rebound frequency is too high");
      assert.ok(Math.max(...motion.map(sample => sample.energy)) < .12, "One pluck must remain restrained");
      assert.equal(Number(await active.locator("canvas").getAttribute("data-pluck-energy")), 0);
      assert.deepEqual(await pixels(active), await pixels(control), "The ribbon must return to its original orbit after the pluck");
      await active.mouse.move(3, 3);
      await stepMotion();
      await active.mouse.move(contact.x, contact.y);
      await stepMotion();
      assert.equal(await active.locator("canvas").getAttribute("data-plucks"), "2", "A fresh touch after settling must pluck again");
      await active.keyboard.press("Escape");
      await active.mouse.move(contact.x + 35, contact.y + 10);
      await frame(active, time + 16);
      assert.equal(await active.locator("canvas").getAttribute("data-plucks"), "2", "Paused scene must stay paused on hover");
      await active.mouse.click(3, 3);
      await active.locator(".paper-directory").waitFor();
      assert.ok(active.url().includes("/paper1/?year=2026#papers"));
      report.push({round, angleCap: 4, energy, changedSamples: changed, recoilSignChangesSeconds: crossings, rapidReentrySuppressed: true, freshTouchWorks: true, decayMatchesControl: true});
      await scene.close();
      assert.deepEqual(errors, []);
      console.log(`Effects round ${round}: glass, bounded tilt/reset, hit testing, visible pluck and complete decay passed.`);
    }
    for (const settings of [
      {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true},
      {viewport: {width: 1056, height: 892}, reducedMotion: "reduce"}
    ]) {
      const context = await browser.newContext(settings);
      const page = await context.newPage();
      await page.goto(`${base}/paper1/?year=2024#papers`);
      await page.locator(".paper-intro").hover({force: true});
      assert.equal(await page.locator("[data-glass-active]").count(), 0);
      const transform = await page.locator(".paper-intro").evaluate(el => getComputedStyle(el).transform);
      assert.ok(transform === "none" || new RegExp("^matrix\\(1, 0, 0, 1, 0, 0\\)$").test(transform));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      if (settings.isMobile) {
        await page.screenshot({path: path.join(output, "mobile-papers.png"), fullPage: true});
        await page.getByRole("link", {name: "題目庫", exact: true}).click();
        await page.screenshot({path: path.join(output, "mobile-find.png")});
      }
      await page.goto(`${base}/?year=2024`);
      await ready(page);
      await page.mouse.move(200, 220);
      assert.equal(await page.locator("canvas").getAttribute("data-plucks"), "0");
      await page.locator("#enter-paper").focus();
      await page.keyboard.press("Enter");
      await page.locator(".paper-directory").waitFor();
      assert.ok(page.url().includes("year=2024"));
      await context.close();
    }
    await fs.writeFile(path.join(output, "effects-report.json"), JSON.stringify(report, null, 2));
    console.log("Touch, reduced motion, keyboard entry and mobile layout passed.");
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
