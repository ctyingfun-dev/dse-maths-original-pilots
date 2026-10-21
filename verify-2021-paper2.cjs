"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const r = Math.PI / 180;
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const near = (a, b) => assert.ok(close(a, b), `${a} != ${b}`);
const sum = xs => xs.reduce((a, b) => a + b, 0);
const mean = xs => sum(xs) / xs.length;
const variance = xs => mean(xs.map(x => (x - mean(xs)) ** 2));
const range = xs => Math.max(...xs) - Math.min(...xs);
const median = xs => {
  const sorted = [...xs].sort((a, b) => a - b), n = sorted.length;
  assert.ok(n > 0);
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};
const sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
const norm = p => Math.hypot(...p);
const distance = (a, b) => norm(sub(a, b));
const det = (a, b) => a[0] * b[1] - a[1] * b[0];
const interpolate = (a, b, t) => a.map((x, i) => x + t * (b[i] - x));
const polar = (degrees, radius = 1) => [radius * Math.cos(degrees * r), radius * Math.sin(degrees * r)];
const area = (a, b, c) => Math.abs(det(sub(b, a), sub(c, a))) / 2;
const angle = (a, b, c) => Math.acos(Math.max(-1, Math.min(1, dot(sub(a, b), sub(c, b)) / (distance(a, b) * distance(c, b))))) / r;
function solve2(a, b, c, d, e, f) {
  const determinant = a * e - b * d;
  assert.ok(Math.abs(determinant) > 1e-12, "Singular simultaneous equations");
  return [(c * e - b * f) / determinant, (a * f - c * d) / determinant];
}
function intersect(a, b, c, d) {
  const u = sub(b, a), v = sub(d, c), w = sub(c, a);
  const [t] = solve2(u[0], -v[0], w[0], u[1], -v[1], w[1]);
  return interpolate(a, b, t);
}
function quadratic(a, b, c) {
  assert.notEqual(a, 0);
  const discriminant = b * b - 4 * a * c;
  assert.ok(discriminant >= 0, "No real roots");
  return [...new Set([(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)])];
}
function choose(n, k) {
  assert.ok(Number.isInteger(n) && Number.isInteger(k) && n >= 0);
  if (k < 0 || k > n) return 0n;
  let result = 1n;
  for (let i = 1; i <= Math.min(k, n - k); i++) result = result * BigInt(n - i + 1) / BigInt(i);
  return result;
}
const complex = {
  add: (a, b) => a.map((x, i) => x + b[i]),
  subtract: sub,
  multiply: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  divide(a, b) {
    const denominator = dot(b, b);
    assert.ok(denominator > 0);
    return [dot(a, b) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
  }
};

// Parse arithmetic options, not solutions. Implicit products and mathematical
// unary-minus precedence are handled without evaluating arbitrary JavaScript.
const superscripts = Object.fromEntries([..."⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺"].map((x, i) => [x, "0123456789-+"[i]]));
function value(source, variables = {}) {
  const input = source.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, t => `^(${[...t].map(x => superscripts[x]).join("")})`)
    .replace(/−/g, "-").replace(/×/g, "*").replace(/\[/g, "(").replace(/\]/g, ")").replace(/\s/g, "");
  const tokens = input.match(/\d+(?:\.\d+)?|\.\d+|[A-Za-zα-ωπ]|[()+*/^\-]/g) || [];
  assert.equal(tokens.join(""), input, `Unrecognized arithmetic: ${source}`);
  let pos = 0;
  function primary() {
    const token = tokens[pos++];
    if (token === "(") {
      const result = expression();
      assert.equal(tokens[pos++], ")", source);
      return result;
    }
    if (/^(?:\d|\.)/.test(token || "")) return Number(token);
    if (token === "π") return Math.PI;
    assert.ok(Object.hasOwn(variables, token), `Unknown variable ${token} in ${source}`);
    return variables[token];
  }
  function power() {
    const base = primary();
    if (tokens[pos] !== "^") return base;
    pos++;
    return base ** unary();
  }
  function unary() {
    if (tokens[pos] === "+") { pos++; return unary(); }
    if (tokens[pos] === "-") { pos++; return -unary(); }
    return power();
  }
  function product() {
    let result = unary();
    while (pos < tokens.length) {
      const token = tokens[pos];
      if (token === "*" || token === "/") {
        pos++;
        const operand = unary();
        if (token === "/") assert.notEqual(operand, 0, `Zero denominator: ${source}`);
        result = token === "*" ? result * operand : result / operand;
      } else if (token === "(" || /^[A-Za-zα-ωπ\d.]/.test(token)) result *= unary();
      else break;
    }
    return result;
  }
  function expression() {
    let result = product();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const operator = tokens[pos++], operand = product();
      result += operator === "+" ? operand : -operand;
    }
    return result;
  }
  const result = expression();
  assert.equal(pos, tokens.length, `Unconsumed arithmetic: ${source}`);
  assert.ok(Number.isFinite(result), `Nonfinite arithmetic: ${source}`);
  return result;
}
function condition(source, variables) {
  if (source.includes("或")) return source.split(/\s*或\s*/).some(part => condition(part, variables));
  const tokens = source.replace(/°/g, "").split(/(≤|≥|<|>|=)/);
  assert.ok(tokens.length >= 3 && tokens.length % 2 === 1, source);
  const compare = { "<": (a, b) => a < b, ">": (a, b) => a > b, "≤": (a, b) => a <= b, "≥": (a, b) => a >= b, "=": close };
  for (let i = 1; i < tokens.length; i += 2) {
    if (!compare[tokens[i]](value(tokens[i - 1], variables), value(tokens[i + 1], variables))) return false;
  }
  return true;
}
const equivalent = (a, b) => Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => equivalent(x, b[i])) : typeof a === "number" && typeof b === "number" ? close(a, b) : a === b;
const checked = new Set(), semanticChecked = new Set(), failures = [];
function distinct(q, meanings) {
  assert.equal(meanings.length, 4);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    assert.ok(!equivalent(meanings[i], meanings[j]), `Semantically duplicate options ${"ABCD"[i]} and ${"ABCD"[j]}`);
  }
  semanticChecked.add(q.n);
}
function unique(q, predicate) {
  const indices = q.options.flatMap((option, i) => predicate(option, i) ? [i] : []);
  assert.equal(indices.length, 1, `Expected exactly one correct option, got ${indices.map(i => "ABCD"[i])}`);
  assert.equal(q.answer, "ABCD"[indices[0]], "Incorrect answer key");
  assert.equal(q.correct, q.options[indices[0]], "Incorrect correct-option field");
}
function numeric(q, expected, unit = "") {
  const meanings = q.options.map(option => {
    if (unit) assert.ok(option.endsWith(unit), `Missing unit: ${option}`);
    return value(option.replace(/^\$/, "").slice(0, unit ? -unit.length : undefined));
  });
  distinct(q, meanings);
  unique(q, (_, i) => close(meanings[i], expected));
}
function expressions(q, samples, expected, evaluate = value) {
  const meanings = q.options.map(option => samples.map(sample => evaluate(option, sample)));
  distinct(q, meanings);
  const targets = samples.map(expected);
  unique(q, (_, i) => equivalent(meanings[i], targets));
}
function statements(q, truths) {
  const meanings = q.options.map(option => option.match(/III|II|I/g));
  meanings.forEach(list => assert.ok(list && new Set(list).size === list.length));
  meanings.forEach(list => list.sort((a, b) => a.length - b.length));
  distinct(q, meanings);
  const expected = ["I", "II", "III"].filter((_, i) => truths[i]);
  unique(q, (_, i) => equivalent(meanings[i], expected));
}
function equationValue(source, variables) {
  const sides = source.split("=");
  assert.equal(sides.length, 2, source);
  return value(sides[0], variables) - value(sides[1], variables);
}
function loci(q, points, variables = ["x", "y"]) {
  const samples = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]];
  const residual = (option, [a, b]) => equationValue(option, { [variables[0]]: a, [variables[1]]: b });
  const meanings = q.options.map(option => {
    const values = samples.map(p => residual(option, p));
    const scale = values.find(x => !close(x, 0));
    assert.ok(scale !== undefined, "Degenerate locus option");
    return values.map(x => x / scale);
  });
  distinct(q, meanings);
  unique(q, option => points.every(p => close(residual(option, p), 0)));
}
function circleChord(centre, radiusSquared, a, b, c) {
  const normalSquared = a * a + b * b;
  assert.ok(normalSquared > 0 && radiusSquared > 0);
  const offset = (a * centre[0] + b * centre[1] + c) / normalSquared;
  const midpoint = [centre[0] - a * offset, centre[1] - b * offset];
  const halfSquared = radiusSquared - distance(midpoint, centre) ** 2;
  assert.ok(halfSquared > 0, "Two distinct circle intersections are required");
  const scale = Math.sqrt(halfSquared / normalSquared), direction = [-b * scale, a * scale];
  const endpoints = [1, -1].map(sign => midpoint.map((x, i) => x + sign * direction[i]));
  endpoints.forEach(p => {
    near(distance(p, centre) ** 2, radiusSquared);
    near(a * p[0] + b * p[1] + c, 0);
  });
  return { midpoint, halfSquared, endpoints };
}
function parallelIsosceles(atD, atE) {
  const a = [0, 0], c = [1, 0], phi = (atE + atD) / 2, theta = (atE - atD) / 2;
  assert.ok(0 < theta && theta < phi && phi < 90);
  const b = [0.5, Math.tan(phi * r) / 2];
  const d = intersect(a, polar(theta), c, c.map((x, i) => x + polar(phi)[i]));
  const e = intersect(a, d, b, c);
  near(distance(a, b), distance(b, c));
  near(det(sub(b, a), sub(d, c)), 0);
  near(angle(a, d, c), atD);
  near(angle(a, e, b), atE);
  assert.ok(e[0] > a[0] && e[0] < d[0] && e[1] > c[1] && e[1] < b[1]);
  return { a, b, c, d, e };
}
function rectangleReflection(width, height) {
  assert.ok(width > height && height > 0, "Required interior intersections need a wider-than-tall rectangle");
  const a = [0, 0], b = [width, 0], c = [width, height], d = [0, height];
  const e = interpolate(a, c, dot(b, c) / dot(c, c));
  const f = e.map((x, i) => 2 * x - b[i]), g = intersect(b, f, c, d);
  near(dot(sub(b, e), sub(c, a)), 0);
  near(distance(c, f), distance(a, d));
  assert.ok(g[0] > d[0] && g[0] < c[0] && f[1] > g[1] && g[1] > e[1]);
  return { a, b, c, d, e, f, g };
}
function squarePerpendicular(ratio) {
  assert.ok(ratio > 0);
  const a = [0, 0], b = [1, 0], c = [1, 1], d = [0, 1], e = [ratio / (1 + ratio), 0];
  const f = [1, e[0] * (1 - e[0])];
  near(distance(a, e) / distance(e, b), ratio);
  near(dot(sub(d, e), sub(f, e)), 0);
  assert.ok(f[1] > 0 && f[1] < 1);
  return { a, b, c, d, e, f };
}
function tangentParallel(tangentAngle, externalAngle) {
  const c = [-1, 0], a = [1, 0], dAngle = 180 - 2 * tangentAngle, d = polar(dAngle);
  const tangent = [-d[1], d[0]], f = d.map((x, i) => x + tangent[i]);
  const direction = polar(90 - 2 * tangentAngle + externalAngle);
  const e = intersect(d, f, c, c.map((x, i) => x + direction[i]));
  const b = a.map((x, i) => x - 2 * direction[0] * direction[i]);
  near(norm(b), 1);
  near(dot(d, tangent), 0);
  near(det(sub(b, a), sub(e, c)), 0);
  near(angle(c, d, f), tangentAngle);
  near(angle(c, e, d), externalAngle);
  assert.ok(b[1] < 0 && d[1] > 0 && e[0] > d[0]);
  return { a, b, c, d, e, f };
}
const stem = (q, ...fragments) => fragments.forEach(fragment => assert.ok(q.prompt.includes(fragment), `Premise drift: ${fragment}`));

