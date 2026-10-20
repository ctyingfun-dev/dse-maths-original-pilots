const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const base=(process.env.PREVIEW_URL||"http://127.0.0.1:4284").replace(/\/$/,"");
const output=path.join(__dirname,"tmp/qa-2023");

async function labelChecks(page) {
  const issues=await page.locator(".exam-question .diagram svg").evaluateAll(svgs=>svgs.flatMap(svg=>{
    const view=svg.viewBox.baseVal,issues=[],boxes=[];
    for(const text of svg.querySelectorAll("text")) {
      const b=text.getBBox(),label=text.textContent,number=svg.closest("article").id;
      if(b.x<view.x||b.y<view.y||b.x+b.width>view.x+view.width||b.y+b.height>view.y+view.height) issues.push({number,label,kind:"clipped"});
      for(const old of boxes) if(b.x<old.x+old.width&&old.x<b.x+b.width&&b.y<old.y+old.height&&old.y<b.y+b.height)issues.push({number,label,other:old.label,kind:"text overlap"});
      boxes.push({x:b.x,y:b.y,width:b.width,height:b.height,label});
      if(!/^[A-Za-zαβθ]$/.test(label)) continue;
      const style=getComputedStyle(text),context=document.createElement("canvas").getContext("2d");
      context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m=context.measureText(label),x=+text.getAttribute("x")-m.actualBoundingBoxLeft,y=+text.getAttribute("y")-m.actualBoundingBoxAscent,w=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,h=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
      for(const shape of svg.querySelectorAll("path,circle")) {
        const length=shape.getTotalLength();
        for(let t=0;t<=length;t+=.5) {
          const p=shape.getPointAtLength(t);
          if(p.x>=x-1&&p.x<=x+w+1&&p.y>=y-1&&p.y<=y+h+1){issues.push({number,label,kind:"line overlap"});break;}
        }
      }
    }
    return issues;
  }));
  for(const number of new Set(issues.map(issue=>issue.number))) await page.locator(`#${number} .diagram svg`).screenshot({path:path.join(output,`label-issue-${number}.png`)});
  assert.deepEqual(issues,[]);
}

