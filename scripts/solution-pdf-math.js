(() => {
  'use strict';
  const pairs = {'(': ')', '[': ']'};

  function groupEnd(text, start) {
    const stack = [];
    for (let i = start; i < text.length; i++) {
      if (pairs[text[i]]) stack.push(pairs[text[i]]);
      else if (text[i] === stack.at(-1)) {
        stack.pop();
        if (!stack.length) return i + 1;
      }
    }
    return start;
  }

  // Explicit groups let the shared renderer consume complete fraction operands.
  function normalize(text) {
    let result = '';
    for (let i = 0; i < text.length;) {
      if (text[i] === '^') {
        const start = i + 1;
        if (pairs[text[start]]) {
          const end = groupEnd(text, start);
          if (end > start) {
            result += '^(' + normalize(text.slice(start + 1, end - 1)) + ')';
            i = end;
            continue;
          }
        } else {
          const exponent = text.slice(start).match(/^[+-]?(?:\d+(?:\.\d+)?|[A-Za-z\u03b1-\u03c9]+)/);
          if (exponent) {
            result += '^(' + exponent[0] + ')';
            i = start + exponent[0].length;
            continue;
          }
        }
      }
      result += text[i++];
    }
    return result
      .replace(/\/\s*(\d+!|[A-Za-z]!)/g, '/($1)')
      .replace(/(\d+!|[A-Za-z]!)\s*\//g, '($1)/')
      .replace(/\/\s*((?:sin|cos|tan)\s+(?:[+-]?\d+(?:\.\d+)?\u00b0?|[A-Za-z\u03b1-\u03c9]))/g, '/($1)');
  }

  function balanced(text) {
    const stack = [];
    for (const c of text) {
      if (pairs[c]) stack.push(pairs[c]);
      else if (c === ')' || c === ']') {
        if (stack.pop() !== c) return false;
      }
    }
    return !stack.length;
  }

  function render(text) {
    // Render first so fractions containing Chinese prose remain complete operands.
    const source = document.createElement('div');
    const output = document.createElement('div');
    source.innerHTML = window.mathText(normalize(text));
    let pending = [];
    const flush = () => {
      if (!pending.length) return;
      const value = pending.map(node => node.textContent).join('');
      if (value.trim() && value.replace(/\s/g, '').length <= 40 && balanced(value)) {
        const span = document.createElement('span');
        span.className = 'math-expression';
        span.append(...pending);
        output.append(span);
      } else output.append(...pending);
      pending = [];
    };
    for (const node of [...source.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) {
        pending.push(node);
        continue;
      }
      let start = 0;
      for (const match of node.textContent.matchAll(/[\p{Script=Han}\u3000-\u303f\uff0c\uff1b\uff1a\uff01\uff1f\u2026\n]+/gu)) {
        if (match.index > start) pending.push(document.createTextNode(node.textContent.slice(start, match.index)));
        flush();
        const punctuation = match[0].match(/^[。，；、：！？]+/u)?.[0] || '';
        const previous = output.lastChild;
        if (punctuation && previous?.nodeType === Node.ELEMENT_NODE && previous.classList.contains('math-expression')) {
          previous.append(document.createTextNode(punctuation));
          output.append(document.createTextNode(match[0].slice(punctuation.length)));
        } else output.append(document.createTextNode(match[0]));
        start = match.index + match[0].length;
      }
      if (start < node.textContent.length) pending.push(document.createTextNode(node.textContent.slice(start)));
    }
    flush();
    return output.innerHTML;
  }

  window.pdfSolutionHtml = values => window.solutionLayout(values).map(block =>
    block.type === 'text'
      ? `<p class="solution-text">${render(block.text)}</p>`
      : `<div class="solution-calculation">${block.rows.map(row =>
        `<p class="solution-equation">${render(row.lhs + row.relation + row.rhs)}</p>`
      ).join('')}</div>`
  ).join('');
})();
