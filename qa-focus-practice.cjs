const assert=require("node:assert/strict");
const path=require("node:path");
const fs=require("node:fs/promises");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const base=process.env.PREVIEW_URL||"http://127.0.0.1:4284";
(async()=>{
  const browser=await launchBrowser();
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1024}});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    for(let year=2014;year<=2026;year++) {
      await page.goto(`${base}/paper1/?year=${year}#papers`);
      const questions=await page.locator("[data-solo]").evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.solo)));
      for(const width of [1440,320]) {
        await page.setViewportSize({width,height:900});
        for(const n of questions) {
          await page.goto(`${base}/paper1/?year=${year}#practice?question=${n}`);
          const article=page.locator(`#question-${n}`);
          assert.equal(await page.locator(".focus-question:visible").count(),1);
          await article.locator(".worked-answer summary").click();
          assert.ok(await article.locator(".scheme-answer").count()>0);
          const invalid=await article.locator("var").evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).fontStyle!=="italic"||!getComputedStyle(node).fontFamily.startsWith('"Times New Roman"')).map(node=>node.textContent));
          assert.deepEqual(invalid,[],`${year}/${n}/${width}: variable typography`);
          const overflow=await article.locator(".exam-stem,.scheme-answer p,.scheme-score,.diagram").evaluateAll(nodes=>nodes.filter(node=>node.clientWidth&&node.scrollWidth>node.clientWidth+2&&![node,node.closest(".solution-calculation")].some(parent=>parent&&getComputedStyle(parent).overflowX==="auto")).map(node=>node.textContent.slice(0,80)));
          assert.deepEqual(overflow,[],`${year}/${n}/${width}: question or solution clipped`);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        }
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${base}/paper1/?year=2026#papers`);
    await page.locator("#directory-query").fill("1");
    assert.ok(await page.locator("[data-solo]").count()<19);
    await page.locator("#directory-query").fill("");
    await page.locator("[data-solo='1']").click();
    await page.locator("[data-complete]").click();
    await page.reload();
    assert.equal(await page.locator("[data-complete]").getAttribute("aria-pressed"),"true");
    await page.locator("#question-1 [data-hint]").click();
    assert.equal(await page.locator("#question-1 .hints li").count(),1);
    await page.locator("#question-1 [data-bookmark]").click();
    await page.locator("[data-focus-step='1']").click();
    await page.locator("#question-2").waitFor({state:"visible"});
    await page.locator("[data-back]").click();
    await page.locator("#directory-progress").selectOption("done");
    assert.equal(await page.locator("[data-solo]").count(),1);
    await page.locator("#directory-progress").selectOption("saved");
    assert.equal(await page.locator("[data-solo]").count(),1);
    await page.locator(".mobile-menu-toggle").click();
    assert.ok(await page.locator("#mobile-navigation").isVisible());
    await page.locator("#mobile-navigation a[href='#topics']").click();
    assert.equal(await page.locator("#mobile-navigation").isVisible(),false);
    await page.locator(".dse-summary").waitFor();
    await page.locator(".mobile-menu-toggle").click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(()=>document.querySelector(".mobile-menu-toggle").getAttribute("aria-expanded")==="false");
    assert.equal(await page.locator(".mobile-menu-toggle").getAttribute("aria-expanded"),"false");
    await page.goto(`${base}/paper1/?year=2025#papers`);
    assert.match(await page.locator(".paper-session").innerText(),/已完成 0/);
    await page.goto(`${base}/paper1/?year=2026#practice?question=1`);
    await page.locator("#question-1 .worked-answer summary").click();
    await fs.mkdir(path.join(__dirname,"output/playwright/ice-blue"),{recursive:true});
    await page.screenshot({path:path.join(__dirname,"output/playwright/ice-blue/mobile-solution.png"),fullPage:true});
    await page.setViewportSize({width:1440,height:1024});
    await page.screenshot({path:path.join(__dirname,"output/playwright/ice-blue/desktop-practice.png"),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log("Focus practice passed: all 248 questions at desktop/mobile, solutions, italic Times variables, filtering, completion persistence, hint, bookmark, next, year isolation and accessible mobile menu.");
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