(async()=>{
  await fs.mkdir(output,{recursive:true});
  const browser=await launchBrowser();
  try {
    for(const paper of [1,2]) {
      const context=await browser.newContext(),page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      page.on("response",r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      await page.goto(`${base}/paper${paper}/?year=2023#practice`);
      assert.equal(await page.evaluate(()=>window.PILOT.year),2023);
      assert.equal(await page.locator(".exam-question").count(),paper===1?19:45);
      assert.equal(await page.locator(".diagram svg").count(),paper===1?3:9);
      assert.equal(await page.locator(".key,textarea").count(),0);
      assert.equal(await page.locator(".curriculum-status").count(),paper===1?0:1);
      if(paper===1) {
        assert.equal(await page.locator("[data-check],input[type=radio]").count(),0);
        await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
        assert.equal(await page.locator("#question-18 .exam-part sub var").count(),2);
      } else {
        await page.evaluate(()=>{
          for(const q of window.PILOT.questions) {
            document.querySelector(`#question-${q.n} input[value="${q.answer}"]`).click();
            document.querySelector(`#question-${q.n} [data-check]`).click();
          }
        });
        assert.equal(await page.locator(".feedback.success").count(),45);
      }
      for(const width of [1440,1056,768,390,320]) {
        await page.setViewportSize({width,height:892});
        await page.evaluate(()=>document.fonts.ready);
        await labelChecks(page);
        const overflow=await page.locator(".exam-stem,.exam-part p,.scheme-answer p,.scheme-score,.options label,.feedback p,.exam-table,.stemleaf").evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>({n:n.closest("article")?.id,text:n.textContent.slice(0,70)})));
        assert.deepEqual(overflow,[]);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        assert.equal(await page.locator(".print-answer-space:visible").count(),0);
        if([1056,390].includes(width)) {
          await page.evaluate(()=>scrollTo(0,0));
          await page.screenshot({path:path.join(output,`p${paper}-overview-${width}.png`)});
          for(const item of await page.locator(".exam-question:has(.diagram svg)").all()) await item.locator(".diagram svg").screenshot({path:path.join(output,`p${paper}-${await item.getAttribute("id")}-${width}.png`)});
          if(paper===1)for(const n of [2,11,14,18,19]) await page.locator(`#question-${n}`).screenshot({path:path.join(output,`p1-q${n}-solution-${width}.png`)});
        }
      }
      await page.locator("#question-1 [data-hint]").click();
      await page.locator("#question-1 [data-bookmark]").click();
      const key=year=>`dse-original-pilot-paper${paper}-${year}-v2`;
      const before=await page.evaluate(key=>localStorage.getItem(key),key(2023));
      for(const year of [2024,2025,2026]) {
        await page.locator("#mock-year").selectOption(String(year));
        await page.waitForURL(new RegExp(`year=${year}`));
        assert.equal(await page.evaluate(()=>window.PILOT.year),year);
        assert.equal(await page.locator("#question-1 .hints li").count(),0);
        assert.equal(await page.locator(".feedback").count(),0);
      }
      await page.locator("#mock-year").selectOption("2023");
      await page.waitForURL(/year=2023/);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),key(2023)),before);
      assert.match(await page.locator(".other-paper").getAttribute("href"),/year=2023/);
      if(!process.argv.includes("--layout-only")) {
        const downloadEvent=page.waitForEvent("download");
        await page.locator(".export-pdf").click();
        const pdf=await downloadEvent;
        assert.equal(pdf.suggestedFilename(),`dse-original-2023-paper${paper}-practice.pdf`);
        assert.equal((await fs.readFile(await pdf.path())).subarray(0,5).toString(),"%PDF-");
      }
      await page.goto(`${base}/paper${paper}/?year=2023#saved`);
      const backupEvent=page.waitForEvent("download");
      await page.locator("[data-export]").click();
      const backup=JSON.parse(await fs.readFile(await (await backupEvent).path(),"utf8"));
      assert.equal(backup.year,2023);
      assert.equal(backup.paper,paper);
      const dialogs=[];
      page.on("dialog",async d=>{dialogs.push(d.message());await d.accept();});
      const importData=data=>page.locator("#import-file").setInputFiles({name:"test.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(data))});
      for(const altered of [{...backup,year:2025},{...backup,paper:paper===1?2:1},{...backup,year:undefined}]) {
        const rejected=page.waitForEvent("dialog");
        await importData(altered);
        assert.match((await rejected).message(),/無法匯入/);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key(2023)),before);
      }
      await page.evaluate(key=>localStorage.removeItem(key),key(2023));
      await page.reload();
      await importData(backup);
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).progress.saved.includes(1),key(2023));
      await page.goto(`${base}/paper${paper}/?year=2023#find`);
      for(const button of await page.locator("[data-open]").all()) await button.click();
      assert.equal(await page.locator(".result").count(),paper===1?19:45);
      assert.ok(await page.locator(".result").evaluateAll(nodes=>nodes.every(n=>n.querySelectorAll(".exam-stem").length===1)));
      assert.equal(await page.locator(".result .curriculum-status").count(),paper===1?0:1);
      if(paper===2) {
        const wrong=await page.evaluate(()=>"ABCD".split("").find(a=>a!==window.PILOT.questions[0].answer));
        await page.locator(`[data-result="1"] input[value="${wrong}"]`).check();
        await page.locator('[data-result="1"] [data-check]').click();
        assert.equal(await page.locator('[data-result="1"] .feedback.error').count(),1);
      }
      for(const query of ["","?year=2022"]) {
        await page.goto(`${base}/paper${paper}/${query}#papers`);
        assert.equal(await page.evaluate(()=>window.PILOT.year),2026);
      }
      assert.deepEqual(errors,[]);
      console.log(`2023 P${paper}: solutions/grading, 5 widths, SVG labels, single stems, isolated progress, backups, fallback and PDF download passed.`);
      await context.close();
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
