const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const output = path.join(__dirname, "tmp/qa-2022-diagrams");
const expected = {1: [8, 18], 2: [14, 17, 18, 19, 20, 21, 22, 24, 38, 40]};

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const length = a => Math.hypot(...a);
const distance = (a, b) => length(sub(a, b));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const angle = (a, b, c) => Math.acos(Math.max(-1, Math.min(1, dot(sub(a, b), sub(c, b)) / (distance(a, b) * distance(c, b))))) * 180 / Math.PI;
function near(actual, target, label, tolerance = 1e-5) {
  assert.ok(Math.abs(actual - target) < tolerance, `${label}: ${actual} != ${target}`);
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
    circles: [...node.querySelectorAll("svg circle")].map(c => ["cx", "cy", "r"].map(a => +c.getAttribute(a))),
    labels: [...node.querySelectorAll("svg text")].map(t => t.textContent)
  }])));
  const ps = n => data[n].paths.flatMap(subpaths);
  if (paper === 1) {
    const [[K, L, M, N], [, J]] = ps(8);
    near(cross(sub(L, J), sub(M, N)), 0, "Q8 JL parallel NM");
    near(cross(sub(M, J), sub(L, K)), 0, "Q8 JM parallel KL");
    near(distance(J, K), distance(J, N), "Q8 JK=JN");
    near(angle(J, K, L), 42, "Q8 JKL");
    near(angle(M, J, N), 82, "Q8 MJN");
    near(angle(J, L, M), 62, "Q8 JLM");
    const sides = [K, L, M, N].map((p, i, all) => Math.sign(cross(sub(all[(i + 1) % 4], p), sub(J, p))));
    assert.equal(new Set(sides).size, 1, "Q8 J lies inside KLMN");

    const [, [j, k, l], [, m], [, h]] = ps(18);
    const x = 21 * Math.cos(100 * Math.PI / 180), z = 21 * Math.sin(Math.PI / 3), y = Math.sqrt(21 ** 2 - x * x - z * z);
    const model = [[0, 0, 0], [28, 0, 0], [x, y, z], [(28 + x) / 2, y / 2, z / 2], [x, y, 0]];
    for (const [i, p] of [j, k, l, m, h].entries()) {
      const [a, b, c] = model[i];
      near(distance(p, [110 + 6 * a + 4 * b, 215 - 2 * b - 6 * c]), 0, `Q18 projected vertex ${i}`);
    }
    near(distance(m, k), distance(m, l), "Q18 M midpoint");
    near(length(model[2]), 21, "Q18 JL");
    near(angle(model[1], model[0], model[2]), 100, "Q18 KJL");
    near(Math.asin(z / 21) * 180 / Math.PI, 60, "Q18 elevation of JL");
    return;
  }

  const counts = [1, 2, 3].map(n => data[14].circles.filter(([x]) => Math.abs(x - (55 + (n - 1) * 110)) <= 12 * n + .1));
  assert.deepEqual(counts.map(group => group.length), [5, 12, 22]);
  counts.forEach((group, i) => {
    const rows = [...new Set(group.map(p => p[1]))].sort((a, b) => a - b);
    assert.deepEqual(rows.map(y => group.filter(p => p[1] === y).length), [1, 4, 7, 10].slice(0, i + 2));
  });
  {
    const [[J, K, L], [M, N]] = ps(17);
    near(distance(J, M) / distance(M, K), 2 / 3, "Q17 JM:MK");
    near(distance(K, N) / distance(N, L), 4 / 5, "Q17 KN:NL");
    near(cross(sub(M, J), sub(K, J)), 0, "Q17 M on JK");
    near(cross(sub(N, K), sub(L, K)), 0, "Q17 N on KL", .1);
  }
  {
    const [[J, K, L, M], [, E, F]] = ps(18);
    near(dot(sub(J, K), sub(L, K)), 0, "Q18 rectangle");
    near(distance(J, K) / distance(K, L), 50 / 30, "Q18 rectangle sides");
    near(distance(J, E) / distance(K, L), 1, "Q18 JE=KL");
    near(distance(E, F) / distance(K, L), 58 / 30, "Q18 EF");
    near(distance(J, M), distance(K, L), "Q18 opposite sides");
    near(E[1], K[1], "Q18 E K F collinear");
    near(F[1], K[1], "Q18 E K F collinear");
  }
  {
    const [[J, K, L], [, M], [, N]] = ps(19);
    near(distance(J, K), distance(K, L), "Q19 equilateral");
    near(distance(J, K), distance(J, L), "Q19 equilateral");
    near(distance(J, M), distance(L, N), "Q19 JM=LN");
    near(angle(L, K, M), 34, "Q19 LKM");
    near(angle(J, N, K), 86, "Q19 JNK");
  }
  {
    const [[a, b, d, c]] = ps(20);
    near(cross(sub(b, a), sub(d, c)), 0, "Q20 opposite sides parallel");
    near(cross(sub(c, a), sub(d, b)), 0, "Q20 opposite sides parallel");
    const arcs = [...data[20].paths[0].matchAll(/A([\d. ]+)/g)].map(m => m[1].trim().split(/\s+/).map(Number));
    assert.deepEqual(arcs.map(a => a[3]), [1, 1], "Q20 both angle arcs must be reflex");
  }
  {
    const [[O, J, K, , L]] = ps(21);
    near(angle(J, K, O), 32, "Q21 JKO");
    near(angle(K, O, L), 152, "Q21 KOL");
    near(angle(J, L, O), 44, "Q21 JLO");
    for (const p of [J, K, L]) near(distance(p, O), 85, "Q21 points on circle");
  }
  {
    const [[J, K, L], [, N, M]] = ps(22), [cx, cy, radius] = data[22].circles[0];
    for (const p of [J, K, N, M]) near(distance(p, [cx, cy]), radius, "Q22 cyclic points");
    near(angle(J, K, L), 90, "Q22 right angle");
    near(distance(J, K), distance(J, M), "Q22 JK=JM");
    near(distance(K, N) / distance(J, K), 1 / 2, "Q22 KN:JK");
    near(distance(M, L) / distance(J, K), 24 / 36, "Q22 ML:JK");
  }
  {
    const [[axis], [vertical], [a, b], [minusTwo], [one]] = ps(24);
    const slope = (b[1] - a[1]) / (b[0] - a[0]);
    const xIntercept = a[0] + (axis[1] - a[1]) / slope;
    const yIntercept = a[1] + (vertical[0] - a[0]) * slope;
    assert.ok(slope < 0 && xIntercept < minusTwo[0]);
    assert.ok(yIntercept < axis[1] && yIntercept > one[1]);
  }
  {
    const [[J, K, L, M], , , [U], [, V]] = ps(38), [cx, cy, radius] = data[38].circles[0];
    for (const p of [J, K, L, M]) near(distance(p, [cx, cy]), radius, "Q38 points on circle");
    near(dot(sub(J, [cx, cy]), sub(U, J)), 0, "Q38 UJ tangent");
    near(dot(sub(K, [cx, cy]), sub(V, K)), 0, "Q38 VK tangent");
    near(angle(J, M, L), 75, "Q38 JML");
    near(angle(L, K, V), 34, "Q38 LKV");
    near(angle(M, J, U), 47, "Q38 MJU");
    near(angle(K, L, M), 88, "Q38 KLM");
  }
  {
    const vertices = {J: [1, 0, 1], K: [1, 0, 0], L: [1, 1, 0], M: [1, 1, 1], N: [0, 1, 1], P: [0, 0, 1], Q: [0, 0, 0], R: [0, 1, 0]};
    const projected = Object.fromEntries(Object.entries(vertices).map(([key, [x, y, z]]) => [key, [185 + 115 * x - 140 * y, 175 + 45 * x + 55 * y - 145 * z]]));
    const lines = ps(40).flatMap(points => points.slice(1).map((b, i) => [points[i], b]));
    const hasEdge = (a, b) => lines.some(([p, q]) => distance(p, projected[a]) < .001 && distance(q, projected[b]) < .001 || distance(q, projected[a]) < .001 && distance(p, projected[b]) < .001);
    for (const a of Object.keys(vertices)) for (const b of Object.keys(vertices)) if (distance(vertices[a], vertices[b]) === 1) assert.ok(hasEdge(a, b), `Q40 cube edge ${a}${b}`);
    for (const pair of ["PR", "JR", "JQ"]) assert.ok(hasEdge(...pair), `Q40 plane diagonal ${pair}`);
    near(angle(vertices.Q, vertices.P, vertices.R), 45, "Q40 alpha");
    near(dot(sub(vertices.J, vertices.P), sub(vertices.Q, vertices.P)), 0, "Q40 JP perpendicular PQ");
    near(dot(sub(vertices.J, vertices.P), sub(vertices.N, vertices.P)), 0, "Q40 JP perpendicular PN");
    assert.deepEqual(data[40].labels.sort(), Object.keys(vertices).sort());
  }
}