function selfTest() {
  near(value("-x²+2xy+(x-y)(x+y)", { x: 3, y: 2 }), 8);
  near(value("2^(-2)/[3(1+2)]"), 1 / 36);
  near(value("2^3^2"), 512);
  assert.throws(() => value("1/(x-2)", { x: 2 }), /Zero denominator/);
  assert.throws(() => value("process.exit()"));
  assert.deepEqual(solve2(2, 1, 7, 1, -1, 2), [3, 1]);
  assert.deepEqual(quadratic(1, -3, 2), [1, 2]);
  assert.equal(choose(30, 7), 2035800n);
  assert.equal(choose(5, 6), 0n);
  near(angle([1, 0], [0, 0], [0, 1]), 90);
  assert.ok(equivalent(complex.divide([1, 1], [1, -1]), [0, 1]));
  const chord = circleChord([2, 11], 50, 4, -3, 0);
  assert.ok(equivalent(chord.midpoint, [6, 8]));
  near(chord.halfSquared, 25);
  assert.throws(() => circleChord([0, 0], 1, 1, 0, -1), /distinct/);
  assert.throws(() => distinct({ n: 0 }, [value("1/2"), value("2/4"), 1, 2]), /duplicate/);
  assert.ok(condition("-2≤x<3", { x: -2 }));
  assert.ok(!condition("-2≤x<3", { x: 3 }));
  assert.ok(condition("x≤-2 或 x≥3", { x: 3 }));
  const iso = parallelIsosceles(28, 94);
  near(angle(iso.c, iso.a, iso.d), 33);
  const rect = rectangleReflection(5, 3);
  near(angle(rect.d, rect.a, rect.e), angle(rect.d, rect.g, rect.f));
  const square = squarePerpendicular(3);
  near(area(square.c, square.d, square.f) / area(square.d, square.e, square.f), 52 / 25);
  const tangent = tangentParallel(49, 31);
  near(angle(tangent.a, tangent.c, tangent.b), 67);
}
selfTest();
if (process.argv.includes("--self-test")) {
  console.log("2021 Paper 2 verifier: standard-library arithmetic, geometry and exact-count helpers passed.");
  process.exit(0);
}

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(`${__dirname}/paper2/math.js`, "utf8"), context);
vm.runInNewContext(fs.readFileSync(`${__dirname}/paper2/diagrams-2021.js`, "utf8"), context);
vm.runInNewContext(fs.readFileSync(`${__dirname}/paper2/data-2021.js`, "utf8"), context);
const paper = JSON.parse(JSON.stringify(context.window.PILOT_2021));
assert.equal(paper.year, 2021);
assert.equal(paper.paper, 2);
assert.equal(paper.questions.length, 45);

