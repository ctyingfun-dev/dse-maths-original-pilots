(() => {
  const data = window.PILOT;
  const year = data.year || 2026;
  const math = window.mathText;
  const curriculumNotice = window.pilotCurriculumNotice;
  const key = `dse-original-pilot-paper${data.paper}-${year}-v2`;
  const schema = 2;
  const marks = year!==2026 ? [0,...data.questions.map(q=>q.marks)] : [0,3,3,3,4,4,4,4,5,5,6,6,7,8,8,4,6,6,7,12];
  const letters = "ABCD";
  const questionRevision = year===2016 || year===2017 || year===2018 || year===2019 || year===2020 || year===2021 || year===2022 || year===2023 ? 1 : 2;
  const revisedQuestions = data.questions.map(q=>q.n);
  const blank = () => ({answers:{}, checked:{}, hints:{}, saved:[], questionRevision, startedAt:null, deadline:null, mode:"untimed", finished:false});
  let state = load();
  let route = "papers";
  let active = state.active || 1;
  let topic = "全部";
  let query = "";
  let dseSection = "all";
  let dseSearch = "";
  let dsePage = 1;
  let dseDetail = "";
  let yearYear = "2026";
  let yearSection = "all";
  let yearDetail = "";
  let session = [];
  let lastFocus = null;
  let pendingScroll = null;
  let saveFailed = false;

  function migrateProgress(saved) {
    const progress = {...blank(), ...saved};
    if (saved.questionRevision !== questionRevision) {
      progress.hints = {...progress.hints};
      for (const n of revisedQuestions) delete progress.hints[n];
      progress.answers = {...progress.answers};
      progress.checked = {...progress.checked};
      for (const n of revisedQuestions) {
        delete progress.answers[n];
        delete progress.checked[n];
      }
      progress.questionRevision = questionRevision;
    }
    return progress;
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || saved.schema !== schema || saved.paper !== data.paper) return blank();
      return migrateProgress(saved.progress);
    } catch { return blank(); }
  }
  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify({schema,paper:data.paper,year,progress:state}));
      saveFailed = false;
    } catch {
      saveFailed = true;
    }
    const status = document.querySelector("#save-state");
    if (status) {
      status.textContent = saveFailed ? "未能儲存；請先到收藏頁下載進度備份。" : "已儲存";
      status.dataset.error = String(saveFailed);
    }
  }
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const question = n => data.questions.find(item => item.n === n);
  const count = data.questions.length;
  const topics = [...new Set(data.questions.map(q => q.topic))];
  const selected = q => state.answers[q.n] ?? "";
  const right = q => data.paper === 2 && selected(q) === q.answer;
  function solutionHtml(q) {
    const subtotal = part => part.steps.reduce((sum, step) => sum + parseInt(step.marks, 10), 0);
    const total = q.solution.reduce((sum, part) => sum + subtotal(part), 0);
    return `<div class="solution-steps"><p class="scheme-key">1M：方法分；1A：準確分。接受其他正確方法及等值答案。</p><table class="marking-scheme"><caption>建議評分參考（非官方）</caption><colgroup><col><col class="scheme-score-column"></colgroup><thead><tr><th scope="col">解答及評分要點</th><th scope="col">分數</th></tr></thead>${q.solution.map(part=>`<tbody>${part.part?`<tr class="scheme-part"><th colspan="2" scope="rowgroup">${esc(part.part)} <span>（${subtotal(part)} 分）</span></th></tr>`:""}${part.steps.map(step=>`<tr class="scheme-step"><td class="scheme-answer">${window.solutionHtml(step.text)}</td><td class="scheme-score">${esc(step.marks)}</td></tr>`).join("")}</tbody>`).join("")}<tfoot><tr><th scope="row">全題總分</th><td class="scheme-total">${total}</td></tr></tfoot></table></div>`;
  }
  function diagram(spec) {
    if (!spec) return "";
    const kind = typeof spec === "string" ? spec : spec.type;
    if (kind.endsWith("2016")) return window.pilotDiagram2016(kind);
    if (kind.endsWith("2017")) return window.pilotDiagram2017(kind);
    if (kind.endsWith("2018")) return window.pilotDiagram2018(kind);
    if (kind.endsWith("2019")) return window.pilotDiagram2019(kind);
    if (kind.endsWith("2020")) return window.pilotDiagram2020(kind);
    if (kind.endsWith("2021")) return window.pilotDiagram2021(kind);
    if (kind.endsWith("2022")) return window.pilotDiagram2022(kind);
    if (kind.endsWith("2023")) return window.pilotDiagram2023(kind);
    if (kind.endsWith("2024")) return window.pilotDiagram2024(kind);
    if (kind === "table2025") return `<table class="exam-table" aria-label="${esc(spec.label)}"><tbody>${spec.rows.map(row=>`<tr>${row.map((v,i)=>i?`<td>${math(v)}</td>`:`<th scope="row">${esc(v)}</th>`).join("")}</tr>`).join("")}</tbody></table>`;
    if (kind === "frequency") return `<div class="exam-table-pair">${spec.tables.map(table=>`<table class="exam-table" aria-label="${esc(table.label)}"><thead><tr>${table.rows[0].map(value=>`<th scope="col">${esc(value)}</th>`).join("")}</tr></thead><tbody>${table.rows.slice(1).map(row=>`<tr>${row.map(value=>`<td>${math(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("")}</div>`;
    if (kind === "stemleaf") return `<table class="stemleaf" aria-label="${esc(spec.label)}"><thead><tr><th>幹<span class="place-value">（十位）</span></th><th>葉<span class="place-value">（個位）</span></th></tr></thead><tbody>${spec.rows.map(row=>`<tr><th scope="row">${esc(row.stem)}</th><td><div class="stemleaf-leaves">${row.leaves.map(leaf=>`<span>${math(leaf)}</span>`).join(" ")}</div></td></tr>`).join("")}</tbody></table>${spec.key?`<p class="key">${esc(spec.key)}</p>`:""}`;
    const line = 'fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
    const shade = 'fill="#e7f4f1" stroke="#087d70" stroke-width="2"';
    let drawing = "";
    if (kind === "crossed2025") drawing = `<path d="M40 130L220 15L180 120L80 25Z" ${line}/><text x="222" y="14">J</text><text x="24" y="143">K</text><text x="181" y="138">L</text><text x="66" y="20">M</text><text x="131" y="52">N</text>`;
    if (kind === "box2025") drawing = `<path d="M20 78H240 M20 65V91 M87.22 48H172.78V108H87.22Z M136.11 48V108 M240 65V91 M10 112H250" ${line}/><text x="11" y="133">24</text><text x="78" y="133">35</text><text x="127" y="133">43</text><text x="164" y="133">49</text><text x="231" y="133">60</text>`;
    if (kind === "coordinate") drawing = `<path d="M15 115H245M55 135V12" stroke="#60757b"/><path d="M30 102L223 36" ${line}/><circle cx="105" cy="77" r="4" fill="#d17435"/><text x="231" y="120">x</text><text x="45" y="18">y</text>`;
    if (kind === "right" || kind === "trig") drawing = `<path d="M40 115L40 25L200 115Z" ${shade}/><path d="M40 104h11v11" ${line}/><text x="17" y="72">${esc(spec.a || spec.opposite || "a")}</text><text x="110" y="135">${esc(spec.b || "b")}</text><text x="123" y="57">${esc(spec.hyp || "c")}</text>`;
    if (kind === "circle") drawing = `<circle cx="128" cy="70" r="53" ${shade}/><path d="M128 70H181" stroke="#d17435" stroke-width="2"/><circle cx="128" cy="70" r="3" fill="#d17435"/><text x="146" y="61">${spec.r ? `r = ${esc(spec.r)}` : "r"}</text>`;
    if (kind === "similar" || kind === "similarTriangles") drawing = `<path d="M14 119L71 21L151 119Z M175 119L201 70L244 119Z" ${shade}/><text x="18" y="67">x+2</text><text x="116" y="72">16</text><text x="174" y="91">4</text><text x="213" y="92">x+2</text>`;
    if (kind === "joinedParallel") drawing = `<path d="M90 15L15 130H240 M90 15L150 130 M15 130L204 61L240 130" ${line}/><text x="85" y="9">J</text><text x="148" y="151">K</text><text x="3" y="151">L</text><text x="138" y="68">M</text><text x="242" y="151">N</text><text x="205" y="53">P</text>`;
    if (kind === "rightSimilar") drawing = `<path d="M15 119V65H85V119Z M122 119V18H242V119Z" ${shade}/><path d="M15 108H26V119 M122 108H133V119" ${line}/><text x="20" y="92">5</text><text x="43" y="137">12</text><text x="140" y="137">24</text>`;
    if (kind === "bars" || kind === "frequency") drawing = spec.values.map((v,i) => `<rect x="${30+i*53}" y="${121-v*7}" width="28" height="${v*7}" fill="${i%2?"#087d70":"#d17435"}"/><text x="${36+i*53}" y="139">${esc(v)}</text>`).join("") + '<path d="M20 121H244" stroke="#60757b"/>';
    if (kind === "lines" || kind === "linear" || kind === "locus") drawing = `<path d="M20 120H240M48 137V13" stroke="#60757b"/><path d="M48 35L211 120 M48 76L211 120" ${line}/><text x="63" y="38">L₁</text><text x="63" y="78">L₂</text><text x="229" y="137">x</text>`;
    if (kind === "sector") drawing = `<path d="M65 120L65 24A96 96 0 0 1 160 120Z" ${shade}/><circle cx="65" cy="120" r="3" fill="#d17435"/><text x="74" y="109">O</text><text x="85" y="75">r</text>`;
    if (kind === "pyramid") drawing = `<path d="M125 15L25 110L95 137L225 111Z M125 15L225 111 M25 110L165 88L225 111 M95 137L165 88" ${line}/><path d="M82 65L186 65L209 88L59 88Z" fill="#d6ece7" stroke="#087d70" stroke-width="2"/><path d="M125 15V112" stroke="#d17435" stroke-dasharray="4 4"/>`;
    if (kind === "trapezoid") drawing = `<path d="M61 30H154L230 120H20Z M72 85H199 M154 30L20 120" ${line}/><text x="57" y="25">A</text><text x="155" y="25">B</text><text x="235" y="126">C</text><text x="7" y="126">D</text><text x="75" y="81">E</text><text x="201" y="84">F</text>`;
    if (kind === "concave") drawing = `<path d="M25 20H175L220 65H170V125H25Z" ${shade}/><path d="M25 31H36V20 M25 114H36V125 M159 125V114H170" ${line}/><text x="164" y="42">p</text><text x="190" y="59">r</text><text x="176" y="91">q</text>`;
    if (kind === "square") drawing = `<path d="M62 18H188V138H62Z M125 18L188 138 M62 138L125 18" ${line}/><text x="46" y="19">A</text><text x="195" y="19">B</text><text x="195" y="143">C</text><text x="46" y="143">D</text><text x="121" y="13">E</text><text x="121" y="145">F</text>`;
    if (kind === "circleAngles") drawing = `<circle cx="130" cy="75" r="60" ${line}/><path d="M80 42L170 32L181 106L93 120Z M80 42L181 106 M170 32L93 120 M130 75L80 42 M130 75L170 32" ${line}/><circle cx="130" cy="75" r="3" fill="#d17435"/><text x="65" y="37">P</text><text x="169" y="23">Q</text><text x="188" y="111">R</text><text x="81" y="137">S</text><text x="134" y="83">O</text>`;
    if (kind === "cyclic") drawing = `<circle cx="130" cy="75" r="60" ${line}/><path d="M80 42L170 32L181 106L93 120Z M80 42L181 106" ${line}/><path d="M80 42L21 9" stroke="#d17435" stroke-width="2"/><text x="64" y="38">A</text><text x="170" y="23">B</text><text x="189" y="112">C</text><text x="78" y="138">D</text>`;
    if (kind === "joinedTriangles") drawing = `<path d="M91 20L91 127L20 78Z M91 20L226 83L91 127" ${shade}/><path d="M91 20V127" stroke="#d17435" stroke-dasharray="4 4"/><text x="100" y="76">共用邊</text>`;
    if (kind === "boxplot") drawing = `<path d="M20 80H233 M37 66V94 M80 48H177V112H80Z M126 48V112 M219 66V94" ${line}/><text x="27" y="117">min</text><text x="80" y="135">Q₁</text><text x="121" y="135">Q₂</text><text x="174" y="135">Q₃</text>`;
    if (kind === "rays") drawing = `<path d="M30 125H235 M30 125L125 30 M30 125L190 5" ${line}/><path d="M78 125A48 48 0 0 0 69 98" ${line}/><text x="28" y="142">U</text><text x="110" y="26">S</text><text x="194" y="18">V</text>`;
    if (kind === "prism") drawing = `<path d="M55 120L195 120L125 65Z M55 85L195 85L125 30Z M55 120V85 M195 120V85 M125 65V30" ${line}/><path d="M55 85L195 120L125 65Z" fill="#e7f4f1" fill-opacity=".75" stroke="#d17435" stroke-width="2"/><path d="M55 120L160 92 M55 85L160 92" ${line}/><circle cx="160" cy="92" r="3" fill="#d17435"/><text x="40" y="138">A</text><text x="202" y="134">B</text><text x="111" y="76">C</text><text x="39" y="83">E</text><text x="163" y="89">M</text>`;
    if (kind === "tiltedPlane") drawing = `<path d="M12 190L49 130H285L249 190Z" fill="none" stroke="#111" stroke-width=".85" stroke-dasharray="7 4 1 4"/><path d="M55 161L126 192L242 178 M55 161L98 55L236 104L242 178 M98 55L126 192" ${line}/><path d="M55 161L236 104 M55 161L242 178 M126 192L236 104" fill="none" stroke="#111" stroke-width=".9" stroke-dasharray="5 4"/><text x="12" y="151">W</text><text x="118" y="211">J</text><text x="258" y="210">K</text><text x="239" y="102">L</text><text x="91" y="47">M</text>`;
    if (!drawing) return "";
    return `<figure class="diagram"><svg viewBox="${kind==="tiltedPlane"?"0 0 300 220":kind==="joinedParallel"?"0 -10 270 170":"0 0 260 150"}" role="img" aria-label="${kind==="tiltedPlane"?"角錐 WJKLM 的透視圖，面 WJK 位於水平面":"本題圖形；不按比例繪製"}">${drawing}</svg><figcaption>圖（不按比例）</figcaption></figure>`;
  }
  function shell(content) {
    const current = route==="practice" ? "papers" : route;
    const resources = [["topics","課題分布"],["years","逐年課題"],["guide","技巧站"],["programs","計算機 Program"]];
    const navLink = ([id,label]) => `<a href="${id==="home"?`../?year=${year}`:`#${id}`}" ${current===id?'aria-current="page"':""}>${label}${id==="saved"?` <small>${state.saved.length}</small>`:""}</a>`;
    document.querySelector("#app").innerHTML = `
      <div class="workspace">
        <a class="skip-link" href="#main-content">跳至主要內容</a>
        <header class="site-header">
          <div class="header-inner">
            <a class="brand" href="../?year=${year}" aria-label="DSE 數學主頁"><span class="brand-mark" aria-hidden="true">π</span><div><strong>DSE 數學</strong><small>原創模擬卷</small></div></a>
            <nav class="primary-nav" aria-label="主要導覽">${[["home","主頁"],["find","題目庫"],["papers","模擬試卷"],["saved","收藏與錯題"]].map(navLink).join("")}</nav>
            <div class="header-tools">
              <label class="mock-year">年份 <select id="mock-year">${[2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026].map(value=>`<option value="${value}" ${year===value?"selected":""}>${value}</option>`).join("")}</select></label>
              <nav class="paper-switch" aria-label="選擇試卷">${[1,2].map(paper=>`<a href="../paper${paper}/${year!==2026?`?year=${year}`:""}" ${paper===data.paper?'aria-current="true"':'class="other-paper"'}>卷${paper===1?"一":"二"}</a>`).join("")}</nav>
            </div>
          </div>
          <div class="navigation-inner">
            ${route==="find"?"":`<span class="workspace-edition">${year}<span>原創卷一</span></span>`}
            <nav class="resource-nav" aria-label="課題與工具">${resources.map(navLink).join("")}</nav>
          </div>
        </header>
        <main id="main-content" tabindex="-1">${content}</main>
        <footer><span>原創模擬卷 · 非香港考評局試卷</span><span id="save-state" role="status" data-error="${saveFailed}">${saveFailed?"未能儲存；請先到收藏頁下載進度備份。":"本機進度"}</span></footer>
      </div>`;
    const downloadHost=document.querySelector('.practice-header, .paper-intro .start');
    if(downloadHost) {
      const filename=`dse-original-${year}-paper1-solutions.pdf`;
      const link=document.createElement('a');
      link.className='export-pdf solution-pdf';link.href=`../output/pdf/${filename}`;link.download=filename;
      link.title='下載全卷參考解答及評分參考（非官方）';link.textContent='參考解答 PDF';
      downloadHost.append(link);
    }
    document.querySelectorAll(".lessons p, .lessons li").forEach(el=>el.innerHTML=math(el.textContent));
    bind();
  }
  function heading(title, context = "") {
    return `<div class="page-head"><h1>${title}</h1><p class="subtle">${context?`${esc(context)} · `:""}${esc(data.subtitle)} · 非官方原創試題。${data.paper===1?"長題不自動批改，可自行對照參考解答。":"選擇題可提交批改。"}</p></div>`;
  }
  function searchCard(q) {
    const done = data.paper===1 ? "" : state.checked[q.n] ? (right(q)?"答對":"待重做") : "未批改";
    return `<article class="result" data-result="${q.n}"><div class="result-index"><small>題目</small><strong>${String(q.n).padStart(2,"0")}</strong></div><div class="result-content"><div class="result-top"><strong>${esc(q.topic)}</strong><span>${esc(q.section)}${done?` · <span class="result-status">${done}</span>`:""}</span></div><div class="result-prompt">${examPrompt(q,true)}</div></div><div class="result-actions"><button type="button" data-open="${q.n}" aria-expanded="false" aria-controls="inline-${q.n}">提示與解答</button><button type="button" class="bookmark" data-bookmark="${q.n}" title="${state.saved.includes(q.n)?"取消收藏":"收藏"}第 ${q.n} 題" aria-label="${state.saved.includes(q.n)?"取消收藏":"收藏"}第 ${q.n} 題">${state.saved.includes(q.n)?"★":"☆"}</button></div><div class="inline" id="inline-${q.n}"></div></article>`;
  }
  function findPage() {
    const matches = data.questions.filter(q => (topic==="全部" || q.topic===topic) && (`${q.n} ${q.topic} ${q.prompt}`).includes(query));
    return `<div class="page-head find-head"><h1>題目庫</h1><p class="subtle">${year} 原創卷一</p></div>
      <div class="find-layout">${window.PilotWorkspace.topicIndex(data.questions,topic)}
        <section class="question-stream" aria-label="題目列表">
          <section class="filters" role="search" aria-label="搜尋原創題目">
            <label class="query-field">搜尋題目<span class="search-input">${window.PilotWorkspace.icon("search")}<input type="search" id="query-filter" value="${esc(query)}" placeholder="題號、關鍵字或課題"></span></label>
            <label class="topic-select">課題<span class="topic-control"><span class="topic-value" aria-hidden="true">${esc(topic)}</span>${window.PilotWorkspace.icon("chevron-down")}<select id="topic-filter"><option>全部</option>${topics.map(t=>`<option ${topic===t?"selected":""}>${esc(t)}</option>`).join("")}</select></span></label>
          </section>
          <div class="results-heading"><p class="count" role="status">${matches.length} 題</p></div>
          <div class="result-grid">${matches.map(searchCard).join("") || '<p class="empty-results">沒有符合的題目。</p>'}</div>
        </section>
      </div>`;
  }
  function topicPage() {
    const source=window.DSE_TOPICS;
    const key=dseSection==="all"?"count":dseSection;
    const rows=source.stats.filter(s=>s.topic.includes(dseSearch.trim())).sort((a,b)=>b[key]-a[key]||b.count-a.count);
    const pages=Math.max(1,Math.ceil(rows.length/10));
    dsePage=Math.min(dsePage,pages);
    const max=Math.max(1,...rows.map(s=>s[key]));
    const sections=[["all","全卷"],["A1","甲一"],["A2","甲二"],["B","乙部"]];
    const detail=source.stats.find(s=>s.topic===dseDetail);
    const matches=detail?source.groups.filter(q=>q.topics.includes(detail.topic)&&(dseSection==="all"||q.section===dseSection)): [];
    const formal=matches.filter(q=>q.year!=="PP").sort((a,b)=>Number(a.year)-Number(b.year)||a.parent-b.parent);
    const pp=matches.filter(q=>q.year==="PP");
    const records=list=>list.map(q=>`<div class="dse-example"><strong>${esc(q.year==="PP"?"PP 練習卷":q.year)} · 第 ${esc(q.parent)} 題</strong><span>${curriculumNotice(q)}${esc(q.summary)}</span></div>`).join("");
    const formalCount=source.groups.filter(q=>q.year!=="PP").length;
    return `<div class="page-head"><p class="eyebrow">DSE 歷屆卷一 · 2012–2026</p><h1>課題分佈</h1><p class="subtle">原有 DSE 網站的歷年分類統計；與本原創模擬卷的 ${data.questions.length} 題分開計算。</p></div>
      <div class="dse-summary"><div><strong>15</strong><span>年正式試卷</span></div><div><strong>${formalCount}</strong><span>道卷一大題</span></div><div><strong>${source.stats.length}</strong><span>項課題分類</span></div></div>
      <div class="dse-heading"><h2>課題出現次數</h2><label>搜尋課題<input id="dse-topic-search" type="search" value="${esc(dseSearch)}" placeholder="輸入課題名稱"></label></div>
      <div class="dse-tabs" role="group" aria-label="試卷部分">${sections.map(([id,name])=>`<button type="button" data-dse-section="${id}" aria-pressed="${dseSection===id}">${name}</button>`).join("")}</div>
      <div class="dse-legend"><span><i class="a1"></i>甲一</span><span><i class="a2"></i>甲二</span><span><i class="b"></i>乙部</span><span>單位：大題</span></div>
      <div class="dse-distribution">${rows.slice((dsePage-1)*10,dsePage*10).map((s,i)=>`<div class="dse-row"><span>${String((dsePage-1)*10+i+1).padStart(2,"0")}</span><button type="button" data-dse-topic="${esc(s.topic)}" aria-expanded="${dseDetail===s.topic}">${esc(s.topic)}</button><div class="dse-bar" role="img" aria-label="${esc(s.topic)} ${s[key]} 題">${[["A1","a1"],["A2","a2"],["B","b"]].map(([part,style])=>`<span class="${style}" style="width:${dseSection==="all"||dseSection===part?s[part]/max*100:0}%"></span>`).join("")}</div><b>${s[key]}</b></div>`).join("")||"<p>找不到課題。</p>"}</div>
      ${pages>1?`<div class="dse-pages"><button type="button" data-dse-page="${dsePage-1}" ${dsePage===1?"disabled":""} aria-label="上一頁">‹</button><span>${dsePage} / ${pages}</span><button type="button" data-dse-page="${dsePage+1}" ${dsePage===pages?"disabled":""} aria-label="下一頁">›</button></div>`:""}
      ${detail?`<section class="dse-detail"><div class="dse-detail-head"><div><h2>${esc(detail.topic)}</h2><p>${detail.count} 道正式卷大題 · ${detail.years}/15 年出現 · PP ${detail.pp} 題</p></div><button type="button" data-dse-close aria-label="收起課題題目">×</button></div><p class="subtle">目前顯示${dseSection==="all"?"全卷":sections.find(([id])=>id===dseSection)[1]}：${formal.length} 道正式卷大題${pp.length?`、${pp.length} 道 PP 題`:""}。</p>${formal.length?`<h3>正式卷</h3><div class="dse-examples">${records(formal)}</div>`:""}${pp.length?`<h3>PP 練習卷</h3><div class="dse-examples">${records(pp)}</div>`:""}${!matches.length?"<p>此部分未有記錄。</p>":""}</section>`:""}
      <p class="note">一題可包含多個課題；各課題次數不能相加。<a href="https://dse-maths-school.ctyingfun.workers.dev/#topics" target="_blank" rel="noopener">到原 DSE 網站查看完整題庫 ↗</a></p>`;
  }
  function yearPage() {
    const source=window.DSE_TOPICS;
    const years=[...new Set(source.groups.map(q=>q.year).filter(y=>/^\d{4}$/.test(y)))].sort();
    const index=years.indexOf(yearYear);
    const all=source.groups.filter(q=>q.year===yearYear);
    const pool=all.filter(q=>yearSection==="all"||q.section===yearSection);
    const sections=[["all","全卷"],["A1","甲部（一）"],["A2","甲部（二）"],["B","乙部"]];
    const counts=new Map();
    for(const q of pool) for(const name of new Set(q.topics)) {
      if(!counts.has(name)) counts.set(name,{topic:name,A1:0,A2:0,B:0,questions:[]});
      const row=counts.get(name);
      row[q.section]++;
      row.questions.push(q);
    }
    const rows=[...counts.values()].sort((a,b)=>b.questions.length-a.questions.length||a.topic.localeCompare(b.topic,"zh-Hant"));
    const max=Math.max(1,...rows.map(row=>row.questions.length));
    const selected=rows.find(row=>row.topic===yearDetail);
    return `<div class="page-head"><p class="eyebrow">DSE 歷屆卷一 · 正式試卷</p><h1>逐年課題分佈</h1><p class="subtle">按年份查看該卷每個課題的出現次數及題號；不包括 PP 練習卷。</p></div>
      <div class="year-controls"><button type="button" data-year-step="-1" ${index===0?"disabled":""} aria-label="上一年" title="上一年">‹</button><label>年份<select id="year-select">${years.map(y=>`<option value="${y}" ${yearYear===y?"selected":""}>${y}</option>`).join("")}</select></label><button type="button" data-year-step="1" ${index===years.length-1?"disabled":""} aria-label="下一年" title="下一年">›</button><a href="#topics">查看歷年總覽 →</a></div>
      <div class="year-summary"><div><strong>${all.length}</strong><span>${yearYear} 年大題</span></div><div><strong>${pool.length}</strong><span>目前範圍大題</span></div><div><strong>${rows.length}</strong><span>項課題</span></div></div>
      <div class="year-tabs" role="group" aria-label="試卷部分">${sections.map(([id,name])=>`<button type="button" data-year-section="${id}" aria-pressed="${yearSection===id}">${name}</button>`).join("")}</div>
      <div class="year-heading"><h2>${yearYear} 年 · ${sections.find(([id])=>id===yearSection)[1]}</h2><span>出現次數 · 題號</span></div>
      <div class="year-legend"><span><i class="a1"></i>甲部（一）</span><span><i class="a2"></i>甲部（二）</span><span><i class="b"></i>乙部</span></div>
      <div class="year-list">${rows.map(row=>`<div class="year-row"><button type="button" data-year-topic="${esc(row.topic)}" aria-expanded="${selected===row}">${esc(row.topic)}</button><div class="year-bar" role="img" aria-label="${esc(row.topic)} ${row.questions.length} 題">${[["A1","a1"],["A2","a2"],["B","b"]].map(([part,style])=>`<span class="${style}" style="width:${row[part]/max*100}%"></span>`).join("")}</div><b>${row.questions.length}</b><span class="year-refs">${row.questions.map(q=>`第 ${q.parent} 題`).join("、")}</span></div>`).join("")}</div>
      ${selected?`<section class="year-detail"><div class="dse-detail-head"><div><h2>${esc(selected.topic)}</h2><p>${yearYear} 年 · ${selected.questions.length} 題</p></div><button type="button" data-year-close aria-label="收起題目摘要">×</button></div><div class="dse-examples">${selected.questions.map(q=>`<div class="dse-example"><strong>${sections.find(([id])=>id===q.section)[1]} · 第 ${q.parent} 題</strong><span>${curriculumNotice(q)}${esc(q.summary)}</span></div>`).join("")}</div></section>`:""}
      <p class="note">一題可涉及多個課題，課題次數相加不等於大題總數。分類依據歷屆 DSE 題目；本頁不是原創模擬卷的統計。</p>`;
  }
  function paperPage() {
    const sections=[...new Set(data.questions.map(q=>q.section))];
    const names={"甲一":"甲部（1）","甲二":"甲部（2）","乙部":"乙部"};
    return `<section class="paper-intro" aria-labelledby="paper-title">
      <div class="paper-identity"><p class="paper-subject">數學必修部分</p><h1 id="paper-title">${year} 模擬試卷一</h1>
        <dl class="paper-facts"><div><dt>全卷</dt><dd>${count} 道大題</dd></div><div><dt>時間</dt><dd>${data.minutes} 分鐘</dd></div><div><dt>總分</dt><dd>${data.questions.reduce((sum,q)=>sum+marks[q.n],0)} 分</dd></div></dl>
        <p class="paper-edition">非官方原創改編</p>
      </div>
      <div class="start"><button type="button" data-start="untimed">不限時開始</button><button type="button" data-start="timed" class="outline">計時 ${data.minutes} 分鐘</button>${state.startedAt&&!state.finished?'<button type="button" data-resume class="quiet">繼續上次操練</button>':""}</div>
    </section>
    <div class="paper-session"><span>本卷收藏 <b>${state.saved.length}</b> 題</span><a href="#saved">查看收藏</a></div>
    <section class="paper-directory" aria-labelledby="directory-title"><div class="directory-heading"><h2 id="directory-title">選題操練</h2></div>
      ${sections.map((section,index)=>{
        const questions=data.questions.filter(q=>q.section===section);
        return `<section class="paper-part part-${index}" aria-labelledby="part-${index}"><div class="part-heading"><h3 id="part-${index}">${esc(names[section]||section)}</h3><p>第 ${questions[0].n}–${questions.at(-1).n} 題<span>${questions.reduce((sum,q)=>sum+marks[q.n],0)} 分</span></p></div><div class="number-grid">${questions.map(q=>{
          const notice=curriculumNotice(q);
          return `<button type="button" data-solo="${q.n}" title="${esc(q.topic)}" aria-label="第 ${q.n} 題：${esc(q.topic)}${notice?"（已取消）":""}"><span class="directory-number">${String(q.n).padStart(2,"0")}</span><span class="directory-topic">${esc(q.topic)}${notice}</span></button>`;
        }).join("")}</div></section>`;
      }).join("")}
    </section><p class="note">不同年份分開儲存進度；清除瀏覽器資料可能令進度消失。</p>`;
  }
  function savedPage() {
    const wrong = data.paper===2 ? data.questions.filter(q=>state.checked[q.n]&&!right(q)) : [];
    return `${heading("我的操練")}<div class="action-row">${data.paper===2?`<button type="button" data-retry ${wrong.length?"":"disabled"}>重做錯題 (${wrong.length})</button>`:""}<button type="button" class="outline" data-export>下載進度備份</button><label class="import-label">匯入進度備份<input type="file" id="import-file" accept=".json,application/json"></label></div>${data.paper===2?`<h2 class="section-title">錯題</h2><div class="compact-list">${wrong.map(q=>`<button type="button" data-solo="${q.n}">${curriculumNotice(q)}第 ${q.n} 題 · ${esc(q.topic)} <span>重做 →</span></button>`).join("")||"<p>目前沒有錯題。</p>"}</div>`:""}<h2 class="section-title">收藏題目</h2><div class="compact-list">${state.saved.map(n=>question(n)).filter(Boolean).map(q=>`<button type="button" data-solo="${q.n}">${curriculumNotice(q)}第 ${q.n} 題 · ${esc(q.topic)} <span>操練 →</span></button>`).join("")||"<p>尚未收藏題目。</p>"}</div>`;
  }
  function guidePage() {
    return `${heading("技巧站")}<div class="guide-list">${topics.map(t=>{const q=data.questions.find(q=>q.topic===t);return `<details><summary>${curriculumNotice(q)}${esc(t)} <small>第 ${q.n} 題示例</small></summary><ol>${q.hints.map(h=>`<li>${math(h)}</li>`).join("")}</ol><p><strong>自己核對：</strong></p>${solutionHtml(q)}<button type="button" data-solo="${q.n}">操練第 ${q.n} 題</button></details>`;}).join("")}</div>`;
  }
  function programsPage() {
    return `${heading("計算機 Program","fx-50FH II")}
      <div class="lessons">
        <details><summary>MODE 4 · 平均數與母體標準差</summary><ol><li>按 MODE、MODE、4 進入 SD。</li><li>按 SHIFT、9、1、EXE 清除舊數據。</li><li>同一數值出現多次，按「數值 SHIFT , 頻數 M+」；畫面顯示「數值 ; 頻數」。</li><li>平均數按 SHIFT、2、1、EXE；母體標準差按 SHIFT、2、2、EXE。</li></ol><p>例：2、2、6、6，輸入「2 ; 2」及「6 ; 2」，每組按 M+。平均數為 4，母體標準差為 2。這裏不使用樣本標準差。</p></details>
        <details><summary>Formula 01 · 二次方程</summary><p>先整理成 ax² + bx + c = 0。按 MODE、1，然後 FMLA、0、1，依畫面依次輸入 a、b、c。</p><p>例：x² - 5x + 6 = 0，輸入 1、-5、6；兩解為 2、3。代回原式檢查。</p></details>
        <details><summary>Formula 02 · 餘弦定理</summary><p>已知兩邊和夾角，先確認角度為 DEG。按 FMLA、0、2，依畫面輸入兩邊及夾角。</p><p>例：邊長 5、8，夾角 60°，第三邊為 7。</p></details>
        <details><summary>Formula 03 · 海倫公式</summary><p>先確認三邊可以圍成三角形。按 FMLA、0、3，依畫面輸入三邊。</p><p>例：三邊 8、5、5，半周界 9，面積為 12。</p></details>
        <details><summary>自訂 P1 · 聯立方程</summary><p>已在自己的計算機安裝老師的 P1 程式，才可跟以下順序輸入。把兩條式寫成 Ax + By = C、Dx + Ey = F，依次輸入 A、B、C、D、E、F，每個數後按 EXE。</p><p>例：x + y = 7、x - y = 1。依次輸入 1、1、7、1、-1、1；讀取 x = 4、y = 3。代回兩式檢查。</p></details>
        <details><summary>自訂 P2 · 兩點坐標</summary><p>依次輸入第一點的 x、y，再輸入第二點的 x、y。例：A(1, 3)、B(5, 11)，順序為 1、3、5、11。</p><p>距離為 √80，直線斜率為 2，直線為 y = 2x + 1。垂直或水平直線要自行處理，不要照抄程式的除以零輸出。</p></details>
        <details><summary>自訂 P3 · 三邊求角及面積</summary><p>先核對三邊能組成三角形，並設 DEG。已安裝對應程式才依次輸入 a、b、c、0；a、b、c 分別與角 A、B、C 相對。</p><p>例：a = 8、b = 7、c = 5，面積約 17.32 平方單位。三角和應約 180°。</p></details>
        <details><summary>自訂 P4 · 多項式長除法</summary><p>把被除式由 x⁴ 至常數排好，缺項補 0，最後輸入一次式除式的兩個係數。</p><p>例：(2x⁴ + x³ + 3x² + 4x + 5) ÷ (x + 2)，依次輸入 2、1、3、4、5、1、2。商為 2x³ - 3x² + 9x - 14，餘數 33。以「除式 × 商 + 餘數」檢查。</p></details>
      </div><p class="note">按鍵參照現有卷一計算機教學整理；此原創試版不附老師自訂 P1–P4 程式原稿，未以實體計算機逐鍵測試。</p>`;
  }
  function parseExamPrompt(q) {
    const clean=q.prompt.replace(/（輸入[^）]*）/g,"").replace(/(?:只)?輸入[^。]*。/g,"").trim();
    const labels=[...clean.matchAll(/(^|[。！？；，：\n])\s*(\([a-d]\))/g)];
    const stem=labels.length?clean.slice(0,labels[0].index+labels[0][1].length).trim():clean;
    const parts=labels.map((match,i)=>({
      label:match[2][1],
      text:clean.slice(match.index+match[0].length,
        i+1<labels.length?labels[i+1].index+labels[i+1][1].length:undefined).trim()
    })).filter(part=>part.text);
    const partMarks=Object.fromEntries(parts.map(({label})=>{
      const steps=(q.solution || []).filter(part=>part.part?.match(/^\(([a-d])\)/)?.[1]===label).flatMap(part=>part.steps);
      const derived=steps.reduce((sum,step)=>sum+(/^[1-9]\d*[MA]$/.test(step.marks)?parseInt(step.marks,10):NaN),0);
      return [label,q.markGroups?.[label] ?? derived];
    }));
    const complete=parts.length>0 && new Set(parts.map(part=>part.label)).size===parts.length &&
      parts.every(part=>Number.isInteger(partMarks[part.label]) && partMarks[part.label]>0) &&
      parts.reduce((sum,part)=>sum+partMarks[part.label],0)===q.marks;
    return {stem,parts,partMarks,complete};
  }
  function examPrompt(q, screenOnly=false, parsed=parseExamPrompt(q)) {
    const {stem,parts,partMarks}=parsed;
    const partHtml=part=>{
      const bits=part.text.split(/(\((?:i|ii|iii|iv)\))/);
      if(bits.length===1) return `<p>${math(part.text).replace(/\n/g,"<br>")}</p>${diagram(q.partDiagrams?.[part.label])}`;
      const lead=bits.shift().trim();
      let html=(lead?`<p>${math(lead).replace(/\n/g,"<br>")}</p>`:"")+diagram(q.partDiagrams?.[part.label]);
      for(let i=0;i<bits.length;i+=2) if(bits[i+1]?.trim()) html+=`<div class="exam-subpart"><span>${bits[i]}</span><p>${math(bits[i+1].trim()).replace(/\n/g,"<br>")}</p></div>`;
      return html;
    };
    const stemHtml=`<p class="exam-stem">${curriculumNotice(q)}${math(stem).replace(/\n/g,"<br>")}</p>${diagram(q.diagram)}`;
    const renderPart=part=>`<div class="exam-part"><span>(${part.label})</span><div>${partHtml(part)}${parsed.complete?`<p class="exam-part-marks">（${partMarks[part.label]} 分）</p>`:""}</div></div>`;
    if(q.splitPrint&&!screenOnly) return parts.map((part,i)=>`<div class="print-segment">${i===0?stemHtml:`<p class="print-continuation">第 ${q.n} 題（續）</p>`}<div class="exam-parts">${renderPart(part)}</div>${i===parts.length-1&&!parsed.complete?`<div class="exam-marks">（${marks[q.n]} 分）</div>`:""}<div class="print-answer-space" style="--answer-height:${i===0?42:70}mm" aria-hidden="true"></div></div>`).join("");
    return `${stemHtml}${parts.length?`<div class="exam-parts">${parts.map(renderPart).join("")}</div>`:""}`;
  }
  function form(q, inline=false) {
    const checked=data.paper===2 && Boolean(state.checked[q.n]);
    const feedback=checked ? `<div class="feedback ${right(q)?"success":"error"}" role="status"><strong>${right(q)?"答對":"答錯"}</strong><p>答案：${q.answer}　${math(q.correct)}</p><p>${math(q.solution)}</p></div>` : "";
    const input=data.paper===2
      ? `<div class="options" role="group" aria-label="第 ${q.n} 題選項">${q.options.map((o,i)=>`<label class="${selected(q)===letters[i]?"chosen":""}"><input type="radio" name="answer-${q.n}" value="${letters[i]}" ${selected(q)===letters[i]?"checked":""}><b>${letters[i]}.</b><span>${math(o)}</span></label>`).join("")}</div>`
      : "";
    const shown=state.hints[q.n] || 0;
    const answerHeight=marks[q.n]<=4?42:marks[q.n]<=7?70:marks[q.n]<=8?84:112;
    const tools=`<div class="study-tools"><button type="button" class="outline" data-hint="${q.n}" ${shown>=q.hints.length?"disabled":""}>逐步提示 ${shown}/${q.hints.length}</button>${data.paper===2?`<button type="button" data-check="${q.n}" ${selected(q)?"":"disabled"}>批改這題</button>`:""}${inline?"":`<button type="button" class="bookmark" data-bookmark="${q.n}" aria-label="收藏第 ${q.n} 題">${state.saved.includes(q.n)?"★":"☆"}</button>`}</div>${shown?`<ol class="hints">${q.hints.slice(0,shown).map(h=>`<li>${math(h)}</li>`).join("")}</ol>`:""}${feedback}${data.paper===1?`<details class="worked-answer"><summary>參考解答</summary>${solutionHtml(q)}</details>`:""}`;
    if(inline) return `<div class="inline-practice" id="question-${q.n}">${input}${tools}</div>`;
    const parsed=parseExamPrompt(q);
    return `<article class="question exam-question${q.splitPrint?" split-print":""}${parsed.complete?" print-part-marks":" print-total-marks"}" id="question-${q.n}"><div class="exam-body"><h2>${q.n}.</h2><div class="exam-content">${examPrompt(q,false,parsed)}${input}${data.paper===1&&!q.splitPrint?`${parsed.complete?"":`<div class="exam-marks">（${marks[q.n]} 分）</div>`}<div class="print-answer-space" style="--answer-height:${answerHeight}mm" aria-hidden="true"></div>`:""}</div></div>${tools}</article>`;
  }
  function sectionTitle(q) {
    if (data.paper===1) return {1:"甲部（1）（35 分）",10:"甲部（2）（35 分）",15:"乙部（35 分）"}[q.n];
    return {1:"甲部",31:"乙部"}[q.n];
  }
  function practicePage() {
    const sequence=session.length ? session : data.questions.map(q=>q.n);
    const timer=state.deadline && !state.finished ? `<span id="timer" class="timer">計算時間中</span>` : "";
    const checked=data.paper===2 ? data.questions.filter(q=>state.checked[q.n]) : [];
    const pdf=`dse-original-${year!==2026?`${year}-`:""}paper1-practice.pdf`;
    return `<div class="practice-header"><button type="button" class="back" data-back>← 返回</button>${timer}<a class="export-pdf" href="../output/pdf/${pdf}" download="${pdf}" title="下載全卷 PDF（附空白作答空間）"><span aria-hidden="true">↓</span>匯出 PDF</a><span>${state.mode==="timed"?"計時":"不限時"} · ${state.finished?"已完成":"練習中"}</span></div><div class="practice-layout"><section class="practice-main"><header class="exam-title"><span>${year} 對應原創模擬卷 · 非官方</span><h1>數學　必修部分<br>試卷一</h1><p>請寫出計算步驟及答案。</p></header>${sequence.map(n=>{const q=question(n);return `${sectionTitle(q)?`<h2 class="exam-section">${sectionTitle(q)}</h2>`:""}${form(q)}`;}).join("")}${state.startedAt&&!state.finished?'<button type="button" class="finish" data-finish>完成本卷</button>':""}</section><aside class="question-nav"><h3>跳至題目</h3><div class="mini-grid">${sequence.map(n=>`<button type="button" data-jump="${n}">${n}</button>`).join("")}</div></aside></div>`;
  }
  function render() {
    const fragment=location.hash.slice(1);
    route = (fragment.split("?")[0] || "papers");
    if(route==="years") {
      const params=new URLSearchParams(fragment.split("?")[1]||"");
      if(/^(201[2-9]|202[0-6])$/.test(params.get("year")||"")) yearYear=params.get("year");
      if(["all","A1","A2","B"].includes(params.get("section"))) yearSection=params.get("section");
    }
    if (route==="practice" && !question(active)) route="papers";
    const pages = {find:findPage,topics:topicPage,years:yearPage,papers:paperPage,guide:guidePage,programs:programsPage,saved:savedPage,practice:practicePage};
    if (!pages[route]) route="papers";
    shell(pages[route]());
    if ((route==="find"||route==="topics") && lastFocus) {
      const field=document.getElementById(lastFocus);
      field?.focus();
      if(field?.setSelectionRange) field.setSelectionRange(field.value.length,field.value.length);
      lastFocus=null;
    }
    if (route==="practice" && pendingScroll) {
      const n=pendingScroll;
      pendingScroll=null;
      requestAnimationFrame(()=>document.getElementById(`question-${n}`)?.scrollIntoView({block:"start"}));
    }
    tick();
  }
  function navigate(name) {
    if (location.hash === `#${name}`) render();
    else location.hash = name;
  }
  function showYear(year, section) {
    yearYear=year;
    yearSection=section;
    yearDetail="";
    const hash=`#years?year=${year}&section=${section}`;
    if(location.hash===hash) render();
    else location.hash=hash;
  }
  function open(n, list) { active=n; session=list||[]; state.active=n; pendingScroll=n; persist(); navigate("practice"); }
  function start(mode) {
    state={...blank(),saved:state.saved,mode,startedAt:Date.now(),deadline:mode==="timed"?Date.now()+data.minutes*60000:null};
    persist(); open(1,data.questions.map(q=>q.n));
  }
  function finish() {
    if(data.paper===2) for(const q of data.questions) if(state.answers[q.n]) state.checked[q.n]=true;
    state.finished=true; state.deadline=null; persist(); render();
    document.querySelector(".exam-result, .finish")?.scrollIntoView({block:"nearest"});
  }
  function tick() {
    const display=document.querySelector("#timer");
    if (!display) return;
    const remaining=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));
    display.textContent=`剩餘 ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`;
    if (!remaining && state.deadline) finish();
  }
  setInterval(tick,1000);
  function bind() {
    document.querySelector(".skip-link").onclick=e=>{e.preventDefault();document.querySelector("main").focus();};
    document.querySelector("#mock-year").onchange=e=>{const url=new URL(location.href);url.searchParams.set("year",e.target.value);location.href=url.href;};
    document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.open),slot=document.getElementById(`inline-${n}`),expanded=!slot.children.length;slot.innerHTML=expanded?form(question(n),true):"";if(expanded)slot.querySelector(".worked-answer").open=true;b.setAttribute("aria-expanded",String(expanded));b.textContent=expanded?"收起解答":"提示與解答";bind();});
    document.querySelectorAll("[data-solo]").forEach(b=>b.onclick=()=>open(Number(b.dataset.solo)));
    document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{active=Number(b.dataset.jump);state.active=active;persist();document.getElementById(`question-${active}`)?.scrollIntoView({behavior:"smooth",block:"start"});});
    document.querySelectorAll("[data-hint]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.hint);state.hints[n]=Math.min(question(n).hints.length,(state.hints[n]||0)+1);persist();refreshQuestion(n);});
    document.querySelectorAll("[data-check]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.check);if(data.paper!==2||!state.answers[n])return;state.checked[n]=true;persist();refreshQuestion(n);});
    document.querySelectorAll("[data-bookmark]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.bookmark);state.saved=state.saved.includes(n)?state.saved.filter(x=>x!==n):[...state.saved,n];persist();pendingScroll=route==="practice"?n:null;render();});
    document.querySelectorAll(".options input").forEach(input=>input.onchange=()=>{const n=Number(input.name.split("-")[1]);state.answers[n]=input.value;delete state.checked[n];persist();refreshQuestion(n);});
    document.querySelector("#topic-filter")?.addEventListener("change", e=>{topic=e.target.value;lastFocus="topic-filter";render();});
    document.querySelector("#query-filter")?.addEventListener("input", e=>{query=e.target.value;lastFocus="query-filter";render();});
    document.querySelectorAll("[data-topic-filter]").forEach(button=>button.onclick=()=>{topic=button.dataset.topicFilter;lastFocus=button.id;render();});
    document.querySelectorAll("[data-topic]").forEach(b=>b.onclick=()=>{topic=b.dataset.topic;query="";navigate("find");});
    document.querySelector("#dse-topic-search")?.addEventListener("input",e=>{dseSearch=e.target.value;dsePage=1;lastFocus="dse-topic-search";render();});
    document.querySelectorAll("[data-dse-section]").forEach(b=>b.onclick=()=>{dseSection=b.dataset.dseSection;dsePage=1;render();});
    document.querySelectorAll("[data-dse-topic]").forEach(b=>b.onclick=()=>{dseDetail=dseDetail===b.dataset.dseTopic?"":b.dataset.dseTopic;render();document.querySelector(".dse-detail")?.scrollIntoView({block:"start"});});
    document.querySelectorAll("[data-dse-page]").forEach(b=>b.onclick=()=>{dsePage=Number(b.dataset.dsePage);render();});
    document.querySelector("[data-dse-close]")?.addEventListener("click",()=>{dseDetail="";render();});
    document.querySelector("#year-select")?.addEventListener("change",e=>showYear(e.target.value,yearSection));
    document.querySelectorAll("[data-year-step]").forEach(b=>b.onclick=()=>showYear(String(Number(yearYear)+Number(b.dataset.yearStep)),yearSection));
    document.querySelectorAll("[data-year-section]").forEach(b=>b.onclick=()=>showYear(yearYear,b.dataset.yearSection));
    document.querySelectorAll("[data-year-topic]").forEach(b=>b.onclick=()=>{yearDetail=yearDetail===b.dataset.yearTopic?"":b.dataset.yearTopic;render();document.querySelector(".year-detail")?.scrollIntoView({block:"nearest"});});
    document.querySelector("[data-year-close]")?.addEventListener("click",()=>{yearDetail="";render();});
    document.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>{if(Object.keys(state.answers).length&&!confirm("重新開始會清除這份試卷的作答進度。已下載備份？"))return;start(b.dataset.start);});
    document.querySelector("[data-resume]")?.addEventListener("click",()=>open(active, data.questions.map(q=>q.n)));
    document.querySelector("[data-back]")?.addEventListener("click",()=>navigate("papers"));
    document.querySelector("[data-finish]")?.addEventListener("click",()=>{if(confirm(data.paper===2?"提交整份練習並批改已作答的題目？":"完成這份長題練習？作答會保留。"))finish();});
    document.querySelector("[data-retry]")?.addEventListener("click",()=>{const wrong=data.questions.filter(q=>state.checked[q.n]&&!right(q)).map(q=>q.n);wrong.forEach(n=>{delete state.answers[n];delete state.checked[n];delete state.hints[n];});state.finished=false;state.startedAt=null;state.deadline=null;state.mode="untimed";persist();open(wrong[0],wrong);});
    document.querySelector("[data-export]")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schema,paper:data.paper,year,progress:state},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`dse-original-${year}-paper${data.paper}-backup.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    document.querySelector("#import-file")?.addEventListener("change", async e=>{try{const file=e.target.files[0];if(!file)return;const payload=JSON.parse(await file.text());if(payload.schema!==schema||payload.paper!==data.paper||(payload.year??2026)!==year||!payload.progress||typeof payload.progress.answers!=="object"||Array.isArray(payload.progress.answers))throw Error("格式不符");if(!confirm("匯入會取代這份原創卷的本機進度。確定嗎？"))return;state=migrateProgress(payload.progress);persist();render();alert(saveFailed?"進度已載入，但未能儲存；請保留備份。":"進度已匯入。");}catch{alert("無法匯入：請選擇相同年份、相同試卷的備份。");}});
    window.PilotWorkspace.enhance(route);
  }
  function refreshQuestion(n) {
    const inline=document.getElementById(`inline-${n}`);
    const answerOpen = (inline || document.getElementById(`question-${n}`))?.querySelector(".worked-answer")?.open;
    if(inline) inline.innerHTML=form(question(n),true);
    else document.getElementById(`question-${n}`).outerHTML=form(question(n));
    const answer = (inline || document.getElementById(`question-${n}`))?.querySelector(".worked-answer");
    if (answer) answer.open = Boolean(answerOpen);
    bind();
  }
  addEventListener("hashchange",render);
  render();
})();
