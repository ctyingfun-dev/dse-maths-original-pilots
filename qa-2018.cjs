const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const base=(process.env.PREVIEW_URL||"http://127.0.0.1:4284").replace(/\/$/,"");
const output=path.join(__dirname,"tmp/integration-2018");
const years=[2018,2019,2020,2021,2022,2023,2024,2025,2026];
const widths=[1440,1056,768,390,320];
const paperFlag=process.argv.indexOf("--paper");
const papers=paperFlag<0?[1,2]:[Number(process.argv[paperFlag+1])];
const layoutOnly=process.argv.includes("--layout-only");
assert.ok(papers.every(paper=>[1,2].includes(paper)),"Use --paper 1 or --paper 2");

// Independently checked against the local 2018 originals, not the adapted data.
// P1 PDF pp.2/8/16: section boundaries; p.22: Q19 (b)(i),(ii).
// P1 figures: pp.6,8,12,18; p.9 has a frequency table, rendered as SVG.
// Q17's two source figures are separate diagrams beside parts (a) and (b).
// Section counts, marks and polar coverage also match SOURCE_ALIGNMENT_2018.md.
// P2 English PDF pp.1-14: A Q1-30, B Q31-45; p.7 Q24 is polar;
// pp.2,4-7,9-10,12-13 contain figures; p.9 Q30 is stem-and-leaf.
const sourceExpectation = {
  1: {count:19, sections:{"甲一":9,"甲二":5,"乙部":5}, polar:[],
    figures:[8,10,11,13,17], figureCounts:{8:1,10:1,11:1,13:1,17:2},
    panels:{17:["圖甲","圖乙"]},
    marks:[3,3,3,3,4,4,5,5,5,5,6,7,8,9,3,5,7,8,12],
    romanSubparts:{11:["i","ii","i","ii"],13:["i","ii","iii"],17:["i","ii"],18:["i","ii","iii"],19:["i","ii"]}},
  2: {count:45, sections:{"甲部":30,"乙部":15}, polar:[24],
    figures:[6,14,15,16,17,18,19,20,21,22,23,30,31,32,33,39,41],
    figureCounts:Object.fromEntries([6,14,15,16,17,18,19,20,21,22,23,30,31,32,33,39,41].map(n=>[n,1]))}
};

async function waitReady(page, year, paper) {
  await page.waitForLoadState("load");
  await page.waitForFunction(({year,paper})=>window.PILOT?.year===year &&
    window.PILOT?.paper===paper && document.querySelector("#mock-year")?.value===String(year), {year,paper});
  await page.evaluate(()=>document.fonts.ready);
}
module.exports = {sourceExpectation, waitReady};

