const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const output = path.join(__dirname, "tmp/qa-2021-diagrams");
// Audited against all original source pages, not inferred from the adapted data.
const expected = {1: [8, 9, 18], 2: [13, 18, 19, 20, 22, 24, 29, 34, 38, 39]};
const kinds = {
  1: ["similarTriangles2021", "readingBar2021", "foldedTrapezium2021"],
  2: ["dots2021", "angles2021", "rectangle2021", "square2021", "circle2021", "trig2021", "box2021", "log2021", "intersection2021", "tangent2021"]
};
const standalone = process.argv.includes("--standalone");
const selectedPaper = process.argv.find(a => a.startsWith("--paper="))?.split("=")[1];
const papers = selectedPaper ? [+selectedPaper] : [1, 2];
assert.ok(papers.every(p => [1, 2].includes(p)), "--paper must be 1 or 2");

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const distance = (a, b) => Math.hypot(...sub(a, b));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const area = (a, b, c) => Math.abs(cross(sub(a, b), sub(c, b))) / 2;
function intersection(a, b, c, d) {
  const u = sub(b, a), v = sub(d, c), t = cross(sub(c, a), v) / cross(u, v);
  return a.map((value, i) => value + t * u[i]);
}
const angle = (a, b, c) => Math.acos(Math.max(-1, Math.min(1, dot(sub(a, b), sub(c, b)) / (distance(a, b) * distance(c, b))))) * 180 / Math.PI;
function near(actual, target, label, tolerance = 1e-6) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - target) < tolerance, `${label}: ${actual} != ${target}`);
}
function subpaths(d) {
  const result = [];
  let current;
  for (const [, command, args] of d.matchAll(/([MLHVZA])([^MLHVZA]*)/g)) {
    const n = args.trim().split(/[ ,]+/).filter(Boolean).map(Number);
    if (command === "M") {current = [[n[0], n[1]]]; result.push(current);}
    if (command === "L") current.push([n[0], n[1]]);
    if (command === "H") current.push([n[0], current.at(-1)[1]]);
    if (command === "V") current.push([current.at(-1)[0], n[0]]);
    if (command === "Z") current.push(current[0]);
    if (command === "A") current.push([n[5], n[6]]);
  }
  return result;
}

