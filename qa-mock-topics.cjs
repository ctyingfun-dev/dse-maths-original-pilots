const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const {forQuestion} = require("./assets/topic-classification.js");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4284";
const years = Array.from({length:13},(_,i)=>2014+i);
const output = path.join(__dirname,"tmp/mock-topics");
const load = paper => {
  const context = {window:{}};
  for (const year of years) vm.runInNewContext(fs.readFileSync(`paper${paper}/data-${year}.js`,"utf8"),context);
  const catalog=JSON.parse(JSON.stringify(years.map(year=>year===2026?context.window.PILOT:context.window[`PILOT_${year}`])));
  for (const source of catalog) for (const q of source.questions) q.topics=forQuestion(q,source.year,paper);
  return catalog;
};
const part = (q,paper) => paper===1 ? q.n<=9?"A1":q.n<=14?"A2":"B" : q.n<=30?"A":"B";
const counts = questions => {
  const result = {};
  for (const q of questions) for (const topic of q.topics) result[topic]=(result[topic]||0)+1;
  return result;
};
async function displayedCounts(page) {
  return page.locator(".year-row").evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.querySelector("button").textContent,Number(row.querySelector("b").textContent)])));
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser = await launchBrowser();
  try {
    for (const paper of [1,2]) {
      const catalog = load(paper);
      const context = await browser.newContext({viewport:{width:1440,height:960}});
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror",error=>errors.push(error.message));
      await page.goto(`${base}/paper${paper}/?year=2015#topics`);
      assert.equal(await page.locator(".dse-summary strong").nth(1).textContent(),paper===1?"248":"585");
      assert.equal(await page.locator("#dse-topic-year option").count(),14);
      assert.equal(await page.evaluate(()=>window.DSE_TOPICS),undefined);
      const before = await page.evaluate(()=>JSON.stringify(localStorage));
      for (const source of catalog) {
        await page.goto(`${base}/paper${paper}/?year=2015#years?year=${source.year}`);
        await page.waitForFunction(year=>document.querySelector("#year-select")?.value===String(year),source.year);
        assert.deepEqual(await displayedCounts(page),counts(source.questions));
        for (const section of paper===1?["A1","A2","B"]:["A","B"]) {
          await page.locator(`[data-mock-section="${section}"]`).click();
          await page.waitForFunction(value=>document.querySelector(`[data-mock-section="${value}"]`)?.getAttribute("aria-pressed")==="true",section);
          assert.deepEqual(await displayedCounts(page),counts(source.questions.filter(q=>part(q,paper)===section)));
        }
        await page.locator('[data-mock-section="all"]').click();
        await page.waitForFunction(()=>document.querySelector('[data-mock-section="all"]')?.getAttribute("aria-pressed")==="true");
        const q = source.questions.find(q=>q.diagram)||source.questions[0];
        const selectedTopic=q.topics[0];
        await page.locator(`[data-year-topic="${selectedTopic}"]`).click();
        const expected = source.questions.filter(item=>item.topics.includes(selectedTopic));
        assert.equal(await page.locator(".mock-topic-question").count(),expected.length);
        assert.deepEqual(await page.locator(".mock-topic-question").evaluateAll(items=>items.map(item=>item.dataset.mockQuestion)),expected.map(item=>`${source.year}-${item.n}`));
        for (const item of expected) {
          const card=page.locator(`[data-mock-question="${source.year}-${item.n}"]`);
          assert.equal(await card.locator(".exam-stem").count(),1);
          assert.equal(await card.locator(".mock-topic-options li").count(),paper===2?4:0);
          assert.equal(await card.locator("input").count(),0,"Cross-year reading must not write answers to the selected year's storage");
          await card.locator("summary").click();
          assert.ok((await card.locator(".solution-steps").textContent()).length>20);
        }
        assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
        await page.goto(`${base}/paper${paper}/?year=${source.year}#find`);
        const indexCounts=await page.locator("[data-topic-filter]").evaluateAll(buttons=>Object.fromEntries(buttons.filter(b=>b.dataset.topicFilter!=="全部").map(b=>[b.dataset.topicFilter,Number(b.querySelector("small").textContent)])));
        assert.deepEqual(indexCounts,counts(source.questions),"Question bank must use the same shared classification");
        await page.locator(`[data-topic-filter="${selectedTopic}"]`).click();
        assert.deepEqual(await page.locator(".result").evaluateAll(items=>items.map(el=>Number(el.dataset.result))),expected.map(q=>q.n));
        await page.goto(`${base}/paper${paper}/?year=2015#topics`);
        assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
      }
      await page.goto(`${base}/paper${paper}/?year=2015#topics`);
      await page.locator("#dse-topic-search").fill("不存在的課題");
      assert.equal(await page.locator(".dse-row").count(),0);
      await page.locator("#dse-topic-search").fill("");
      await page.locator('[data-mock-page="2"]').click();
      await page.waitForFunction(()=>document.querySelector(".dse-pages span")?.textContent.startsWith("2"));
      const topic=await page.locator("[data-dse-topic]").first().textContent();
      const expected=catalog.flatMap(source=>source.questions.map(q=>({...q,year:source.year}))).filter(q=>q.topics.includes(topic));
      await page.locator("[data-dse-topic]").first().click();
      assert.equal(await page.locator(".mock-topic-question").count(),expected.length);
      await page.reload();
      assert.equal(await page.locator(".mock-topic-question").count(),expected.length);
      await page.locator("[data-mock-close]").click();
      assert.equal(await page.locator(".mock-topic-question").count(),0);
      assert.equal(await page.evaluate(()=>document.activeElement?.dataset.dseTopic),topic);
      await page.goBack();
      await page.locator(".mock-topic-question").first().waitFor();
      const link=page.locator(".mock-topic-question header a").first();
      const target=await link.getAttribute("href");
      await link.click();
      const targetYear=new URL(target,base).searchParams.get("year");
      const n=Number(target.split("question=")[1]);
      await page.locator(`#question-${n}`).waitFor();
      assert.equal(await page.locator(".exam-question").count(),1);
      assert.equal(await page.evaluate(()=>window.PILOT.year),Number(targetYear));
      assert.equal(await page.locator("#mock-year").inputValue(),targetYear);
      // A 2026 diagram must use the 2026 renderer even from a 2015 page.
      const diagramQuestion=catalog.at(-1).questions.find(q=>q.diagram);
      const topicHash=new URLSearchParams({year:"2026",topic:diagramQuestion.topics[0]});
      await page.goto(`${base}/paper${paper}/?year=2015#years?${topicHash}`);
      const actual=await page.locator(`[data-mock-question="2026-${diagramQuestion.n}"] .diagram`).first().innerHTML();
      await page.goto(`${base}/paper${paper}/?year=2026#practice?question=${diagramQuestion.n}`);
      assert.equal(await page.locator(".diagram").first().innerHTML(),actual);
      for (const width of [1440,390,320]) {
        await page.setViewportSize({width,height:900});
        await page.goto(`${base}/paper${paper}/?year=2015#years?${topicHash}`);
        const answer=page.locator(".mock-topic-question .worked-answer").first();
        if (!(await answer.evaluate(el=>el.open))) await answer.locator("summary").click();
        assert.equal(await answer.evaluate(el=>el.open),true);
        await page.evaluate(()=>document.fonts.ready);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
        await page.locator(".mock-topic-question").first().screenshot({path:path.join(output,`paper${paper}-${width}.png`)});
        const oldPrint=await page.locator(".mock-topic-question").first().boundingBox();
        await page.mouse.move(oldPrint.x+20,oldPrint.y+20);
        assert.equal(await page.locator("[data-glass-tilt]").count(),0);
        assert.equal(await page.locator(".mock-topic-detail").evaluate(el=>getComputedStyle(el).transform),"none");
        await page.goto(`${base}/paper${paper}/?year=2015#topics`);
        await page.waitForLoadState("networkidle");
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:path.join(output,`paper${paper}-overview-${width}.png`)});
      }
      if (paper===1) {
        const source=catalog.find(p=>p.year===2025),q=source.questions.find(q=>q.n===17);
        await page.goto(`${base}/paper1/?year=2015#years?${new URLSearchParams({year:"2025",topic:q.topics[0]})}`);
        const card=page.locator('[data-mock-question="2025-17"]');
        await card.locator("summary").click();
        assert.equal(await card.locator(".worked-answer").evaluate(el=>el.open),true);
        await card.screenshot({path:path.join(output,"paper1-2025-q17-320.png")});
      }
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`P${paper}: all 13 years' source counts/sections, full questions, cross-year diagrams, solutions, links, history, storage isolation and 3 widths passed.`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
