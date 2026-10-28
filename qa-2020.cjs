const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const base=(process.env.PREVIEW_URL||"http://127.0.0.1:4284").replace(/\/$/,"");
const output=path.join(__dirname,"tmp/integration-2020");
const years=[2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];
const widths=[1440,1056,768,390,320];
const paperFlag=process.argv.indexOf("--paper");
const papers=paperFlag<0?[1,2]:[Number(process.argv[paperFlag+1])];
const layoutOnly=process.argv.includes("--layout-only");
assert.ok(papers.every(paper=>[1,2].includes(paper)),"Use --paper 1 or --paper 2");

async function checkLayout(page,paper,width) {
  await page.setViewportSize({width,height:892});
  await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.locator(".exam-stem,.exam-part p,.scheme-answer p,.scheme-score,.options label,.feedback p,.exam-table,.stemleaf").evaluateAll(nodes=>nodes.filter(node=>
    node.clientWidth && node.scrollWidth>node.clientWidth+2 &&
    ![node,node.closest(".solution-calculation")].some(parent=>parent&&getComputedStyle(parent).overflowX==="auto")
  ).map(node=>({question:node.closest("article")?.id,text:node.textContent.slice(0,100)})));
  assert.deepEqual(overflow,[],`2020 P${paper}: overflow at ${width}px`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await page.locator(".print-answer-space:visible").count(),0);
  if([1056,390].includes(width)) {
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(output,`p${paper}-overview-${width}.png`)});
  }
}

async function checkMarks(page) {
  for(const media of ["screen","print"]) {
    await page.emulateMedia({media});
    const marks=await page.locator(".exam-question").evaluateAll(nodes=>nodes.map(node=>{
      const q=window.PILOT.questions.find(q=>node.id===`question-${q.n}`);
      const visible=[...node.querySelectorAll(".exam-content .exam-part-marks,.exam-content .exam-marks")].filter(n=>n.getClientRects().length);
      return {n:q.n,expected:q.marks,total:visible.reduce((sum,n)=>sum+Number(n.textContent.match(/\d+/)?.[0]),0),
        repeated:visible.some(n=>n.classList.contains("exam-part-marks"))&&visible.some(n=>n.classList.contains("exam-marks"))};
    }));
    assert.deepEqual(marks.filter(q=>q.total!==q.expected||q.repeated),[],`${media}: marks must appear exactly once`);
  }
  await page.emulateMedia({media:"screen"});
}

