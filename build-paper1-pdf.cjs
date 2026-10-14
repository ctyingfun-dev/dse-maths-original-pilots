const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {pathToFileURL} = require("node:url");

let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}

async function main() {
  const output = path.join(__dirname, "output/pdf/dse-original-paper1-practice.pdf");
  const browser = await playwright.chromium.launch({channel:"msedge", headless:true});
  try {
    const page = await browser.newPage({viewport:{width:680, height:1000}});
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const url = pathToFileURL(path.join(__dirname, "paper1/index.html"));
    url.hash = "practice";
    await page.goto(url.href);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({media:"print"});

    const layout = await page.locator(".exam-question").evaluateAll(questions => questions.map(question => {
      const space = question.querySelector(".print-answer-space");
      return {
        number:question.id,
        height:question.getBoundingClientRect().height,
        answerHeight:space.getBoundingClientRect().height,
        overflow:question.scrollWidth - question.clientWidth,
        solutionHidden:getComputedStyle(question.querySelector(".worked-answer")).display === "none"
      };
    }));
    assert.equal(layout.length, 19);
    assert.deepEqual(errors, []);
    for (const question of layout) {
      assert.ok(question.answerHeight >= 35*96/25.4, `${question.number}: insufficient writing space`);
      assert.ok(question.height <= 257*96/25.4, `${question.number}: taller than an A4 page`);
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
      footerTemplate:'<div style="font:10px serif;width:100%;text-align:center;color:#333"><span class="pageNumber"></span></div>',
      tagged:true
    });
    console.log(JSON.stringify({output, questions:layout.length, writingSpaceMm:layout.map(q=>Math.round(q.answerHeight*25.4/96))}, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => {console.error(error); process.exitCode=1;});
