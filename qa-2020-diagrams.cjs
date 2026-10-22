const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const output = path.join(__dirname, "tmp/qa-2020-diagrams");
// Q11 is the source stem-and-leaf data, rendered as SVG in this edition.
const expected = {1: [8, 11, 18, 19], 2: [8, 12, 14, 17, 18, 19, 20, 21, 22, 29, 33, 34, 38, 39]};
const selected = process.argv.find(arg => arg.startsWith("--paper="))?.split("=")[1];
const papers = selected ? [+selected] : [1, 2];
assert.ok(papers.every(paper => [1, 2].includes(paper)), "--paper must be 1 or 2");

async function labelChecks(page) {
  return page.locator(".exam-question .diagram svg").evaluateAll(svgs => svgs.flatMap(svg => {
    const view = svg.viewBox.baseVal, issues = [], boxes = [];
    const svgMatrix = svg.getScreenCTM().inverse();
    const mappedBox = (b, matrix) => {
      const points = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
      const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
      return {x, y, width: Math.max(...points.map(p => p.x)) - x, height: Math.max(...points.map(p => p.y)) - y};
    };
    const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    for (const text of svg.querySelectorAll("text")) {
      const matrix = svgMatrix.multiply(text.getScreenCTM()), b = mappedBox(text.getBBox(), matrix), label = text.textContent, number = svg.closest("article").id;
      if (b.x < view.x || b.y < view.y || b.x + b.width > view.x + view.width || b.y + b.height > view.y + view.height) issues.push({number, label, kind: "clipped"});
      for (const old of boxes) if (overlaps(b, old)) issues.push({number, label, other: old.label, kind: "text overlap"});
      boxes.push({...b, label});
      const style = getComputedStyle(text);
      if (/[A-Za-z0-9]/.test(label) && !style.fontFamily.startsWith('"Times New Roman"')) issues.push({number, label, kind: "font family"});
      if (/^[-−\d.]+$/.test(label) && style.fontStyle !== "normal") issues.push({number, label, kind: "italic number"});
      const context = document.createElement("canvas").getContext("2d"), glyphs = [];
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      let node, index = 0;
      while ((node = walker.nextNode())) {
        const style = getComputedStyle(node.parentElement);
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        for (const char of node.textContent) {
          const position = text.getStartPositionOfChar(index++);
          if (/\s/.test(char)) continue;
          const metrics = context.measureText(char);
          glyphs.push(mappedBox({x: position.x - metrics.actualBoundingBoxLeft, y: position.y - metrics.actualBoundingBoxAscent, width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight, height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent}, matrix));
        }
      }
      for (const shape of svg.querySelectorAll("path,circle,rect,line,polyline")) {
        const transform = svgMatrix.multiply(shape.getScreenCTM()), length = shape.getTotalLength();
        for (let t = 0; t <= length; t += .5) {
          const p = shape.getPointAtLength(t).matrixTransform(transform);
          if (glyphs.some(g => p.x >= g.x - .7 && p.x <= g.x + g.width + .7 && p.y >= g.y - .7 && p.y <= g.y + g.height + .7)) {issues.push({number, label, kind: "line overlap"}); break;}
        }
      }
    }
    return issues;
  }));
}

async function actualFonts(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const {root} = await cdp.send("DOM.getDocument");
  const {nodeIds} = await cdp.send("DOM.querySelectorAll", {nodeId: root.nodeId, selector: ".diagram text"});
  let checked = 0;
  for (const nodeId of nodeIds) {
    const {outerHTML} = await cdp.send("DOM.getOuterHTML", {nodeId});
    const text = outerHTML.replace(/<[^>]+>/g, "");
    if (!/[A-Za-z0-9]/.test(text) || /[\u3400-\u9fff]/.test(text)) continue;
    const {fonts} = await cdp.send("CSS.getPlatformFontsForNode", {nodeId});
    assert.ok(fonts.length && fonts.every(font => font.familyName === "Times New Roman"), `${text}: ${JSON.stringify(fonts)}`);
    checked++;
  }
  assert.ok(checked > 0, "Actual diagram text glyphs must be inspected");
  await cdp.detach();
  return checked;
}


(async () => {
  await fs.mkdir(output, {recursive: true});
  const browser = await launchBrowser(), results = [], screenshots = [];
  try {
    for (const paper of papers) {
      assert.ok(expected[paper]?.length, "Missing independent source-figure audit");
      const context = await browser.newContext(), page = await context.newPage(), errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${base}/paper${paper}/?year=2020#practice`);
      assert.equal(await page.evaluate(() => window.PILOT.year), 2020);
      const numbers = await page.locator(".exam-question:has(.diagram svg)").evaluateAll(nodes => nodes.map(n => +n.id.replace("question-", "")));
      assert.deepEqual(numbers, expected[paper], "Source-audited diagram question numbers");
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({width, height: 900});
        await page.evaluate(() => document.fonts.ready);
        for (const n of numbers) {
          const diagrams = page.locator(`#question-${n} .diagram`);
          for (let index = 0; index < await diagrams.count(); index++) {
            const filename = `p${paper}-q${n}-${index + 1}-${width}.png`;
            await diagrams.nth(index).screenshot({path: path.join(output, filename)});
            screenshots.push({paper, n, index, width, filename});
          }
        }
        const issues = await labelChecks(page);
        const overflow = await page.locator(".exam-question .diagram").evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 1).map(n => n.closest("article").id));
        results.push({paper, width, issues, overflow});
        console.log(JSON.stringify(results.at(-1)));
      }
      const glyphNodes = await actualFonts(page);
      await page.emulateMedia({media: "print"});
      results.push({paper, media: "print", issues: await labelChecks(page), overflow: [], glyphNodes});
      assert.deepEqual(errors, []);
      await context.close();
    }
    const sheet = await browser.newPage({viewport: {width: 1200, height: 900}});
    for (const width of [1440, 390, 320]) {
      const tiles = [];
      for (const shot of screenshots.filter(s => s.width === width)) {
        const bytes = await fs.readFile(path.join(output, shot.filename));
        tiles.push(`<section><h2>P${shot.paper} Q${shot.n} (${width}px)</h2><img src="data:image/png;base64,${bytes.toString("base64")}" /></section>`);
      }
      await sheet.setContent(`<html><head><style>body{margin:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;background:white;font-family:serif}section{min-width:0}h2{font-size:17px}img{max-width:100%;height:auto}</style></head><body>${tiles.join("")}</body></html>`);
      await sheet.screenshot({path: path.join(output, `contact-${width}.png`), fullPage: true});
    }
    await fs.writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    assert.ok(results.every(r => !r.issues.length && !r.overflow.length), "Diagram label/overflow issues; see results and screenshots.");
    console.log(`2020 diagrams: P${papers.join("/P")} source-figure coverage, actual Times New Roman glyphs, three widths and print bounds passed. Geometry still requires the per-paper mathematical verifier and visual review.`);
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
