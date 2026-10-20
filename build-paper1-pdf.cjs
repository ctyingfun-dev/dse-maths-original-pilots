const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {pathToFileURL} = require("node:url");

const {launchBrowser} = require("./scripts/browser-runtime.cjs");

async function main() {
  const year=Number(process.argv[2] || 2026);
  const paper=Number(process.argv[3] || 1);
  assert.ok([2023,2024,2025,2026].includes(year) && [1,2].includes(paper));
  assert.ok(paper===1 || year!==2026, "This MC paper has no writing-space print layout");
  const output = path.join(__dirname, `output/pdf/dse-original-${year!==2026?`${year}-`:""}paper${paper}-practice.pdf`);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({viewport:{width:680, height:1000}});
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const url = pathToFileURL(path.join(__dirname, `paper${paper}/index.html`));
    if(year!==2026) url.search=`?year=${year}`;
    url.hash = "practice";
    await page.goto(url.href);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({media:"print"});

    const layout = await page.locator(".exam-question").evaluateAll(questions => questions.map(question => {
      const spaces = [...question.querySelectorAll(".print-answer-space")];
      const segments = [...question.querySelectorAll(".print-segment")];
      return {
        number:question.id,
        height:question.getBoundingClientRect().height,
        answerHeight:Math.min(...spaces.map(space=>space.getBoundingClientRect().height)),
        segmentHeights:(segments.length?segments:[question]).map(segment=>segment.getBoundingClientRect().height),
        overflow:question.scrollWidth - question.clientWidth,
        solutionHidden:!question.querySelector(".worked-answer") || getComputedStyle(question.querySelector(".worked-answer")).display === "none"
      };
    }));
    assert.equal(layout.length, paper===1?19:45);
    assert.deepEqual(errors, []);
    for (const question of layout) {
      assert.ok(question.answerHeight >= 35*96/25.4, `${question.number}: insufficient writing space`);
      assert.ok(question.segmentHeights.every(height=>height <= 257*96/25.4), `${question.number}: unbreakable segment taller than an A4 page`);
      assert.ok(question.overflow <= 2, `${question.number}: content overflow`);
      assert.ok(question.solutionHidden, `${question.number}: reference solution visible`);
    }
    await fs.mkdir(path.dirname(output), {recursive:true});
    await page.pdf({
      path:output,
      format:"A4",
      preferCSSPageSize:true,
      printBackground:false,
      displayHeaderFooter:true,
      headerTemplate:"<span></span>",
      footerTemplate:`<div style="font:10px 'Times New Roman',serif;width:100%;text-align:center;color:#333"><span class="pageNumber"></span></div>`,
      tagged:true
    });
    console.log(JSON.stringify({output, questions:layout.length, writingSpaceMm:layout.map(q=>Math.round(q.answerHeight*25.4/96))}, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => {console.error(error); process.exitCode=1;});
