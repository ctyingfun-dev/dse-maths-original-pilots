(() => {
  const data = window.PILOT;
  const year = data.year || 2026;
  const math = window.mathText;
  const curriculumNotice = window.pilotCurriculumNotice;
  const key = `dse-original-pilot-paper${data.paper}-${year}-v2`;
  const schema = 2;
  const questionRevision = year===2016 || year===2017 || year===2018 || year===2019 || year===2020 || year===2021 || year===2023 || year===2024 ? 1 : year===2022 || year===2025 ? 2 : 5;
  const questionRevisions = year===2022 ? [
    {revision:1, questions:data.questions.map(q=>q.n)},
    {revision:2, questions:[20,23,24,27,28,31,37]}
  ] : year===2016 || year===2017 || year===2018 || year===2019 || year===2020 || year===2021 || year===2023 || year===2024 ? [
    {revision:1, questions:data.questions.map(q=>q.n)}
  ] : year===2025 ? [
    {revision:2, questions:data.questions.map(q=>q.n)}
  ] : [
    {revision:3, questions:[22,26,31,42]},
    {revision:4, questions:[4,5,8,9,12,14,15,23,26,30,34,36,40,41,42,44]},
    {revision:5, questions:data.questions.map(q=>q.n)}
  ];
  const marks = [0,3,3,3,4,4,4,4,5,5,6,6,7,8,8,4,6,6,7,12];
  const letters = "ABCD";
  const blank = () => ({answers:{}, checked:{}, hints:{}, saved:[], startedAt:null, deadline:null, mode:"untimed", finished:false, questionRevision});
  let state = load();
  let route = "papers";
  let active = state.active || 1;
  let topic = "全部";
  let query = "";
  let dseYear = "all";
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

  function migrateProgress(progress) {
    const next={...blank(),...progress};
    if(data.paper===2 && progress.questionRevision!==questionRevision) {
      next.answers={...next.answers};
      next.checked={...next.checked};
      next.hints={...next.hints};
      const changed = questionRevisions.filter(change=>(progress.questionRevision || 0)<change.revision);
      for(const n of new Set(changed.flatMap(change=>change.questions))) {
        delete next.answers[n];
        delete next.checked[n];
        delete next.hints[n];
      }
      next.questionRevision=questionRevision;
    }
    return next;
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved && saved.schema === schema && saved.paper === data.paper
        ? migrateProgress(saved.progress) : blank();
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
    if (kind.endsWith("2025")) return window.pilotDiagram2025(kind);
    if (year===2026 && window.pilotDiagram2026) return window.pilotDiagram2026(kind);
    if (kind === "frequency") return `<table class="exam-table" aria-label="分組頻數表"><thead><tr><th>時數</th><th>0–10</th><th>10–20</th><th>20–30</th><th>30–40</th></tr></thead><tbody><tr><th>頻數</th><td>3</td><td><var>k</var></td><td>8</td><td>5</td></tr></tbody></table>`;
    if (kind === "stemleaf") return `<table class="stemleaf" aria-label="十人的時數幹葉圖"><thead><tr><th>幹（十位）</th><th>葉（個位）</th></tr></thead><tbody><tr><th>1</th><td>2　4　6　8</td></tr><tr><th>2</th><td>0　0　2　4　6　<var>w</var></td></tr></tbody></table><p class="key">例如：1｜2 表示 12 小時</p>`;
    const line = 'fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
    const shade = 'fill="none" stroke="#111" stroke-width="1.15"';
    let drawing = "";
    if (kind === "coordinate") drawing = `<path d="M15 115H245M55 135V12" stroke="#60757b"/><path d="M30 102L223 36" ${line}/><circle cx="105" cy="77" r="4" fill="#d17435"/><text x="231" y="120">x</text><text x="45" y="18">y</text>`;
    if (kind === "right" || kind === "trig") drawing = `<path d="M40 115L40 25L200 115Z" ${shade}/><path d="M40 104h11v11" ${line}/><text x="17" y="72">${esc(spec.a || spec.opposite || "a")}</text><text x="110" y="135">${esc(spec.b || "b")}</text><text x="123" y="57">${esc(spec.hyp || "c")}</text>`;
    if (kind === "circle") drawing = `<circle cx="128" cy="70" r="53" ${shade}/><path d="M128 70H181" stroke="#d17435" stroke-width="2"/><circle cx="128" cy="70" r="3" fill="#d17435"/><text x="146" y="61">${spec.r ? `r = ${esc(spec.r)}` : "r"}</text>`;
    if (kind === "similar" || kind === "similarTriangles") drawing = `<path d="M14 119L71 21L151 119Z M175 119L201 70L244 119Z" ${shade}/><text x="18" y="67">x+2</text><text x="116" y="72">16</text><text x="174" y="91">4</text><text x="213" y="92">x+2</text>`;
    if (kind === "rightSimilar") drawing = `<path d="M15 119V65H85V119Z M122 119V18H242V119Z" ${shade}/><path d="M15 108H26V119 M122 108H133V119" ${line}/><text x="20" y="92">5</text><text x="43" y="137">12</text><text x="140" y="137">24</text>`;
    if (kind === "bars" || kind === "frequency") drawing = spec.values.map((v,i) => `<rect x="${30+i*53}" y="${121-v*7}" width="28" height="${v*7}" fill="${i%2?"#087d70":"#d17435"}"/><text x="${36+i*53}" y="139">${esc(v)}</text>`).join("") + '<path d="M20 121H244" stroke="#60757b"/>';
    if (kind === "lines" || kind === "linear" || kind === "locus") drawing = `<path d="M28 116H244 M54 138V12 M244 116l-7-4 M244 116l-7 4 M54 12l-4 7 M54 12l4 7" ${line}/><path d="M26 26.5L235 127.6 M26 68.9L235 122.1" ${line}/><text x="12" y="18">L₁</text><text x="12" y="59">L₂</text><text x="37" y="135">O</text><text x="247" y="137">x</text><text x="65" y="19">y</text>`;
    if (kind === "sector") drawing = `<path d="M65 120L65 24A96 96 0 0 1 160 120Z" ${shade}/><circle cx="65" cy="120" r="3" fill="#d17435"/><text x="74" y="109">O</text><text x="85" y="75">r</text>`;
    if (kind === "pyramid") drawing = `<path d="M125 15L25 110L95 137L225 111Z M125 15L225 111 M25 110L165 88L225 111 M95 137L165 88" ${line}/><path d="M82 65L186 65L209 88L59 88Z" fill="#d6ece7" stroke="#087d70" stroke-width="2"/><path d="M125 15V112" stroke="#d17435" stroke-dasharray="4 4"/>`;
    if (kind === "trapezoid") drawing = `<path d="M55 20H205L220 130H20Z M205 20L20 130 M205 20L191 64H131 M191 64L220 130" ${line}/><text x="43" y="14">A</text><text x="209" y="15">B</text><text x="226" y="145">C</text><text x="3" y="145">D</text><text x="116" y="60">E</text><text x="177" y="84">F</text>`;
    if (kind === "rectangleExtension") drawing = `<path d="M30 136H230V100H30Z M30 136L230 46V100" ${line}/><text x="236" y="146">A</text><text x="235" y="106">B</text><text x="12" y="106">C</text><text x="12" y="146">D</text><text x="113" y="86">E</text><text x="235" y="49">F</text>`;
    if (kind === "concave") drawing = `<path d="M25 20H210L150 75L220 130H25Z" ${line}/><path d="M25 31H36V20 M25 119H36V130" ${line}/><path d="M190 20A20 20 0 0 0 195 34 M166 60A22 22 0 0 1 167 89 M200 130A20 20 0 0 1 204 118" ${line}/><text x="161" y="42">p</text><text x="180" y="120">r</text><text x="180" y="82">q</text>`;
    if (kind === "square") drawing = `<path d="M62 18H188V138H62Z M125 18L188 138 M62 138L125 18" ${line}/><text x="46" y="19">A</text><text x="195" y="19">B</text><text x="195" y="143">C</text><text x="46" y="143">D</text><text x="121" y="13">E</text><text x="121" y="145">F</text>`;
    if (kind === "circleAngles") drawing = `<circle cx="130" cy="75" r="60" ${line}/><path d="M80 42L170 32L181 106L93 120Z M80 42L181 106 M170 32L93 120 M130 75L80 42 M130 75L170 32" ${line}/><circle cx="130" cy="75" r="3" fill="#d17435"/><text x="65" y="37">P</text><text x="169" y="23">Q</text><text x="188" y="111">R</text><text x="81" y="137">S</text><text x="134" y="83">O</text>`;
    if (kind === "radiusChord") drawing = `<circle cx="130" cy="75" r="60" ${line}/><path d="M103.7 128.9L180.9 43.2 M130 75L103.7 128.9 M130 75L182 105 M78 45L182 105 M78 45L180.9 43.2 M94 45A16 16 0 0 1 92 53" ${line}/><circle cx="130" cy="75" r="2.5" fill="#111"/><text x="84" y="145">P</text><text x="184" y="121">Q</text><text x="187" y="40">R</text><text x="62" y="42">S</text><text x="133" y="68">O</text><text x="159" y="84">T</text>`;
    if (kind === "cyclic") drawing = `<circle cx="130" cy="75" r="60" ${line}/><path d="M80 42L170 32L181 106L93 120Z M80 42L181 106" ${line}/><path d="M80 42L21 9" stroke="#d17435" stroke-width="2"/><text x="64" y="38">A</text><text x="170" y="23">B</text><text x="189" y="112">C</text><text x="78" y="138">D</text>`;
    if (kind === "tangentCircle") drawing = `<circle cx="85" cy="83" r="61" ${line}/><path d="M25 95H197 M25 95L130 42L145 95 M130 42L113 138 M113 138L197 95 M140 78A18 18 0 0 0 127 95" ${line}/><text x="138" y="38">A</text><text x="10" y="99">B</text><text x="106" y="166">C</text><text x="151" y="82">D</text><text x="99" y="86">E</text><text x="201" y="99">T</text>`;
    if (kind === "joinedTriangles") drawing = `<path d="M91 20L91 127L20 78Z M91 20L226 83L91 127" ${shade}/><path d="M91 20V127" stroke="#d17435" stroke-dasharray="4 4"/><text x="100" y="76">共用邊</text>`;
    if (kind === "boxplot") drawing = `<path d="M20 80H233 M37 66V94 M80 48H177V112H80Z M126 48V112 M219 66V94" ${line}/><text x="27" y="117">min</text><text x="80" y="135">Q₁</text><text x="121" y="135">Q₂</text><text x="174" y="135">Q₃</text>`;
    if (kind === "rays") drawing = `<path d="M30 125H235 M30 125L125 30 M30 125L190 5" ${line}/><path d="M78 125A48 48 0 0 0 69 98" ${line}/><text x="28" y="142">U</text><text x="110" y="26">S</text><text x="194" y="18">V</text>`;
    if (kind === "rightCyclic") drawing = `<path d="M53 43L227 43L170 125H110Z M53 43L170 125 M110 125L227 43 M210 55A20 20 0 0 1 215 61" ${line}/><text x="40" y="40">T</text><text x="229" y="42">U</text><text x="95" y="141">S</text><text x="172" y="141">V</text>`;
    if (kind === "prism") drawing = `<path d="M30 42L165 85L225 30L30 42 M30 42V112L165 155L225 100V30 M165 85V155 M30 42L165 155 M225 30L165 155" ${line}/><path d="M30 112L225 100" fill="none" stroke="#111" stroke-width=".9" stroke-dasharray="5 4"/><text x="176" y="96">A</text><text x="228" y="28">B</text><text x="15" y="43">C</text><text x="12" y="126">D</text><text x="173" y="168">E</text><text x="236" y="111">F</text>`;
    if (kind === "tiltedPlane") drawing = `<path d="M20 120H243 M90 120L225 120L174 36L74 67Z M90 120L174 36 M74 67V120 M74 67L30 120" ${line}/><path d="M74 67V120" stroke="#d17435" stroke-dasharray="4 4"/><text x="82" y="138">A</text><text x="224" y="138">B</text><text x="171" y="28">C</text><text x="58" y="65">D</text><text x="19" y="138">V</text>`;
    if (!drawing) return "";
    return `<figure class="diagram"><svg viewBox="${kind==="prism"?"0 0 260 175":kind==="tangentCircle"?"0 0 260 172":"0 0 260 150"}" role="img" aria-label="本題圖形；不按比例繪製">${drawing}</svg><figcaption>圖（不按比例）</figcaption></figure>`;
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
            ${route==="find"?"":`<span class="workspace-edition">${year}<span>原創卷二</span></span>`}
            <nav class="resource-nav" aria-label="課題與工具">${resources.map(navLink).join("")}</nav>
          </div>
        </header>
        <main id="main-content" tabindex="-1">${content}</main>
        <footer><span>原創模擬卷 · 非香港考評局試卷</span><span id="save-state" role="status" data-error="${saveFailed}">${saveFailed?"未能儲存；請先到收藏頁下載進度備份。":"本機進度"}</span></footer>
      </div>`;
    document.querySelectorAll(".lessons p, .lessons li").forEach(el=>el.innerHTML=math(el.textContent));
    bind();
  }
  function heading(title, context = "") {
    return `<div class="page-head"><h1>${title}</h1><p class="subtle">${context?`${esc(context)} · `:""}${esc(data.subtitle)} · 非官方原創試題。${data.paper===1?"長題不自動批改，可自行對照參考解答。":"選擇題可提交批改。"}</p></div>`;
  }
  function searchCard(q) {
    const done = data.paper===1 ? (selected(q)?"已作答":"未作答") : state.checked[q.n] ? (right(q)?"答對":"待重做") : "未批改";
    return `<article class="result" data-result="${q.n}"><div class="result-index"><small>題目</small><strong>${String(q.n).padStart(2,"0")}</strong></div><div class="result-content"><div class="result-top"><strong>${esc(q.topic)}</strong><span>${esc(q.section)} · <span class="result-status">${done}</span></span></div><div class="result-prompt">${examPrompt(q)}${diagram(q.diagram)}</div></div><div class="result-actions"><button type="button" data-open="${q.n}" aria-expanded="false" aria-controls="inline-${q.n}">作答與批改</button><button type="button" class="bookmark" data-bookmark="${q.n}" title="${state.saved.includes(q.n)?"取消收藏":"收藏"}第 ${q.n} 題" aria-label="${state.saved.includes(q.n)?"取消收藏":"收藏"}第 ${q.n} 題">${state.saved.includes(q.n)?"★":"☆"}</button></div><div class="inline" id="inline-${q.n}"></div></article>`;
  }
  function findPage() {
    const matches = data.questions.filter(q => (topic==="全部" || q.topic===topic) && (`${q.n} ${q.topic} ${q.prompt}`).includes(query));
    return `<div class="page-head find-head"><h1>題目庫</h1><p class="subtle">${year} 原創卷二</p></div>
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
    const pool=source.questions.filter(q=>(dseYear==="all"||q.year===Number(dseYear))&&(dseSection==="all"||q.section===dseSection));
    const counts=new Map();
    for(const q of pool) for(const name of new Set(q.concepts)) {
      if(!counts.has(name)) counts.set(name,{topic:name,A:0,B:0,count:0});
      const row=counts.get(name);
      row[q.section]++;
      row.count++;
    }
    const rows=[...counts.values()].filter(row=>row.topic.includes(dseSearch.trim()))
      .sort((a,b)=>b.count-a.count||a.topic.localeCompare(b.topic,"zh-Hant"));
    const pages=Math.max(1,Math.ceil(rows.length/10));
    dsePage=Math.min(dsePage,pages);
    const max=Math.max(1,...rows.map(row=>row.count));
    const detail=source.stats.find(row=>row.topic===dseDetail);
    const matches=detail?pool.filter(q=>q.concepts.includes(detail.topic)).sort((a,b)=>a.year-b.year||a.q-b.q):[];
    const yearOptions=[["all","全部年份"],...source.years.map(year=>[String(year),String(year)])];
    const sectionOptions=[["all","全卷"],["A","甲部"],["B","乙部"]];
    return `<div class="page-head"><p class="eyebrow">DSE 歷屆卷二 · 2012–2026</p><h1>課題分佈</h1><p class="subtle">原有 DSE 卷二網站的歷年分類；與這份 45 題原創模擬卷分開計算。</p></div>
      <div class="dse-summary"><div><strong>${source.years.length}</strong><span>年正式試卷</span></div><div><strong>${source.questions.length}</strong><span>道卷二試題</span></div><div><strong>${source.stats.length}</strong><span>項課題分類</span></div></div>
      <div class="dse-controls"><label>年份<select id="dse-topic-year">${yearOptions.map(([value,label])=>`<option value="${value}" ${dseYear===value?"selected":""}>${label}</option>`).join("")}</select></label>
      <label>搜尋課題<input id="dse-topic-search" type="search" value="${esc(dseSearch)}" placeholder="輸入課題名稱"></label></div>
      <div class="dse-tabs" role="group" aria-label="試卷部分">${sectionOptions.map(([id,name])=>`<button type="button" data-dse-section="${id}" aria-pressed="${dseSection===id}">${name}</button>`).join("")}</div>
      <div class="dse-heading"><h2>課題出現次數</h2><span>${dseYear==="all"?"全部年份":dseYear} · ${dseSection==="all"?"全卷":sectionOptions.find(([id])=>id===dseSection)[1]} · ${pool.length} 題</span></div>
      <div class="dse-legend"><span><i class="a"></i>甲部</span><span><i class="b"></i>乙部</span><span>單位：題</span></div>
      <div class="dse-distribution">${rows.slice((dsePage-1)*10,dsePage*10).map((row,i)=>`<div class="dse-row"><span>${String((dsePage-1)*10+i+1).padStart(2,"0")}</span><button type="button" data-dse-topic="${esc(row.topic)}" aria-expanded="${dseDetail===row.topic}">${esc(row.topic)}</button><div class="dse-bar" role="img" aria-label="${esc(row.topic)} ${row.count} 題"><span class="a" style="width:${row.A/max*100}%"></span><span class="b" style="width:${row.B/max*100}%"></span></div><b>${row.count}</b></div>`).join("")||"<p>此範圍找不到課題。</p>"}</div>
      ${pages>1?`<div class="dse-pages"><button type="button" data-dse-page="${dsePage-1}" ${dsePage===1?"disabled":""} aria-label="上一頁">‹</button><span>${dsePage} / ${pages}</span><button type="button" data-dse-page="${dsePage+1}" ${dsePage===pages?"disabled":""} aria-label="下一頁">›</button></div>`:""}
      ${detail?`<section class="dse-detail"><div class="dse-detail-head"><div><h2>${esc(detail.topic)}</h2><p>歷年 ${detail.count} 題 · ${detail.years}/${source.years.length} 年出現</p></div><button type="button" data-dse-close aria-label="收起課題題目">×</button></div><p class="subtle">目前範圍：${matches.length} 題。</p>${matches.length?`<div class="dse-examples">${matches.map(q=>`<div class="dse-example"><strong>${q.year} · ${q.section==="A"?"甲部":"乙部"}第 ${q.q} 題</strong><span>${curriculumNotice(q)}${esc(q.summary)}</span></div>`).join("")}</div>`:"<p>此範圍未有記錄。</p>"}</section>`:""}
      <p class="note">一題可包含多個課題；各課題次數不能相加。<a href="https://dse-maths-paper2-school.ctyingfun.workers.dev/#topics" target="_blank" rel="noopener">到原 DSE 卷二網站查看完整題目 ↗</a></p>`;
  }
  function yearPage() {
    const source=window.DSE_TOPICS;
    const years=source.years.map(String);
    const index=years.indexOf(yearYear);
    const all=source.questions.filter(q=>q.year===Number(yearYear));
    const pool=all.filter(q=>yearSection==="all"||q.section===yearSection);
    const sections=[["all","全卷"],["A","甲部"],["B","乙部"]];
    const counts=new Map();
    for(const q of pool) for(const name of new Set(q.concepts)) {
      if(!counts.has(name)) counts.set(name,{topic:name,A:0,B:0,questions:[]});
      const row=counts.get(name);
      row[q.section]++;
      row.questions.push(q);
    }
    const rows=[...counts.values()].sort((a,b)=>b.questions.length-a.questions.length||a.topic.localeCompare(b.topic,"zh-Hant"));
    const max=Math.max(1,...rows.map(row=>row.questions.length));
    const selected=rows.find(row=>row.topic===yearDetail);
    return `<div class="page-head"><p class="eyebrow">DSE 歷屆卷二 · 正式試卷</p><h1>逐年課題分佈</h1><p class="subtle">按年份查看該卷每個課題的出現次數及題號。</p></div>
      <div class="year-controls"><button type="button" data-year-step="-1" ${index===0?"disabled":""} aria-label="上一年" title="上一年">‹</button><label>年份<select id="year-select">${years.map(y=>`<option value="${y}" ${yearYear===y?"selected":""}>${y}</option>`).join("")}</select></label><button type="button" data-year-step="1" ${index===years.length-1?"disabled":""} aria-label="下一年" title="下一年">›</button><a href="#topics">查看歷年總覽 →</a></div>
      <div class="year-summary"><div><strong>${all.length}</strong><span>${yearYear} 年試題</span></div><div><strong>${pool.length}</strong><span>目前範圍試題</span></div><div><strong>${rows.length}</strong><span>項課題</span></div></div>
      <div class="year-tabs" role="group" aria-label="試卷部分">${sections.map(([id,name])=>`<button type="button" data-year-section="${id}" aria-pressed="${yearSection===id}">${name}</button>`).join("")}</div>
      <div class="year-heading"><h2>${yearYear} 年 · ${sections.find(([id])=>id===yearSection)[1]}</h2><span>出現次數 · 題號</span></div>
      <div class="year-legend"><span><i class="a"></i>甲部</span><span><i class="b"></i>乙部</span></div>
      <div class="year-list">${rows.map(row=>`<div class="year-row"><button type="button" data-year-topic="${esc(row.topic)}" aria-expanded="${selected===row}">${esc(row.topic)}</button><div class="year-bar" role="img" aria-label="${esc(row.topic)} ${row.questions.length} 題">${[["A","a"],["B","b"]].map(([part,style])=>`<span class="${style}" style="width:${row[part]/max*100}%"></span>`).join("")}</div><b>${row.questions.length}</b><span class="year-refs">${row.questions.map(q=>`第 ${q.q} 題`).join("、")}</span></div>`).join("")}</div>
      ${selected?`<section class="year-detail"><div class="dse-detail-head"><div><h2>${esc(selected.topic)}</h2><p>${yearYear} 年 · ${selected.questions.length} 題</p></div><button type="button" data-year-close aria-label="收起題目摘要">×</button></div><div class="dse-examples">${selected.questions.map(q=>`<div class="dse-example"><strong>${sections.find(([id])=>id===q.section)[1]} · 第 ${q.q} 題</strong><span>${curriculumNotice(q)}${esc(q.summary)}</span></div>`).join("")}</div></section>`:""}
      <p class="note">一題可涉及多個課題，課題次數相加不等於試題總數。分類依據歷屆 DSE 題目；本頁不是原創模擬卷的統計。</p>`;
  }
  function paperPage() {
    const answered = data.questions.filter(q=>selected(q));
    const checked = data.questions.filter(q=>state.checked[q.n]);
    const sections=[...new Set(data.questions.map(q=>q.section))];
    return `<section class="paper-intro" aria-labelledby="paper-title">
      <div class="paper-identity"><p class="paper-subject">數學必修部分</p><h1 id="paper-title">${year} 模擬試卷二</h1>
        <dl class="paper-facts"><div><dt>全卷</dt><dd>${count} 題</dd></div><div><dt>時間</dt><dd>${data.minutes} 分鐘</dd></div><div><dt>題型</dt><dd>選擇題</dd></div></dl>
        <p class="paper-edition">非官方原創改編</p>
      </div>
      <div class="start"><button type="button" data-start="untimed">不限時開始</button><button type="button" data-start="timed" class="outline">計時 ${data.minutes} 分鐘</button>${state.startedAt&&!state.finished?'<button type="button" data-resume class="quiet">繼續上次操練</button>':""}</div>
    </section>
    <div class="paper-session"><label for="paper-progress">已作答 <b>${answered.length}/${count}</b></label><progress id="paper-progress" max="${count}" value="${answered.length}">${answered.length}/${count}</progress><span>已批改 <b>${checked.length}</b></span><span>答對 <b>${checked.filter(right).length}</b></span></div>
    <section class="paper-directory" aria-labelledby="directory-title"><div class="directory-heading"><h2 id="directory-title">選題操練</h2></div>
      ${sections.map((section,index)=>{
        const questions=data.questions.filter(q=>q.section===section);
        return `<section class="paper-part part-${index}" aria-labelledby="part-${index}"><div class="part-heading"><h3 id="part-${index}">${esc(section)}</h3><p>第 ${questions[0].n}–${questions.at(-1).n} 題</p></div><div class="number-grid">${questions.map(q=>{
          const notice=curriculumNotice(q);
          const status=state.checked[q.n]?(right(q)?"答對":"待重做"):selected(q)?"已作答":"未作答";
          return `<button type="button" data-solo="${q.n}" class="${state.checked[q.n]?(right(q)?"good":"bad"):selected(q)?"answered":""}" title="${esc(q.topic)}" aria-label="第 ${q.n} 題：${esc(q.topic)}，${status}${notice?"（已取消）":""}"><span class="directory-number">${String(q.n).padStart(2,"0")}</span><span class="directory-topic">${esc(q.topic)}${notice}</span></button>`;
        }).join("")}</div></section>`;
      }).join("")}
    </section><p class="note">不同年份分開儲存進度；清除瀏覽器資料可能令進度消失。</p>`;
  }
  function savedPage() {
    const wrong = data.paper===2 ? data.questions.filter(q=>state.checked[q.n]&&!right(q)) : [];
    return `${heading("我的操練")}<div class="action-row">${data.paper===2?`<button type="button" data-retry ${wrong.length?"":"disabled"}>重做錯題 (${wrong.length})</button>`:""}<button type="button" class="outline" data-export>下載進度備份</button><label class="import-label">匯入進度備份<input type="file" id="import-file" accept=".json,application/json"></label></div>${data.paper===2?`<h2 class="section-title">錯題</h2><div class="compact-list">${wrong.map(q=>`<button type="button" data-solo="${q.n}">${curriculumNotice(q)}第 ${q.n} 題 · ${esc(q.topic)} <span>重做 →</span></button>`).join("")||"<p>目前沒有錯題。</p>"}</div>`:""}<h2 class="section-title">收藏題目</h2><div class="compact-list">${state.saved.map(n=>question(n)).filter(Boolean).map(q=>`<button type="button" data-solo="${q.n}">${curriculumNotice(q)}第 ${q.n} 題 · ${esc(q.topic)} <span>操練 →</span></button>`).join("")||"<p>尚未收藏題目。</p>"}</div>`;
  }
  function guidePage() {
    return `${heading("技巧站")}<div class="guide-list">${topics.map(t=>{const q=data.questions.find(q=>q.topic===t);return `<details><summary>${curriculumNotice(q)}${esc(t)} <small>第 ${q.n} 題示例</small></summary><ol>${q.hints.map(h=>`<li>${math(h)}</li>`).join("")}</ol><strong>自己核對：</strong>${solutionHtml(q)}<button type="button" data-solo="${q.n}">操練第 ${q.n} 題</button></details>`;}).join("")}</div>`;
  }
  function solutionHtml(q) {
    return `<div class="solution-steps">${window.solutionHtml(q.solution)}</div>`;
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
  function examPrompt(q) {
    const clean=q.prompt.replace(/（輸入[^）]*）/g,"").replace(/(?:只)?輸入[^。]*。/g,"").trim();
    const labels=[...clean.matchAll(/(^|[。！？；，：\n])\s*(\([a-d]\))/g)];
    const stem=labels.length?clean.slice(0,labels[0].index+labels[0][1].length).trim():clean;
    const parts=labels.map((match,i)=>({
      label:match[2][1],
      text:clean.slice(match.index+match[0].length,
        i+1<labels.length?labels[i+1].index+labels[i+1][1].length:undefined).trim()
    })).filter(part=>part.text);
    const statementStart=data.paper===2 ? stem.search(/(?:^|[？。；：])\s*I\s/) : -1;
    let stemHtml=stem.includes("\n") ? stem.split("\n").map(math).join("<br>") : math(stem);
    if(statementStart>=0) {
      const prefix=stem.slice(0,statementStart+1).trim();
      const prefixHtml=prefix.split("\n").map(math).join("<br>");
      const statements=stem.slice(statementStart+1).trim().split(/；\s*(?=I{2,3}\s)/);
      stemHtml=`${prefixHtml}<span class="exam-statements">${statements.map(s=>{
        const match=s.replace(/[。；]$/,"").match(/^(I{1,3})\s+(.+)$/);
        return match?`<span><b>${match[1]}.</b><span>${math(match[2])}</span></span>`:`<span>${math(s)}</span>`;
      }).join("")}</span>`;
    }
    const table=q.table?`<table class="exam-table question-data" aria-label="${esc(q.table.label)}"><tbody>${q.table.rows.map(row=>`<tr>${row.map((cell,i)=>`<${i===0?"th":"td"}${i===0?' scope="row"':""}>${math(cell)}</${i===0?"th":"td"}>`).join("")}</tr>`).join("")}</tbody></table>`:"";
    return `<p class="exam-stem">${curriculumNotice(q)}${stemHtml}</p>${table}${parts.length?`<div class="exam-parts">${parts.map(part=>`<div class="exam-part"><span>(${part.label})</span><p>${math(part.text)}</p></div>`).join("")}</div>`:""}`;
  }
  function form(q, inline=false) {
    const checked=data.paper===2 && Boolean(state.checked[q.n]);
    const feedback=checked ? `<div class="feedback ${right(q)?"success":"error"}" role="status"><strong>${right(q)?"答對":"答錯"}</strong><p>答案：${q.answer}　${math(q.correct)}</p>${solutionHtml(q)}</div>` : "";
    const input=data.paper===2
      ? `<div class="options" role="group" aria-label="第 ${q.n} 題選項">${q.options.map((o,i)=>`<label class="${selected(q)===letters[i]?"chosen":""}"><input type="radio" name="answer-${q.n}" value="${letters[i]}" ${selected(q)===letters[i]?"checked":""}><b>${letters[i]}.</b><span>${math(o)}<span class="option-stop" aria-hidden="true">。</span></span></label>`).join("")}</div>`
      : `<label class="answer-field"><span>作答區</span><textarea data-answer="${q.n}" rows="${Math.min(20,marks[q.n]*2+4)}" aria-label="第 ${q.n} 題作答區">${esc(selected(q))}</textarea></label>`;
    const shown=state.hints[q.n] || 0;
    const choices=q.diagram?`<div class="exam-choice-layout${q.stackChoices?' exam-choice-layout--stacked':''}">${input}${diagram(q.diagram)}</div>`:input;
    const tools=`<div class="study-tools"><button type="button" class="outline" data-hint="${q.n}" ${shown>=q.hints.length?"disabled":""}>逐步提示 ${shown}/${q.hints.length}</button><button type="button" data-check="${q.n}" ${selected(q)?"":"disabled"}>批改這題</button>${inline?"":`<button type="button" class="bookmark" data-bookmark="${q.n}" aria-label="收藏第 ${q.n} 題">${state.saved.includes(q.n)?"★":"☆"}</button>`}</div>${shown?`<ol class="hints">${q.hints.slice(0,shown).map(h=>`<li>${math(h)}</li>`).join("")}</ol>`:""}${feedback}`;
    if(inline) return `<div class="inline-practice" id="question-${q.n}">${input}${tools}</div>`;
    return `<article class="question exam-question" id="question-${q.n}"><div class="exam-body"><h2>${q.n}.</h2><div class="exam-content">${examPrompt(q)}${choices}${year!==2026?'<div class="print-answer-space" aria-hidden="true"></div>':""}</div></div>${tools}</article>`;
  }
  function sectionTitle(q) {
    if (data.paper===1) return {1:"甲部（1）（35 分）",10:"甲部（2）（35 分）",15:"乙部（35 分）"}[q.n];
    return {1:"甲部",31:"乙部"}[q.n];
  }
  function practicePage() {
    const sequence=session.length ? session : data.questions.map(q=>q.n);
    const timer=state.deadline && !state.finished ? `<span id="timer" class="timer">計算時間中</span>` : "";
    const checked=data.paper===2 ? data.questions.filter(q=>state.checked[q.n]) : [];
    const filename=`dse-original-${year}-paper2-practice.pdf`;
    const checkAnswers='<button type="button" data-finish>對答案</button>';
    const pdf=year!==2026?`<a class="export-pdf" href="../output/pdf/${filename}" download="${filename}" title="下載全卷 PDF（附空白草稿空間）"><span aria-hidden="true">↓</span>匯出 PDF</a>`:"";
    return `<div class="practice-header"><button type="button" class="back" data-back>← 返回</button>${timer}${pdf}${checkAnswers}<span>${state.mode==="timed"?"計時":"不限時"} · ${state.finished?"已完成":"作答中"}</span></div><div class="practice-layout"><section class="practice-main"><header class="exam-title"><span>${year} 對應原創模擬卷 · 非官方</span><h1>數學　必修部分<br>試卷二</h1><p>甲部共 30 題，乙部共 15 題。<br>本試卷的附圖不一定依比例繪成。<br>選出每題最佳的答案。</p></header>${sequence.map(n=>{const q=question(n);return `${sectionTitle(q)?`<h2 class="exam-section">${sectionTitle(q)}</h2>`:""}${form(q)}`;}).join("")}<div class="finish">${checkAnswers}</div>${state.finished?`<p class="exam-result" role="status">已批改 ${checked.length} 題，答對 ${checked.filter(right).length} 題。</p>`:""}</section><aside class="question-nav"><h3>跳至題目</h3><div class="mini-grid">${sequence.map(n=>`<button type="button" data-jump="${n}" class="${state.checked[n]?(right(question(n))?"good":"bad"):state.answers[n]?"answered":""}">${n}</button>`).join("")}</div><p>${Object.values(state.answers).filter(Boolean).length} 題已有答案</p></aside></div>`;
  }
  function render() {
    const fragment=location.hash.slice(1);
    route = (fragment.split("?")[0] || "papers");
    if(route==="years") {
      const params=new URLSearchParams(fragment.split("?")[1]||"");
      if(/^(201[2-9]|202[0-6])$/.test(params.get("year")||"")) yearYear=params.get("year");
      if(["all","A","B"].includes(params.get("section"))) yearSection=params.get("section");
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
    document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.open),slot=document.getElementById(`inline-${n}`),expanded=!slot.children.length;slot.innerHTML=expanded?form(question(n),true):"";b.setAttribute("aria-expanded",String(expanded));b.textContent=expanded?"收起作答":"作答與批改";bind();});
    document.querySelectorAll("[data-solo]").forEach(b=>b.onclick=()=>open(Number(b.dataset.solo)));
    document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{active=Number(b.dataset.jump);state.active=active;persist();document.getElementById(`question-${active}`)?.scrollIntoView({behavior:"smooth",block:"start"});});
    document.querySelectorAll("[data-hint]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.hint);state.hints[n]=Math.min(question(n).hints.length,(state.hints[n]||0)+1);persist();refreshQuestion(n);});
    document.querySelectorAll("[data-check]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.check);if(data.paper!==2||!state.answers[n])return;state.checked[n]=true;persist();refreshQuestion(n);});
    document.querySelectorAll("[data-bookmark]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.bookmark);state.saved=state.saved.includes(n)?state.saved.filter(x=>x!==n):[...state.saved,n];persist();pendingScroll=route==="practice"?n:null;render();});
    document.querySelectorAll("[data-answer]").forEach(input=>input.oninput=()=>{state.answers[input.dataset.answer]=input.value;persist();});
    document.querySelectorAll(".options input").forEach(input=>input.onchange=()=>{const n=Number(input.name.split("-")[1]);state.answers[n]=input.value;delete state.checked[n];persist();refreshQuestion(n);});
    document.querySelector("#topic-filter")?.addEventListener("change", e=>{topic=e.target.value;lastFocus="topic-filter";render();});
    document.querySelector("#query-filter")?.addEventListener("input", e=>{query=e.target.value;lastFocus="query-filter";render();});
    document.querySelectorAll("[data-topic-filter]").forEach(button=>button.onclick=()=>{topic=button.dataset.topicFilter;lastFocus=button.id;render();});
    document.querySelectorAll("[data-topic]").forEach(b=>b.onclick=()=>{topic=b.dataset.topic;query="";navigate("find");});
    document.querySelector("#dse-topic-year")?.addEventListener("change",e=>{dseYear=e.target.value;dsePage=1;render();});
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
    document.querySelectorAll("[data-finish]").forEach(button=>button.addEventListener("click",()=>{
      if(!Object.values(state.answers).some(Boolean)){alert("請先選擇答案，再按「對答案」。");return;}
      if(confirm("批改已作答的題目？"))finish();
    }));
    document.querySelector("[data-retry]")?.addEventListener("click",()=>{const wrong=data.questions.filter(q=>state.checked[q.n]&&!right(q)).map(q=>q.n);wrong.forEach(n=>{delete state.answers[n];delete state.checked[n];delete state.hints[n];});state.finished=false;state.startedAt=null;state.deadline=null;state.mode="untimed";persist();open(wrong[0],wrong);});
    document.querySelector("[data-export]")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schema,paper:data.paper,year,progress:state},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`dse-original-${year}-paper${data.paper}-backup.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    document.querySelector("#import-file")?.addEventListener("change", async e=>{try{const file=e.target.files[0];if(!file)return;const payload=JSON.parse(await file.text());if(payload.schema!==schema||payload.paper!==data.paper||(payload.year??2026)!==year||!payload.progress||typeof payload.progress.answers!=="object"||Array.isArray(payload.progress.answers))throw Error("格式不符");if(!confirm("匯入會取代這份原創卷的本機進度。確定嗎？"))return;state=migrateProgress(payload.progress);persist();render();alert(saveFailed?"進度已載入，但未能儲存；請保留備份。":"進度已匯入。");}catch{alert("無法匯入：請選擇相同年份、相同試卷的備份。");}});
    window.PilotWorkspace.enhance(route);
  }
  function refreshQuestion(n) {
    const inline=document.getElementById(`inline-${n}`);
    if(inline) {
      inline.innerHTML=form(question(n),true);
      inline.closest(".result").querySelector(".result-status").textContent=state.checked[n]?(right(question(n))?"答對":"待重做"):"未批改";
    }
    else document.getElementById(`question-${n}`).outerHTML=form(question(n));
    bind();
  }
  addEventListener("hashchange",render);
  render();
})();
