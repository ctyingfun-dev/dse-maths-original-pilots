(() => {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let mainElement = null;
  let entered = false;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let glassTarget = null;
  let glassBounds = null;
  let lightFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function resetGlass() {
    if (lightFrame) cancelAnimationFrame(lightFrame);
    lightFrame = 0;
    if (glassTarget) {
      glassTarget.removeAttribute("data-glass-active");
    }
    glassTarget = null;
    glassBounds = null;
  }
  function paintGlass() {
    lightFrame = 0;
    if (!glassTarget?.isConnected || reduced.matches || !finePointer.matches) return resetGlass();
    const x = Math.max(0, Math.min(glassBounds.width, pointerX - glassBounds.left));
    const y = Math.max(0, Math.min(glassBounds.height, pointerY - glassBounds.top));
    glassTarget.style.setProperty("--glow-x", `${x}px`);
    glassTarget.style.setProperty("--glow-y", `${y}px`);
  }
  document.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || !finePointer.matches || reduced.matches) return;
    const target = event.target.closest?.(".glass-surface");
    if (target !== glassTarget) {
      resetGlass();
      if (!target) return;
      glassTarget = target;
      glassBounds = target.getBoundingClientRect();
      target.dataset.glassActive = "true";
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!lightFrame) lightFrame = requestAnimationFrame(paintGlass);
  }, {passive: true});
  document.addEventListener("pointerout", event => {
    if (!event.relatedTarget || !glassTarget?.contains(event.relatedTarget)) resetGlass();
  });
  document.addEventListener("pointercancel", resetGlass);
  addEventListener("blur", resetGlass);
  addEventListener("resize", resetGlass);
  addEventListener("scroll", resetGlass, {passive: true, capture: true});
  document.addEventListener("visibilitychange", resetGlass);
  reduced.addEventListener("change", resetGlass);
  finePointer.addEventListener("change", resetGlass);

  function icon(name) {
    return `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="../assets/workspace-icons.svg?v=20261102-mock-topics#${name}"></use></svg>`;
  }
  function orbitMark(className = "") {
    return `<span class="orbit-mark ${className}" aria-hidden="true"><i></i></span>`;
  }
  function topicIndex(questions, selected, topicsOf) {
    const topics = [...new Set(questions.flatMap(topicsOf))];
    return `<aside class="topic-index" aria-label="題庫課題索引"><h2>課題索引</h2><nav aria-label="按課題篩選">${["全部", ...topics].map((topic, index) => `<button type="button" id="topic-choice-${index}" data-topic-filter="${escape(topic)}" aria-pressed="${selected === topic}">${orbitMark()}<span>${escape(topic)}</span><small>${topic === "全部" ? questions.length : questions.filter(q => topicsOf(q).includes(topic)).length}</small></button>`).join("")}</nav></aside>`;
  }
  function groupSolutionMath(line) {
    const fragment = document.createDocumentFragment();
    let parts = [];
    const flush = () => {
      if (!parts.length) return;
      const expression = document.createElement("span");
      expression.className = "math-expression";
      expression.append(...parts);
      fragment.append(expression);
      parts = [];
    };
    // Line breaks are authored by the solution renderer; keep each inline expression intact.
    for (const node of [...line.childNodes]) {
      const tokens = node.nodeType === Node.TEXT_NODE
        ? node.textContent.split(/([\p{Script=Han}，。；：、！？\n]+)/u).filter(Boolean).map(text => document.createTextNode(text))
        : [node];
      for (const token of tokens) {
        if (token.nodeType === Node.TEXT_NODE && /[\p{Script=Han}，。；：、！？\n]/u.test(token.textContent)) {
          const punctuation = token.textContent.match(/^[，。；：、！？]+/u)?.[0];
          if (punctuation && parts.length) {
            parts.push(document.createTextNode(punctuation));
            token.textContent = token.textContent.slice(punctuation.length);
          }
          flush();
          if (token.textContent) fragment.append(token);
        } else {
          parts.push(token);
        }
      }
    }
    flush();
    line.replaceChildren(fragment);
    line.dataset.mathGrouped = "true";
  }
  const screenMedia = matchMedia("screen");
  let rootFrame = 0;
  let rootContext;
  function fitScreenRoots(container = document) {
    if (!screenMedia.matches) return 0;
    rootContext ||= document.createElement("canvas").getContext("2d");
    if (!rootContext) return 0;
    const roots = [...container.querySelectorAll("math.math-root")];
    if (container.matches?.("math.math-root")) roots.unshift(container);
    let fitted = 0;
    // Keep the MathML subtree intact for accessibility and print. Only the
    // screen stylesheet disables its native radical and draws the fitted sign.
    for (const root of roots.reverse()) {
      if (!root.isConnected || !root.getBoundingClientRect().height || root.checkVisibility?.() === false) continue;
      const radicand = root.querySelector(":scope > msqrt > mtext > .math-radicand");
      if (!radicand) continue;
      let wrapper = root.parentElement;
      if (!wrapper.classList.contains("screen-root")) {
        wrapper = document.createElement("span");
        wrapper.className = "screen-root";
        const sign = document.createElement("span");
        sign.className = "screen-root-sign";
        sign.setAttribute("aria-hidden", "true");
        const glyph = document.createElement("span");
        glyph.className = "screen-root-glyph";
        const baseline = document.createElement("span");
        baseline.className = "screen-root-baseline";
        glyph.append(baseline);
        sign.append(glyph);
        root.replaceWith(wrapper);
        wrapper.append(sign, root);
      }
      const glyph = wrapper.firstElementChild.firstElementChild;
      wrapper.style.setProperty("--screen-root-scale", "1");
      wrapper.style.setProperty("--screen-root-top", "0px");
      const style = getComputedStyle(glyph);
      rootContext.font = `${style.fontSize} "Times New Roman"`;
      const ink = rootContext.measureText("\u221a");
      const inkHeight = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
      if (!(inkHeight > 0)) continue;
      wrapper.style.setProperty("--screen-root-width", `${ink.width}px`);
      const scale = radicand.getBoundingClientRect().height / inkHeight;
      const inkTop = glyph.firstElementChild.getBoundingClientRect().top - glyph.getBoundingClientRect().top - ink.actualBoundingBoxAscent;
      wrapper.style.setProperty("--screen-root-top", `${-inkTop * scale}px`);
      wrapper.style.setProperty("--screen-root-scale", String(scale));
      fitted++;
    }
    return fitted;
  }
  function scheduleRoots() {
    if (!rootFrame) rootFrame = requestAnimationFrame(() => {
      rootFrame = 0;
      fitScreenRoots();
    });
  }
  addEventListener("resize", scheduleRoots);
  addEventListener("afterprint", scheduleRoots);
  screenMedia.addEventListener("change", scheduleRoots);
  document.addEventListener("toggle", scheduleRoots, true);
  document.fonts.ready.then(scheduleRoots);
  document.fonts.addEventListener("loadingdone", scheduleRoots);
  function enhance(route) {
    document.body.dataset.route = route;
    const menu = document.querySelector("#mobile-navigation");
    const menuToggle = document.querySelector(".mobile-menu-toggle");
    if (menu && menuToggle) {
      menuToggle.onclick = () => { menu.showModal(); menuToggle.setAttribute("aria-expanded","true"); };
      menu.querySelector("[data-menu-close]").onclick = () => menu.close();
      menu.onclose = () => menuToggle.setAttribute("aria-expanded","false");
      menu.querySelectorAll("a").forEach(link => link.onclick = () => menu.close());
      menu.querySelector("#mobile-mock-year").onchange = event => {
        const url = new URL(location.href);
        url.searchParams.set("year",event.target.value);
        location.href = url.href;
      };
    }
    document.querySelectorAll(".focus-practice .study-tools:not([data-hint-ready])").forEach(tools => {
      tools.dataset.hintReady = "true";
      tools.insertAdjacentHTML("afterbegin",'<div class="hint-intro screen-only"><h2>逐步提示</h2><p>先試一試，再看提示。<br>每次只顯示一個步驟。</p></div>');
    });
    if (!glassTarget?.isConnected) resetGlass();
    document.querySelectorAll(".site-header, .topic-index, .paper-intro, .result, .paper-part .number-grid button, .practice-main, .question-nav, .guide-list > details, .lessons > details, .dse-distribution, .dse-detail, .year-detail, .compact-list, .year-list, .dse-summary, .year-summary").forEach(surface => {
      surface.classList.add("glass-surface");
    });
    document.querySelectorAll(".solution-text:not([data-math-grouped]),.solution-equation:not([data-math-grouped])").forEach(groupSolutionMath);
    scheduleRoots();
    document.querySelectorAll(".result-index:not([data-orbit-ready])").forEach(index => {
      index.dataset.orbitReady = "true";
      index.insertAdjacentHTML("beforeend", orbitMark());
    });
    document.querySelectorAll("button.bookmark:not([data-icon-ready])").forEach(button => {
      const saved = button.textContent.trim() === "★";
      button.dataset.iconReady = "true";
      button.dataset.saved = String(saved);
      button.setAttribute("aria-pressed", String(saved));
      button.innerHTML = icon("star");
      if (button.dataset.bookmark) button.setAttribute("aria-label", `${saved ? "取消收藏" : "收藏"}第 ${button.dataset.bookmark} 題`);
      button.title = button.getAttribute("aria-label");
    });
    document.querySelectorAll(".export-pdf:not([data-icon-ready])").forEach(link => {
      link.dataset.iconReady = "true";
      link.querySelector("span")?.remove();
      link.insertAdjacentHTML("afterbegin", icon("download"));
    });
    const main = document.querySelector("#main-content");
    if (main === mainElement) return;
    mainElement = main;
    if (!entered && !reduced.matches) {
      main.animate([{opacity: .75}, {opacity: 1}], {duration: 340, easing: "cubic-bezier(.22,1,.36,1)"});
    }
    entered = true;
  }
  addEventListener("beforeprint", () => {
    resetGlass();
    document.querySelector("#main-content")?.getAnimations({subtree: true}).forEach(animation => animation.finish());
  });
  function createTopicBrowser({data, prompt, solution}) {
    const catalog = window.PILOT_CATALOG;
    const years = catalog.map(paper=>String(paper.year));
    const sections = data.paper===1 ? [["A1","甲部（1）","a1"],["A2","甲部（2）","a2"],["B","乙部","b"]] : [["A","甲部","a"],["B","乙部","b"]];
    const sectionOf = q => data.paper===1 ? (["甲一","甲部（1）"].includes(q.section)?"A1":["甲二","甲部（2）"].includes(q.section)?"A2":"B") : (q.section==="甲部"?"A":"B");
    const records = catalog.flatMap(paper=>paper.questions.map(q=>({...q,mockYear:paper.year,part:sectionOf(q),topics:window.MockTopics.forQuestion(q,paper.year,data.paper)})));
    const options = [["all","全卷"],...sections];
    let current;
    const href = (route, values) => `#${route}?${new URLSearchParams(values)}`;
    function render(route, fragment) {
      const params = new URLSearchParams(fragment.split("?")[1]||"");
      const byYear = route==="years";
      const chosenYear = years.includes(params.get("year")) ? params.get("year") : byYear ? String(data.year||2026) : "all";
      const section = options.some(([id])=>id===params.get("section")) ? params.get("section") : "all";
      const search = params.get("search")||"";
      const requestedTopic = params.get("topic")||"";
      const topic = window.MockTopics.names.includes(requestedTopic) ? requestedTopic : window.MockTopics.classify(requestedTopic)[0]||requestedTopic;
      const all = records.filter(q=>chosenYear==="all"||String(q.mockYear)===chosenYear);
      const pool = all.filter(q=>section==="all"||q.part===section);
      const counts = new Map();
      for (const q of pool) {
        for (const name of q.topics) {
          if (!counts.has(name)) counts.set(name,{topic:name,questions:[]});
          counts.get(name).questions.push(q);
        }
      }
      const rows = [...counts.values()].filter(row=>row.topic.includes(search.trim())||row.questions.some(q=>q.topic.includes(search.trim())))
        .sort((a,b)=>b.questions.length-a.questions.length||a.topic.localeCompare(b.topic,"zh-Hant"));
      const pages = Math.max(1,Math.ceil(rows.length/10));
      const page = Math.min(pages,Math.max(1,Number.parseInt(params.get("page"),10)||1));
      const selected = rows.find(row=>row.topic===topic);
      const max = Math.max(1,...rows.map(row=>row.questions.length));
      current = {route,year:chosenYear,section,search,topic,page};
      const bars = (row,kind) => `<div class="${kind}-bar" role="img" aria-label="${escape(row.topic)} ${row.questions.length} 題">${sections.map(([id,,style])=>`<span class="${style}" style="width:${row.questions.filter(q=>q.part===id).length/max*100}%"></span>`).join("")}</div>`;
      const close = `<button type="button" data-mock-close aria-label="收起課題題目" title="收起課題題目">${icon("x")}</button>`;
      const questionHtml = q => `<article class="mock-topic-question" data-mock-question="${q.mockYear}-${q.n}">
        <header><h3>${q.mockYear} · 第 ${q.n} 題</h3><span>${escape(options.find(([id])=>id===q.part)[1])}</span><a href="?year=${q.mockYear}#practice?question=${q.n}">操練此題 ${icon("arrow-right")}</a></header>
        <div class="result-prompt">${prompt(q)}</div>
        ${data.paper===2?`<ol class="mock-topic-options" type="A">${q.options.map(option=>`<li>${window.mathText(option)}</li>`).join("")}</ol>`:""}
        <details class="worked-answer"><summary>參考解答</summary>${data.paper===2?`<p>答案：${escape(q.answer)}</p>`:""}${solution(q)}</details>
      </article>`;
      const detail = selected ? `<section class="mock-topic-detail ${byYear?"year-detail":"dse-detail"}" id="mock-topic-detail" aria-labelledby="mock-topic-title">
        <div class="dse-detail-head"><div><h2 id="mock-topic-title" tabindex="-1">${escape(selected.topic)}</h2><p>${chosenYear==="all"?"2014–2026":chosenYear} 原創模擬卷 · ${selected.questions.length} 題</p></div>${close}</div>
        ${selected.questions.map(questionHtml).join("")}</section>` : "";
      const index = years.indexOf(chosenYear);
      const yearControls = byYear
        ? `<div class="year-controls"><button type="button" data-mock-year-step="-1" ${index===0?"disabled":""} aria-label="上一年" title="上一年">${icon("chevron-left")}</button><label>年份<select id="year-select">${years.map(y=>`<option ${y===chosenYear?"selected":""}>${y}</option>`).join("")}</select></label><button type="button" data-mock-year-step="1" ${index===years.length-1?"disabled":""} aria-label="下一年" title="下一年">${icon("chevron-right")}</button><a href="#topics">查看歷年總覽 →</a></div>`
        : `<div class="mock-topic-controls"><label>年份<select id="dse-topic-year"><option value="all">全部年份</option>${years.map(y=>`<option ${y===chosenYear?"selected":""}>${y}</option>`).join("")}</select></label><label>搜尋課題<input id="dse-topic-search" type="search" value="${escape(search)}" placeholder="輸入課題名稱"></label></div>`;
      return `<div class="page-head"><h1>${byYear?"逐年課題分佈":"課題分佈"}</h1><p class="subtle">${byYear?chosenYear:"2014–2026"} 原創模擬卷${data.paper===1?"一":"二"} · 非官方</p></div>
        ${yearControls}
        <div class="${byYear?"year-summary":"dse-summary"}"><div><strong>${byYear?all.length:catalog.length}</strong><span>${byYear?`${chosenYear} 年試題`:"年原創模擬卷"}</span></div><div><strong>${pool.length}</strong><span>目前範圍試題</span></div><div><strong>${counts.size}</strong><span>項課題</span></div></div>
        <div class="${byYear?"year-tabs":"dse-tabs"}" role="group" aria-label="試卷部分">${options.map(([id,name])=>`<button type="button" data-mock-section="${id}" aria-pressed="${section===id}">${name}</button>`).join("")}</div>
        <div class="dse-heading"><h2>課題出現次數</h2></div>
        <p class="subtle">同一題可涉及多個課題，各課題題數不可相加。</p>
        <div class="${byYear?"year-legend":"dse-legend"}">${sections.map(([,name,style])=>`<span><i class="${style}"></i>${name}</span>`).join("")}</div>
        <div class="${byYear?"year-list":"dse-distribution"}">${(byYear?rows:rows.slice((page-1)*10,page*10)).map((row,i)=>`<div class="${byYear?"year-row":"dse-row"}">${byYear?"":`<span>${(page-1)*10+i+1}</span>`}<button type="button" data-${byYear?"year":"dse"}-topic="${escape(row.topic)}" aria-expanded="${selected===row}" ${selected===row?'aria-controls="mock-topic-detail"':""}>${escape(row.topic)}</button>${bars(row,byYear?"year":"dse")}<b>${row.questions.length}</b>${byYear?`<span class="year-refs">${row.questions.map(q=>`第 ${q.n} 題`).join("、")}</span>`:""}</div>`).join("")||'<p class="empty-results" role="status">此範圍找不到課題。</p>'}</div>
        ${!byYear&&pages>1?`<nav class="dse-pages" aria-label="課題分頁"><button type="button" data-mock-page="${page-1}" ${page===1?"disabled":""} aria-label="上一頁" title="上一頁">${icon("chevron-left")}</button><span>${page}／${pages}</span><button type="button" data-mock-page="${page+1}" ${page===pages?"disabled":""} aria-label="下一頁" title="下一頁">${icon("chevron-right")}</button></nav>`:""}
        ${detail}`;
    }
    function bind(refresh, route) {
      if (!["topics","years"].includes(route) || !current) return;
      const update = values => {
        const {route,...valuesNow} = current;
        location.hash = href(route,{...valuesNow,...values});
      };
      document.querySelector("#dse-topic-year")?.addEventListener("change",e=>update({year:e.target.value,topic:"",page:1}));
      document.querySelector("#year-select")?.addEventListener("change",e=>update({year:e.target.value,topic:"",page:1}));
      document.querySelector("#dse-topic-search")?.addEventListener("input",e=>{
        const input=e.target,position=input.selectionStart;
        const {route,...values} = current;
        history.replaceState(null,"",href(route,{...values,search:input.value,page:1,topic:""}));
        refresh();
        const field=document.querySelector("#dse-topic-search");
        field.focus();
        field.setSelectionRange(position,position);
      });
      document.querySelectorAll("[data-mock-section]").forEach(button=>button.onclick=()=>update({section:button.dataset.mockSection,page:1}));
      document.querySelectorAll("[data-mock-year-step]").forEach(button=>button.onclick=()=>update({year:years[years.indexOf(current.year)+Number(button.dataset.mockYearStep)],topic:"",page:1}));
      document.querySelectorAll("[data-mock-page]").forEach(button=>button.onclick=()=>update({page:button.dataset.mockPage,topic:""}));
      document.querySelectorAll("[data-dse-topic],[data-year-topic]").forEach(button=>button.onclick=()=>{
        const topic=button.dataset.dseTopic||button.dataset.yearTopic;
        const {route,...values} = current;
        history.pushState(null,"",href(route,{...values,topic:topic===current.topic?"":topic}));
        refresh();
        const title=document.querySelector("#mock-topic-title");
        title?.focus({preventScroll:true});
        title?.scrollIntoView({block:"start"});
        if (!title) [...document.querySelectorAll("[data-dse-topic],[data-year-topic]")].find(button=>(button.dataset.dseTopic||button.dataset.yearTopic)===topic)?.focus();
      });
      document.querySelector("[data-mock-close]")?.addEventListener("click",()=>{
        const name=current.topic;
        const {route,...values}=current;
        history.pushState(null,"",href(route,{...values,topic:""}));
        refresh();
        [...document.querySelectorAll("[data-dse-topic],[data-year-topic]")].find(button=>(button.dataset.dseTopic||button.dataset.yearTopic)===name)?.focus();
      });
    }
    return {render,bind};
  }
  window.PilotWorkspace = {icon, topicIndex, enhance, fitScreenRoots, createTopicBrowser};
})();
