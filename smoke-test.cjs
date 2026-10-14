const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
}
const {chromium} = playwright;
const root = __dirname;
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const url = paper => `${base}/paper${paper}/`;

(async () => {
  const browser = await chromium.launch({channel:"msedge",headless:true});
  try {
    for(const paper of [1,2]) for(const width of [1440,1004,390,320]) {
      const context=await browser.newContext({viewport:{width,height:900}});
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror", error=>errors.push(error.message));
      await page.goto(url(paper)+"#practice");
      const total=paper===1?19:45;
      if(await page.locator(".exam-question").count()!==total) throw Error(`卷${paper}題數`);
      if(!await page.locator("#question-1 var").count()) throw Error(`卷${paper}變數非斜體`);
      if(!await page.locator("#question-1 .math-frac").count()) throw Error(`卷${paper}分數未排版`);
      if(paper===1) {
        if(await page.locator("[data-check], #question-1 .feedback").count()) throw Error("長題不應批改");
        if(!await page.locator("#question-1 .exam-marks").innerText().then(t=>t.includes("3 分"))) throw Error("配分缺失");
        if(!await page.locator("#question-19 .exam-marks").innerText().then(t=>t.includes("12 分"))) throw Error("乙部配分缺失");
        if(!await page.locator("#question-10 .stemleaf").count()) throw Error("幹葉圖缺失");
        if(await page.locator("#question-10 .stemleaf tbody tr").count()!==4) throw Error("卷一第10題幹葉圖未擴充至四行");
        const leaves=(await page.locator("#question-10 .stemleaf tbody td").allTextContents()).flatMap(row=>row.trim().split(/\s+/));
        if(leaves.length!==20 || leaves.at(-1)!=="w") throw Error("卷一第10題應有20個數據");
        if(!await page.locator("#question-1 .exam-stem").innerText().then(t=>t.includes("公式主項"))) throw Error("卷一第1題指令未更新");
        if(await page.locator("#question-14 .exam-part").count()!==2 || await page.locator("#question-14 .exam-stem").innerText().then(t=>t.includes("(a)"))) throw Error("卷一第14題應有兩個獨立分題");
        if(!await page.locator("#question-14 .exam-stem").innerText().then(t=>t.includes("商為")&&t.includes("餘式"))) throw Error("卷一第14題缺少原卷的除法關係");
        const q14StemBox=await page.locator("#question-14 .exam-stem").boundingBox();
        const q14PartBox=await page.locator("#question-14 .exam-part").first().boundingBox();
        if(q14PartBox.y<q14StemBox.y+q14StemBox.height) throw Error("卷一第14題分題與題幹重疊");
        if(!await page.locator("#question-19 .exam-stem").innerText().then(t=>t.startsWith("設 k 為正數，")) || await page.locator("#question-19 .exam-stem br").count()!==3) throw Error("卷一第19題定義未分行");
        const groups=await page.evaluate(()=>window.PILOT.questions.map(q=>({n:q.n,groups:Object.values(q.markGroups||{})})));
        for(const {n,groups:expected} of groups) {
          const printed=await page.locator(`#question-${n} .exam-part-marks`).allTextContents();
          if(JSON.stringify(printed.map(text=>Number(text.match(/\d+/)[0])))!==JSON.stringify(expected)) throw Error(`卷一第${n}題分題配分缺失`);
        }
        if(await page.locator("#question-19 .exam-part").count()!==3 || await page.locator("#question-19 .exam-subpart").count()!==3) throw Error("卷一第19題未恢復原卷分題結構");
        const p1Parallels=await page.locator("#question-8 .math-parallel").allTextContents();
        if(p1Parallels.length!==3 || p1Parallels.some(mark=>mark!=="//")) throw Error("卷一第8題平行符號不一致");
        if(await page.locator("#question-8 .exam-stem .math-frac").count()) throw Error("卷一第8題平行符號被當成分數");
        if(await page.locator("#question-17 .exam-subpart").count()!==2) throw Error("卷一第17題小題排列錯誤");
        if(!await page.locator("#question-17 svg").getAttribute("aria-label").then(t=>t.includes("角錐"))) throw Error("卷一第17題立體圖缺失");
        if(await page.locator("textarea, .answer-field").count()) throw Error("卷一仍有作答區");
        if(!await page.locator("#question-7 .exam-stem").innerText().then(t=>t.endsWith("求盈利百分率。"))) throw Error("卷一第7題措辭未更新");
        const smallText=await page.locator(".exam-stem, .exam-part").evaluateAll(elements=>elements.filter(el=>parseFloat(getComputedStyle(el).fontSize)!==18).length);
        if(smallText) throw Error("卷一題目字體應為18px");
        const tinyTables=await page.locator(".exam-table td, .stemleaf td").evaluateAll(elements=>elements.filter(el=>parseFloat(getComputedStyle(el).fontSize)<17).length);
        if(tinyTables) throw Error("卷一表格字體過小");
        if(await page.locator(".print-answer-space:visible").count()) throw Error("網頁不應顯示PDF作答空間");
        if(await page.locator(".export-pdf[download]").count()!==1) throw Error("PDF下載按鈕缺失");
        if(await page.locator(".worked-answer .marking-scheme").count()!==19) throw Error("卷一未全面採用評分參考格式");
        for(let n=1;n<=19;n++) {
          await page.locator(`#question-${n} .worked-answer summary`).click();
          const steps=page.locator(`#question-${n} .scheme-step`);
          if(await steps.count()<3) throw Error(`卷一第${n}題解答未分步`);
          const issues=await steps.evaluateAll(elements=>elements.flatMap(row=>{
            const answer=row.querySelector('.scheme-answer'),score=row.querySelector('.scheme-score');
            const paragraphs=[...answer.querySelectorAll('p')];
            const problems=[];
            if(answer.scrollWidth>answer.clientWidth+2 || score.scrollWidth>score.clientWidth+2) problems.push('overflow');
            if(answer.getBoundingClientRect().right>score.getBoundingClientRect().left+1) problems.push('score overlap');
            paragraphs.forEach((p,i)=>{
              if(i && p.getBoundingClientRect().top-paragraphs[i-1].getBoundingClientRect().bottom<7) problems.push('paragraph gap');
              if(p.scrollWidth>p.clientWidth+2) problems.push('formula overflow');
            });
            return problems;
          }));
          if(issues.length) throw Error(`卷一第${n}題評分參考排版錯誤：${issues.join(', ')}`);
          const scores=await page.locator(`#question-${n} .scheme-score`).allTextContents();
          const total=scores.reduce((sum,score)=>sum+parseInt(score,10),0);
          if(Number(await page.locator(`#question-${n} .scheme-total`).innerText())!==total || !await page.locator(`#question-${n} .exam-marks`).innerText().then(t=>t.includes(`${total} 分`))) throw Error(`卷一第${n}題配分不一致`);
          if((width===1004 || width===320) && [1,7,9,10,13,14,16,19].includes(n)) await page.locator(`#question-${n} .worked-answer`).screenshot({path:`${root}/solution-q${n}-${width}.png`});
          await page.locator(`#question-${n} .worked-answer summary`).click();
        }
        if(width===1004) {
          const downloadEvent=page.waitForEvent("download");
          await page.locator(".export-pdf").click();
          const pdfDownload=await downloadEvent;
          const bytes=fs.readFileSync(await pdfDownload.path());
          if(bytes.subarray(0,5).toString()!=="%PDF-" || bytes.length<10000) throw Error("下載檔案不是完整PDF");
        }
        const operatorSpacing=await page.locator("#question-1 .math-op").evaluateAll(elements=>elements.length>0&&elements.every(el=>parseFloat(getComputedStyle(el).marginLeft)>0&&parseFloat(getComputedStyle(el).marginRight)>0));
        if(!operatorSpacing) throw Error("卷一公式運算符號欠缺間距");
        const overflowingContent=await page.locator(".exam-content, .stemleaf, .exam-table-pair").evaluateAll(elements=>elements.filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.closest("article").id));
        if(overflowingContent.length) throw Error(`卷一題目內容溢出：${overflowingContent.join(", ")}`);
        await page.locator("#question-1 [data-hint]").click();
        await page.locator("#question-1 [data-bookmark]").click();
        if(width===1004 || width===320) for(const n of [1,7,9,10,14,19]) await page.locator(`#question-${n}`).screenshot({path:`${root}/reading-q${n}-${width}.png`});
      } else {
        if(await page.locator("#question-1 .options label").count()!==4) throw Error("MC 選項缺失");
        if(await page.locator("#question-14 .exam-statements>span").count()!==3) throw Error("羅馬數字敘述沒有逐行排列");
        if(await page.locator("#question-30 .exam-statements>span").count()!==3) throw Error("卷二第30題敘述沒有逐行排列");
        const q26=await page.evaluate(()=>window.PILOT.questions[25]);
        if(q26.correct!=="一對直線" || q26.options.length!==4) throw Error("卷二第26題軌跡型態錯誤");
        const q31=await page.evaluate(()=>window.PILOT.questions[30]);
        if(q31.correct!=="9×2¹²+21" || !q31.prompt.includes("等於下列何者")) throw Error("卷二第31題問法錯誤");
        if(!await page.locator("#question-20 svg").getAttribute("aria-label")) throw Error("卷二第20題圖缺失");
        const columns=await page.locator("#question-1 .options").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length);
        if(columns!==1) throw Error("卷二選項不是單列");
        await page.locator("#question-1 .options label").first().click();
        await page.locator("#question-1 [data-check]").click();
        if(!await page.locator("#question-1 .feedback").count()) throw Error("MC 批改缺失");
        const q42=await page.evaluate(()=>window.PILOT.questions[41]);
        if(q42.correct!=="91/132" || !q42.prompt.includes("至多2名")) throw Error("卷二第42題未恢復原卷考核結構");
        await page.locator(`#question-42 .options input[value="${q42.answer}"]`).check({force:true});
        await page.locator("#question-42 [data-check]").click();
        if(!await page.locator("#question-42 .feedback").innerText().then(t=>t.includes("答對"))) throw Error("卷二第42題答案批改錯誤");
        if(width===390) await page.locator("#question-42").screenshot({path:`${root}/paper2-q42-390.png`});
        if(await page.locator("#question-44 .question-data tr").count()!==2 || await page.locator("#question-44 .question-data td").count()!==8) throw Error("卷二第44題數據表缺失");
        if(await page.locator("#question-40 svg text").allTextContents().then(items=>items.includes("M"))) throw Error("卷二第40題圖形不應預先提供輔助點");
        if(!await page.locator("#question-30 .exam-stem").innerText().then(text=>text.includes("方差"))) throw Error("卷二第30題漏了方差判斷");
        if(!await page.locator("#question-41 .exam-stem").innerText().then(text=>text.includes("90°≤θ≤360°"))) throw Error("卷二第41題角度範圍錯誤");
        for(let n=1;n<=45;n++) {
          const answer=await page.evaluate(n=>window.PILOT.questions[n-1].answer,n);
          await page.locator(`#question-${n} .options input[value="${answer}"]`).check({force:true});
          await page.locator(`#question-${n} [data-check]`).click();
          const feedback=page.locator(`#question-${n} .feedback`);
          if(!await feedback.locator("strong").innerText().then(text=>text==="答對")) throw Error(`卷二第${n}題正確選項批改錯誤`);
          if(await feedback.locator(".solution-steps p").count()<2) throw Error(`卷二第${n}題解答未分步`);
          const overflow=await page.locator(`#question-${n} .exam-content, #question-${n} .options label, #question-${n} .feedback`).evaluateAll(elements=>elements.some(el=>el.scrollWidth>el.clientWidth+2));
          if(overflow) throw Error(`卷二第${n}題內容溢出`);
          if([1004,320].includes(width) && [4,14,23,30,34,40,41,42,44].includes(n)) await page.locator(`#question-${n}`).screenshot({path:`${root}/aligned-paper2-q${n}-${width}.png`});
        }
      }
      const fonts=await page.locator(".practice-main").evaluate(el=>getComputedStyle(el).fontFamily);
      if(!fonts.includes("Times New Roman") || !fonts.includes("PMingLiU")) throw Error(`卷${paper} 試卷字體不符`);
      const expected=paper===1?[8,17]:[14,18,20,22,25,38,39,40];
      const found=await page.evaluate(()=>[...document.querySelectorAll(".exam-question")].filter(el=>el.querySelector(".diagram svg")).map(el=>Number(el.id.split("-")[1])));
      if(JSON.stringify(found)!==JSON.stringify(expected)) throw Error(`卷${paper}圖題不符：${found}`);
      const diagramErrors=await page.evaluate(()=>[...document.querySelectorAll(".exam-question .diagram svg")].flatMap(svg=>[...svg.querySelectorAll("path,circle,rect")].flatMap(el=>{
        const stroke=el.getAttribute("stroke");
        const fill=el.getAttribute("fill");
        const width=Number(el.getAttribute("stroke-width")||0);
        return (stroke && stroke!=="#111" || fill && !["none","#111"].includes(fill) || width>1.2)
          ? [`${svg.closest(".exam-question").id}: ${el.outerHTML.slice(0,100)}`] : [];
      })));
      if(diagramErrors.length) throw Error(`卷${paper}圖形不是細黑線：${diagramErrors.join("; ")}`);
      if(paper===2 && width===1440) {
        const labelErrors=await page.evaluate(()=>[...document.querySelectorAll(".exam-question .diagram svg")].flatMap(svg=>{
          const points=[...svg.querySelectorAll("path")].flatMap(path=>{
            const length=path.getTotalLength(),steps=Math.ceil(length),samples=[];
            for(let i=0;i<=steps;i++) samples.push(path.getPointAtLength(i*length/steps));
            return samples;
          });
          for(const circle of svg.querySelectorAll("circle")) {
            const radius=Number(circle.getAttribute("r"));
            if(radius<=4) continue;
            const cx=Number(circle.getAttribute("cx")),cy=Number(circle.getAttribute("cy"));
            for(let angle=0;angle<360;angle++) {
              const radians=angle*Math.PI/180;
              points.push({x:cx+radius*Math.cos(radians),y:cy+radius*Math.sin(radians)});
            }
          }
          const labels=[...svg.querySelectorAll("text")].map(text=>({name:text.textContent,box:text.getBBox()}));
          const errors=[],bounds=svg.viewBox.baseVal;
          for(let i=0;i<labels.length;i++) {
            const {name,box}=labels[i];
            if(box.x<0||box.y<0||box.x+box.width>bounds.width||box.y+box.height>bounds.height) errors.push(`${name} 出框`);
            if(points.some(point=>point.x>=box.x-1.5&&point.x<=box.x+box.width+1.5&&point.y>=box.y-1.5&&point.y<=box.y+box.height+1.5)) errors.push(`${name} 碰線`);
            for(let j=i+1;j<labels.length;j++) {
              const next=labels[j];
              if(box.x<next.box.x+next.box.width+2&&box.x+box.width+2>next.box.x&&box.y<next.box.y+next.box.height+2&&box.y+box.height+2>next.box.y) errors.push(`${name}/${next.name} 撞字`);
            }
          }
          return errors.map(error=>`${svg.closest(".exam-question").id}: ${error}`);
        }));
        if(labelErrors.length) throw Error(`卷二圖形標記錯位：${labelErrors.join("; ")}`);
      }
      if(paper===1) {
        if(await page.locator("#question-4 .exam-part").count()!==2) throw Error("卷一第4題分段錯誤");
        const q4=await page.locator("#question-4 .exam-content").innerText();
        if(!q4.includes("−")||!q4.includes("利用 (a)")) throw Error("卷一第4題負號或題幹錯誤");
      } else {
        const q14=await page.locator("#question-14 .diagram svg text").allTextContents();
        if(!["L₁","L₂","O","x","y"].every(label=>q14.includes(label))) throw Error("卷二第14題坐標軸或直線標示缺失");
        const parallels=await page.locator("#question-18 .exam-stem .math-parallel").allTextContents();
        if(parallels.length!==3 || parallels.some(mark=>mark!=="//")) throw Error("平行符號未按試卷呈現");
        if(await page.locator("#question-18 .exam-stem .math-relation").count()!==3) throw Error("平行關係被拆開");
        const minus=await page.locator("#question-3 .exam-stem .math-op").allTextContents();
        if(!minus.includes("−") || minus.includes("-")) throw Error("MC 數學減號未轉換");
        if(!await page.locator("#question-5 .exam-stem .math-op").allTextContents().then(items=>items.includes("−"))) throw Error("MC 減號未轉換");
        const layout=await page.locator("#question-18 .exam-choice-layout").evaluate(el=>{
          const options=el.querySelector(".options").getBoundingClientRect();
          const figure=el.querySelector(".diagram").getBoundingClientRect();
          return {options,figure,sideBySide:getComputedStyle(el).gridTemplateColumns.split(" ").length===2};
        });
        if(layout.sideBySide && layout.options.right>layout.figure.left) throw Error("圖及選項並排時重疊");
        if(!layout.sideBySide && layout.figure.bottom>layout.options.top) throw Error("窄欄圖及選項閱讀次序錯誤");
      }
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      if(overflow>2) throw Error(`卷${paper} ${width}px 溢出 ${overflow}`);
      await page.locator("#question-1").screenshot({path:`${root}/paper${paper}-${width}.png`});
      if(width===390) {
        await page.locator(".exam-title").screenshot({path:`${root}/paper${paper}-title-390.png`});
        await page.locator(paper===1?"#question-8":"#question-25").screenshot({path:`${root}/paper${paper}-figure-390.png`});
        await page.locator(paper===1?"#question-10":"#question-40").screenshot({path:`${root}/paper${paper}-later-390.png`});
        if(paper===2) {
          await page.locator("#question-22").screenshot({path:`${root}/paper2-q22-390.png`});
          await page.locator("#question-30").screenshot({path:`${root}/paper2-q30-390.png`});
        }
      }
      await page.reload();
      if(paper===1 && (await page.locator("#question-1 .hints li").count()!==1 || await page.locator("#question-1 [data-bookmark]").innerText()!=="★")) throw Error("卷一提示或收藏進度遺失");
      if(paper===2 && !await page.locator("#question-1 .feedback").count()) throw Error("MC 批改進度遺失");
      if(errors.length) throw Error(errors.join("; "));
      await context.close();
      console.log(`卷${paper} ${width}px：排版、圖題、作答及重新整理通過`);
    }
    const topics=await browser.newPage({viewport:{width:390,height:800}});
    await topics.goto(url(1)+"#topics");
    const summary=await topics.locator(".dse-summary").innerText();
    if(!summary.includes("286")||!summary.includes("44")) throw Error("卷一歷屆DSE課題數據缺失");
    await topics.locator("#dse-topic-search").fill("相似形");
    if(await topics.locator(".dse-row").count()!==1) throw Error("DSE課題搜尋錯誤");
    await topics.locator("[data-dse-topic]").click();
    if(!await topics.locator(".dse-detail .dse-example").count()) throw Error("DSE課題題目記錄缺失");
    await topics.locator("[data-dse-section=B]").click();
    if(!await topics.locator(".dse-detail").innerText().then(t=>t.includes("乙部"))) throw Error("DSE課題分部錯誤");
    await topics.locator("[data-dse-section=all]").click();
    await topics.locator("#dse-topic-search").fill("成本、標價與售價");
    if(await topics.locator(".dse-row").count()!==1 || await topics.locator(".dse-row b").innerText()!=="9") throw Error("卷一商品定價類別未出現");
    await topics.locator("[data-dse-topic]").click();
    if(!await topics.locator(".dse-detail").innerText().then(t=>t.includes("PP 1 題"))) throw Error("卷一商品定價PP題缺失");
    await topics.close();
    console.log("卷一第4題、歷屆DSE課題搜尋及兩卷細黑線圖形通過");

    const p2topics=await browser.newPage({viewport:{width:390,height:800}});
    await p2topics.goto(url(2)+"#topics");
    const p2summary=await p2topics.locator(".dse-summary").innerText();
    if(!["15","675","48"].every(t=>p2summary.includes(t))) throw Error("卷二歷屆DSE課題數據缺失");
    await p2topics.locator("#dse-topic-year").selectOption("2026");
    await p2topics.locator("[data-dse-section=B]").click();
    if(!await p2topics.locator(".dse-heading").innerText().then(t=>t.includes("15 題"))) throw Error("卷二2026乙部題數錯誤");
    await p2topics.locator("#dse-topic-search").fill("概率");
    const row=await p2topics.locator(".dse-row").first();
    const topic=await row.locator("[data-dse-topic]").getAttribute("data-dse-topic");
    const expected=await p2topics.evaluate(name=>window.DSE_TOPICS.questions.filter(q=>q.year===2026&&q.section==="B"&&q.concepts.includes(name)).length,topic);
    if(!expected || Number(await row.locator("b").innerText())!==expected) throw Error("卷二課題篩選出現次數錯誤");
    await row.locator("[data-dse-topic]").click();
    if(await p2topics.locator(".dse-detail .dse-example").count()!==expected) throw Error("卷二課題題目記錄缺失");
    await p2topics.locator("#dse-topic-year").selectOption("2023");
    await p2topics.locator("[data-dse-section=A]").click();
    await p2topics.locator("#dse-topic-search").fill("成本、標價與售價");
    if(await p2topics.locator(".dse-row").count()!==1 || await p2topics.locator(".dse-row b").innerText()!=="1") throw Error("卷二商品定價類別未出現");
    await p2topics.locator("[data-dse-topic]").click();
    if(!await p2topics.locator(".dse-detail").innerText().then(t=>t.includes("第 11 題"))) throw Error("卷二商品定價題號錯誤");
    const overflow=await p2topics.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    if(overflow>2) throw Error("卷二手機課題頁溢出");
    await p2topics.close();
    console.log("卷二歷屆DSE課題年份、分部、搜尋、詳情及第42題批改通過");

    const migrated=await browser.newPage({viewport:{width:390,height:800}});
    await migrated.goto(url(2)+"#papers");
    await migrated.evaluate(()=>{
      const key="dse-original-pilot-paper2-2026-v2";
      localStorage.setItem(key,JSON.stringify({schema:2,paper:2,progress:{
        answers:{1:"A",22:"B",26:"C",29:"D",30:"D",31:"A",42:"B"},
        checked:{1:true,22:true,26:true,31:true,42:true},
        hints:{22:2,26:1,31:1,42:1},saved:[22,30],mode:"untimed",finished:false
      }}));
    });
    await migrated.reload();
    await migrated.goto(url(2)+"#practice");
    if(!await migrated.locator('#question-1 .options input[value="A"]').isChecked()) throw Error("舊進度中未改題目遺失");
    if(!await migrated.locator('#question-29 .options input[value="D"]').isChecked()) throw Error("卷二第29題舊進度遺失");
    for(const n of [22,26,30,31,42]) {
      if(await migrated.locator(`#question-${n} .options input:checked`).count()) throw Error(`卷二第${n}題沿用舊答案`);
      if(await migrated.locator(`#question-${n} .feedback, #question-${n} .hints li`).count()) throw Error(`卷二第${n}題沿用舊批改或提示`);
    }
    await migrated.locator("#question-1 [data-hint]").click();
    const revised=await migrated.evaluate(()=>JSON.parse(localStorage.getItem("dse-original-pilot-paper2-2026-v2")).progress);
    if(revised.questionRevision!==4 || revised.answers[22] || revised.answers[26] || revised.answers[30] || revised.answers[31] || revised.answers[42] || revised.saved.join(",")!=="22,30") throw Error("卷二題目更新進度遷移錯誤");
    await migrated.evaluate(()=>localStorage.setItem("dse-original-pilot-paper2-2026-v2",JSON.stringify({
      schema:2,paper:2,progress:{
        questionRevision:3,answers:Object.fromEntries(Array.from({length:45},(_,i)=>[i+1,"A"])),
        checked:Object.fromEntries(Array.from({length:45},(_,i)=>[i+1,true])),
        hints:Object.fromEntries(Array.from({length:45},(_,i)=>[i+1,1])),saved:[14,22,30,42],mode:"untimed"
      }
    })));
    await migrated.reload();
    await migrated.locator("#question-1 [data-hint]").click();
    const currentMigration=await migrated.evaluate(()=>JSON.parse(localStorage.getItem("dse-original-pilot-paper2-2026-v2")).progress);
    const changed=[4,5,8,9,12,14,15,23,26,30,34,36,40,41,42,44];
    for(let n=1;n<=45;n++) {
      if(changed.includes(n)) {
        if(currentMigration.answers[n] || currentMigration.checked[n] || currentMigration.hints[n]) throw Error(`卷二第${n}題仍沿用換題前進度`);
      } else if(currentMigration.answers[n]!=="A" || !currentMigration.checked[n] || !currentMigration.hints[n]) throw Error(`卷二第${n}題未改題目的進度遺失`);
    }
    if(currentMigration.saved.join(",")!=="14,22,30,42") throw Error("卷二換題不應刪除收藏");
    await migrated.close();
    console.log("卷二換題只清除受影響題目的舊作答，其他進度及收藏保留");

    const migratedP1=await browser.newPage({viewport:{width:390,height:800}});
    await migratedP1.goto(url(1)+"#papers");
    await migratedP1.evaluate(()=>localStorage.setItem("dse-original-pilot-paper1-2026-v2",JSON.stringify({
      schema:2,paper:1,progress:{answers:{1:"舊作答"},hints:{1:2,7:1,14:4},saved:[1,14],mode:"untimed"}
    })));
    await migratedP1.reload();
    await migratedP1.goto(url(1)+"#practice");
    if(await migratedP1.locator("#question-1 .hints li, #question-14 .hints li").count()) throw Error("卷一仍顯示換題前的提示");
    if(await migratedP1.locator("#question-7 .hints li").count()!==1) throw Error("卷一未改題目提示遺失");
    await migratedP1.locator("#question-14 [data-hint]").click();
    const progressP1=await migratedP1.evaluate(()=>JSON.parse(localStorage.getItem("dse-original-pilot-paper1-2026-v2")).progress);
    if(progressP1.questionRevision!==1 || progressP1.answers[1]!=="舊作答" || progressP1.saved.join(",")!=="1,14") throw Error("卷一舊作答或收藏遺失");
    await migratedP1.goto(url(1)+"#guide");
    if(await migratedP1.locator(".marking-scheme").count()!==19) throw Error("技巧站未同步新解答");
    await migratedP1.close();
    console.log("卷一換題清除舊提示，保留原有作答及收藏；技巧站解答同步");

    const context=await browser.newContext({viewport:{width:390,height:800},acceptDownloads:true});
    const page=await context.newPage();
    await page.goto(url(2)+"#find");
    await page.locator("#query-filter").fill("圓方程");
    await page.locator("[data-open]").first().click();
    await page.locator(".inline .options label").first().click();
    await page.locator(".inline [data-hint]").click();
    if(!await page.locator(".inline .hints li").count()) throw Error("搜尋內提示缺失");
    await page.locator(".inline [data-check]").click();
    if(!await page.locator(".inline .feedback").count()) throw Error("搜尋內批改缺失");
    await page.goto(url(2)+"#saved");
    const downloadEvent=page.waitForEvent("download");
    await page.locator("[data-export]").click();
    const download=await downloadEvent;
    const text=fs.readFileSync(await download.path(),"utf8");
    const backup=JSON.parse(text);
    if(backup.paper!==2 || backup.schema!==2 || !backup.progress.answers[27]) throw Error("卷二備份不完整");
    await page.goto(url(1)+"#saved");
    page.on("dialog", dialog=>dialog.dismiss());
    await page.locator("#import-file").setInputFiles({name:"backup.json",mimeType:"application/json",buffer:Buffer.from(text)});
    if(await page.evaluate(()=>localStorage.getItem("dse-original-pilot-paper1-2026-v2"))!==null) throw Error("跨卷備份被接受");
    await context.close();

    const timed=await browser.newContext({viewport:{width:390,height:800}});
    const timedPage=await timed.newPage();
    timedPage.on("dialog", dialog=>dialog.accept());
    await timedPage.goto(url(2));
    await timedPage.locator("[data-start=timed]").click();
    await timedPage.locator("#timer").waitFor();
    const correct=await timedPage.evaluate(()=>window.PILOT.questions[0].answer);
    const wrong="ABCD".split("").find(letter=>letter!==correct);
    await timedPage.locator(`#question-1 .options input[value="${wrong}"]`).check({force:true});
    await timedPage.locator("#question-1 [data-check]").click();
    await timedPage.reload();
    if(!await timedPage.locator("#timer").count()) throw Error("計時未保留");
    await timedPage.locator("[data-finish]").click();
    if(!await timedPage.locator(".exam-result").count()) throw Error("交卷結果缺失");
    await timedPage.goto(url(2)+"#saved");
    await timedPage.locator("[data-retry]").click();
    await timedPage.locator("#question-1").waitFor();
    await timed.close();
    console.log("搜尋內操練、計時、MC 批改、錯題及分卷備份通過");
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