async function checkLayout(page,paper,width) {
  await page.setViewportSize({width,height:892});
  await page.evaluate(()=>document.fonts.ready);
  const overflow=await page.locator(".exam-stem,.exam-part p,.scheme-answer p,.scheme-score,.options label,.feedback p,.exam-table,.stemleaf").evaluateAll(nodes=>nodes.filter(node=>
    node.clientWidth && node.scrollWidth>node.clientWidth+2 &&
    ![node,node.closest(".solution-calculation")].some(parent=>parent&&getComputedStyle(parent).overflowX==="auto")
  ).map(node=>({question:node.closest("article")?.id,text:node.textContent.slice(0,100)})));
  assert.deepEqual(overflow,[],`2018 P${paper}: overflow at ${width}px`);
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
    for (const [n, labels] of Object.entries(sourceExpectation[1].romanSubparts)) {
      assert.deepEqual(await page.locator(`#question-${n} .exam-subpart > span`).allTextContents(),
        labels.map(label=>`(${label})`), `${media}: Q${n} source subparts, without duplicate inline references`);
    }
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

if (require.main === module) (async()=>{
  const required=papers.flatMap(paper=>[`paper${paper}/data-2018.js`,`paper${paper}/diagrams-2018.js`,
    ...layoutOnly?[]:[`output/pdf/dse-original-2018-paper${paper}-practice.pdf`]]);
  for(const file of required) await fs.access(path.join(__dirname,file)).catch(()=>{
    throw new Error(`2018 QA blocked: missing ${file}; wait for the authors/PDF build before running.`);
  });
  await fs.mkdir(output,{recursive:true});
  const {launchBrowser}=require("./scripts/browser-runtime.cjs");
  const browser=await launchBrowser();
  try {
    for(const paper of papers) {
      const context=await browser.newContext(),page=await context.newPage(),errors=[];
      const key=`dse-original-pilot-paper${paper}-2018-v2`;
      const expected=sourceExpectation[paper],polarQuestions=expected.polar;
      page.on("pageerror",error=>errors.push(error.message));
      page.on("response",response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
      page.on("dialog",dialog=>dialog.accept());
      try {
        await page.goto(`${base}/paper${paper}/?year=2018#practice`);
        await waitReady(page,2018,paper);
        assert.equal(await page.evaluate(()=>window.PILOT.year),2018);
        assert.equal(await page.evaluate(()=>window.PILOT.paper),paper);
        assert.equal(await page.locator("#mock-year").inputValue(),"2018");
        assert.deepEqual(await page.locator("#mock-year option").evaluateAll(nodes=>nodes.map(n=>Number(n.value))),years);
        const metadata=await page.evaluate(()=>({
          numbers:window.PILOT.questions.map(q=>q.n),
          sections:window.PILOT.questions.reduce((counts,q)=>(counts[q.section]=(counts[q.section]||0)+1,counts),{}),
          polar:window.PILOT.questions.filter(q=>window.pilotCurriculumNotice(q)).map(q=>q.n)
        }));
        assert.deepEqual(metadata.numbers,Array.from({length:expected.count},(_,i)=>i+1));
        assert.deepEqual(metadata.sections,expected.sections);
        assert.deepEqual(metadata.polar,polarQuestions);
        if(paper===1) assert.deepEqual(await page.evaluate(()=>window.PILOT.questions.map(q=>q.marks)),expected.marks,"2018 original question marks");
        assert.equal(await page.locator(".exam-question").count(),expected.count);
        assert.equal(await page.locator(".key,textarea").count(),0);
        assert.deepEqual(await page.locator(".exam-question .curriculum-status").evaluateAll(nodes=>nodes.map(n=>Number(n.closest("article").id.replace("question-","")))),polarQuestions);

        // Give every other year/paper real progress to detect overwrites and migration leakage.
        const protectedProgress=await page.evaluate(({years,paper})=>{
          const result={};
          for(const year of years) for(const otherPaper of [1,2]) {
            if(year===2018&&otherPaper===paper)continue;
            const key=`dse-original-pilot-paper${otherPaper}-${year}-v2`;
            const questionRevision=otherPaper===1?([2018,2019,2020,2021,2022,2023].includes(year)?1:2):([2018,2019,2020,2021,2023,2024].includes(year)?1:[2022,2025].includes(year)?2:5);
            const value=JSON.stringify({schema:2,paper:otherPaper,year,progress:{answers:{},checked:{},hints:{1:1},saved:[2],questionRevision,startedAt:null,deadline:null,mode:"untimed",finished:false}});
            localStorage.setItem(key,value);
            result[key]=value;
          }
          return result;
        },{years,paper});
        const assertProtected=async()=>assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(protectedProgress)),protectedProgress,"Another year/paper's progress changed");

        const diagrams=await page.evaluate(()=>window.PILOT.questions.flatMap(q=>[q.diagram,...Object.values(q.partDiagrams||{})].filter(Boolean).map(spec=>({n:q.n,kind:typeof spec==="string"?spec:spec.type}))).filter(item=>item.kind.endsWith("2018")).map(item=>({...item,html:window.pilotDiagram2018(item.kind)})));
        for(const {n,kind,html} of diagrams) {
          assert.match(html,/<(?:svg|table)\b/,`Q${n}: ${kind} has no drawing/table`);
        }
        assert.equal(await page.locator(".exam-question .diagram svg").count(),diagrams.reduce((sum,item)=>sum+(item.html.match(/<svg\b/g)||[]).length,0));
        if(paper===1) {
          assert.equal(await page.locator("[data-check],input[type=radio]").count(),0);
          await checkMarks(page);
          await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
          assert.equal(await page.locator(".marking-scheme caption").count(),expected.count);
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
          assert.equal(await page.locator(".feedback.success").count(),expected.count);
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
        await waitReady(page,2018,paper);
        assert.equal(await page.locator("#question-1 .hints li").count(),1);
        if(paper===2)assert.equal(await page.locator(".feedback.success").count(),expected.count);

        for(const year of years.filter(year=>year!==2018)) {
          await page.locator("#mock-year").selectOption(String(year));
          await page.waitForURL(new RegExp(`year=${year}`));
          await waitReady(page,year,paper);
          assert.equal(await page.evaluate(()=>window.PILOT.year),year);
          assert.equal(await page.locator("#question-1 .hints li").count(),1);
          assert.equal(await page.locator(".feedback").count(),0);
        }
        await page.locator("#mock-year").selectOption("2018");
        await page.waitForURL(/year=2018/);
        await waitReady(page,2018,paper);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);
        assert.match(await page.locator(".other-paper").getAttribute("href"),/year=2018/);
        await page.locator(".other-paper").click();
        await waitReady(page,2018,paper===1?2:1);
        assert.equal(await page.evaluate(()=>window.PILOT.year),2018);
        assert.equal(await page.evaluate(()=>window.PILOT.paper),paper===1?2:1);
        assert.equal(await page.locator(".feedback").count(),0);
        await page.goto(`${base}/paper${paper}/?year=2018#practice`);
        await waitReady(page,2018,paper);
        await assertProtected();
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);

        const filename=`dse-original-2018-paper${paper}-practice.pdf`;
        assert.equal(await page.locator(".export-pdf").getAttribute("download"),filename);
        assert.equal(await page.locator(".export-pdf").getAttribute("href"),`../output/pdf/${filename}`);
        if(!layoutOnly) {
          const downloadEvent=page.waitForEvent("download");
          await page.locator(".export-pdf").click();
          const pdf=await downloadEvent;
          assert.equal(pdf.suggestedFilename(),filename);
          assert.equal((await fs.readFile(await pdf.path())).subarray(0,5).toString(),"%PDF-");
        }
        await page.goto(`${base}/paper${paper}/?year=2018#saved`);
        await waitReady(page,2018,paper);
        assert.equal(await page.locator('[data-solo="1"]').count(),1);
        assert.equal(await page.locator('[data-solo="2"]').count(),0);
        const backupEvent=page.waitForEvent("download");
        await page.locator("[data-export]").click();
        const backupDownload=await backupEvent;
        assert.equal(backupDownload.suggestedFilename(),`dse-original-2018-paper${paper}-backup.json`);
        const backup=JSON.parse(await fs.readFile(await backupDownload.path(),"utf8"));
        assert.equal(backup.year,2018);
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
        await waitReady(page,2018,paper);
        await importData(backup);
        await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.progress.saved.includes(1),key);
        assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).progress,key),backup.progress);
        await assertProtected();

        await page.goto(`${base}/paper${paper}/?year=2018#find`);
        await waitReady(page,2018,paper);
        for(const button of await page.locator("[data-open]").all()) await button.click();
        assert.equal(await page.locator(".result").count(),expected.count);
        assert.ok(await page.locator(".result").evaluateAll(nodes=>nodes.every(n=>n.querySelectorAll(".exam-stem").length===1)));
        assert.equal(await page.locator(".result .curriculum-status").count(),polarQuestions.length);
        if(paper===2) {
          const answer=await page.evaluate(()=>window.PILOT.questions[0].answer);
          const wrong="ABCD".split("").find(letter=>letter!==answer);
          await page.locator(`[data-result="1"] label:has(input[value="${wrong}"])`).click();
          assert.ok(await page.locator(`[data-result="1"] input[value="${wrong}"]`).isChecked());
          await page.locator('[data-result="1"] [data-check]').click();
          assert.equal(await page.locator('[data-result="1"] .feedback.error').count(),1);
          await page.locator(`[data-result="1"] label:has(input[value="${answer}"])`).click();
          assert.ok(await page.locator(`[data-result="1"] input[value="${answer}"]`).isChecked());
          await page.locator('[data-result="1"] [data-check]').click();
          assert.equal(await page.locator('[data-result="1"] .feedback.success').count(),1);
        }
        await page.goto(`${base}/paper${paper}/?year=2018#papers`);
        await waitReady(page,2018,paper);
        assert.equal(await page.locator(".paper-part").count(),Object.keys(expected.sections).length);
        assert.equal(await page.locator("[data-solo]").count(),expected.count);
        assert.equal(await page.locator(".paper-directory .curriculum-status").count(),polarQuestions.length);
        await page.getByRole("link",{name:"主頁",exact:true}).click();
        await page.waitForFunction(()=>document.querySelector("#enter-paper").getAttribute("href").includes("year=2018"));
        await page.locator("#enter-paper").focus();
        await page.keyboard.press("Enter");
        await page.waitForURL("**/paper1/?year=2018#papers");
        await waitReady(page,2018,1);
        assert.equal(await page.evaluate(()=>window.PILOT.year),2018);
        for(const query of ["","?year=2017","?year=invalid"]) {
          await page.goto(`${base}/paper${paper}/${query}#papers`);
          await waitReady(page,2026,paper);
          assert.equal(await page.evaluate(()=>window.PILOT.year),2026);
        }
        await assertProtected();
        assert.deepEqual(errors,[]);
        console.log(`2018 P${paper}: ${metadata.numbers.length} questions, dropdown, solutions/grading, five widths, hints/favorites, year/paper isolation, backup round trip, polar labels, single stems, homepage and 2026 default passed; PDF ${layoutOnly?"download skipped (link checked)":"download passed"}.`);
      } finally {await context.close();}
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
