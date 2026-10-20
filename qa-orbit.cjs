const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4284";
const output = path.join(__dirname, "output/playwright/orbit");

async function stable(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {})));
  });
}
async function noOverflow(page, label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label);
}
async function savedProgress(page, paper) {
  return page.evaluate(p => JSON.parse(localStorage.getItem(`dse-original-pilot-paper${p}-2026-v2`)).progress, paper);
}
(async () => {
  await fs.mkdir(output, {recursive: true});
  const browser = await launchBrowser();
  try {
    for (let round = 1; round <= 3; round++) {
      const context = await browser.newContext({viewport: {width: 1056, height: 892}});
      const errors = [];
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (...args) {
          if (window.__failSave) throw new DOMException("Storage unavailable", "QuotaExceededError");
          return original.apply(this, args);
        };
      });
      for (const paper of [1, 2]) {
        await page.setViewportSize({width: 1056, height: 892});
        await page.goto(`${base}/paper${paper}/?year=2026#find`);
        await stable(page);
        const all = await page.locator(".result").count();
        assert.equal(all, paper === 1 ? 19 : 45);
        const topic = await page.locator("[data-topic-filter]").nth(1).getAttribute("data-topic-filter");
        await page.locator("[data-topic-filter]").nth(1).click();
        const topicCount = await page.evaluate(t => window.PILOT.questions.filter(q => q.topic === t).length, topic);
        assert.equal(await page.locator(".result").count(), topicCount);
        assert.equal(await page.locator("[data-topic-filter]").nth(1).getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator("#topic-filter").inputValue(), topic);
        assert.equal(await page.evaluate(() => document.activeElement.id), "topic-choice-1");
        await page.locator("#query-filter").fill("沒有這道題");
        assert.equal(await page.locator(".result").count(), 0);
        await page.locator("[data-topic-filter]").first().click();
        assert.equal(await page.locator("#query-filter").inputValue(), "沒有這道題", "Topic selection must retain search input");
        await page.locator("#query-filter").fill("");
        assert.equal(await page.locator(".result").count(), all);
        await page.locator('[data-result="1"] [data-open]').click();
        assert.equal(await page.locator('[data-result="1"] .exam-stem').count(), 1, "Expanded question must not repeat its stem");
        if (paper === 1) {
          assert.ok(await page.locator('[data-result="1"] .marking-scheme').isVisible());
        } else {
          await page.locator('[data-result="1"] .options label').first().click();
          await page.locator('[data-result="1"] [data-check]').click();
          assert.ok(await page.locator('[data-result="1"] .feedback').isVisible());
        }
        await page.locator('[data-result="1"] [data-hint]').click();
        assert.ok(await page.locator('[data-result="1"] .hints').isVisible());
        if (paper === 1) assert.ok(await page.locator('[data-result="1"] .marking-scheme').isVisible(), "Hint must retain the open reference answer");
        await page.locator('[data-result="1"] .result-actions [data-bookmark]').click();
        assert.equal(await page.locator('[data-result="1"] .result-actions [data-bookmark]').getAttribute("aria-pressed"), "true");
        await page.reload();
        assert.ok((await savedProgress(page, paper)).saved.includes(1));
        assert.equal((await savedProgress(page, paper)).hints[1], 1);
        if (paper === 2) assert.equal((await savedProgress(page, paper)).checked[1], true);

        // Failed writes must leave the current answer and navigation usable.
        await page.locator('[data-result="1"] [data-open]').click();
        await page.evaluate(() => {window.__failSave = true;});
        if (paper === 2) await page.locator('[data-result="1"] .options label').nth(1).click();
        await page.locator('[data-result="1"] [data-hint]').click();
        assert.match(await page.locator("#save-state").innerText(), /未能儲存/);
        assert.equal(await page.locator('[data-result="1"] [data-hint]').innerText().then(text => text.includes("2/")), true);
        if (paper === 2) assert.equal(await page.locator('[data-result="1"] .options input:checked').inputValue(), "B");
        await page.locator('.primary-nav a[href="#saved"]').click();
        const downloadEvent = page.waitForEvent("download");
        await page.locator("[data-export]").click();
        const download = await downloadEvent;
        const payload = JSON.parse(await fs.readFile(await download.path(), "utf8"));
        assert.equal(payload.progress.hints[1], 2);
        if (paper === 2) assert.equal(payload.progress.answers[1], "B");
        assert.match(await page.locator("#save-state").innerText(), /未能儲存/);
        await page.evaluate(() => {window.__failSave = false;});
        await page.locator('.primary-nav a[href="#find"]').click();
        await page.locator('[data-result="1"] [data-open]').click();
        await page.locator('[data-result="1"] [data-hint]').click();
        await page.reload();
        assert.equal((await savedProgress(page, paper)).hints[1], 3);
        if (paper === 2) assert.equal((await savedProgress(page, paper)).answers[1], "B");

        for (const width of [1440, 1056, 768, 390, 320]) {
          await page.setViewportSize({width, height: 892});
          await page.goto(`${base}/paper${paper}/?year=2026#find`);
          await stable(page);
          await noOverflow(page, `${paper}/find/${width}`);
          assert.equal(await page.locator(".resource-nav a:visible").count(), 4);
          assert.equal(await page.locator('.primary-nav > a[aria-current="page"]').count(), 1);
          if (width <= 600) {
            assert.equal(await page.locator(".topic-index").isVisible(), false);
            await page.locator("#topic-filter").selectOption({label: topic});
            assert.equal(await page.locator(".result").count(), topicCount);
            const longest = await page.evaluate(() => [...new Set(window.PILOT.questions.map(q => q.topic))].sort((a,b) => b.length-a.length)[0]);
            await page.locator("#topic-filter").selectOption({label: longest});
            assert.equal(await page.locator(".topic-value").innerText(), longest);
            assert.equal(await page.locator(".topic-value").evaluate(el => el.scrollWidth > el.clientWidth), false, "Full selected topic must fit");
            assert.equal(await page.evaluate(() => document.activeElement.id), "topic-filter");
          }
        }
        if (round === 1) {
          for (const width of [1056, 390]) {
            await page.setViewportSize({width, height: 892});
            for (const route of ["papers", "find", "topics", "years", "guide", "programs", "saved"]) {
              await page.goto(`${base}/paper${paper}/?year=2026#${route}`);
              if (route === "find") await page.reload();
              await stable(page);
              await noOverflow(page, `${paper}/${route}/${width}`);
              await page.screenshot({path: path.join(output, `paper${paper}-${route}-${width}.png`)});
            }
          }
        }
      }
      await context.close();
      assert.deepEqual(errors, []);
      console.log(`Round ${round}: topic filters, keyboard focus, inline support, saved progress, failed writes and backup, all widths passed.`);
    }
    const reduced = await browser.newContext({reducedMotion: "reduce", viewport: {width: 390, height: 844}});
    const page = await reduced.newPage();
    await page.goto(`${base}/paper1/?year=2026#find`);
    await page.locator("[data-open]").first().click();
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await page.locator('.primary-nav a[href="#papers"]').click();
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await reduced.close();
    console.log("Reduced-motion check passed. Evidence: output/playwright/orbit.");
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