(async()=>{
  await fs.mkdir(output,{recursive:true});
  const browser=await launchBrowser();
  try {
    for(const paper of papers) {
      const context=await browser.newContext(),page=await context.newPage(),errors=[];
      const key=`dse-original-pilot-paper${paper}-2020-v2`;
      const polarQuestions=paper===1?[]:[24];
      page.on("pageerror",error=>errors.push(error.message));
      page.on("response",response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
      page.on("dialog",dialog=>dialog.accept());
      try {
        await page.goto(`${base}/paper${paper}/?year=2020#practice`);
        assert.equal(await page.evaluate(()=>window.PILOT.year),2020);
        assert.equal(await page.evaluate(()=>window.PILOT.paper),paper);
        assert.equal(await page.locator("#mock-year").inputValue(),"2020");
        assert.deepEqual(await page.locator("#mock-year option").evaluateAll(nodes=>nodes.map(n=>Number(n.value))),years);
        const metadata=await page.evaluate(()=>({
          numbers:window.PILOT.questions.map(q=>q.n),
          sections:window.PILOT.questions.reduce((counts,q)=>(counts[q.section]=(counts[q.section]||0)+1,counts),{}),
          polar:window.PILOT.questions.filter(q=>window.pilotCurriculumNotice(q)).map(q=>q.n)
        }));
        assert.deepEqual(metadata.numbers,Array.from({length:paper===1?19:45},(_,i)=>i+1));
        assert.deepEqual(Object.values(metadata.sections),paper===1?[9,5,5]:[30,15]);
        assert.deepEqual(metadata.polar,polarQuestions);
        assert.equal(await page.locator(".exam-question").count(),paper===1?19:45);
        assert.equal(await page.locator(".key,textarea").count(),0);
        assert.deepEqual(await page.locator(".exam-question .curriculum-status").evaluateAll(nodes=>nodes.map(n=>Number(n.closest("article").id.replace("question-","")))),polarQuestions);

        // Give every other year/paper real progress to detect overwrites and migration leakage.
        const protectedProgress=await page.evaluate(({years,paper})=>{
          const result={};
          for(const year of years) for(const otherPaper of [1,2]) {
            if(year===2020&&otherPaper===paper)continue;
            const key=`dse-original-pilot-paper${otherPaper}-${year}-v2`;
            const questionRevision=otherPaper===1?([2016,2017,2018,2019,2020,2021,2022,2023].includes(year)?1:2):([2016,2017,2018,2019,2020,2021,2023,2024].includes(year)?1:[2022,2025].includes(year)?2:5);
            const value=JSON.stringify({schema:2,paper:otherPaper,year,progress:{answers:{},checked:{},hints:{1:1},saved:[2],questionRevision,startedAt:null,deadline:null,mode:"untimed",finished:false}});
            localStorage.setItem(key,value);
            result[key]=value;
          }
          return result;
        },{years,paper});
        const assertProtected=async()=>assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(protectedProgress)),protectedProgress,"Another year/paper's progress changed");

        const diagrams=await page.evaluate(()=>window.PILOT.questions.flatMap(q=>[q.diagram,...Object.values(q.partDiagrams||{})].filter(Boolean).map(spec=>({n:q.n,kind:typeof spec==="string"?spec:spec.type}))).filter(item=>item.kind.endsWith("2020")).map(item=>({...item,html:window.pilotDiagram2020(item.kind)})));
        for(const {n,kind,html} of diagrams) {
          assert.match(html,/<(?:svg|table)\b/,`Q${n}: ${kind} has no drawing/table`);
        }
        assert.equal(await page.locator(".exam-question .diagram svg").count(),diagrams.reduce((sum,item)=>sum+(item.html.match(/<svg\b/g)||[]).length,0));
        if(paper===1) {
          assert.equal(await page.locator("[data-check],input[type=radio]").count(),0);
          await checkMarks(page);
          await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
          assert.equal(await page.locator(".marking-scheme caption").count(),19);
          assert.ok(await page.locator(".marking-scheme caption").evaluateAll(nodes=>nodes.every(n=>n.textContent.includes("非官方"))));
        } else {
          assert.equal(await page.locator("[data-finish]").count(),2);
          await page.locator(".practice-header [data-finish]").click();
          assert.equal(await page.locator(".exam-result").count(),0,"Empty answers must not submit");
          await page.evaluate(()=>{
            for(const q of window.PILOT.questions) {
              document.querySelector(`#question-${q.n} input[value="${q.answer}"]`).click();
              document.querySelector(`#question-${q.n} [data-check]`).click();
            }
          });
          assert.equal(await page.locator(".feedback.success").count(),45);
          assert.equal(await page.locator(".scheme-score,.marking-scheme").count(),0);
          const breaks=await page.evaluate(()=>window.PILOT.questions.map(q=>{
            const marker=q.prompt.search(/(?:^|[？。；：])\s*I\s/);
            const prefix=marker<0?q.prompt:q.prompt.slice(0,marker+1);
            return {n:q.n,count:(prefix.match(/\n/g)||[]).length};
          }));
          for(const {n,count} of breaks)assert.equal(await page.locator(`#question-${n} .exam-stem > br`).count(),count,`Q${n}: explicit prompt breaks`);
        }
        for(const width of widths) await checkLayout(page,paper,width);
        await page.locator("#question-1 [data-hint]").click();
        assert.equal(await page.locator("#question-1 .hints li").count(),1);
        await page.locator("#question-1 [data-bookmark]").click();
        const before=await page.evaluate(key=>localStorage.getItem(key),key);
        assert.equal(JSON.parse(before).progress.questionRevision,1);
        assert.deepEqual(JSON.parse(before).progress.saved,[1]);
        await page.reload();
        assert.equal(await page.locator("#question-1 .hints li").count(),1);
        if(paper===2)assert.equal(await page.locator(".feedback.success").count(),45);

        for(const year of years.filter(year=>year!==2020)) {
          await page.locator("#mock-year").selectOption(String(year));
          await page.waitForURL(new RegExp(`year=${year}`));
          assert.equal(await page.evaluate(()=>window.PILOT.year),year);
          assert.equal(await page.locator("#question-1 .hints li").count(),1);
          assert.equal(await page.locator(".feedback").count(),0);
        }
        await page.locator("#mock-year").selectOption("2020");
        await page.waitForURL(/year=2020/);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);
        assert.match(await page.locator(".other-paper").getAttribute("href"),/year=2020/);
        await page.locator(".other-paper").click();
        assert.equal(await page.evaluate(()=>window.PILOT.year),2020);
        assert.equal(await page.evaluate(()=>window.PILOT.paper),paper===1?2:1);
        assert.equal(await page.locator(".feedback").count(),0);
        await page.goto(`${base}/paper${paper}/?year=2020#practice`);
        await assertProtected();
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);

        const filename=`dse-original-2020-paper${paper}-practice.pdf`;
        assert.equal(await page.locator(".export-pdf").getAttribute("download"),filename);
        assert.equal(await page.locator(".export-pdf").getAttribute("href"),`../output/pdf/${filename}`);
        if(!layoutOnly) {
          const downloadEvent=page.waitForEvent("download");
          await page.locator(".export-pdf").click();
          const pdf=await downloadEvent;
          assert.equal(pdf.suggestedFilename(),filename);
          assert.equal((await fs.readFile(await pdf.path())).subarray(0,5).toString(),"%PDF-");
        }
        await page.goto(`${base}/paper${paper}/?year=2020#saved`);
        assert.equal(await page.locator('[data-solo="1"]').count(),1);
        assert.equal(await page.locator('[data-solo="2"]').count(),0);
        const backupEvent=page.waitForEvent("download");
        await page.locator("[data-export]").click();
        const backupDownload=await backupEvent;
        assert.equal(backupDownload.suggestedFilename(),`dse-original-2020-paper${paper}-backup.json`);
        const backup=JSON.parse(await fs.readFile(await backupDownload.path(),"utf8"));
        assert.equal(backup.year,2020);
        assert.equal(backup.paper,paper);
        assert.deepEqual(backup.progress,JSON.parse(before).progress);
        const importData=data=>page.locator("#import-file").setInputFiles({name:"test.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(data))});
        for(const altered of [{...backup,year:2021},{...backup,paper:paper===1?2:1},{...backup,year:undefined}]) {
          const rejected=page.waitForEvent("dialog");
          await importData(altered);
          assert.match((await rejected).message(),/無法匯入/);
          assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);
        }
        await page.evaluate(key=>localStorage.removeItem(key),key);
        await page.reload();
        await importData(backup);
        await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.progress.saved.includes(1),key);
        assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress,key),backup.progress);
        await assertProtected();

        await page.goto(`${base}/paper${paper}/?year=2020#find`);
        for(const button of await page.locator("[data-open]").all()) await button.click();
        assert.equal(await page.locator(".result").count(),paper===1?19:45);
        assert.ok(await page.locator(".result").evaluateAll(nodes=>nodes.every(n=>n.querySelectorAll(".exam-stem").length===1)));
        assert.equal(await page.locator(".result .curriculum-status").count(),polarQuestions.length);
        if(paper===2) {
          const answer=await page.evaluate(()=>window.PILOT.questions[0].answer);
          const wrong="ABCD".split("").find(letter=>letter!==answer);
          await page.locator(`[data-result="1"] input[value="${wrong}"]`).check();
          await page.locator('[data-result="1"] [data-check]').click();
          assert.equal(await page.locator('[data-result="1"] .feedback.error').count(),1);
          await page.locator(`[data-result="1"] input[value="${answer}"]`).check();
          await page.locator('[data-result="1"] [data-check]').click();
          assert.equal(await page.locator('[data-result="1"] .feedback.success').count(),1);
        }
        await page.goto(`${base}/paper${paper}/?year=2020#papers`);
        assert.equal(await page.locator(".paper-part").count(),paper===1?3:2);
        assert.equal(await page.locator("[data-solo]").count(),paper===1?19:45);
        assert.equal(await page.locator(".paper-directory .curriculum-status").count(),polarQuestions.length);
        await page.getByRole("link",{name:"主頁",exact:true}).click();
        await page.waitForFunction(()=>document.querySelector("#enter-paper").getAttribute("href").includes("year=2020"));
        await page.locator("#enter-paper").focus();
        await page.keyboard.press("Enter");
        await page.waitForURL("**/paper1/?year=2020#papers");
        assert.equal(await page.evaluate(()=>window.PILOT.year),2020);
        for(const query of ["","?year=1900","?year=invalid"]) {
          await page.goto(`${base}/paper${paper}/${query}#papers`);
          assert.equal(await page.evaluate(()=>window.PILOT.year),2026);
        }
        await assertProtected();
        assert.deepEqual(errors,[]);
        console.log(`2020 P${paper}: ${metadata.numbers.length} questions, dropdown, solutions/grading, five widths, hints/favorites, year/paper isolation, backup round trip, polar labels, single stems, homepage and 2026 default passed; PDF ${layoutOnly?"download skipped (link checked)":"download passed"}.`);
      } finally {await context.close();}
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
