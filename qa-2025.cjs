const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const os=require("node:os");
const path=require("node:path");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const root=__dirname;
const base=(process.env.PREVIEW_URL||"http://127.0.0.1:4284").replace(/\/$/,"");
async function diagramLabelChecks(page,paper){
  for(const [number,label] of (paper===1?[[8,"N"]]:[[19,"L"],[38,"N"]])){
    const overlaps=await page.locator(`#question-${number} svg`).evaluate((svg,label)=>{
      const text=[...svg.querySelectorAll("text")].find(node=>node.textContent===label);
      if(!text)throw new Error(`Missing diagram label ${label}`);
      const style=getComputedStyle(text),context=document.createElement("canvas").getContext("2d");
      context.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics=context.measureText(label);
      const box={
        x:Number(text.getAttribute("x"))-metrics.actualBoundingBoxLeft,
        y:Number(text.getAttribute("y"))-metrics.actualBoundingBoxAscent,
        width:metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight,
        height:metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent
      },padding=2;
      return [...svg.querySelectorAll("path,circle")].flatMap((shape,index)=>{
        const length=shape.getTotalLength();
        for(let distance=0;distance<=length;distance+=.4){
          const point=shape.getPointAtLength(distance);
          if(point.x>=box.x-padding&&point.x<=box.x+box.width+padding&&
             point.y>=box.y-padding&&point.y<=box.y+box.height+padding)return [index];
        }
        return [];
      });
    },label);
    assert.deepEqual(overlaps,[],`Q${number}: ${label} overlaps a diagram line`);
  }
}
async function persistenceChecks(page,paper){
  const key=year=>`dse-original-pilot-paper${paper}-${year}-v2`;
  await page.locator("#question-1 [data-hint]").click();
  await page.locator("#question-1 [data-bookmark]").click();
  const before=await page.evaluate(key=>localStorage.getItem(key),key(2025));
  await page.locator("#mock-year").selectOption("2026");
  await page.waitForURL(/year=2026/);
  assert.match(await page.locator(".exam-title>span").innerText(),/2026/);
  assert.equal(await page.locator("#question-1 .hints li").count(),0);
  assert.equal(await page.locator(".feedback").count(),0);
  await page.locator("#question-2 [data-hint]").click();
  const legacy=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key(2026)));
  delete legacy.year;
  await page.locator("#mock-year").selectOption("2025");
  await page.waitForURL(/year=2025/);
  assert.equal(await page.locator("#question-1 .hints li").count(),1);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key(2025)),before);
  assert.ok((await page.locator(".other-paper").getAttribute("href")).includes("year=2025"));
  const pdfEvent=page.waitForEvent("download");
  await page.locator(".export-pdf").click();
  const pdf=await pdfEvent;
  assert.equal((await fs.readFile(await pdf.path())).subarray(0,5).toString(),"%PDF-");
  await page.goto(`${base}/paper${paper}/?year=2025#saved`);
  const downloadEvent=page.waitForEvent("download");
  await page.locator("[data-export]").click();
  const download=await downloadEvent;
  const backup=JSON.parse(await fs.readFile(await download.path(),"utf8"));
  assert.equal(backup.year,2025);assert.equal(backup.paper,paper);
  assert.ok(download.suggestedFilename().includes("2025"));
  const dialogs=[];
  page.on("dialog",async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
  const importData=async data=>page.locator("#import-file").setInputFiles({name:"test.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(data))});
  await importData({...backup,year:2026});
  await page.waitForFunction(()=>document.querySelector("#import-file").files.length===1);
  assert.ok(dialogs.at(-1).includes("無法匯入"));
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key(2025)),before);
  await importData({...backup,paper:paper===1?2:1});
  assert.ok(dialogs.at(-1).includes("無法匯入"));
  await page.evaluate(key=>localStorage.removeItem(key),key(2025));
  await page.reload();
  await importData(backup);
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).progress.saved.includes(1),key(2025));
  await page.locator("#mock-year").selectOption("2026");
  await page.waitForURL(/year=2026/);
  await importData(legacy);
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).progress.hints[2]===1,key(2026));
  assert.ok(dialogs.at(-1).includes("進度已匯入"));
  const old={...backup,progress:{...backup.progress,questionRevision:1,answers:{1:"A",12:"B"},checked:{1:true,12:true},hints:{1:1,12:2},saved:[1,12]}};
  await page.locator("#mock-year").selectOption("2025");
  await page.waitForURL(/year=2025/);
  await page.goto(`${base}/paper${paper}/?year=2025#saved`);
  await importData(old);
  const imported=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress,key(2025));
  assert.equal(imported.questionRevision,2);
  assert.deepEqual(imported.hints,{});
  assert.deepEqual(imported.saved,[1,12]);
  if(paper===2){assert.deepEqual(imported.answers,{});assert.deepEqual(imported.checked,{});}
  await page.evaluate(({key,old})=>localStorage.setItem(key,JSON.stringify(old)),{key:key(2025),old});
  await page.goto(`${base}/paper${paper}/?year=2025#practice`);
  assert.equal(await page.locator(".hints li,.feedback").count(),0);
  await page.locator("#question-2 [data-hint]").click();
  const loaded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress,key(2025));
  assert.equal(loaded.questionRevision,2);assert.deepEqual(loaded.hints,{"2":1});assert.deepEqual(loaded.saved,[1,12]);
  if(paper===2){assert.deepEqual(loaded.answers,{});assert.deepEqual(loaded.checked,{});}
  console.log(`P${paper}: year isolation, PDF download, backup round trip, cross-year/paper rejection, legacy 2026 import passed`);
}
(async()=>{
  const browser=await launchBrowser();
  try{
    await fs.mkdir(path.join(root,"tmp/qa-2025"),{recursive:true});
    for(const paper of [1,2]){
      const page=await browser.newPage({viewport:{width:1004,height:892}});
      const errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      const url=new URL(`${base}/paper${paper}/`);
      url.search="?year=2025";url.hash="practice";
      await page.goto(url.href);
      assert.equal(await page.locator(".exam-question").count(),paper===1?19:45);
      assert.match(await page.locator(".exam-title>span").innerText(),/2025/);
      assert.equal(await page.locator(".exam-question svg").count(),paper===1?2:9);
      if(paper===1){
        assert.deepEqual(await page.locator("#question-8 svg text").allTextContents(),["J","K","L","M","N"]);
        assert.deepEqual(await page.locator("#question-12 svg text").allTextContents(),["24","35","43","49","60"]);
        assert.equal(await page.locator("#question-12 .key").count(),0,"Q12 has no stem-and-leaf example line");
        assert.ok(!(await page.locator("#question-12").innerText()).match(/運動員|體重|訓練|kg/));
      }else{
        assert.equal(await page.locator("#question-3 .exam-stem .math-op").allTextContents().then(items=>items.filter(text=>text==="≡").length),1);
        assert.equal(await page.locator("#question-33 .exam-parts").count(),0,"A bracketed exponent is not a subquestion");
        assert.equal(await page.locator("#question-33 .exam-stem sup").innerText(),"b");
        const labels={14:["x","y","O","−2","2","K"],17:["J","K","L","M","N","P","Q","R"],18:["J","K","L","M"],19:["J","K","L","M","N","P","Q"],21:["J","K","L","M","N"],22:["J","K","L","M","N"],23:["J","K","L","M"],38:["J","L","K","M","N","R"]};
        for(const [n,expected] of Object.entries(labels))assert.deepEqual(await page.locator(`#question-${n} svg text`).allTextContents(),expected);
      }
      assert.equal(await page.locator(".print-answer-space:visible").count(),0);
      assert.ok((await page.locator("#question-1 .exam-stem .math-frac").getAttribute("aria-label")).startsWith("(("));
      for(const width of [1440,1004,390,320]){
        await page.setViewportSize({width,height:892});
        await page.evaluate(()=>document.fonts.ready);
        await diagramLabelChecks(page,paper);
        if(paper===1)await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
        else{
          await page.evaluate(()=>{
            for(const q of window.PILOT.questions){
              document.querySelector(`#question-${q.n} input[value="${q.answer}"]`).click();
              document.querySelector(`#question-${q.n} [data-check]`).click();
            }
          });
          assert.equal(await page.locator(".feedback.success").count(),45);
        }
        assert.ok(!/[橫縱横纵½]/.test(await page.locator(".practice-main").textContent()),"Coordinate vocabulary and half fractions must be consistent in questions and answers");
        const problems=await page.locator(".exam-stem,.exam-part p,.scheme-answer p,.options label,.feedback p,.exam-table,.stemleaf").evaluateAll(nodes=>nodes.filter(n=>{
          const article=n.closest("article"),box=n.getBoundingClientRect(),parent=article?.getBoundingClientRect();
          return n.scrollWidth>n.clientWidth+2||(parent&&(box.right>parent.right+2||box.left<parent.left-2));
        }).map(n=>({id:n.closest("article")?.id,text:n.textContent.slice(0,60),extra:n.scrollWidth-n.clientWidth})));
        console.log(`P${paper} width ${width}`,JSON.stringify(problems));
        assert.deepEqual(problems,[]);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
        for(const n of (paper===1?[1,8,9,12,18,19]:[3,14,15,17,19,21,22,26,29,34,38])){
          await page.locator(`#question-${n}`).screenshot({path:path.join(root,`tmp/qa-2025/p${paper}-q${n}-${width}.png`)});
        }
      }
      await page.setViewportSize({width:680,height:1000});
      await page.emulateMedia({media:"print"});
      await diagramLabelChecks(page,paper);
      const sizes=await page.locator(".exam-question").evaluateAll(nodes=>nodes.map(n=>({
        n:n.id,height:n.getBoundingClientRect().height,space:n.querySelector(".print-answer-space").getBoundingClientRect().height,
        stem:n.querySelector(".exam-stem").getBoundingClientRect().height,
        parts:n.querySelector(".exam-parts")?.getBoundingClientRect().height,
        diagram:n.querySelector(".diagram")?.getBoundingClientRect().height
      })));
      console.log(`Print P${paper}`,JSON.stringify(sizes));
      await page.screenshot({path:path.join(root,`tmp/qa-2025/print-p${paper}.png`),fullPage:true});
      assert.deepEqual(errors,[]);
      await page.emulateMedia({media:"screen"});
      await page.setViewportSize({width:1004,height:892});
      await persistenceChecks(page,paper);
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