async function geometryChecks(page, paper) {
  const data = await page.locator(".exam-question:has(.diagram svg)").evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.id.replace("question-", ""), {
    paths: [...node.querySelectorAll("svg path")].map(p => p.getAttribute("d")),
    dashed: [...node.querySelectorAll("svg path[stroke-dasharray]")].map(p => p.getAttribute("d")),
    circles: [...node.querySelectorAll("svg circle")].map(c => ["cx", "cy", "r"].map(a => +c.getAttribute(a))),
    rects: [...node.querySelectorAll("svg rect")].map(c => ["x", "y", "width", "height"].map(a => +c.getAttribute(a))),
    texts: [...node.querySelectorAll("svg text")].map(t => ({x: +t.getAttribute("x"), y: +t.getAttribute("y"), label: t.textContent})),
    labels: [...node.querySelectorAll("svg text")].map(t => t.textContent)
  }])));
  const ps = n => data[n].paths.flatMap(subpaths);
  if (paper === 1) {
    const [[J, L, N], [K, M]] = ps(8), scale = distance(L, N) / 100;
    near(distance(J, L) / scale, 28, "P1 Q8 JL");
    near(distance(J, N) / scale, 96, "P1 Q8 JN");
    near(distance(K, M) / scale, 21, "P1 Q8 KM");
    near(cross(sub(K, J), sub(N, J)), 0, "P1 Q8 J K N collinear");
    near(cross(sub(M, L), sub(N, L)), 0, "P1 Q8 L M N collinear");
    assert.ok(dot(sub(K, J), sub(K, N)) < 0 && dot(sub(M, L), sub(M, N)) < 0);
    near(angle(L, J, N), angle(K, M, N), "P1 Q8 equal given angles");
    near(Math.abs(cross(sub(K, M), sub(N, M))) / (2 * scale ** 2), 756, "P1 Q8 area KMN");
    assert.equal(data[8].paths.length, 2, "Q8 has no answer-revealing right-angle markers");
    assert.deepEqual(data[8].labels.sort(), ["J", "K", "L", "M", "N"]);

    const bars = data[9].rects;
    assert.equal(bars.length, 6);
    bars.forEach(([x, y, width, height], i) => {
      near(height / bars[0][3], [10, 20, 18, 8, 11, 5][i] / 10, `P1 Q9 bar ${i + 1}`);
      near(y + height, bars[0][1] + bars[0][3], "P1 Q9 common baseline");
      if (i) assert.ok(x > bars[i - 1][0] + width, "P1 Q9 bars separated");
    });
    assert.deepEqual(data[9].labels, ["學生全年閱讀科普文章數目的分布", "閱讀篇數", "學生人數", "31", "10", "32", "k", "33", "18", "34", "8", "35", "11", "36", "5"]);
    assert.ok(!data[9].labels.includes("20"), "P1 Q9 unknown frequency remains hidden");

    const [[j, k, l, m], , [, n]] = ps(18), radians = Math.PI / 180;
    const h = 52 * Math.sin(55 * radians), v = 52 * Math.cos(55 * radians), d = 46 + h / Math.tan(65 * radians);
    const model = {J: [0, 0, v], K: [0, -h, 0], L: [46, -h, 0], M: [d, 0, 0], N: [0, 0, 0]};
    for (const [name, p] of Object.entries({J: j, K: k, L: l, M: m, N: n})) {
      const [x, y, z] = model[name];
      near(distance(p, [100 + 3 * x + 1.35 * y, 155 - .95 * y - 3.45 * z]), 0, `P1 Q18 projection ${name}`);
    }
    near(distance(model.J, model.K), 52, "P1 Q18 JK");
    near(distance(model.K, model.L), 46, "P1 Q18 KL");
    near(angle([-v, 0, 0], model.M, model.L), 65, "P1 Q18 flat JML");
    near(angle(model.K, [-v, 0, 0], model.M), 55, "P1 Q18 flat KJM");
    near(dot(sub(model.J, model.N), sub(model.K, model.N)), 0, "P1 Q18 JN perpendicular base");
    near(dot(sub(model.J, model.N), sub(model.M, model.N)), 0, "P1 Q18 JN perpendicular base");
    assert.deepEqual(data[18].labels.sort(), ["J", "K", "L", "M", "N"]);
    const hidden = data[18].dashed.flatMap(subpaths).flatMap(points => points.slice(1).map((b, i) => [points[i], b]));
    for (const [a, b] of [[j, n], [n, k], [n, m]]) assert.ok(hidden.some(([p, q]) => distance(p, a) + distance(q, b) < 1e-6 || distance(p, b) + distance(q, a) < 1e-6), "P1 Q18 correct hidden edges");
    return;
  }
  {
    const groups = [1, 2, 3].map(n => data[13].circles.filter(([x]) => Math.abs(x - (49 + (n - 1) * 117)) <= 35));
    assert.deepEqual(groups.map(group => group.length), [4, 11, 21], "P2 Q13 pattern counts");
    groups.forEach((group, i) => {
      const rows = [...new Set(group.map(p => p[1]))].sort((a, b) => a - b);
      assert.deepEqual(rows.map(y => group.filter(p => p[1] === y).length), [4, 7, 10].slice(0, i + 1));
    });
    assert.deepEqual(data[13].labels, ["1", "2", "3"]);
  }
  {
    const [[J, K, L, M]] = ps(18), N = intersection(J, M, K, L);
    near(distance(J, K), distance(K, L), "P2 Q18 JK=KL");
    near(cross(sub(K, J), sub(M, L)), 0, "P2 Q18 JK parallel LM");
    near(angle(J, M, L), 32, "P2 Q18 JML");
    near(angle(J, N, K), 102, "P2 Q18 JNK, not JNL");
    near(angle(L, J, M), 35, "P2 Q18 target LJM");
    assert.ok(dot(sub(N, J), sub(N, M)) < 0 && dot(sub(N, K), sub(N, L)) < 0);
    assert.deepEqual(data[18].labels.sort(), ["J", "K", "L", "M", "N"]);
  }
  {
    const [[J, K, L, M], , [, P]] = ps(19), N = intersection(J, L, K, P), Q = intersection(K, P, L, M);
    near(dot(sub(J, K), sub(L, K)), 0, "P2 Q19 rectangle");
    near(distance(J, K) / distance(K, L), 20 / 12, "P2 Q19 side ratio");
    near(dot(sub(K, N), sub(L, N)), 0, "P2 Q19 KN perpendicular JL");
    near(distance(K, N), distance(P, N), "P2 Q19 N midpoint KP");
    near(distance(L, P), distance(J, M), "P2 Q19 LP=JM");
    near(distance(M, Q) / distance(M, L), 12.8 / 20, "P2 Q19 Q position");
    near(angle(M, J, N), angle(M, Q, P), "P2 Q19 assertion I");
    near(angle(K, L, N), angle(L, Q, N), "P2 Q19 assertion II");
    near(distance(K, L), distance(P, L), "P2 Q19 assertion III");
    assert.deepEqual(data[19].labels.sort(), ["J", "K", "L", "M", "N", "P", "Q"]);
  }
  {
    const [[J, K, L, M], [, N, P]] = ps(20);
    near(distance(J, K), distance(K, L), "P2 Q20 square");
    near(dot(sub(J, K), sub(L, K)), 0, "P2 Q20 square right angle");
    near(distance(J, N) / distance(N, K), 2, "P2 Q20 JN=2NK");
    near(dot(sub(M, N), sub(P, N)), 0, "P2 Q20 MN perpendicular NP");
    near(cross(sub(P, K), sub(L, K)), 0, "P2 Q20 P on KL");
    near(area(L, M, P) / area(M, N, P), 21 / 13, "P2 Q20 target area ratio");
    assert.ok(data[20].labels.every(label => /^[A-Z]$/.test(label)), "Q20 construction coordinates must not be visible lengths");
    assert.deepEqual(data[20].labels.sort(), ["J", "K", "L", "M", "N", "P"]);
  }
  {
    const [[J, L, M, , N], [K]] = ps(22), [cx, cy, radius] = data[22].circles[0];
    for (const point of [J, K, L, M, N]) near(distance(point, [cx, cy]), radius, "P2 Q22 cyclic vertices");
    near(distance(J, L), distance(K, M), "P2 Q22 equal chords");
    near(angle(J, N, M), 104, "P2 Q22 JNM");
    near(angle(K, M, L), 18, "P2 Q22 KML");
    near(angle(L, J, M), 43, "P2 Q22 target LJM");
    assert.deepEqual(data[22].labels.sort(), ["J", "K", "L", "M", "N"]);
  }
  {
    const [[M, J, K, L]] = ps(24), alpha = angle(J, M, L) * Math.PI / 180, beta = angle(J, L, K) * Math.PI / 180;
    near(dot(sub(M, L), sub(J, L)), 0, "P2 Q24 ML perpendicular LJ");
    near(dot(sub(J, K), sub(L, K)), 0, "P2 Q24 JK perpendicular KL");
    near(distance(L, M) / distance(J, K), 1 / (Math.tan(alpha) * Math.sin(beta)), "P2 Q24 target reciprocal expression");
    assert.deepEqual(data[24].labels.sort(), ["J", "K", "L", "M", "α", "β"]);
    assert.ok(!data[24].labels.some(label => /\d/.test(label)), "Q24 construction lengths stay hidden");
  }
  {
    const numbers = data[29].texts.filter(t => /^\d+$/.test(t.label));
    assert.deepEqual(numbers.map(t => +t.label), [12, 18, 24, 30, 36, 42, 48], "P2 Q29 major tick labels");
    const scale = (numbers[1].x - numbers[0].x) / 6, value = x => 12 + (x - numbers[0].x) / scale;
    const shape = data[29].paths.at(-1), [left, rightWhisker, min, max, box, median] = subpaths(shape);
    near(value(min[0][0]), 15, "P2 Q29 minimum");
    near(value(max[0][0]), 45, "P2 Q29 maximum");
    near(value(box[0][0]), 21, "P2 Q29 Q1");
    near(value(box[1][0]), 39, "P2 Q29 Q3");
    near(value(median[0][0]), 33, "P2 Q29 median");
    near(value(box[1][0]) - value(box[0][0]), 18, "P2 Q29 IQR");
    near(left[1][0], box[0][0], "P2 Q29 left whisker touches box");
    near(rightWhisker[0][0], box[1][0], "P2 Q29 right whisker touches box");
    assert.ok(!data[29].labels.some(label => /^(15|21|33|39|45)$/.test(label)), "Q29 quartiles must be read from grid, not given as labels");
  }
  {
    const [[axis], , [vertical], , [a, b], [xTick], [yTick]] = ps(34);
    const xIntercept = intersection(a, b, [0, axis[1]], [1, axis[1]]), yIntercept = intersection(a, b, [vertical[0], 0], [vertical[0], 1]);
    near(xIntercept[0], xTick[0], "P2 Q34 line passes x tick");
    near(yIntercept[1], yTick[1], "P2 Q34 line passes y tick");
    const xScale = (vertical[0] - xTick[0]) / 6, yScale = (axis[1] - yTick[1]) / 2;
    const u = (a[0] - vertical[0]) / xScale, v = (axis[1] - a[1]) / yScale;
    near(3 * v - u, 6, "P2 Q34 3log3y-log3x=6");
    assert.deepEqual(data[34].labels, ["−6", "2", "O", "log3 x", "log3 y"]);
  }
  {
    const [[J, K, L, M], [, P], [N, Q], [, R]] = ps(38), scale = distance(J, K) / 864;
    near(dot(sub(J, K), sub(L, K)), 0, "P2 Q38 rectangle");
    near(distance(K, L) / scale, 594, "P2 Q38 KL");
    near(distance(J, N) / scale, 576, "P2 Q38 JN");
    near(distance(K, P) / scale, 270, "P2 Q38 KP");
    near(distance(L, Q) / scale, 432, "P2 Q38 LQ");
    near(cross(sub(R, J), sub(P, J)), 0, "P2 Q38 R on JP");
    near(cross(sub(R, N), sub(Q, N)), 0, "P2 Q38 R on NQ");
    near(distance(R, intersection(J, P, N, Q)), 0, "P2 Q38 exact intersection");
    assert.equal(Math.round(distance(M, R) / scale), 685, "P2 Q38 rounded MR");
    assert.deepEqual(data[38].labels.sort(), ["J", "K", "L", "M", "N", "P", "Q", "R"]);
  }
  {
    const [[J, L, K], [, M], [, N, P]] = ps(39), [cx, cy, radius] = data[39].circles[0], O = [cx, cy];
    for (const point of [J, K, L, M]) near(distance(point, O), radius, "P2 Q39 cyclic vertices");
    near(distance(J, L), 2 * radius, "P2 Q39 JL diameter");
    near(cross(sub(M, N), sub(P, N)), 0, "P2 Q39 tangent N M P collinear");
    near(dot(sub(M, O), sub(N, P)), 0, "P2 Q39 tangent perpendicular radius");
    near(cross(sub(K, J), sub(N, L)), 0, "P2 Q39 JK parallel LN");
    near(angle(L, M, P), 52, "P2 Q39 LMP");
    near(angle(L, N, M), 26, "P2 Q39 LNM");
    near(angle(J, L, K), 78, "P2 Q39 target JLK");
    assert.deepEqual(data[39].labels.sort(), ["J", "K", "L", "M", "N", "P"]);
  }
}

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
      const context = await browser.newContext(), page = await context.newPage(), errors = [];
      page.on("pageerror", error => errors.push(error.message));
      if (standalone) {
        assert.equal(kinds[paper].length, expected[paper].length);
        await page.setContent('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"></head><body><main class="practice-main"></main></body></html>');
        await page.addStyleTag({path: path.join(__dirname, `paper${paper}/style.css`)});
        await page.addScriptTag({path: path.join(__dirname, `paper${paper}/diagrams-2021.js`)});
        await page.evaluate(({numbers, names}) => {
          document.querySelector("main").innerHTML = numbers.map((n, i) => `<article class="exam-question" id="question-${n}">${window.pilotDiagram2021(names[i])}</article>`).join("");
        }, {numbers: expected[paper], names: kinds[paper]});
      } else {
        await page.goto(`${base}/paper${paper}/?year=2021#practice`);
        assert.equal(await page.evaluate(() => window.PILOT.year), 2021);
      }
      const numbers = await page.locator(".exam-question:has(.diagram svg)").evaluateAll(nodes => nodes.map(n => +n.id.replace("question-", "")));
      assert.deepEqual(numbers, expected[paper], "Source-audited diagram question numbers");
      assert.equal(await page.locator(".exam-question .diagram svg").count(), expected[paper].length, "Exactly one SVG per source figure question");
      await geometryChecks(page, paper);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({width, height: 900});
        await page.evaluate(() => document.fonts.ready);
        for (const n of numbers) {
          const filename = `p${paper}-q${n}-${width}${standalone ? "-standalone" : ""}.png`;
          await page.locator(`#question-${n} .diagram`).screenshot({path: path.join(output, filename)});
          screenshots.push({paper, n, width, filename});
        }
        const issues = await labelChecks(page);
        const overflow = await page.locator(".exam-question .diagram").evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 1).map(n => n.closest("article").id));
        results.push({paper, width, issues, overflow});
        console.log(JSON.stringify(results.at(-1)));
      }
      const glyphNodes = await actualFonts(page);
      await page.emulateMedia({media: "print"});
      const printIssues = await labelChecks(page);
      results.push({paper, media: "print", issues: printIssues, overflow: [], glyphNodes});
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
      await sheet.screenshot({path: path.join(output, `contact-${width}${standalone ? "-standalone" : ""}.png`), fullPage: true});
    }
    await fs.writeFile(path.join(output, `results${standalone ? "-standalone" : ""}.json`), JSON.stringify(results, null, 2));
    assert.ok(results.every(r => !r.issues.length && !r.overflow.length), "Diagram label/overflow issues; see results and screenshots.");
    console.log(`2021 diagrams: P${papers.join("/P")} geometry, actual Times New Roman glyphs, three widths and print bounds passed${standalone ? " (standalone, app integration not tested)" : ""}.`);
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
