const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const output = path.join(__dirname, "tmp/curriculum-20261016");
const expectedPolar = (year,paper) => {
  if(year===2015) return require('./scripts/source-expectations-2015.cjs')[paper].polar;
  if(year===2016 || year===2017) return require('./scripts/source-expectations-2016-2017.cjs')[year][paper].polar;
  if(year===2018) return require('./qa-2018.cjs').sourceExpectation[paper].polar;
  return paper===1 && [2021,2024].includes(year) ? [7] : paper===2 && [2020,2022,2023,2025].includes(year) ? [24] : [];
};

(async () => {
  await fs.mkdir(output, {recursive:true});
  const browser = await launchBrowser();
  try {
    for (const paper of [1,2]) for (const year of [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${base}/paper${paper}/?year=${year}#practice`);
      const expected = expectedPolar(year,paper);
      assert.deepEqual(await page.evaluate(() => window.PILOT.questions.filter(q=>window.pilotCurriculumNotice(q)).map(q=>q.n)), expected);
      assert.equal(await page.evaluate(() => ["極坐標", "極座標", "極徑及極角", "Polar coordinates"].every(topic=>window.pilotCurriculumNotice({topic}))), true);
      assert.equal(await page.evaluate(() => window.pilotCurriculumNotice({topic:"直角坐標與多項式"})), "");
      for (const width of [1440,1056,390,320]) {
        await page.setViewportSize({width,height:892});
        for (const route of ["practice","find"]) {
          await page.goto(`${base}/paper${paper}/?year=${year}#${route}`);
          await page.locator(".exam-stem").first().waitFor();
          const selector = route==="practice" ? ".exam-question" : ".result";
          assert.equal(await page.locator(`${selector} .curriculum-status`).count(), expected.length);
          for (const n of expected) {
            const row = page.locator(route==="practice" ? `#question-${n}` : `[data-result="${n}"]`);
            assert.equal(await row.locator(".exam-stem .curriculum-status").textContent(), "已取消");
            assert.equal(await row.locator(".exam-stem").count(), 1);
            const bounds = await row.locator(".curriculum-status").evaluate(el => {
              const a=el.getBoundingClientRect(), b=el.closest(".exam-content,.result-prompt").getBoundingClientRect();
              return {inside:a.left>=b.left && a.right<=b.right, width:a.width, height:a.height};
            });
            assert.ok(bounds.inside && bounds.width>0 && bounds.height>0);
            if (route==="find") {
              await row.locator("[data-open]").click();
              assert.equal(await row.locator(".curriculum-status").count(), 1, "Expanding must not duplicate the label or question");
            }
            if ([1056,390].includes(width) && route==="practice") {
              await row.screenshot({path:path.join(output, `p${paper}-${year}-q${n}-${width}.png`)});
            }
          }
          if (paper===1 && year===2024) {
            const row=page.locator(route==="practice" ? "#question-11" : '[data-result="11"]');
            assert.match(await row.textContent(), /求\s*c\s*及\s*d。/);
            assert.doesNotMatch(await row.textContent(), /有序數對/);
            if (width===1056 && route==="practice") await row.screenshot({path:path.join(output, "p1-2024-q11.png")});
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth+1), false);
        }
      }
      if (expected.length) {
        await page.goto(`${base}/paper${paper}/?year=${year}#guide`);
        assert.equal(await page.locator(".guide-list summary .curriculum-status").count(), 1);
        await page.goto(`${base}/paper${paper}/?year=${year}#practice`);
        await page.locator(`#question-${expected[0]} [data-bookmark]`).click();
        await page.goto(`${base}/paper${paper}/?year=${year}#saved`);
        assert.equal(await page.locator(".compact-list .curriculum-status").count(), 1);
        const topic=paper===1 ? "極坐標" : "坐標幾何";
        await page.goto(`${base}/paper${paper}/?year=${year}#years?year=${year}&section=all`);
        await page.locator(`[data-year-topic="${topic}"]`).click();
        assert.ok(await page.locator(".year-detail .curriculum-status").count()>0);
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`P${paper} ${year}: wording, automatic polar labels, single question display and four widths passed.`);
    }
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
