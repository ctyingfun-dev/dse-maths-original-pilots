(() => {
  const data = window.PILOT;
  const math = window.mathText;
  const key = `dse-original-pilot-paper${data.paper}-2026-v2`;
  const schema = 2;
  const marks = [0,3,3,3,4,4,4,4,5,5,6,6,7,8,8,4,6,6,7,12];
  const letters = "ABCD";
  const revisedQuestions = [1,2,3,4,5,6,9,10,11,12,14,15,16,17,18,19];
  const blank = () => ({answers:{}, checked:{}, hints:{}, saved:[], questionRevision:1, startedAt:null, deadline:null, mode:"untimed", finished:false});
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

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || saved.schema !== schema || saved.paper !== data.paper) return blank();
      const progress = {...blank(), ...saved.progress};
      if (saved.progress.questionRevision !== 1) {
        progress.hints = {...progress.hints};
        for (const n of revisedQuestions) delete progress.hints[n];
        progress.questionRevision = 1;
      }
      return progress;
    } catch { return blank(); }
  }
  function persist() {
    localStorage.setItem(key, JSON.stringify({schema,paper:data.paper,progress:state}));
    document.querySelector("#save-state")?.replaceChildren(document.createTextNode("已儲存"));
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
    return `<div class="solution-steps"><p class="scheme-key">1M：方法分；1A：準確分。接受其他正確方法及等值答案。</p><table class="marking-scheme"><caption>建議評分參考（非官方）</caption><colgroup><col><col class="scheme-score-column"></colgroup><thead><tr><th scope="col">解答及評分要點</th><th scope="col">分數</th></tr></thead>${q.solution.map(part=>`<tbody>${part.part?`<tr class="scheme-part"><th colspan="2" scope="rowgroup">${esc(part.part)} <span>（${subtotal(part)} 分）</span></th></tr>`:""}${part.steps.map(step=>`<tr class="scheme-step"><td class="scheme-answer">${step.text.map(line=>`<p>${math(line)}</p>`).join("")}</td><td class="scheme-score">${esc(step.marks)}</td></tr>`).join("")}</tbody>`).join("")}<tfoot><tr><th scope="row">全題總分</th><td class="scheme-total">${total}</td></tr></tfoot></table></div>`;
  }
  function diagram(spec) {
    if (!spec) return "";
    const kind = typeof spec === "string" ? spec : spec.type;
    if (kind === "frequency") return `<div class="exam-table-pair"><table class="exam-table" aria-label="分組頻數表"><thead><tr><th>重量 (g)</th><th>頻數</th></tr></thead><tbody><tr><td>71–80</td><td>2</td></tr><tr><td>81–90</td><td><var>a</var></td></tr><tr><td>91–100</td><td>6</td></tr><tr><td>101–110</td><td>5</td></tr><tr><td>111–120</td><td><var>h</var></td></tr></tbody></table><table class="exam-table" aria-label="累積頻數分布表"><thead><tr><th>重量少於 (g)</th><th>累積頻數</th></tr></thead><tbody><tr><td>80.5</td><td>2</td></tr><tr><td>90.5</td><td>6</td></tr><tr><td>100.5</td><td>12</td></tr><tr><td>110.5</td><td><var>b</var></td></tr><tr><td>120.5</td><td><var>k</var></td></tr></tbody></table></div>`;
    if (kind === "stemleaf") return `<table class="stemleaf" aria-label="${esc(spec.label)}"><thead><tr><th>幹<span class="place-value">（十位）</span></th><th>葉<span class="place-value">（個位）</span></th></tr></thead><tbody>${spec.rows.map(row=>`<tr><th scope="row">${esc(row.stem)}</th><td><div class="stemleaf-leaves">${row.leaves.map(leaf=>`<span>${math(leaf)}</span>`).join(" ")}</div></td></tr>`).join("")}</tbody></table><p class="key">${esc(spec.key)}</p>`;
    const line = 'fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
    const shade = 'fill="#e7f4f1" stroke="#087d70" stroke-width="2"';
    let drawing = "";
    if (kind === "coordinate") drawing = `<path d="M15 115H245M55 135V12" stroke="#60757b"/><path d="M30 102L223 36" ${line}/><circle cx="105" cy="77" r="4" fill="#d17435"/><text x="231" y="120">x</text><text x="45" y="18">y</text>`;
    if (kind === "right" || kind === "trig") drawing = `<path d="M40 115L40 25L200 115Z" ${shade}/><path d="M40 104h11v11" ${line}/><text x="17" y="72">${esc(spec.a || spec.opposite || "a")}</text><text x="110" y="135">${esc(spec.b || "b")}</text><text x="123" y="57">${esc(spec.hyp || "c")}</text>`;
    if (kind === "circle") drawing = `<circle cx="128" cy="70" r="53" ${shade}/><path d="M128 70H181" stroke="#d17435" stroke-width="2"/><circle cx="128" cy="70" r="3" fill="#d17435"/><text x="146" y="61">${spec.r ? `r = ${esc(spec.r)}` : "r"}</text>`;
    if (kind === "similar" || kind === "similarTriangles") drawing = `<path d="M14 119L71 21L151 119Z M175 119L201 70L244 119Z" ${shade}/><text x="18" y="67">x+2</text><text x="116" y="72">16</text><text x="174" y="91">4</text><text x="213" y="92">x+2</text>`;
    if (kind === "joinedParallel") drawing = `<path d="M90 15L15 130H240 M90 15L150 130 M15 130L204 61L240 130" ${line}/><text x="85" y="13">A</text><text x="148" y="146">B</text><text x="3" y="146">C</text><text x="132" y="84">D</text><text x="242" y="146">E</text><text x="205" y="58">F</text>`;
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
    if (kind === "tiltedPlane") drawing = `<path d="M12 190L49 130H285L249 190Z" fill="none" stroke="#111" stroke-width=".85" stroke-dasharray="7 4 1 4"/><path d="M55 161L126 192L242 178 M55 161L98 55L236 104L242 178 M98 55L126 192" ${line}/><path d="M55 161L236 104 M55 161L242 178 M126 192L236 104" fill="none" stroke="#111" stroke-width=".9" stroke-dasharray="5 4"/><text x="38" y="164">V</text><text x="118" y="211">A</text><text x="243" y="196">B</text><text x="239" y="102">C</text><text x="91" y="47">D</text>`;
    if (!drawing) return "";
    return `<figure class="diagram"><svg viewBox="${kind==="tiltedPlane"?"0 0 300 220":"0 0 260 150"}" role="img" aria-label="${kind==="tiltedPlane"?"角錐 VABCD 的透視圖，面 VAB 位於水平面":"本題圖形；不按比例繪製"}">${drawing}</svg><figcaption>圖（不按比例）</figcaption></figure>`;
  }
  const icon = (name) => ({search:"⌕",book:"▤",grid:"▦",light:"◉",save:"▣",back:"←",next:"→",star:"☆",clock:"◷"}[name]);
  function shell(content) {
    const nav = [
      ["find",icon("search"),"同類題搜尋"],["topics",icon("grid"),"課題分布"],["years",icon("grid"),"逐年課題"],
      ["papers",icon("book"),"整卷操練"],["guide",icon("light"),"技巧站"],["programs",icon("light"),"計算機 Program"],
      ["saved",icon("star"),"我的操練"]
    ];
    document.querySelector("#app").innerHTML = `
      <aside class="sidebar"><div class="brand"><div class="brand-mark">m<sup>+</sup></div><div><strong>DSE 數學</strong><small>研習室 · ${esc(data.title)}</small></div></div>
        <p class="nav-label">你的溫習空間</p><nav aria-label="主要導覽">${nav.map(([id,symbol,label]) => `<a href="#${id}" class="${route===id?"current":""}"><span aria-hidden="true">${symbol}</span>${label}${id==="saved"?` <small>${state.saved.length}</small>`:""}</a>`).join("")}</nav>
        <div class="sidebar-bottom"><span class="status-dot"></span> 原創模擬題 · 非官方試卷<br><small>${esc(data.subtitle)}</small></div>
      </aside>
      <div class="workspace"><header class="topbar"><span>一步一步，找出自己的解題方法。</span><div><a href="../paper${data.paper===1?2:1}/" class="other-paper">前往原創卷${data.paper===1?"二":"一"} →</a><span id="save-state">本機進度</span></div></header>
      <main>${content}</main><footer>原創試版 · 非香港考評局試卷 · 不含原卷圖片</footer></div>`;
    document.querySelectorAll(".lessons p, .lessons li").forEach(el=>el.innerHTML=math(el.textContent));
    bind();
  }
  function heading(title, eyebrow = "原創模擬題") {
    return `<div class="page-head"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtle">${esc(data.subtitle)} · 非官方原創試題。${data.paper===1?"長題不自動批改，可自行對照參考解答。":"選擇題可提交批改。"}</p></div>`;
  }
  function searchCard(q) {
    const done = data.paper===1 ? "" : state.checked[q.n] ? (right(q)?"答對":"待重做") : "未批改";
    return `<article class="result"><div class="result-top"><strong>第 ${q.n} 題</strong><span>${esc(q.section)} · ${esc(q.topic)}</span></div><p>${math(q.prompt)}</p><div class="result-actions"><button type="button" data-open="${q.n}">在此操練</button><button type="button" class="bookmark" data-bookmark="${q.n}" aria-label="${state.saved.includes(q.n)?"取消收藏":"收藏"}第 ${q.n} 題">${state.saved.includes(q.n)?"★":"☆"}</button><small>${done}</small></div><div class="inline" id="inline-${q.n}"></div></article>`;
  }
  function findPage() {
    const matches = data.questions.filter(q => (topic==="全部" || q.topic===topic) && (`${q.n} ${q.topic} ${q.prompt}`).includes(query));
    return `${heading("同類題搜尋")}<section class="filters"><label>課題<select id="topic-filter"><option>全部</option>${topics.map(t=>`<option ${topic===t?"selected":""}>${esc(t)}</option>`).join("")}</select></label><label>搜尋題號或內容<input id="query-filter" value="${esc(query)}" placeholder="輸入題號或題目內容"></label></section><p class="count">${matches.length} 題</p><div class="result-grid">${matches.map(searchCard).join("") || '<p>沒有符合的題目。試試其他課題。</p>'}</div>`;
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
    const records=list=>list.map(q=>`<div class="dse-example"><strong>${esc(q.year==="PP"?"PP 練習卷":q.year)} · 第 ${esc(q.parent)} 題</strong><span>${esc(q.summary)}</span></div>`).join("");
    const formalCount=source.groups.filter(q=>q.year!=="PP").length;
    return `<div class="page-head"><p class="eyebrow">DSE 歷屆卷一 · 2012–2026</p><h1>課題分佈</h1><p class="subtle">原有 DSE 網站的歷年分類統計；與本原創模擬卷的 19 題分開計算。</p></div>
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
      ${selected?`<section class="year-detail"><div class="dse-detail-head"><div><h2>${esc(selected.topic)}</h2><p>${yearYear} 年 · ${selected.questions.length} 題</p></div><button type="button" data-year-close aria-label="收起題目摘要">×</button></div><div class="dse-examples">${selected.questions.map(q=>`<div class="dse-example"><strong>${sections.find(([id])=>id===q.section)[1]} · 第 ${q.parent} 題</strong><span>${esc(q.summary)}</span></div>`).join("")}</div></section>`:""}
      <p class="note">一題可涉及多個課題，課題次數相加不等於大題總數。分類依據歷屆 DSE 題目；本頁不是原創模擬卷的統計。</p>`;
  }
  function paperPage() {
    const answered = data.questions.filter(q=>selected(q));
    const checked = data.paper===2 ? data.questions.filter(q=>state.checked[q.n]) : [];
    return `${heading("整卷操練")}<section class="paper-intro"><div><h2>${esc(data.subtitle)}</h2><p>${data.paper===1?"甲部（1）35 分 · 甲部（2）35 分 · 乙部 35 分":"甲部 30 題 · 乙部 15 題"}。題目為原創，題號及版面參照 2026 試卷。</p><div class="stats">${data.paper===1?`<span><b>${count}</b> 道題目</span>`:`<span><b>${answered.length}/${count}</b> 已作答</span><span><b>${checked.length}</b> 已批改</span><span><b>${checked.filter(right).length}</b> 答對</span>`}</div></div><div class="start"><button type="button" data-start="untimed">不限時開始</button><button type="button" data-start="timed" class="outline">計時 ${data.minutes} 分鐘</button>${state.startedAt&&!state.finished?'<button type="button" data-resume class="quiet">繼續上次操練 →</button>':""}</div></section><h2 class="section-title">題目</h2><div class="number-grid">${data.questions.map(q=>`<button type="button" data-solo="${q.n}" class="${data.paper===2?(state.checked[q.n]?(right(q)?"good":"bad"):selected(q)?"answered":""):""}">${q.n}</button>`).join("")}</div><p class="note">本機進度與備份只屬於這份原創卷；清除瀏覽器資料可能令進度消失。</p>`;
  }
  function savedPage() {
    const wrong = data.paper===2 ? data.questions.filter(q=>state.checked[q.n]&&!right(q)) : [];
    return `${heading("我的操練")}<div class="action-row">${data.paper===2?`<button type="button" data-retry ${wrong.length?"":"disabled"}>重做錯題 (${wrong.length})</button>`:""}<button type="button" class="outline" data-export>下載進度備份</button><label class="import-label">匯入進度備份<input type="file" id="import-file" accept=".json,application/json"></label></div>${data.paper===2?`<h2 class="section-title">錯題</h2><div class="compact-list">${wrong.map(q=>`<button type="button" data-solo="${q.n}">第 ${q.n} 題 · ${esc(q.topic)} <span>重做 →</span></button>`).join("")||"<p>目前沒有錯題。</p>"}</div>`:""}<h2 class="section-title">收藏題目</h2><div class="compact-list">${state.saved.map(n=>question(n)).filter(Boolean).map(q=>`<button type="button" data-solo="${q.n}">第 ${q.n} 題 · ${esc(q.topic)} <span>操練 →</span></button>`).join("")||"<p>尚未收藏題目。</p>"}</div>`;
  }
  function guidePage() {
    return `${heading("技巧站")}<div class="guide-list">${topics.map(t=>{const q=data.questions.find(q=>q.topic===t);return `<details><summary>${esc(t)} <small>第 ${q.n} 題示例</small></summary><ol>${q.hints.map(h=>`<li>${math(h)}</li>`).join("")}</ol><p><strong>自己核對：</strong></p>${solutionHtml(q)}<button type="button" data-solo="${q.n}">操練第 ${q.n} 題</button></details>`;}).join("")}</div>`;
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
    const partHtml=part=>{
      const bits=part.text.split(/(\((?:i|ii|iii)\))/);
      if(bits.length===1) return `<p>${math(part.text).replace(/\n/g,"<br>")}</p>`;
      const lead=bits.shift().trim();
      let html=lead?`<p>${math(lead).replace(/\n/g,"<br>")}</p>`:"";
      for(let i=0;i<bits.length;i+=2) if(bits[i+1]?.trim()) html+=`<div class="exam-subpart"><span>${bits[i]}</span><p>${math(bits[i+1].trim()).replace(/\n/g,"<br>")}</p></div>`;
      return html;
    };
    return `<p class="exam-stem">${math(stem).replace(/\n/g,"<br>")}</p>${diagram(q.diagram)}${parts.length?`<div class="exam-parts">${parts.map(part=>`<div class="exam-part"><span>(${part.label})</span><div>${partHtml(part)}${q.markGroups?.[part.label]?`<p class="exam-part-marks">（${q.markGroups[part.label]} 分）</p>`:""}</div></div>`).join("")}</div>`:""}`;
  }
  function form(q, inline=false) {
    const checked=data.paper===2 && Boolean(state.checked[q.n]);
    const feedback=checked ? `<div class="feedback ${right(q)?"success":"error"}" role="status"><strong>${right(q)?"答對":"答錯"}</strong><p>答案：${q.answer}　${math(q.correct)}</p><p>${math(q.solution)}</p></div>` : "";
    const input=data.paper===2
      ? `<div class="options" role="group" aria-label="第 ${q.n} 題選項">${q.options.map((o,i)=>`<label class="${selected(q)===letters[i]?"chosen":""}"><input type="radio" name="answer-${q.n}" value="${letters[i]}" ${selected(q)===letters[i]?"checked":""}><b>${letters[i]}.</b><span>${math(o)}</span></label>`).join("")}</div>`
      : "";
    const shown=state.hints[q.n] || 0;
    const answerHeight=marks[q.n]<=4?42:marks[q.n]<=7?70:marks[q.n]<=8?84:112;
    return `<article class="question exam-question" id="question-${q.n}"><div class="exam-body"><h2>${q.n}.</h2><div class="exam-content">${examPrompt(q)}${input}${data.paper===1?`<div class="exam-marks">（${marks[q.n]} 分）</div><div class="print-answer-space" style="--answer-height:${answerHeight}mm" aria-hidden="true"></div>`:""}</div></div><div class="study-tools"><button type="button" class="outline" data-hint="${q.n}" ${shown>=q.hints.length?"disabled":""}>逐步提示 ${shown}/${q.hints.length}</button>${data.paper===2?`<button type="button" data-check="${q.n}" ${selected(q)?"":"disabled"}>批改這題</button>`:""}<button type="button" class="bookmark" data-bookmark="${q.n}" aria-label="收藏第 ${q.n} 題">${state.saved.includes(q.n)?"★":"☆"}</button></div>${shown?`<ol class="hints">${q.hints.slice(0,shown).map(h=>`<li>${math(h)}</li>`).join("")}</ol>`:""}${feedback}${data.paper===1?`<details class="worked-answer"><summary>參考解答</summary>${solutionHtml(q)}</details>`:""}</article>`;
  }
  function sectionTitle(q) {
    if (data.paper===1) return {1:"甲部（1）（35 分）",10:"甲部（2）（35 分）",15:"乙部（35 分）"}[q.n];
    return {1:"甲部",31:"乙部"}[q.n];
  }
  function practicePage() {
    const sequence=session.length ? session : data.questions.map(q=>q.n);
    const timer=state.deadline && !state.finished ? `<span id="timer" class="timer">計算時間中</span>` : "";
    const checked=data.paper===2 ? data.questions.filter(q=>state.checked[q.n]) : [];
    return `<div class="practice-header"><button type="button" class="back" data-back>← 返回</button>${timer}<a class="export-pdf" href="../output/pdf/dse-original-paper1-practice.pdf" download="dse-original-paper1-practice.pdf" title="下載全卷 PDF（附空白作答空間）"><span aria-hidden="true">↓</span>匯出 PDF</a><span>${state.mode==="timed"?"計時":"不限時"} · ${state.finished?"已完成":data.paper===1?"練習中":"作答中"}</span></div><div class="practice-layout"><section class="practice-main"><header class="exam-title"><span>2026 對應原創模擬卷 · 非官方</span><h1>數學　必修部分<br>試卷${data.paper===1?"一":"二"}</h1><p>${data.paper===1?"請寫出計算步驟及答案。":"每題選出最佳答案。"}</p></header>${sequence.map(n=>{const q=question(n);return `${sectionTitle(q)?`<h2 class="exam-section">${sectionTitle(q)}</h2>`:""}${form(q)}`;}).join("")}${state.startedAt&&!state.finished?`<button type="button" class="finish" data-finish>${data.paper===2?"提交整卷並批改":"完成本卷"}</button>`:""}${data.paper===2&&state.finished?`<p class="exam-result">已批改 ${checked.length} 題，答對 ${checked.filter(right).length} 題。</p>`:""}</section><aside class="question-nav"><h3>跳至題目</h3><div class="mini-grid">${sequence.map(n=>`<button type="button" data-jump="${n}" class="${data.paper===2?(state.checked[n]?(right(question(n))?"good":"bad"):state.answers[n]?"answered":""):""}">${n}</button>`).join("")}</div>${data.paper===2?`<p>${Object.values(state.answers).filter(Boolean).length} 題已有答案</p>`:""}</aside></div>`;
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
    document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ const n=Number(b.dataset.open); const slot=document.getElementById(`inline-${n}`); slot.innerHTML=slot.innerHTML?"":form(question(n),true); bind(); });
    document.querySelectorAll("[data-solo]").forEach(b=>b.onclick=()=>open(Number(b.dataset.solo)));
    document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>{active=Number(b.dataset.jump);state.active=active;persist();document.getElementById(`question-${active}`)?.scrollIntoView({behavior:"smooth",block:"start"});});
    document.querySelectorAll("[data-hint]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.hint);state.hints[n]=Math.min(question(n).hints.length,(state.hints[n]||0)+1);persist();refreshQuestion(n);});
    document.querySelectorAll("[data-check]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.check);if(data.paper!==2||!state.answers[n])return;state.checked[n]=true;persist();refreshQuestion(n);});
    document.querySelectorAll("[data-bookmark]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.bookmark);state.saved=state.saved.includes(n)?state.saved.filter(x=>x!==n):[...state.saved,n];persist();pendingScroll=route==="practice"?n:null;render();});
    document.querySelectorAll(".options input").forEach(input=>input.onchange=()=>{const n=Number(input.name.split("-")[1]);state.answers[n]=input.value;delete state.checked[n];persist();refreshQuestion(n);});
    document.querySelector("#topic-filter")?.addEventListener("change", e=>{topic=e.target.value;render();});
    document.querySelector("#query-filter")?.addEventListener("input", e=>{query=e.target.value;lastFocus="query-filter";render();});
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
    document.querySelector("[data-export]")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schema,paper:data.paper,progress:state},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`dse-original-2026-paper${data.paper}-backup.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    document.querySelector("#import-file")?.addEventListener("change", async e=>{try{const file=e.target.files[0];if(!file)return;const payload=JSON.parse(await file.text());if(payload.schema!==schema||payload.paper!==data.paper||!payload.progress||typeof payload.progress.answers!=="object"||Array.isArray(payload.progress.answers))throw Error("格式不符");if(!confirm("匯入會取代這份原創卷的本機進度。確定嗎？"))return;state={...blank(),...payload.progress};persist();render();alert("進度已匯入。");}catch{alert("無法匯入：請選擇同一份原創卷的備份。");}});
  }
  function refreshQuestion(n) {
    const inline=document.getElementById(`inline-${n}`);
    if(inline) inline.innerHTML=form(question(n),true);
    else document.getElementById(`question-${n}`).outerHTML=form(question(n));
    bind();
  }
  addEventListener("hashchange",render);
  render();
})();
