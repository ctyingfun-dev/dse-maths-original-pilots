const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const output = path.join(__dirname, "output/playwright/workspace");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4284";
const before = process.argv.includes("--before");

async function printSnapshot(page) {
  await page.emulateMedia({media:"print"});
  const snapshot = await page.locator(".practice-main,.exam-title,.exam-stem,.exam-section,.diagram svg,.diagram text,.math-frac,.print-answer-space").evaluateAll(elements => elements.map(el => {
    const css = getComputedStyle(el), rect = el.getBoundingClientRect();
    // Glass is a screen-only enhancement; compare the original print classes and rendered geometry.
    const printClass = String(el.className.baseVal ?? el.className).replace(/\bglass-surface\b/g, "").trim();
    return [el.tagName, printClass, css.color, css.backgroundColor, css.fontSize, css.fontFamily, css.display, rect.width, rect.height];
  }));
  await page.emulateMedia({media:"screen"});
  return snapshot;
}

(async () => {
  await fs.mkdir(output, {recursive:true});
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const paper of [1,2]) for (const year of [2018,2019,2020,2021,2022,2023,2024,2025,2026]) {
      await page.setViewportSize({width:1056,height:892});
      await page.goto(`${base}/paper${paper}/?year=${year}#practice`);
      if (!before && paper === 1) {
        const textPreserved = await page.evaluate(() => {
          const plain = text => {
            const element = document.createElement("p");
            element.innerHTML = window.mathText(text);
            return element.textContent.replace(/\s+/g, "");
          };
          const expected = window.PILOT.questions.flatMap(q => q.solution.flatMap(part => part.steps.map(step => step.text.map(plain).join(""))));
          return JSON.stringify(expected) === JSON.stringify([...document.querySelectorAll(".scheme-answer")].map(cell => cell.textContent.replace(/\s+/g, "")));
        });
        assert.ok(textPreserved, `Mathematical answer text changed in ${year}`);
      }
      const snapshot = await printSnapshot(page);
      const filename = path.join(output, `print-${paper}-${year}.json`);
      if (before) await fs.writeFile(filename, JSON.stringify(snapshot));
      else {
        const stylesheet = page.locator('link[href*="assets/workspace.css"]');
        await stylesheet.evaluate(link => {link.disabled=true;});
        assert.deepEqual(await printSnapshot(page), snapshot, "Screen stylesheet changed print layout");
        await stylesheet.evaluate(link => {link.disabled=false;});
        const baseline = await fs.readFile(filename, "utf8").catch(error => {
          if (error.code==="ENOENT") return null;
          throw error;
        });
        if (baseline) assert.deepEqual(snapshot, JSON.parse(baseline), "Print layout changed since baseline");
      }
      if (!before) for (const width of [1440,1056,768,390,320]) {
        await page.setViewportSize({width,height:892});
        await page.goto(`${base}/paper${paper}/?year=${year}#papers`);
        const clipped = await page.locator(".paper-part button").evaluateAll(buttons => buttons.filter(button => {
          const box=button.getBoundingClientRect(), topic=button.querySelector(".directory-topic").getBoundingClientRect();
          return topic.top < box.top || topic.bottom > box.bottom || topic.right > box.right || button.scrollWidth > button.clientWidth;
        }).map(button => button.getAttribute("aria-label")));
        assert.deepEqual(clipped, [], `Directory labels clipped at ${paper}/${year}/${width}`);
        const polar = await page.evaluate(() => window.PILOT.questions.filter(q=>window.pilotCurriculumNotice(q)).length);
        assert.equal(await page.locator(".paper-directory .curriculum-status").count(), polar);
      }
    }
    for (const width of [1440,1056,768,390,320]) for (const paper of [1,2]) {
      await page.setViewportSize({width,height:892});
      for (const route of ["papers","find","practice"]) {
        await page.goto(`${base}/paper${paper}/?year=2024#${route}`);
        await page.locator(".site-header").waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${paper}/${route}/${width} overflow`);
        if (!before && route==="papers") {
          assert.equal(await page.locator(".paper-part").count(), paper===1?3:2);
          assert.equal(await page.locator("[data-solo]").count(), paper===1?19:45);
          for (const button of await page.locator("[data-solo]").all()) {
            const box = await button.boundingBox();
            assert.ok(box.width>=40 && box.height>=42, "Question targets too small");
            assert.ok(await button.getAttribute("aria-label"), "Question target needs a name");
          }
          const first = await page.locator("[data-solo]").first().getAttribute("data-solo");
          await page.locator("[data-solo]").first().click();
          await page.locator(`article#question-${first}`).waitFor();
          assert.equal(await page.locator(`article#question-${first}`).count(), 1);
          await page.goto(`${base}/paper${paper}/?year=2024#papers`);
        }
        if (width===1056 || width===390) {
          await page.reload();
          await page.evaluate(() => document.fonts.ready);
          await page.mouse.move(0,0);
          await page.evaluate(() => scrollTo(0,0));
          await page.screenshot({path:path.join(output, `${before?"before":"after"}-${paper}-${route}-${width}.png`), fullPage:route==="papers"});
        }
      }
    }
    if (!before) {
      await page.setViewportSize({width:1056,height:892});
      await page.goto(`${base}/paper2/?year=2024#papers`);
      await page.locator("[data-start=timed]").click();
      await page.locator(".timer").waitFor();
      await page.locator('a[href="#papers"]').last().click();
      await page.locator("[data-resume]").click();
      await page.locator(".timer").waitFor();
      await page.goto(`${base}/paper2/?year=2024#find`);
      const expand = page.locator("[data-open]").first();
      await expand.click();
      assert.equal(await page.locator('[data-result="1"] .exam-stem').count(), 1);
      await page.locator('[data-result="1"] .options label').first().click();
      await page.locator('[data-result="1"] [data-check]').click();
      await page.goto(`${base}/paper2/?year=2024#papers`);
      assert.match(await page.locator(".paper-session").innerText(), /1\/45/);
      assert.equal(await page.locator(".paper-part .good,.paper-part .bad").count(), 1);
      assert.equal(await page.locator("progress").getAttribute("value"), "1");
    }
    assert.deepEqual(errors, []);
    console.log(before ? "Baseline screenshots and eighteen print snapshots saved." : "Workspace passed: nine years, both papers, five widths, navigation, progress, timing, no duplicated stem, eighteen print layouts isolated from screen CSS.");
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
