const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {launchBrowser} = require('./browser-runtime.cjs');
const root = path.resolve(__dirname, '..');

async function main() {
  const corpus = [];
  for (let year = 2016; year <= 2026; year++) for (const paper of [1, 2]) {
    const context = {window: {}};
    vm.runInNewContext(fs.readFileSync(path.join(root, `paper${paper}/data-${year}.js`), 'utf8'), context);
    const data = context.window[`PILOT_${year}`] || context.window.PILOT;
    for (const q of data.questions) corpus.push({year, paper, n: q.n, groups: paper === 1
      ? q.solution.flatMap(part => part.steps.map(step => step.text)) : [q.solution]});
  }
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><meta charset="utf-8"><div id="sample"></div>');
    await page.addStyleTag({path: path.join(__dirname, 'solution-pdf.css')});
    await page.addScriptTag({path: path.join(root, 'paper1/math.js')});
    await page.addScriptTag({path: path.join(__dirname, 'solution-pdf-math.js')});
    const result = await page.evaluate(corpus => {
      const failures = [];
      const check = (condition, message) => {if (!condition) failures.push(message);};
      const host = document.querySelector('#sample');
      const show = text => {host.innerHTML = window.pdfSolutionHtml(text); return host;};
      const frac = text => show(text).querySelector('.math-frac');
      let f = frac('(C(7,4)\u00d74!\u00d76!)/10!');
      check(f?.children[1].textContent === '10!', '2016 P1 Q15 denominator must include factorial');
      for (const [text, top, bottom] of [['5^198/5^246', '5198', '5246'], ['a^m/a^n', 'am', 'an']]) {
        f = frac(text);
        check(f?.children[0].textContent === top && f?.children[1].textContent === bottom, `Fraction operands: ${text}`);
        check(f?.children[0].querySelector('sup') && f?.children[1].querySelector('sup'), `Superscript operands: ${text}`);
        check(!host.textContent.includes('^'), `Unrendered caret: ${text}`);
      }
      show('3^[(6n+6)-(6n+2)]=3\u2074=81');
      check(host.querySelector('sup')?.textContent === '(6n+6)\u2212(6n+2)', '2018 P2 Q1 complete bracket exponent');
      f = frac('12/tan 60\u00b0');
      check(f?.children[1].textContent === 'tan 60\u00b0', '2025 P2 Q20 complete trig denominator');
      show('(a^m)^n=a^(mn)');
      check([...host.querySelectorAll('sup')].map(s => s.textContent).join(',') === 'm,n,mn', 'Nested powers');
      f = frac('n!/r!');
      check(f?.children[0].textContent === 'n!' && f?.children[1].textContent === 'r!', 'Factorial numerator and denominator');

      host.style.width = '105px';
      for (const text of ['7\u00d711=77', '12a+9', 'y=-3', 'y=3']) {
        show('\u6240\u4ee5\u7d50\u679c\u70ba ' + text + '\u3002');
        const expression = [...host.querySelectorAll('.math-expression')].find(el => el.textContent.trim().replace(/\u2212/g, '-') === text+'\u3002');
        check(expression && getComputedStyle(expression).whiteSpace === 'nowrap', `Atomic short result: ${text}`);
        if (expression) {
          const walker = document.createTreeWalker(expression, NodeFilter.SHOW_TEXT);
          const rects = [];
          while (walker.nextNode()) {
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            rects.push(...range.getClientRects());
          }
          check(Math.max(...rects.map(r => r.bottom)) - Math.min(...rects.map(r => r.top)) < 25, `No line split: ${text}`);
        }
      }
      show('<img src=x onerror=alert(1)>');
      check(!host.querySelector('img,script'), 'Input remains escaped');
      const canonical = text => text.normalize('NFKC').replace(/[\s^()[\]]/g, '').replace(/\u2212/g, '-');
      let groups = 0;
      for (const q of corpus) for (const group of q.groups) {
        const old = document.createElement('div');
        old.innerHTML = window.solutionHtml(group);
        show(group);
        check(canonical(host.textContent) === canonical(old.textContent), `${q.year} P${q.paper} Q${q.n}: text preservation: ${old.textContent} -> ${host.textContent}`);
        check(!host.textContent.includes('^'), `${q.year} P${q.paper} Q${q.n}: residual caret`);
        groups++;
      }
      return {questions: corpus.length, groups, failures};
    }, corpus);
    assert.deepEqual(result.failures, []);
    console.log(`PDF math helper: targeted formula and narrow-width checks passed; ${result.questions} questions / ${result.groups} solution groups preserve visible content.`);
  } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
