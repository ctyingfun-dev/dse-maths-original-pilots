const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const base=process.env.PREVIEW_URL||"http://127.0.0.1:4284";
const output=path.join(__dirname,"tmp/qa-marking-layout");
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const browser=await launchBrowser();
  try {
    const page=await browser.newPage();
    for(const paper of [1,2]) for(const year of [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]) {
      await page.goto(`${base}/paper${paper}/?year=${year}#practice`);
      if(paper===1) for(const media of ["screen","print"]) {
        await page.emulateMedia({media});
        const marks=await page.locator(".exam-question").evaluateAll(nodes=>nodes.map(node=>{
          const items=[...node.querySelectorAll(".exam-content .exam-part-marks,.exam-content .exam-marks")].filter(item=>item.getClientRects().length);
          const q=window.PILOT.questions.find(q=>node.id===`question-${q.n}`);
          return {n:q.n,total:items.reduce((sum,item)=>sum+Number(item.textContent.match(/\d+/)[0]),0),expected:q.marks,
            repeated:items.some(item=>item.classList.contains("exam-part-marks"))&&items.some(item=>item.classList.contains("exam-marks"))};
        }));
        assert.deepEqual(marks.filter(q=>q.total!==q.expected||q.repeated),[],`${year} ${media}: marks must appear exactly once`);
      }
      await page.emulateMedia({media:"screen"});
      if(paper===1) await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
      else await page.evaluate(()=>{
        for(const q of window.PILOT.questions) {
          document.querySelector(`#question-${q.n} input[value="${q.answer}"]`).click();
          document.querySelector(`#question-${q.n} [data-check]`).click();
        }
      });
      for(const width of [1440,691,455,390,320]) {
        await page.setViewportSize({width,height:892});
        await page.evaluate(()=>document.fonts.ready);
        const issues=await page.evaluate(()=>{
          const errors=[];
          if(document.querySelector(".equation-left,.equation-relation,.equation-right")) errors.push({type:"unwanted-equals-alignment"});
          for(const group of document.querySelectorAll(".solution-calculation")) {
            const xs=[...group.querySelectorAll(".solution-equation")].map(n=>n.getBoundingClientRect().x);
            if(Math.max(...xs)-Math.min(...xs)>1) errors.push({type:"not-left-aligned",text:group.textContent});
          }
          for(const node of document.querySelectorAll(".math-root mtext")) {
            if(getComputedStyle(node).whiteSpace!=="nowrap") errors.push({type:"root-wrap",text:node.textContent});
            const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
            while(walker.nextNode()) {
              const range=document.createRange();range.selectNodeContents(walker.currentNode);
              if(range.getClientRects().length>1) errors.push({type:"root-line-break",text:walker.currentNode.textContent});
            }
            const content=node.querySelector(":scope > .math-radicand");
            if(!content) errors.push({type:"missing-root-container",text:node.textContent});
            else if(!content.querySelector(".math-frac,.math-root") && content.getBoundingClientRect().height>parseFloat(getComputedStyle(content).fontSize)*2) errors.push({type:"stacked-root",text:node.textContent});
          }
          for(const node of document.querySelectorAll(".math-frac>span")) {
            if(node.scrollWidth>node.clientWidth+2) errors.push({type:"fraction-overflow",text:node.textContent});
          }
          return errors;
        });
        assert.deepEqual(issues,[],`${year} P${paper} ${width}`);
        if(paper===1&&[2023,2025].includes(year)&&[691,455,320].includes(width)) {
          const n=year===2023?19:17;
          await page.locator(`#question-${n} .solution-steps`).screenshot({path:path.join(output,`${year}-p${paper}-q${n}-${width}.png`)});
        }
        if(paper===1&&year===2025&&[691,455,320].includes(width)) {
          const proof=page.locator("#question-8 .solution-steps");
          assert.match(await proof.textContent(),/（ASA）/);
          assert.doesNotMatch((await proof.locator("var").allTextContents()).join(" "),/SAS|SSS|ASA|AAS|RHS/);
          await proof.screenshot({path:path.join(output,`2025-p1-q8-${width}.png`)});
        }
      }
      console.log(`${year} P${paper}: left-aligned steps and unbroken radicals/fractions at five widths.`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
