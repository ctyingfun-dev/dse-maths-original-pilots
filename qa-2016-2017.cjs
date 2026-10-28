const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {launchBrowser} = require('./scripts/browser-runtime.cjs');
const sourceExpectation = require('./scripts/source-expectations-2016-2017.cjs');
const base = (process.env.PREVIEW_URL || 'http://127.0.0.1:4284').replace(/\/$/, '');
const years = Array.from({length:11}, (_, i) => 2016+i);
const widths = [1440,1056,768,390,320];
const yearArg = process.argv.indexOf('--year');
const selectedYears = yearArg<0 ? [2016,2017] : [+process.argv[yearArg+1]];
const paperArg = process.argv.indexOf('--paper');
const papers = paperArg<0 ? [1,2] : [+process.argv[paperArg+1]];
const layoutOnly = process.argv.includes('--layout-only');
assert(selectedYears.every(y=>[2016,2017].includes(y)) && papers.every(p=>[1,2].includes(p)));
async function waitReady(page,year,paper) {
  await page.waitForLoadState('load');
  await page.waitForFunction(({year,paper})=>window.PILOT?.year===year && window.PILOT.paper===paper && document.querySelector('#mock-year')?.value===String(year),{year,paper});
  await page.evaluate(()=>document.fonts.ready);
}
module.exports={sourceExpectation,waitReady};
async function main() {
  const output=path.join(__dirname,'tmp/integration-2016-2017');
  await fs.mkdir(output,{recursive:true});
  const browser=await launchBrowser();
  try {
    for(const year of selectedYears) for(const paper of papers) {
      const expected=sourceExpectation[year][paper],context=await browser.newContext(),page=await context.newPage(),errors=[];
      const key=`dse-original-pilot-paper${paper}-${year}-v2`;
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      page.on('dialog',d=>d.accept());
      const go=async route=>{await page.goto(`${base}/paper${paper}/?year=${year}#${route}`);await waitReady(page,year,paper);};
      try {
        await go('practice');
        if(paper===1){
          await go('topics');
          assert((await page.locator('.page-head .subtle').textContent()).includes(`${expected.count} 題`));
          await go('practice');
        }
        assert.deepEqual(await page.locator('#mock-year option').evaluateAll(ns=>ns.map(n=>+n.value)),years);
        const actual=await page.evaluate(()=>({count:window.PILOT.questions.length,sections:window.PILOT.questions.reduce((a,q)=>(a[q.section]=(a[q.section]||0)+1,a),{}),polar:window.PILOT.questions.filter(q=>window.pilotCurriculumNotice(q)).map(q=>q.n),numbers:window.PILOT.questions.map(q=>q.n)}));
        assert.equal(actual.count,expected.count);assert.deepEqual(actual.sections,expected.sections);assert.deepEqual(actual.polar,expected.polar);
        assert.deepEqual(actual.numbers,Array.from({length:expected.count},(_,i)=>i+1));
        assert.equal(await page.locator('.exam-question').count(),expected.count);
        assert.equal(await page.locator('.key,textarea,.print-answer-space:visible').count(),0);
        assert.deepEqual(await page.locator('.exam-question .curriculum-status').evaluateAll(ns=>ns.map(n=>+n.closest('article').id.replace('question-',''))),expected.polar);
        const figures=await page.locator('.exam-question').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[+n.id.replace('question-',''),n.querySelectorAll('.diagram svg').length]).filter(([,count])=>count)));
        assert.deepEqual(figures,expected.figureCounts,'Original figure coverage including table figures');
        if(paper===1) {
          assert.deepEqual(await page.evaluate(()=>window.PILOT.questions.map(q=>q.marks)),expected.marks);
          assert.equal(await page.locator('[data-check],input[type=radio]').count(),0);
          for(const media of ['screen','print']) {
            await page.emulateMedia({media});
            const marks=await page.locator('.exam-question').evaluateAll(ns=>ns.map(n=>{
              const q=window.PILOT.questions.find(q=>n.id===`question-${q.n}`),items=[...n.querySelectorAll('.exam-content .exam-part-marks,.exam-content .exam-marks')].filter(i=>i.getClientRects().length);
              return {n:q.n,expected:q.marks,total:items.reduce((s,i)=>s+Number(i.textContent.match(/\d+/)[0]),0),duplicate:items.some(i=>i.classList.contains('exam-part-marks'))&&items.some(i=>i.classList.contains('exam-marks'))};
            }));
            assert.deepEqual(marks.filter(q=>q.expected!==q.total||q.duplicate),[],`${year} ${media}: marks exactly once`);
            for(const [n,labels] of Object.entries(expected.romanSubparts)) assert.deepEqual(await page.locator(`#question-${n} .exam-subpart > span`).allTextContents(),labels.map(s=>`(${s})`));
          }
          await page.emulateMedia({media:'screen'});
          await page.locator('.worked-answer').evaluateAll(ns=>ns.forEach(n=>n.open=true));
          assert.equal(await page.locator('.marking-scheme caption').count(),expected.count);
        } else {
          assert.equal(await page.locator('[data-finish]').count(),2);
          await page.locator('.practice-header [data-finish]').click();
          assert.equal(await page.locator('.exam-result').count(),0);
          await page.evaluate(()=>{for(const q of window.PILOT.questions){document.querySelector(`#question-${q.n} input[value="${q.answer}"]`).click();document.querySelector(`#question-${q.n} [data-check]`).click();}});
          assert.equal(await page.locator('.feedback.success').count(),45);
          assert.equal(await page.locator('.scheme-score,.marking-scheme').count(),0);
        }
        for(const width of widths) {
          await page.setViewportSize({width,height:892});
          const overflow=await page.locator('.exam-stem,.exam-part p,.scheme-answer p,.scheme-score,.options label,.feedback p').evaluateAll(ns=>ns.filter(n=>n.clientWidth&&n.scrollWidth>n.clientWidth+2&&![n,n.closest('.solution-calculation')].some(p=>p&&getComputedStyle(p).overflowX==='auto')).map(n=>({q:n.closest('article')?.id,text:n.textContent.slice(0,120)})));
          assert.deepEqual(overflow,[],`${year} P${paper} ${width}px`);
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
          if([1056,390].includes(width))await page.screenshot({path:path.join(output,`${year}-p${paper}-${width}.png`)});
        }
        const protectedProgress=await page.evaluate(({years,year,paper})=>{
          const result={};
          for(const y of years)for(const p of [1,2])if(y!==year||p!==paper){
            const k=`dse-original-pilot-paper${p}-${y}-v2`,revision=p===1?(y<=2023?1:2):([2022,2025].includes(y)?2:y===2026?5:1);
            result[k]=JSON.stringify({schema:2,paper:p,year:y,progress:{answers:{},checked:{},hints:{1:1},saved:[2],questionRevision:revision,startedAt:null,deadline:null,mode:'untimed',finished:false}});localStorage.setItem(k,result[k]);
          }return result;
        },{years,year,paper});
        const assertProtected=async()=>assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(protectedProgress)),protectedProgress);
        await page.locator('#question-1 [data-hint]').click();
        await page.locator('#question-1 [data-bookmark]').click();
        const saved=await page.evaluate(k=>localStorage.getItem(k),key);
        assert.equal(JSON.parse(saved).progress.questionRevision,1);
        assert.deepEqual(JSON.parse(saved).progress.saved,[1]);
        await page.reload();await waitReady(page,year,paper);
        assert.equal(await page.locator('#question-1 .hints li').count(),1);
        if(paper===2)assert.equal(await page.locator('.feedback.success').count(),45);
        for(const y of years.filter(y=>y!==year)) {
          await page.locator('#mock-year').selectOption(String(y));await waitReady(page,y,paper);
          assert.equal(await page.locator('#question-1 .hints li').count(),1);assert.equal(await page.locator('.feedback').count(),0);
        }
        await page.locator('#mock-year').selectOption(String(year));await waitReady(page,year,paper);
        assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);
        await page.locator('.other-paper').click();await waitReady(page,year,3-paper);
        await go('practice');await assertProtected();
        const filename=`dse-original-${year}-paper${paper}-practice.pdf`;
        assert.equal(await page.locator('.export-pdf').getAttribute('download'),filename);
        if(!layoutOnly){const pending=page.waitForEvent('download');await page.locator('.export-pdf').click();const download=await pending;assert.equal(download.suggestedFilename(),filename);assert.deepEqual(await fs.readFile(await download.path()),await fs.readFile(path.join(__dirname,'output/pdf',filename)));}
        await go('saved');
        assert.equal(await page.locator('[data-solo="1"]').count(),1);
        const pending=page.waitForEvent('download');await page.locator('[data-export]').click();const backupDownload=await pending;
        const backup=JSON.parse(await fs.readFile(await backupDownload.path(),'utf8'));
        assert.equal(backup.year,year);assert.equal(backup.paper,paper);assert.deepEqual(backup.progress,JSON.parse(saved).progress);
        const importData=data=>page.locator('#import-file').setInputFiles({name:'qa.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
        for(const altered of [{...backup,year:2026},{...backup,paper:3-paper},{...backup,year:undefined}]){const dialog=page.waitForEvent('dialog');await importData(altered);assert.match((await dialog).message(),/無法匯入/);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);}
        await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();await waitReady(page,year,paper);await importData(backup);
        await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.progress.saved.includes(1),key);
        assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).progress,key),backup.progress);await assertProtected();
        await go('find');for(const button of await page.locator('[data-open]').all())await button.click();
        assert.equal(await page.locator('.result').count(),expected.count);
        assert(await page.locator('.result').evaluateAll(ns=>ns.every(n=>n.querySelectorAll('.exam-stem').length===1)));
        assert.equal(await page.locator('.result .curriculum-status').count(),expected.polar.length);
        if(paper===2){const answer=await page.evaluate(()=>window.PILOT.questions[0].answer),wrong=[...'ABCD'].find(a=>a!==answer);for(const [choice,state]of [[wrong,'error'],[answer,'success']]){await page.locator(`[data-result="1"] label:has(input[value="${choice}"])`).click();await page.locator('[data-result="1"] [data-check]').click();assert.equal(await page.locator(`[data-result="1"] .feedback.${state}`).count(),1);}}
        await go('papers');assert.equal(await page.locator('[data-solo]').count(),expected.count);assert.equal(await page.locator('.paper-directory .curriculum-status').count(),expected.polar.length);
        await page.getByRole('link',{name:'主頁',exact:true}).click();
        await page.waitForFunction(y=>document.querySelector('#enter-paper')?.getAttribute('href').includes(`year=${y}`),year);
        await page.locator('#enter-paper').focus();await page.keyboard.press('Enter');await waitReady(page,year,1);
        for(const query of ['', '?year=1900','?year=invalid']){await page.goto(`${base}/paper${paper}/${query}#papers`);await waitReady(page,2026,paper);}
        await assertProtected();assert.deepEqual(errors,[]);
        console.log(`${year} P${paper}: ${expected.count} questions, source structure, five widths, marking, hints/favorites, all-year isolation, backup, single stems, homepage and PDF ${layoutOnly?'link':'download'} passed.`);
      }finally{await context.close();}
    }
  }finally{await browser.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