function diagram(q) {
  const svg = context.window.pilotDiagram2021(q.diagram.type);
  assert.match(svg, /<svg/);
  const paths = [];
  for (const [, data] of svg.matchAll(/<path d="([^"]+)"/g)) {
    let points;
    for (const [, command, argumentsText] of data.matchAll(/([MLHVZA])([^MLHVZA]*)/g)) {
      const n = argumentsText.trim().split(/[ ,]+/).filter(Boolean).map(Number);
      if (command === "M") { points = [[n[0], n[1]]]; paths.push(points); }
      if (command === "L") points.push([n[0], n[1]]);
      if (command === "H") points.push([n[0], points.at(-1)[1]]);
      if (command === "V") points.push([points.at(-1)[0], n[0]]);
      if (command === "Z") points.push(points[0]);
      if (command === "A") points.push([n[5], n[6]]);
    }
  }
  const labels = [...svg.matchAll(/<text x="([^"]+)" y="([^"]+)"[^>]*>(.*?)<\/text>/g)]
    .map(([, x, y, content]) => ({ text: content.replace(/<[^>]+>/g, ""), at: [Number(x), Number(y)] }));
  return { svg, paths, labels };
}

function check(n, work) {
  assert.ok(!checked.has(n));
  const q = paper.questions[n - 1];
  try {
    assert.equal(q.n, n);
    assert.equal(q.sourceNo, n);
    assert.equal(q.section, n <= 30 ? "甲部" : "乙部");
    assert.ok(q.topic && q.prompt && typeof q.solution === "string" && q.solution.trim());
    assert.ok(Array.isArray(q.hints) && q.hints.length && q.hints.every(x => typeof x === "string" && x.trim()));
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.match(q.answer, /^[A-D]$/);
    assert.equal(q.options["ABCD".indexOf(q.answer)], q.correct);
    assert.ok(!Object.hasOwn(q, "marks"), "Do not invent MC method marks");
    assert.ok(q.solution.split("\n").length >= 3, "Missing worked solution steps");
    assert.doesNotMatch(q.solution, /(?:^|\n)\s*[=≡]/, "Detached equality");
    assert.doesNotMatch(JSON.stringify(q), /角邊角|邊角邊|角角邊|邊邊邊|斜邊直角邊|（等角）|填空|找錯|改錯|[橫縱横纵]/);
    for (const text of [q.topic, q.prompt, q.correct, ...q.options, ...q.hints, q.solution]) {
      const html = context.window.mathText(text);
      const visible = html.replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g, "").replace(/<[^>]+>/g, "");
      assert.doesNotMatch(visible, /[\/÷√]/, `Unformatted division or square root: ${text}`);
      assert.equal((html.match(/<msqrt>/g) || []).length, (text.match(/√/g) || []).length, "Square-root count");
    }
    for (const block of context.window.solutionLayout(q.solution)) {
      if (block.type === "calculation") assert.ok(block.rows[0].lhs, "Detached rendered calculation");
      else assert.doesNotMatch(block.text, /^(所以|因此|故|得)[，。；]?$/, "Isolated connective");
    }
    work(q);
    assert.ok(semanticChecked.has(n), "Missing semantic option-distinctness check");
    checked.add(n);
  } catch (error) { failures.push(`Q${n}: ${error.message}`); }
}

// Source chains Q1-15: powers; subject change; expansion; rational difference;
// rounding interval; identity; quadratic values; linear remainder; percentages;
// inequality union; ratios; variation; recurrence; graph properties; prism.
// Q16-30: hemispheres; sector/circumcircle; parallel/isosc.; rectangle proof;
// square areas; octagon; equal chords; transformations; trig ratios; loci;
// median; chord midpoint; quartile probability; boxplot; pooled means.
// Q31-45: exponent extrema; hex carries; log intercepts; log graph; complex
// conjugates; GP identities; nonnegative quadratic; line intersection; tangent;
// chord-diameter circle; orthocentre; combinations; stopping probability;
// standard scores; translated arithmetic-progression statistics.

