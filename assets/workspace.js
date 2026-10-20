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
      glassTarget.style.setProperty("--tilt-x", "0deg");
      glassTarget.style.setProperty("--tilt-y", "0deg");
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
    if (!glassTarget.hasAttribute("data-glass-tilt")) return;
    const nx = x / glassBounds.width * 2 - 1;
    const ny = y / glassBounds.height * 2 - 1;
    // Bound the combined angle, rather than allowing four degrees on each axis.
    const limit = glassBounds.height > 650 ? 1.1 : 3.6;
    const scale = limit / Math.max(1, Math.hypot(nx, ny));
    glassTarget.style.setProperty("--tilt-x", `${(-ny * scale).toFixed(3)}deg`);
    glassTarget.style.setProperty("--tilt-y", `${(nx * scale).toFixed(3)}deg`);
  }
  document.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || !finePointer.matches || reduced.matches) return;
    const target = event.target.closest?.(".glass-surface");
    if (target !== glassTarget) {
      resetGlass();
      if (!target) return;
      glassTarget = target;
      // Measure before applying perspective so the light does not chase its own transform.
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
    return `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="../assets/workspace-icons.svg?v=20261020-orbit-final#${name}"></use></svg>`;
  }
  function orbitMark(className = "") {
    return `<span class="orbit-mark ${className}" aria-hidden="true"><i></i></span>`;
  }
  function topicIndex(questions, selected) {
    const topics = [...new Set(questions.map(q => q.topic))];
    return `<aside class="topic-index" aria-label="題庫課題索引"><h2>課題索引</h2><nav aria-label="按課題篩選">${["全部", ...topics].map((topic, index) => `<button type="button" id="topic-choice-${index}" data-topic-filter="${escape(topic)}" aria-pressed="${selected === topic}">${orbitMark()}<span>${escape(topic)}</span><small>${topic === "全部" ? questions.length : questions.filter(q => q.topic === topic).length}</small></button>`).join("")}</nav></aside>`;
  }
  function groupSolutionMath(line) {
    const fragment = document.createDocumentFragment();
    let parts = [];
    let depth = 0;
    const flush = () => {
      if (!parts.length) return;
      const expression = document.createElement("span");
      expression.className = "math-expression";
      expression.append(...parts);
      fragment.append(expression);
      parts = [];
    };
    // Keep bracketed operations and their units together, with breaks at relations.
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
          if (!depth && token.nodeType === Node.ELEMENT_NODE && token.classList.contains("math-op") && /^[=≡<>≤≥≠≈]$/.test(token.textContent)) flush();
          parts.push(token);
          if (token.nodeType === Node.TEXT_NODE) {
            for (const char of token.textContent) {
              if ("([".includes(char)) depth++;
              if (")]".includes(char)) depth = Math.max(0, depth - 1);
            }
          }
        }
      }
    }
    flush();
    line.replaceChildren(fragment);
    line.dataset.mathGrouped = "true";
  }
  function enhance(route) {
    document.body.dataset.route = route;
    if (!glassTarget?.isConnected) resetGlass();
    document.querySelectorAll(".site-header, .topic-index, .paper-intro, .result, .paper-part .number-grid button, .practice-main, .question-nav, .guide-list > details, .lessons > details, .dse-distribution, .dse-detail, .year-detail, .compact-list, .year-list, .dse-summary, .year-summary").forEach(surface => {
      surface.classList.add("glass-surface");
      if (surface.matches(".paper-intro, .result, .paper-part .number-grid button, .guide-list > details, .lessons > details, .dse-detail, .year-detail")) surface.dataset.glassTilt = "";
    });
    document.querySelectorAll(".scheme-answer p:not([data-math-grouped])").forEach(groupSolutionMath);
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
  window.PilotWorkspace = {icon, topicIndex, enhance};
})();
