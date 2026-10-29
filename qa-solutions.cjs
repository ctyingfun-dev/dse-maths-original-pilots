const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const base=process.env.PREVIEW_URL||"http://127.0.0.1:4284";
const output=path.join(__dirname,"tmp/qa-solutions");
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const browser=await launchBrowser();
  try {
    const page=await browser.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    for(const paper of [1,2]) for(const year of [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]) {
      await page.goto(`${base}/paper${paper}/?year=${year}#practice`);
      if(paper===1) await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
      else await page.evaluate(()=>{
        for(const q of window.PILOT.questions) {
          document.querySelector(`#question-${q.n} input[value="${q.answer}"]`).click();
          document.querySelector(`#question-${q.n} [data-check]`).click();
        }
      });
      const check=await page.evaluate(()=>{
        const plain=text=>{
          const element=document.createElement("div");
          element.innerHTML=window.mathText(text);
          return element.textContent.replace(/\s+/g,"");
        };
        return window.PILOT.questions.map(q=>{
          const selector=window.PILOT.paper===1?".scheme-answer p":".solution-steps p";
          const lines=[...document.querySelectorAll(`#question-${q.n} ${selector}`)];
          const source=window.PILOT.paper===1?q.solution.flatMap(p=>p.steps.flatMap(s=>s.text)):[q.solution];
          return {n:q.n,preserved:source.map(plain).join("")===lines.map(n=>n.textContent.replace(/\s+/g,"")).join(""),
            lines:lines.length,expected:(window.PILOT.paper===1?q.solution.flatMap(p=>p.steps.map(s=>s.text)):[q.solution]).flatMap(window.solutionLayout).reduce((sum,b)=>sum+(b.type==="text"?1:b.rows.length),0),
            marks:[...document.querySelectorAll(`#question-${q.n} .scheme-score`)].reduce((s,n)=>s+parseInt(n.textContent,10),0),total:q.marks};
        });
      });
      assert.ok(check.every(q=>q.preserved),JSON.stringify(check.filter(q=>!q.preserved)));
      assert.ok(check.every(q=>q.lines===q.expected));
      if(paper===1) assert.ok(check.every(q=>q.marks===q.total));
      else assert.equal(await page.locator(".feedback.success").count(),45);
      for(const width of [1440,1056,768,691,455,390,320]) {
        await page.setViewportSize({width,height:892});
        await page.evaluate(()=>document.fonts.ready);
        const overflow=await page.locator(".scheme-answer p,.scheme-score,.solution-steps p,.math-root").evaluateAll(nodes=>nodes.filter(n=>n.clientWidth && n.scrollWidth>n.clientWidth+2 && ![n,n.closest(".solution-calculation")].some(parent=>parent && getComputedStyle(parent).overflowX==="auto")).map(n=>({q:n.closest("article")?.id,text:n.textContent})));
        assert.deepEqual(overflow,[],`${year} P${paper} ${width}`);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        if(year===2025&&[1056,390].includes(width)) for(const n of paper===1?[8,14,18,19]:[8,36,40,45]) {
          await page.locator(`#question-${n} .solution-steps`).screenshot({path:path.join(output,`2025-p${paper}-q${n}-${width}.png`)});
        }
      }
      console.log(`${year} P${paper}: all original solution text and marks preserved; ${check.reduce((s,q)=>s+q.lines,0)} readable lines; seven widths passed.`);
    }
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