check(1, q => {
  stem(q, "(3^r×9^(3r))/27^r");
  q.options.forEach(option => assert.match(option, /^9\^/, "Retain the final conversion from common base 3 to option base 9"));
  expressions(q, [-2, -1, 0, 0.25, 0.5, 1, 2].map(r => ({ r })), ({ r }) => 3 ** r * 9 ** (3 * r) / 27 ** r);
  assert.ok(q.solution.split("\n").some(line => /^3\^/.test(line) && line.includes("=(3²)^") && line.includes("=9^")), "Show the final base conversion as a connected solution step");
});
check(2, q => {
  stem(q, "t(2t-b)=b(3-t)", "b 為公式主項");
  const samples = [-4, -1, 0, 0.25, 1, 3, 5].map(t => ({ t }));
  expressions(q, samples, ({ t }) => {
    const residual = b => t * (2 * t - b) - b * (3 - t);
    const coefficient = residual(1) - residual(0);
    assert.notEqual(coefficient, 0);
    const b = -residual(0) / coefficient;
    near(residual(b), 0);
    return b;
  });
  assert.match(q.solution, /t=0/);
});
check(3, q => {
  stem(q, "(p+2q)(p-2q)(p+3)");
  const samples = [-4, -1, 0, 1, 2, 3].flatMap(p => [-3, -1, 0, 1, 4].map(q => ({ p, q })));
  expressions(q, samples, ({ p, q }) => (p + 2 * q) * (p - 2 * q) * (p + 3));
});
check(4, q => {
  stem(q, "4/(t-4)-9/(t-9)", "t≠4", "t≠9");
  const samples = [-4, -1, 0, 1, 3.9, 4.1, 8.9, 9.1, 20].map(t => ({ t }));
  expressions(q, samples, ({ t }) => 4 / (t - 4) - 9 / (t - 9));
  for (const t of [4, 9]) assert.throws(() => value(q.correct, { t }), /Zero denominator/);
  assert.match(q.solution, /t≠4、9/);
});
check(5, q => {
  stem(q, "12.48", "二位小數");
  const samples = [12.469, 12.47, 12.474, 12.474999, 12.475, 12.475001, 12.48, 12.484999, 12.485, 12.485001, 12.49].map(x => ({ x }));
  expressions(q, samples, ({ x }) => Math.floor(x * 100 + 0.5 + 1e-10) === 1248, condition);
});
check(6, q => {
  stem(q, "a(t+4)+b(2t-3)≡c(t+1)", "a:b", "非零");
  const meanings = q.options.map(option => {
    const [a, b] = option.split(":").map(Number);
    assert.ok(a !== 0 && b !== 0);
    return a / b;
  });
  distinct(q, meanings);
  unique(q, option => {
    const [a, b] = option.split(":").map(Number), c = a + 2 * b;
    return [-3, 0, 1, 5].every(t => close(a * (t + 4) + b * (2 * t - 3), c * (t + 1)));
  });
});
check(7, q => {
  stem(q, "g(t)=(t+a)(t-4)+b", "g(0)=g(10)=3", "求 b");
  const [a, b] = solve2(-4, 1, 3, 10 - 4, 1, 3 - 10 * (10 - 4));
  near((0 + a) * (0 - 4) + b, 3);
  near((10 + a) * (10 - 4) + b, 3);
  assert.ok(a !== 0 && b !== 0, "Retain both coupled unknowns");
  numeric(q, b);
});
check(8, q => {
  stem(q, "t+2", "餘數為 12", "t-2 整除", "t²-4 的餘式");
  const [a, b] = solve2(-2, 1, 12, 2, 1, 0);
  const samples = [-5, -2, -1, 0, 2, 4].map(t => ({ t }));
  expressions(q, samples, ({ t }) => a * t + b);
  for (const t of [-2, 2]) {
    const quotient = t ** 3 - 4 * t + 1;
    near((t * t - 4) * quotient + a * t + b, t === -2 ? 12 : 0);
  }
  assert.match(q.solution, /餘式.*at\+b/);
});
check(9, q => {
  stem(q, "38%", "45%", "60%", "非兒童書中有 x%");
  const total = 10000, children = total * 0.45, science = total * 0.38, childrenScience = children * 0.6;
  const adultScience = science - childrenScience, adults = total - children;
  assert.ok(0 <= adultScience && adultScience <= adults);
  near((childrenScience + adultScience) / total, 0.38);
  numeric(q, 100 * adultScience / adults);
});
check(10, q => {
  stem(q, "5t+9≤2(t-3) 或 8-3t>17");
  const samples = [-100, -5.001, -5, -4.999, -4, -3.001, -3, -2.999, 0, 100].map(t => ({ t }));
  expressions(q, samples, ({ t }) => 5 * t + 9 <= 2 * (t - 3) || 8 - 3 * t > 17, condition);
});
check(11, q => {
  stem(q, "(3u+2v)/(2u+5v)=4/3", "(u+3v)/(2u-v)", "各分母均不為零");
  const ratio = (4 * 5 - 3 * 2) / (3 * 3 - 4 * 2);
  const answers = [-7, -1, 0.125, 1, 6].map(v => {
    const u = ratio * v;
    assert.ok(u !== 0 && v !== 0 && 2 * u + 5 * v !== 0 && 2 * u - v !== 0);
    near((3 * u + 2 * v) / (2 * u + 5 * v), 4 / 3);
    return (u + 3 * v) / (2 * u - v);
  });
  answers.forEach(answer => near(answer, answers[0]));
  numeric(q, answers[0]);
});
check(12, q => {
  stem(q, "均為正數", "w 隨 s 的立方正變且隨 t 的平方反變");
  const samples = [0.5, 1, 3].flatMap(s => [0.5, 1, 2, 5].map(t => ({ s, t, w: 7 * s ** 3 / t ** 2 })));
  const meanings = q.options.map(option => samples.map(sample => value(option, sample)));
  distinct(q, meanings);
  unique(q, (_, i) => meanings[i].every(x => close(x, meanings[i][0])));
});