async function labelChecks(page) {
  return page.locator(".exam-question .diagram svg").evaluateAll(svgs => svgs.flatMap(svg => {
    const view = svg.viewBox.baseVal, issues = [], boxes = [];
    for (const text of svg.querySelectorAll("text")) {
      const b = text.getBBox(), label = text.textContent, number = svg.closest("article").id;
      if (b.x < view.x || b.y < view.y || b.x + b.width > view.x + view.width || b.y + b.height > view.y + view.height) issues.push({number, label, kind: "clipped"});
      for (const old of boxes) if (b.x < old.x + old.width && old.x < b.x + b.width && b.y < old.y + old.height && old.y < b.y + b.height) issues.push({number, label, other: old.label, kind: "text overlap"});
      boxes.push({x: b.x, y: b.y, width: b.width, height: b.height, label});
      if (!/^[A-Za-zαβθ]$/.test(label)) continue;
      const style = getComputedStyle(text), context = document.createElement("canvas").getContext("2d");
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = context.measureText(label), x = +text.getAttribute("x") - m.actualBoundingBoxLeft, y = +text.getAttribute("y") - m.actualBoundingBoxAscent;
      const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      for (const shape of svg.querySelectorAll("path,circle")) {
        const length = shape.getTotalLength();
        for (let t = 0; t <= length; t += .5) {
          const p = shape.getPointAtLength(t);
          if (p.x >= x - 1 && p.x <= x + w + 1 && p.y >= y - 1 && p.y <= y + h + 1) {issues.push({number, label, kind: "line overlap"}); break;}
        }
      }
    }
    return issues;
  }));
}

