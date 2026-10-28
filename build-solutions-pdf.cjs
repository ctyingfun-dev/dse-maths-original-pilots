const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
const {launchBrowser} = require('./scripts/browser-runtime.cjs');
const root = __dirname;
const years = Array.from({length:11},(_,i)=>2016+i);

async function loadData(year,paper) {
  const window={};
  vm.runInNewContext(await fs.readFile(path.join(root,`paper${paper}/data-${year}.js`),'utf8'),{window});
  return JSON.parse(JSON.stringify(window[`PILOT_${year}`] || window.PILOT));
}

async function build(browser,year,paper) {
  const data=await loadData(year,paper);
  assert.equal(data.questions.length,paper===1?(year===2016?20:19):45);
  const page=await browser.newPage({viewport:{width:820,height:1150}});
  try {
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.setContent('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>參考解答</title></head><body></body></html>');
    await page.addStyleTag({path:path.join(root,'scripts/solution-pdf.css')});
    await page.addScriptTag({path:path.join(root,`paper${paper}/math.js`)});
    await page.addScriptTag({path:path.join(root,'scripts/solution-pdf-math.js')});
    await page.addScriptTag({path:path.join(root,'scripts/solution-pdf-roots.js')});
    await page.evaluate(()=>document.fonts.ready);
    const report=await page.evaluate(({data,year,paper})=>{
      const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const polar=q=>/極[坐座]標|[極极][角徑径]|polar\s+coordinates?/i.test([q.topic,q.prompt,q.summary,...q.topics||[],...q.concepts||[]].join(' '));
      const title=`${year} 原創模擬卷${paper===1?'一':'二'}`;
      let sheet,table,body,pageNumber=0;
      const newPage=(intro=false,keyOnly=false)=>{
        pageNumber++;
        sheet=document.createElement('section');sheet.className='sheet';
        sheet.innerHTML=`<header class="page-heading"><strong>${title}</strong><span>參考解答及評分參考（非官方）</span></header>`;
        if(intro) sheet.innerHTML+=`<h1>${paper===1?'參考解答及評分參考':'答案表及詳細解答'}</h1><p class="subtitle">自擬參考評分準則（非考評局官方）</p><div class="instructions">${paper===1?'<p>1M：方法分；1A：準確分。保留本卷既定配分，接受其他正確方法及等值答案。</p><p>下列代入及中間運算供核對，並非每一行均獨立計分。全卷滿分 105 分。</p>':'<p>每題 1 分，共 45 分；答錯、未作答或多選得 0 分，不設方法分。</p><p>詳細推導供核對及學習，不另外計分。</p>'}<p>「已取消」為本網站對極坐標題的保留標示。</p></div>`;
        document.body.append(sheet);
        if(!keyOnly) {
          table=document.createElement('table');table.className='scheme';
          table.innerHTML=`<colgroup><col class="number"><col><col class="score"></colgroup><thead><tr><th>題號</th><th>解答及評分要點</th><th>${paper===1?'分數':'答案'}</th></tr></thead><tbody></tbody>`;
          sheet.append(table);body=table.tBodies[0];
        }
      };
      if(paper===2) {
        newPage(true,true);
        for(const [name,start,end] of [['甲部',1,30],['乙部',31,45]]) {
          sheet.insertAdjacentHTML('beforeend',`<h2 class="key-section">${name}</h2>`);
          const key=document.createElement('table');key.className='answer-key';
          key.innerHTML='<thead><tr>'+Array.from({length:3},()=>'<th>題號</th><th>答案</th>').join('')+'</tr></thead>';
          const rows=Math.ceil((end-start+1)/3);
          key.innerHTML+='<tbody>'+Array.from({length:rows},(_,i)=>'<tr>'+Array.from({length:3},(_,col)=>{
            const n=start+col*rows+i,q=data.questions[n-1];
            return n<=end?`<td>${n}${polar(q)?'<span class="cancelled">已取消</span>':''}</td><td class="key-answer" data-key="${n}">${esc(q.answer)}</td>`:'<td></td><td></td>';
          }).join('')+'</tr>').join('')+'</tbody>';
          sheet.append(key);
        }
        newPage();
      } else newPage(true);
      let rowCount=0,markTotal=0;
      const sourceHtml=[];
      const addRow=(q,label,html,marks,first,continuationLabel=label)=>{
        const row=document.createElement('tr');row.dataset.question=q.n;row.dataset.row=++rowCount;
        row.dataset.part=continuationLabel;
        row.className=first?'question-start':'';
        const labelHtml=`${q.n}${label?' '+esc(label):'.'}${polar(q)?'<span class="cancelled">已取消</span>':''}`;
        row.innerHTML=`<td class="label">${first||label?labelHtml:''}</td><td class="answer">${html}</td><td class="marks">${esc(marks)}</td>`;
        body.append(row);
        window.fitPdfRoots(row);
        // Move whole scored steps to a fresh page; never split a fraction or its award.
        if(table.getBoundingClientRect().bottom>sheet.getBoundingClientRect().top+sheet.clientHeight-2) {
          row.remove();newPage();body.append(row);
          row.cells[0].innerHTML=`${q.n}${continuationLabel?' '+esc(continuationLabel):'.'}${polar(q)?'<span class="cancelled">已取消</span>':''}`+(first?'':'<br>（續）');
        }
        if(table.getBoundingClientRect().bottom>sheet.getBoundingClientRect().top+sheet.clientHeight-2) throw Error(`${year} P${paper} Q${q.n}: scored step exceeds page`);
        sourceHtml.push(html);
      };
      for(const q of data.questions) {
        const source=paper===1?q.solution.flatMap(part=>part.steps.map(step=>step.text)):q.solution;
        const audit=document.createElement('div');audit.innerHTML=window.pdfSolutionHtml(source);
        const tokens=value=>[...String(value).normalize('NFKC').matchAll(/[A-Za-z0-9\p{Script=Han}\p{Script=Greek}]/gu)].map(m=>m[0]).sort().join('');
        if(tokens(Array.isArray(source)?source.join(''):source)!==tokens(audit.textContent)) throw Error(`${year} P${paper} Q${q.n}: rendered content differs from source`);
        if(paper===1) {
          let first=true,questionMarks=0;
          for(const part of q.solution) for(let i=0;i<part.steps.length;i++) {
            const step=part.steps[i],award=Number(String(step.marks).match(/\d+/)?.[0]||0);
            questionMarks+=award;
            addRow(q,i===0?part.part:'',window.pdfSolutionHtml(step.text),step.marks,first,part.part);first=false;
          }
          if(questionMarks!==q.marks) throw Error(`Q${q.n}: marks ${questionMarks} != ${q.marks}`);
          markTotal+=questionMarks;
        } else {
          const holder=document.createElement('div');holder.innerHTML=window.pdfSolutionHtml(q.solution);
          const blocks=[...holder.children],groups=[];
          // Keep introductions with their equation and the final result with its derivation.
          for(let i=0;i<blocks.length;) {
            let end=i+1;
            if(i===0 || i===blocks.length-2) end=Math.min(i+2,blocks.length);
            while(end<blocks.length && /[：，:]$/.test(blocks[end-1].textContent.trim())) end++;
            if(end===blocks.length-1) end++;
            groups.push(blocks.slice(i,end).map(b=>b.outerHTML).join(''));i=end;
          }
          groups.forEach((html,i)=>addRow(q,'',html,i===0?q.answer:'',i===0));
        }
      }
      // A lone final award should retain the preceding derivation on its page.
      if(paper===1) {
        const pages=[...document.querySelectorAll('.sheet')],last=pages.at(-1),previous=pages.at(-2);
        const lastBody=last.querySelector('tbody'),previousBody=previous?.querySelector('tbody');
        if(lastBody.rows.length===1 && previousBody?.rows.length>1) {
          const current=lastBody.rows[0],candidate=previousBody.rows[previousBody.rows.length-1];
          if(current.dataset.question===candidate.dataset.question && current.dataset.part===candidate.dataset.part) {
            lastBody.prepend(candidate);
            if(last.querySelector('table').getBoundingClientRect().bottom>last.getBoundingClientRect().bottom-2) previousBody.append(candidate);
            else {
              const q=data.questions.find(item=>item.n===+candidate.dataset.question);
              candidate.cells[0].innerHTML=`${candidate.dataset.question} ${esc(candidate.dataset.part)}${polar(q)?'<span class="cancelled">已取消</span>':''}<br>（續）`;
              current.cells[0].innerHTML='';
            }
          }
        }
      }
      for(const s of document.querySelectorAll('.sheet')) if([...s.children].some(el=>el.getBoundingClientRect().bottom>s.getBoundingClientRect().bottom+1)) throw Error('Page content exceeds printable height');
      const overflow=[...document.querySelectorAll('.answer>*')].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>({question:el.closest('tr').dataset.question,text:el.textContent,width:el.clientWidth,scroll:el.scrollWidth}));
      const represented=[...new Set([...document.querySelectorAll('tr[data-question]')].map(r=>+r.dataset.question))];
      const bounds=el=>{
        const pageBox=el.closest('.sheet').getBoundingClientRect(),box=el.getBoundingClientRect();
        return [14*72/25.4+(box.left-pageBox.left)*.75,16*72/25.4+(box.top-pageBox.top)*.75,14*72/25.4+(box.right-pageBox.left)*.75,16*72/25.4+(box.bottom-pageBox.top)*.75];
      };
      const keyEvidence=[...document.querySelectorAll('[data-key]')].map(el=>({question:+el.dataset.key,answer:data.questions[+el.dataset.key-1].answer,bounds:bounds(el),numberBounds:bounds(el.previousElementSibling)}));
      const rowEvidence=[...document.querySelectorAll('tr[data-question]')].map(row=>{
        return {question:+row.dataset.question,page:[...document.querySelectorAll('.sheet')].indexOf(row.closest('.sheet'))+1,text:row.cells[1].innerText,marks:row.cells[2].innerText,
          bounds:bounds(row.cells[1]),marksBounds:bounds(row.cells[2])};
      });
      return {year,paper,pages:pageNumber,questions:represented,rows:rowCount,markTotal,overflow,html:sourceHtml,rowEvidence,keyEvidence,plainText:document.body.innerText};
    },{data,year,paper});
    assert.deepEqual(report.questions,data.questions.map(q=>q.n));
    assert.deepEqual(report.overflow,[],`${year} P${paper}: formula overflow`);
    if(paper===1) assert.equal(report.markTotal,105);
    const out=path.join(root,`output/pdf/dse-original-${year}-paper${paper}-solutions.pdf`);
    await page.pdf({path:out,format:'A4',preferCSSPageSize:true,printBackground:false,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:`<div style="font:9px 'Times New Roman',serif;width:100%;text-align:center;color:#333">${year} Original P${paper} - <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,tagged:true});
    const qa=path.join(root,'tmp/solutions-pdf');await fs.mkdir(qa,{recursive:true});
    report.inputs={};
    for(const file of [`paper${paper}/data-${year}.js`,`paper${paper}/math.js`,'build-solutions-pdf.cjs','scripts/solution-pdf.css','scripts/solution-pdf-math.js','scripts/solution-pdf-roots.js']) {
      report.inputs[file]=crypto.createHash('sha256').update((await fs.readFile(path.join(root,file),'utf8')).replace(/\r\n/g,'\n')).digest('hex');
    }
    await fs.writeFile(path.join(qa,`${year}-p${paper}.json`),JSON.stringify(report,null,2));
    await fs.writeFile(path.join(qa,`${year}-p${paper}.html`),await page.content());
    console.log(`${year} P${paper}: ${report.questions.length} questions, ${report.rows} rows, ${report.pages} pages -> ${out}`);
    return report;
  } finally {await page.close();}
}
async function main() {
  const selected=process.argv[2]?[Number(process.argv[2])]:years;
  const papers=process.argv[3]?[Number(process.argv[3])]:[1,2];
  assert(selected.every(y=>years.includes(y))&&papers.every(p=>[1,2].includes(p)));
  const browser=await launchBrowser();
  try {for(const y of selected) for(const p of papers) await build(browser,y,p);}
  finally {await browser.close();}
}
module.exports={loadData,build};
if(require.main===module) main().catch(e=>{console.error(e);process.exitCode=1;});