check(13, q => {
  stem(q, "3n+4");
  assert.match(q.prompt, /(?:第一|第 1).*4/);
  assert.match(q.prompt, /第\s*7/);
  let count = 4;
  const counts = [count];
  for (let n = 1; n < 7; n++) { count += 3 * n + 4; counts.push(count); }
  assert.deepEqual(counts.slice(0, 3), [4, 11, 21]);
  assert.equal(q.diagram.type, "dots2021");
  const { svg } = diagram(q);
  const circles = [...svg.matchAll(/<circle cx="([^"]+)"/g)].map(match => Number(match[1]));
  assert.deepEqual([0, 1, 2].map(i => circles.filter(x => Math.round((x - 49) / 117) === i).length), counts.slice(0, 3));
  numeric(q, count);
});
check(14, q => {
  stem(q, "y=(h+2x)²+k", "I 圖像開口向上", "II y 截距為正", "III 圖像通過點 (-h/2,k)");
  const truths = [-3, 0, 2].flatMap(h => [-10, -1, 0, 3].map(k => {
    const f = x => (h + 2 * x) ** 2 + k;
    return [(f(-1) + f(1) - 2 * f(0)) / 2 > 0, f(0) > 0, close(f(-h / 2), k)];
  }));
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
});
check(15, q => {
  stem(q, "正六邊形", "邊長為 6 cm", "432 cm³", "總表面面積", "最接近");
  const vertices = Array.from({ length: 6 }, (_, i) => polar(i * 60, 6));
  const base = sum(vertices.map((v, i) => det(v, vertices[(i + 1) % 6]))) / 2;
  const height = 432 / base, perimeter = sum(vertices.map((v, i) => distance(v, vertices[(i + 1) % 6])));
  assert.ok(base > 0 && height > 0);
  near(base * height, 432);
  numeric(q, Math.round(2 * base + perimeter * height), " cm²");
});
check(16, q => {
  stem(q, "總表面面積之和為 675π", "3:4", "體積之差");
  const scaleRoots = quadratic(3 * (3 ** 2 + 4 ** 2), 0, -675);
  const positive = scaleRoots.filter(t => t > 0);
  assert.equal(positive.length, 1);
  assert.ok(scaleRoots.some(t => t < 0));
  const [small, large] = [3 * positive[0], 4 * positive[0]];
  near(3 * (small ** 2 + large ** 2), 675);
  assert.ok(large > small && small > 0);
  numeric(q, 2 * Math.PI * (large ** 3 - small ** 3) / 3, " cm³");
  assert.match(q.solution, /t>0/);
  assert.match(q.solution, /捨去 t=-3/);
});
check(17, q => {
  stem(q, "9π cm²", "∠JOK=90°", "半徑為 6 cm", "周界為 3π cm", "18π cm²");
  const radius = Math.sqrt(9 * 360 / 90), O = [0, 0], J = [radius, 0], K = [0, radius];
  assert.ok(radius > 0);
  const centre = interpolate(J, K, 0.5), circleRadius = distance(centre, O);
  near(distance(centre, J), circleRadius);
  near(distance(centre, K), circleRadius);
  const perimeter = 2 * radius + 90 * r * radius;
  statements(q, [close(radius, 6), close(perimeter, 3 * Math.PI), close(Math.PI * circleRadius ** 2, 18 * Math.PI)]);
});
check(18, q => {
  stem(q, "JK=KL", "∠JML=32°", "∠JEK=102°");
  assert.match(q.prompt, /JK(?:∥|\/\/)LM/);
  const { a: J, b: K, c: L, d: M, e: E } = parallelIsosceles(32, 102);
  near(angle(J, E, L), 180 - 102);
  near(angle(K, J, L), angle(J, L, K));
  numeric(q, angle(L, J, M), "°");
});
check(19, q => {
  stem(q, "JKLM", "LF=JM");
  const truths = [[20, 12], [4, 3], [9, 2], [1.01, 1]].map(([w, h]) => {
    const { a: J, b: K, c: L, d: M, e: E, f: F, g: G } = rectangleReflection(w, h);
    const sameAngle = close(angle(M, J, E), angle(M, G, F));
    const similar = close(angle(K, L, E), angle(L, G, E)) && close(angle(K, E, L), angle(L, E, G)) &&
      close(distance(K, L) / distance(L, G), distance(L, E) / distance(G, E)) &&
      close(distance(L, E) / distance(G, E), distance(E, K) / distance(E, L));
    const congruent = close(distance(K, L), distance(F, L)) && close(distance(L, E), distance(L, E)) && close(distance(K, E), distance(F, E));
    near(angle(K, E, L), 90);
    return [sameAngle, similar, congruent];
  });
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
  assert.match(q.solution, /AA/);
  assert.match(q.solution, /RHS|SSS/);
});
check(20, q => {
  stem(q, "正方形", "JE=2EK", "13");
  const { a: J, b: K, c: L, d: M, e: E, f: F } = squarePerpendicular(2);
  const smallArea = area(M, E, F), scale = Math.sqrt(13 / smallArea);
  const scaled = [J, K, L, M, E, F].map(p => p.map(x => x * scale));
  near(area(scaled[3], scaled[4], scaled[5]), 13);
  near(angle(M, E, F), 90);
  numeric(q, area(L, M, F) * scale ** 2, " cm²");
});
check(21, q => {
  stem(q, "JKLMNPQR", "正八邊形", "I JQ∥KP", "II KM=NQ", "III ∠LJQ=3∠KMR");
  const [J, K, L, M, N, P, Q, R] = Array.from({ length: 8 }, (_, i) => polar(i * 45));
  statements(q, [close(det(sub(Q, J), sub(P, K)), 0), close(distance(K, M), distance(N, Q)), close(angle(L, J, Q), 3 * angle(K, M, R))]);
  near(angle(J, Q, K), angle(Q, K, P));
});
check(22, q => {
  stem(q, "JL=KM", "∠JNM=104°", "∠KML=18°");
  const d = 2 * 104, separation = 2 * 18;
  const [c, b] = solve2(1, 1, d, 1, -1, separation);
  assert.ok(0 < b && b < c && c < d && d < 360);
  const J = polar(0), K = polar(b), L = polar(c), M = polar(d), N = polar((d + 360) / 2);
  near(distance(J, L), distance(K, M));
  near(angle(J, N, M), 104);
  near(angle(K, M, L), 18);
  // The supplementary chord branch would require d+separation=360.
  assert.ok(!close(d + separation, 360), "Ambiguous supplementary equal-chord branch");
  numeric(q, angle(L, J, M), "°");
});
check(23, q => {
  stem(q, "(-9,4)", "對 y 軸反射", "逆時針旋轉 90°", "R 的 x 坐標");
  const P = [-9, 4], Q = [-P[0], P[1]], rotation = 90 * r;
  const R = [Q[0] * Math.cos(rotation) - Q[1] * Math.sin(rotation), Q[0] * Math.sin(rotation) + Q[1] * Math.cos(rotation)];
  near(norm(R), norm(P));
  numeric(q, R[0]);
});
check(24, q => {
  stem(q, "LM/JK");
  const samples = [20, 35, 55, 70].flatMap(alpha => [15, 40, 65].map(beta => ({ alpha, beta })));
  expressions(q, samples, ({ alpha, beta }) => {
    const L = [0, 0], K = [Math.cos(beta * r), 0], J = polar(beta);
    const M = [-Math.sin(beta * r) / Math.tan(alpha * r), Math.cos(beta * r) / Math.tan(alpha * r)];
    near(angle(L, K, J), 90);
    near(angle(M, L, J), 90);
    near(angle(J, M, L), alpha);
    near(angle(J, L, K), beta);
    return distance(L, M) / distance(J, K);
  }, (option, { alpha, beta }) => value(option.replace(/(sin|cos|tan)([αβ])/g, (_, fn, theta) => `(${Math[fn]((theta === "α" ? alpha : beta) * r)})`)));
});
check(25, q => {
  stem(q, "(-3,5)", "(1,8)", "PJ=JK");
  const J = [-3, 5], K = [1, 8], radius = distance(J, K);
  assert.ok(radius > 0);
  const points = Array.from({ length: 12 }, (_, i) => polar(i * 30, radius).map((x, j) => x + J[j]));
  points.forEach(p => near(distance(p, J), radius));
  loci(q, points);
  assert.ok(!close(equationValue(q.correct, { x: J[0], y: J[1] }), 0), "The centre is not on the fixed-distance locus");
});
check(26, q => {
  stem(q, "(-2,5)", "(4,-1)", "(8,7)", "JP", "中線");
  const J = [-2, 5], K = [4, -1], L = [8, 7], P = interpolate(K, L, 0.5);
  near(distance(K, P), distance(L, P));
  assert.ok(area(J, K, L) > 0);
  loci(q, [-2, -1, 0, 0.5, 1, 3].map(t => interpolate(J, P, t)));
});
check(27, q => {
  stem(q, "斜率為 -3", "x²+y²+8x-14y-15=0", "兩個相異點", "(s,t)");
  const centre = [-4, 7], radiusSquared = 4 ** 2 + 7 ** 2 + 15;
  const midpoints = [-0.9, -0.5, 0, 0.5, 0.9].map(t => {
    const offset = t * Math.sqrt(radiusSquared * 10), constant = -(3 * centre[0] + centre[1]) + offset;
    const chord = circleChord(centre, radiusSquared, 3, 1, constant);
    near(dot(sub(chord.midpoint, centre), sub(chord.endpoints[1], chord.endpoints[0])), 0);
    chord.endpoints.forEach(([x, y]) => near(x * x + y * y + 8 * x - 14 * y - 15, 0));
    return chord.midpoint;
  });
  assert.ok(midpoints.some(point => equivalent(point, centre)), "Include the diameter boundary case");
  loci(q, midpoints, ["s", "t"]);
});
check(28, q => {
  const rows = [[2, [4, 6, 8, 9]], [3, [1, 1, 1, 1, 1, 5, 8]], [4, [0, 2, 2, 4, 5, 6, 8, 9]], [5, [0, 1, 2, 3, 5, 5, 6, 7, 8]]];
  stem(q, "28 箱", "不小於", "下四分位數");
  assert.deepEqual(q.table.rows[0], ["幹", "葉"], "Keep stem-and-leaf headings concise without an example key");
  const actualRows = q.table.rows.slice(1).map(([s, leaves]) => [Number(s), leaves.trim().split(/\s+/).map(Number)]);
  assert.deepEqual(actualRows, rows, "Stem-and-leaf data drifted");
  const data = rows.flatMap(([s, leaves]) => leaves.map(leaf => 10 * s + leaf));
  assert.equal(data.length, 28);
  const lowerQuartile = median(data.slice(0, data.length / 2));
  assert.equal(lowerQuartile, 31);
  assert.equal(data.filter(x => x === lowerQuartile).length, 5, "Retain tied quartile observations");
  numeric(q, data.filter(x => x >= lowerQuartile).length / data.length);
});
check(29, q => {
  stem(q, "四分位數間距");
  assert.equal(q.diagram.type, "box2021");
  const { paths, labels } = diagram(q);
  const ticks = labels.filter(label => /^\d+$/.test(label.text)).sort((a, b) => a.at[0] - b.at[0]);
  const left = ticks[0], right = ticks.at(-1);
  const read = x => Number(left.text) + (x - left.at[0]) * (Number(right.text) - Number(left.text)) / (right.at[0] - left.at[0]);
  const box = paths.find(p => p.length === 5 && equivalent(p[0], p[4]) && p[0][1] === p[1][1]);
  assert.ok(box, "Missing boxplot rectangle");
  const [x1, x3] = [Math.min(...box.map(p => p[0])), Math.max(...box.map(p => p[0]))];
  const whiskers = paths.filter(p => p.length === 2 && p[0][1] === p[1][1] && p[0][1] > box[0][1] && p[0][1] < box[2][1]);
  assert.equal(whiskers.length, 2);
  const middle = paths.find(p => p.length === 2 && p[0][0] === p[1][0] && p[0][0] > x1 && p[0][0] < x3 && p[0][1] === box[0][1] && p[1][1] === box[2][1]);
  assert.ok(middle, "Missing median line");
  const endpoints = whiskers.flatMap(p => p.map(v => v[0]));
  const fiveNumbers = [Math.min(...endpoints), x1, middle[0][0], x3, Math.max(...endpoints)].map(read);
  assert.ok(equivalent(fiveNumbers, [15, 21, 33, 39, 45]), "Boxplot values drifted");
  assert.ok(fiveNumbers.every((x, i) => i === 0 || x > fiveNumbers[i - 1]));
  numeric(q, fiveNumbers[3] - fiveNumbers[1], " 分鐘");
});
check(30, q => {
  stem(q, "84 個整數", "平均值為 34", "28 個整數", "平均值為 22", "其餘 56");
  const remaining = (84 * 34 - 28 * 22) / (84 - 28);
  near(mean([...Array(28).fill(22), ...Array(56).fill(remaining)]), 34);
  numeric(q, remaining);
});
check(31, q => {
  stem(q, "p²q³r", "p⁵q⁶r⁴", "p⁵q³r²", "p⁴q⁵r⁴");
  const minimum = [2, 3, 1], maximum = [5, 6, 4], first = [5, 3, 2], second = [4, 5, 4];
  const valid = [];
  for (let p = 0; p <= 5; p++) for (let q = 0; q <= 6; q++) for (let r = 0; r <= 4; r++) {
    const third = [p, q, r];
    if (third.every((exponent, i) => Math.min(first[i], second[i], exponent) === minimum[i] && Math.max(first[i], second[i], exponent) === maximum[i])) valid.push(third);
  }
  assert.equal(valid.length, 1, "The HCF/LCM conditions must uniquely determine all three exponents, beyond the listed options");
  const meanings = q.options.map(option => ["p", "q", "r"].map(letter => {
    const match = option.match(new RegExp(`${letter}([⁰¹²³⁴⁵⁶⁷⁸⁹]*)`));
    assert.ok(match);
    return match[1] ? Number([...match[1]].map(x => superscripts[x]).join("")) : 1;
  }));
  distinct(q, meanings);
  unique(q, (_, i) => equivalent(meanings[i], valid[0]));
});
check(32, q => {
  stem(q, "12×16¹³+19×16¹²+2×16²+18");
  const expected = 12n * 16n ** 13n + 19n * 16n ** 12n + 2n * 16n ** 2n + 18n;
  assert.ok(expected > BigInt(Number.MAX_SAFE_INTEGER), "Retain exact large-place hexadecimal carrying");
  const meanings = q.options.map(option => {
    assert.match(option, /^[0-9A-F]+₁₆$/);
    return BigInt(`0x${option.slice(0, -2)}`);
  });
  distinct(q, meanings);
  unique(q, (_, i) => meanings[i] === expected);
  assert.equal(expected.toString(16).length, 14);
});
check(33, q => {
  stem(q, "均為正數", "q≠1", "r≠1", "y=2p+log_(q)x", "y=log_(r)x", "OT:OS");
  const samples = [0.5, 1, 2].flatMap(p => [0.25, 0.5, 2, 3].flatMap(q => [0.2, 0.5, 4, 5].map(r => ({ p, q, r }))));
  expressions(q, samples, ({ p, q, r }) => {
    const S = Math.exp(-2 * p * Math.log(q)), T = Math.exp(0 * Math.log(r));
    assert.ok(S > 0 && T > 0);
    near(2 * p + Math.log(S) / Math.log(q), 0);
    near(Math.log(T) / Math.log(r), 0);
    return T / S;
  }, (option, sample) => {
    const [a, b] = option.split(":").map(part => value(part, sample));
    assert.ok(a > 0 && b > 0);
    return a / b;
  });
});
check(34, q => {
  stem(q, "log₃x", "log₃y");
  assert.equal(q.diagram.type, "log2021");
  const { paths, labels } = diagram(q);
  const xTick = labels.find(label => label.text === "−6"), yTick = labels.find(label => label.text === "2");
  assert.ok(xTick && yTick);
  const horizontal = paths.find(p => p.length === 2 && p[0][1] === p[1][1] && distance(...p) > 200);
  const vertical = paths.find(p => p.length === 2 && p[0][0] === p[1][0] && distance(...p) > 150);
  const origin = [vertical[0][0], horizontal[0][1]];
  const graph = paths.find(p => p.length === 2 && Math.abs(p[0][0] - p[1][0]) > 100 && Math.abs(p[0][1] - p[1][1]) > 100);
  const xCross = intersect(...graph, ...horizontal), yCross = intersect(...graph, ...vertical);
  const horizontalTick = paths.find(p => p.length === 2 && p[0][1] === p[1][1] && Math.abs((p[0][0] + p[1][0]) / 2 - origin[0]) < 1e-9 && distance(...p) < 20);
  assert.ok(horizontalTick);
  const xIntercept = -6 * (xCross[0] - origin[0]) / (xTick.at[0] - origin[0]);
  const yIntercept = 2 * (yCross[1] - origin[1]) / (horizontalTick[0][1] - origin[1]);
  near(xIntercept, -6);
  near(yIntercept, 2);
  const slope = -yIntercept / xIntercept;
  const samples = [-6, -3, 0, 3, 6].map(X => ({ x: 3 ** X, y: 3 ** (yIntercept + slope * X) }));
  samples.forEach(({ x, y }) => {
    assert.ok(x > 0 && y > 0);
    near(Math.log(y) / Math.log(3), yIntercept + slope * Math.log(x) / Math.log(3));
  });
  expressions(q, samples, () => 0, equationValue);
});
check(35, q => {
  stem(q, "t 為實數", "w=(t+3i)/(t-3i)", "u=2w+2/w", "v=3w-3/w", "I u 為實數", "II v 的實部為 0", "III v 的虛部等於 3w 的虛部");
  const truths = [-100, -3, -1, -0.1, 0, 0.1, 1, 3, 100].map(t => {
    assert.ok(t * t + 9 > 0, "The complex denominator never vanishes for real t");
    const w = complex.divide([t, 3], [t, -3]), inverse = complex.divide([1, 0], w);
    near(norm(w), 1);
    const u = complex.add(w, inverse).map(x => 2 * x), v = complex.subtract(w, inverse).map(x => 3 * x);
    assert.ok(equivalent(complex.multiply(w, inverse), [1, 0]));
    return [close(u[1], 0), close(v[0], 0), close(v[1], 3 * w[1])];
  });
  assert.ok(truths.some(row => row[2]) && truths.some(row => !row[2]), "Distinguish sometimes from always at t=0");
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
});
check(36, q => {
  stem(q, "實數等比數列", "I ad=bc", "II a+d=b+c", "III a>b>c>d");
  const truths = [-3, 0, 1, 4].flatMap(first => [-2, -0.5, 0, 0.5, 1, 2].map(ratio => {
    const [a, b, c, d] = Array.from({ length: 4 }, (_, i) => first * ratio ** i);
    return [close(a * d, b * c), close(a + d, b + c), a > b && b > c && c > d];
  }));
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
  assert.match(q.solution, /ad=a\(ar³\)/);
  assert.match(q.solution, /bc=\(ar\)\(ar²\)/);
  assert.doesNotMatch(q.solution, /ac=b²/, "Do not replace the four-term product with a three-term identity");
});
check(37, q => {
  stem(q, "對所有實數 t", "t²+ht+2h+5≥0");
  const samples = [-20, -10, -2.001, -2, -1.999, 0, 2, 9.999, 10, 10.001, 20].map(h => ({ h }));
  expressions(q, samples, ({ h }) => {
    const vertex = -h / 2, f = t => t * t + h * t + 2 * h + 5, minimum = f(vertex);
    for (const t of [-20, -1, 0, 2, 20]) near(f(t), (t - vertex) ** 2 + minimum);
    return minimum >= 0;
  }, condition);
  for (const h of [-2, 10]) near((-h / 2) ** 2 + h * (-h / 2) + 2 * h + 5, 0);
});
check(38, q => {
  stem(q, "864", "594", "576", "270", "432");
  const J = [0, 594], K = [864, 594], L = [864, 0], M = [0, 0], E = [576, 594], F = [864, 594 - 270], G = [864 - 432, 0];
  const H = intersect(J, F, E, G);
  near(distance(J, K), 864);
  near(distance(K, L), 594);
  near(distance(J, E), 576);
  near(distance(K, F), 270);
  near(distance(L, G), 432);
  for (const [a, b] of [[J, F], [E, G]]) {
    near(det(sub(H, a), sub(b, a)), 0);
    assert.ok(dot(sub(H, a), sub(b, a)) > 0 && dot(sub(H, b), sub(a, b)) > 0);
  }
  numeric(q, Math.round(distance(M, H)), " cm");
});
check(39, q => {
  stem(q, "∠LMF=52°", "∠LEM=26°");
  const { a: J, b: K, c: L, d: M, e: E } = tangentParallel(52, 26);
  near(angle(L, K, J), 90);
  near(det(sub(K, J), sub(E, L)), 0);
  near(angle(L, J, M), 52);
  numeric(q, angle(J, L, K), "°");
});
check(40, q => {
  stem(q, "3x=4y", "x²+y²-30x-10y+161=0", "MN 為直徑");
  const centre = [15, 5], radiusSquared = dot(centre, centre) - 161;
  const chord = circleChord(centre, radiusSquared, 3, -4, 0);
  // Parameterize the original line independently to cross-check both endpoints.
  const roots = quadratic(4 ** 2 + 3 ** 2, -30 * 4 - 10 * 3, 161);
  const endpoints = roots.map(t => [4 * t, 3 * t]);
  endpoints.forEach(point => assert.ok(chord.endpoints.some(p => equivalent(p, point))));
  assert.ok(equivalent(interpolate(...endpoints, 0.5), chord.midpoint));
  near(distance(...endpoints) ** 2 / 4, chord.halfSquared);
  const radius = Math.sqrt(chord.halfSquared);
  assert.ok(radius > 0);
  loci(q, Array.from({ length: 12 }, (_, i) => polar(i * 30, radius).map((x, j) => x + chord.midpoint[j])));
});
check(41, q => {
  stem(q, "P 的坐標為 (18,-12)", "垂心為 H(10,2)", "Q 的 y 坐標");
  const O = [0, 0], P = [18, -12], H = [10, 2], altitudePH = sub(P, H);
  const Q = solve2(...P, dot(H, P), ...altitudePH, 0);
  assert.ok(area(O, P, Q) > 0, "The triangle must be nondegenerate");
  near(dot(sub(Q, H), sub(P, O)), 0);
  near(dot(sub(P, H), sub(Q, O)), 0);
  near(dot(sub(O, H), sub(Q, P)), 0);
  numeric(q, Q[1]);
});
check(42, q => {
  stem(q, "16 名設計員", "9 名工程師", "7 人", "至多 4 名設計員");
  const dp = Array.from({ length: 8 }, () => Array(8).fill(0n));
  dp[0][0] = 1n;
  // Include or exclude each distinguishable person, keeping group size and role count.
  for (let person = 0; person < 25; person++) {
    const designer = person < 16 ? 1 : 0;
    for (let size = 7; size >= 1; size--) for (let count = designer; count <= size; count++) dp[size][count] += dp[size - 1][count - designer];
  }
  const total = dp[7].reduce((a, b) => a + b, 0n), expected = dp[7].slice(0, 5).reduce((a, b) => a + b, 0n);
  assert.equal(total, choose(25, 7));
  assert.ok(dp[7][0] > 0n, "Zero designers is a feasible case");
  assert.equal(expected, Array.from({ length: 5 }, (_, d) => choose(16, d) * choose(9, 7 - d)).reduce((a, b) => a + b, 0n));
  const meanings = q.options.map(option => { assert.match(option, /^\d+$/); return BigInt(option); });
  distinct(q, meanings);
  unique(q, (_, i) => meanings[i] === expected);
});
check(43, q => {
  stem(q, "8 枚白", "4 枚藍", "6 枚黑", "不放回", "至多抽取三次");
  let triples = 0, successful = 0;
  for (let a = 0; a < 18; a++) for (let b = 0; b < 18; b++) for (let c = 0; c < 18; c++) {
    if (a === b || b === c || a === c) continue;
    triples++;
    if ([a, b, c].some(token => token >= 12)) successful++;
  }
  assert.equal(triples, 18 * 17 * 16);
  let survival = 1, stopByThree = 0, totalStop = 0;
  for (let turn = 1; turn <= 13; turn++) {
    const probability = survival * 6 / (18 - turn + 1);
    if (turn <= 3) stopByThree += probability;
    totalStop += probability;
    survival *= (12 - turn + 1) / (18 - turn + 1);
  }
  near(totalStop, 1);
  near(survival, 0);
  near(successful / triples, stopByThree);
  numeric(q, successful / triples);
});
check(44, q => {
  stem(q, "平均分為 58", "40 分", "標準分為 -3", "標準分為 4");
  const mean = 58, sigma = (40 - mean) / -3;
  assert.ok(sigma > 0);
  const score = mean + 4 * sigma;
  near((40 - mean) / sigma, -3);
  near((score - mean) / sigma, 4);
  numeric(q, score, " 分");
});
check(45, q => {
  stem(q, "{T(1),T(2),…,T(31)}", "{T(41),T(42),…,T(71)}", "I x₁>x₂", "II y₁=y₂", "III z₁<z₂");
  const truths = [-19, 0, 5].flatMap(a => [-3, -0.5, 0, 0.5, 4].map(d => {
    const first = Array.from({ length: 31 }, (_, i) => a + i * d), second = Array.from({ length: 31 }, (_, i) => a + (i + 40) * d);
    first.forEach((x, i) => near(second[i] - x, 40 * d));
    near(median(first), a + 15 * d);
    near(median(second), a + 55 * d);
    near(range(first), 30 * Math.abs(d));
    near(variance(first), variance(second));
    return [median(first) > median(second), close(range(first), range(second)), variance(first) < variance(second)];
  }));
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
});

assert.equal(checked.size, 45, `Incomplete verification: ${checked.size}/45\n${failures.join("\n")}`);
assert.deepEqual([...checked].sort((a, b) => a - b), Array.from({ length: 45 }, (_, i) => i + 1));
assert.equal(failures.length, 0, failures.join("\n"));
console.log("2021 Paper 2: all 45 independent mathematical checks passed; four semantically distinct options and exactly one verified key each; domains, boundaries, geometry and counting checked; rendered text has no division slashes or bare roots and solution steps remain connected.");