(async () => {
  await fs.mkdir(output, {recursive: true});
  const browser = await launchBrowser(), results = [], screenshots = [];
  try {
    for (const paper of [1, 2]) {
      const context = await browser.newContext(), page = await context.newPage(), errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${base}/paper${paper}/?year=2022#practice`);
      assert.equal(await page.evaluate(() => window.PILOT.year), 2022);
      const numbers = await page.locator(".exam-question:has(.diagram svg)").evaluateAll(nodes => nodes.map(n => +n.id.replace("question-", "")));
      assert.deepEqual(numbers, expected[paper]);
      await geometryChecks(page, paper);
      for (const width of [1440, 390]) {
        await page.setViewportSize({width, height: 900});
        await page.evaluate(() => document.fonts.ready);
        for (const n of numbers) {
          const filename = `p${paper}-q${n}-${width}.png`;
          await page.locator(`#question-${n} .diagram`).screenshot({path: path.join(output, filename)});
          screenshots.push({paper, n, width, filename});
        }
        const issues = await labelChecks(page);
        const overflow = await page.locator(".exam-question .diagram").evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 1).map(n => n.closest("article").id));
        results.push({paper, width, issues, overflow});
        console.log(JSON.stringify({paper, width, issues, overflow}));
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    // Build contact sheets only from screenshots of the real practice pages.
    const sheet = await browser.newPage({viewport: {width: 1200, height: 900}});
    for (const width of [1440, 390]) {
      const tiles = [];
      for (const shot of screenshots.filter(s => s.width === width)) {
        const bytes = await fs.readFile(path.join(output, shot.filename));
        tiles.push(`<section><h2>P${shot.paper} Q${shot.n} (${width}px)</h2><img src="data:image/png;base64,${bytes.toString("base64")}" /></section>`);
      }
      await sheet.setContent(`<html><head><style>body{margin:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;background:white;font-family:serif}section{min-width:0}h2{font-size:17px}img{max-width:100%;height:auto}</style></head><body>${tiles.join("")}</body></html>`);
      await sheet.screenshot({path: path.join(output, `contact-${width}.png`), fullPage: true});
    }
    await fs.writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    assert.ok(results.every(r => !r.issues.length && !r.overflow.length), "Diagram label/overflow issues; see results.json and screenshots.");
    console.log("2022 diagrams: all 12 SVGs passed desktop and 390px label/overflow checks.");
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
