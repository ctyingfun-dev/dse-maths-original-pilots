(() => {
  'use strict';

  // Call after document.fonts.ready, with visible content, before measuring rows.
  // Call again after changing font size. Repeated calls do not duplicate wrappers.
  window.fitPdfRoots = function fitPdfRoots(container = document) {
    const document = container.ownerDocument || container;
    const roots = Array.from(container.querySelectorAll('.math-root'));
    if (container.matches?.('.math-root')) roots.unshift(container);
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return 0;
    let fitted = 0;

    // Inner roots must reach their final height before their parents are measured.
    for (let root of roots.reverse()) {
      if (!root.isConnected || !root.getBoundingClientRect().height) continue;
      if (!root.classList.contains('pdf-root')) {
        const radicand = root.querySelector(':scope > msqrt > mtext > .math-radicand');
        if (!radicand) continue;
        const replacement = document.createElement('span');
        replacement.className = 'math-root pdf-root';
        replacement.setAttribute('role', 'math');
        if (root.hasAttribute('aria-label')) {
          replacement.setAttribute('aria-label', root.getAttribute('aria-label'));
        }
        const sign = document.createElement('span');
        sign.className = 'pdf-root-sign';
        sign.setAttribute('aria-hidden', 'true');
        const glyph = document.createElement('span');
        glyph.className = 'pdf-root-glyph';
        glyph.textContent = '\u221a';
        const baseline = document.createElement('span');
        baseline.className = 'pdf-root-baseline';
        glyph.append(baseline);
        sign.append(glyph);
        replacement.append(sign, radicand);
        root.replaceWith(replacement);
        root = replacement;
      }

      const glyph = root.querySelector(':scope > .pdf-root-sign > .pdf-root-glyph');
      const radicand = root.querySelector(':scope > .math-radicand');
      root.style.setProperty('--pdf-root-glyph-scale', '1');
      root.style.setProperty('--pdf-root-glyph-top', '0px');
      const style = getComputedStyle(glyph);
      context.font = `${style.fontSize} "Times New Roman"`;
      const ink = context.measureText('\u221a');
      const inkHeight = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
      if (!(inkHeight > 0)) continue;
      root.style.setProperty('--pdf-root-sign-width', `${ink.width}px`);
      const height = radicand.getBoundingClientRect().height;
      const scale = height / inkHeight;
      const baselineY = glyph.querySelector('.pdf-root-baseline').getBoundingClientRect().top;
      const inkTop = baselineY - glyph.getBoundingClientRect().top - ink.actualBoundingBoxAscent;
      root.style.setProperty('--pdf-root-glyph-top', `${-inkTop * scale}px`);
      root.style.setProperty('--pdf-root-glyph-scale', String(scale));
      fitted++;
    }
    return fitted;
  };
})();
