const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(`${__dirname}/paper2/math.js`, "utf8"), context);
vm.runInNewContext(fs.readFileSync(`${__dirname}/paper2/diagrams-2022.js`, "utf8"), context);
vm.runInNewContext(fs.readFileSync(`${__dirname}/paper2/data-2022.js`, "utf8"), context);
const paper = JSON.parse(JSON.stringify(context.window.PILOT_2022));
const checked = new Set();
const r = Math.PI / 180;
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const near = (a, b) => assert.ok(close(a, b), `${a} != ${b}`);
const sum = xs => xs.reduce((a, b) => a + b, 0);
const mean = xs => sum(xs) / xs.length;
const variance = xs => mean(xs.map(x => (x - mean(xs)) ** 2));
const median = xs => {
  const a = [...xs].sort((x, y) => x - y), n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
};
const modes = xs => {
  const counts = new Map();
  xs.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
  return [...counts].filter(([, n]) => n === Math.max(...counts.values())).map(([x]) => x);
};
const range = xs => Math.max(...xs) - Math.min(...xs);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
const norm = a => Math.hypot(...a);
const distance = (a, b) => norm(sub(a, b));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const angle = (a, b, c) => Math.acos(Math.max(-1, Math.min(1, dot(sub(a, b), sub(c, b)) / (distance(a, b) * distance(c, b))))) / r;
const polar = deg => [Math.cos(deg * r), Math.sin(deg * r)];
const area = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
const interpolate = (a, b, t) => a.map((x, i) => x + t * (b[i] - x));
function solve2(a, b, c, d, e, f) {
  const determinant = a * e - b * d;
  assert.ok(Math.abs(determinant) > 1e-12);
  return [(c * e - b * f) / determinant, (a * f - c * d) / determinant];
}
function intersect(a, b, c, d) {
  const u = sub(b, a), v = sub(d, c), w = sub(c, a);
  const [t] = solve2(u[0], -v[0], w[0], u[1], -v[1], w[1]);
  return interpolate(a, b, t);
}

function diagram(q) {
  const svg = context.window.pilotDiagram2022(q.diagram.type);
  assert.ok(svg.includes("<svg"), `Q${q.n}: missing diagram`);
  const paths = [];
  for (const [, data] of svg.matchAll(/<path d="([^"]+)"/g)) {
    let points;
    for (const [, command, args] of data.matchAll(/([MLHVZA])([^MLHVZA]*)/g)) {
      const n = args.trim().split(/[ ,]+/).filter(Boolean).map(Number);
      if (command === "M") { points = [[n[0], n[1]]]; paths.push(points); }
      if (command === "L") points.push([n[0], n[1]]);
      if (command === "H") points.push([n[0], points.at(-1)[1]]);
      if (command === "V") points.push([points.at(-1)[0], n[0]]);
      if (command === "Z") points.push(points[0]);
      if (command === "A") points.push([n[5], n[6]]);
    }
  }
  const labels = [...svg.matchAll(/<text x="([^"]+)" y="([^"]+)"[^>]*>([^<]+)<\/text>/g)].map(([, x, y, text]) => ({ text, at: [Number(x), Number(y)] }));
  return { paths, labels };
}

// Evaluate only the trusted arithmetic in this fixture, never the solution text.
const superscripts = Object.fromEntries([..."⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺"].map((x, i) => [x, "0123456789-+"[i]]));
function value(source, variables = {}) {
  let expression = source.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, text => `^(${[...text].map(x => superscripts[x]).join("")})`);
  expression = expression.replace(/[a-zA-Z]+/g, name => {
    assert.ok(Object.hasOwn(variables, name), `Unknown variable ${name} in ${source}`);
    return `(${variables[name]})`;
  });
  expression = expression.replace(/×/g, "*").replace(/−/g, "-").replace(/\^/g, "**");
  expression = expression.replace(/([0-9)])\(/g, "$1*(").replace(/\)([0-9])/g, ")*$1");
  assert.match(expression, /^[0-9().+*/\-\s]+$/);
  const result = Function(`"use strict"; return (${expression});`)();
  assert.ok(Number.isFinite(result), `Nonfinite expression: ${source}`);
  return result;
}
function condition(source, variables) {
  const tokens = source.replace(/°/g, "").split(/(≤|≥|<|>|=)/);
  assert.ok(tokens.length >= 3 && tokens.length % 2 === 1, source);
  const comparisons = { "<": (a, b) => a < b, ">": (a, b) => a > b, "≤": (a, b) => a <= b, "≥": (a, b) => a >= b, "=": close };
  for (let i = 1; i < tokens.length; i += 2) {
    if (!comparisons[tokens[i]](value(tokens[i - 1], variables), value(tokens[i + 1], variables))) return false;
  }
  return true;
}
function unique(q, predicate) {
  const indices = q.options.flatMap((option, i) => predicate(option, i) ? [i] : []);
  assert.equal(indices.length, 1, `Q${q.n}: expected one mathematically valid option, got ${indices}`);
  assert.equal(q.answer, "ABCD"[indices[0]], `Q${q.n}: incorrect answer key`);
  assert.equal(q.correct, q.options[indices[0]], `Q${q.n}: incorrect correct-option field`);
}
const numeric = (q, expected, unit = "") => unique(q, option => {
  if (unit) assert.ok(option.endsWith(unit), `Q${q.n}: missing unit ${option}`);
  return close(value(option.replace(/^\$/, "").slice(0, unit ? -unit.length : undefined)), expected);
});
const statements = (q, truths) => {
  const expected = ["I", "II", "III"].filter((_, i) => truths[i]);
  unique(q, option => JSON.stringify(option.match(/III|II|I/g)) === JSON.stringify(expected));
};
const stem = (q, ...fragments) => fragments.forEach(fragment => assert.ok(q.prompt.includes(fragment), `Q${q.n}: premise drift: ${fragment}`));
function check(n, work) {
  assert.ok(!checked.has(n));
  const q = paper.questions[n - 1];
  try { work(q); } catch (error) { error.message = `Q${n}: ${error.message}`; throw error; }
  checked.add(n);
}

assert.equal(paper.year, 2022);
assert.equal(paper.paper, 2);
assert.equal(paper.questions.length, 45);
paper.questions.forEach((q, i) => {
  assert.equal(q.n, i + 1);
  assert.equal(q.sourceNo, q.n);
  assert.equal(q.section, q.n <= 30 ? "甲部" : "乙部");
  assert.ok(q.topic && q.prompt && typeof q.solution === "string" && q.solution.trim());
  assert.ok(Array.isArray(q.hints) && q.hints.length && q.hints.every(x => typeof x === "string" && x.trim()));
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options).size, 4);
  assert.match(q.answer, /^[A-D]$/);
  assert.equal(q.options["ABCD".indexOf(q.answer)], q.correct);
  assert.ok(!Object.hasOwn(q, "marks"), `Q${q.n}: do not invent MC method marks`);
  assert.ok(q.solution.split("\n").length >= 3, `Q${q.n}: missing worked steps`);
  assert.doesNotMatch(q.solution, /(?:^|\n)\s*[=≡]/, `Q${q.n}: detached equality`);
  assert.doesNotMatch(JSON.stringify(q), /角邊角|邊角邊|角角邊|邊邊邊|斜邊直角邊|（等角）|填空|找錯|改錯|[橫縱横纵]/);
  for (const text of [q.topic, q.prompt, q.correct, ...q.options, ...q.hints, q.solution]) {
    const html = context.window.mathText(text);
    const visible = html.replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g, "").replace(/<[^>]+>/g, "");
    assert.doesNotMatch(visible, /[\/÷√]/, `Q${q.n}: unformatted division or square root: ${text}`);
    assert.equal((html.match(/<msqrt>/g) || []).length, (text.match(/√/g) || []).length, `Q${q.n}: square-root count`);
  }
  for (const block of context.window.solutionLayout(q.solution)) {
    if (block.type === "calculation") assert.ok(block.rows[0].lhs, `Q${q.n}: detached rendered calculation`);
    else assert.doesNotMatch(block.text, /^(所以|因此|故|得)[，。；]?$/, `Q${q.n}: isolated connective`);
  }
});

check(1, q => {
  stem(q, "4p²-6p-q²+3q");
  const samples = [-3, -1, 0, 1, 2, 4].flatMap(p => [-3, 0, 2, 5].map(t => ({ p, q: t })));
  unique(q, option => samples.every(({ p, q: t }) => close(value(option, { p, q: t }), 4 * p * p - 6 * p - t * t + 3 * t)));
});
check(2, q => {
  stem(q, "16^(2n+1)", "(8^(n-1))²");
  unique(q, option => [-3, -1, 0, 0.5, 1, 2].every(n => close(value(option, { n }), 16 ** (2 * n + 1) / (8 ** (n - 1)) ** 2)));
});
check(3, q => {
  stem(q, "(t+5)²+at≡(t-b)(t+3)+4b");
  const b = 5 ** 2 / (4 - 3), a = 3 - b - 2 * 5;
  for (let t = -4; t <= 4; t++) near((t + 5) ** 2 + a * t, (t - b) * (t + 3) + 4 * b);
  numeric(q, a);
});
check(4, q => {
  stem(q, "c 為非零實數", "(x-2c)(x-5c)=(4c-x)(x-5c)");
  unique(q, option => [-3, -0.5, 1, 4].every(c => {
    // Expand both sides independently: their difference has coefficients 2,-16c,30c^2.
    const discriminant = (-16 * c) ** 2 - 4 * 2 * 30 * c * c;
    const roots = [(-(-16 * c) - Math.sqrt(discriminant)) / 4, (-(-16 * c) + Math.sqrt(discriminant)) / 4].sort((a, b) => a - b);
    roots.forEach(x => near((x - 2 * c) * (x - 5 * c), (4 * c - x) * (x - 5 * c)));
    const candidates = option.split(" 或 ").map(x => value(x.replace(/^x=/, ""), { c })).sort((a, b) => a - b);
    return candidates.length === roots.length && candidates.every((x, i) => close(x, roots[i]));
  }));
});
check(5, q => {
  stem(q, "3/u+5/v=7", "各分母均不為零");
  unique(q, option => [-4, -1, 0.5, 1, 2, 7].every(v => {
    const u = value(option, { v });
    return u !== 0 && close(3 / u + 5 / v, 7);
  }));
  near(7 * (5 / 7) - 5, 0);
  assert.match(q.solution, /7v-5≠0/);
});
check(6, q => {
  stem(q, "向下捨入至三位有效數字", "0.0726");
  const samples = [0.0725, 0.07255, 0.072599, 0.0726, 0.07261, 0.07265, 0.072699, 0.0727, 0.07275];
  unique(q, option => samples.every(x => condition(option, { x }) === (Math.floor(x * 10000 + 1e-10) === 726)));
});
check(7, q => {
  stem(q, "4y-7<6y+3≤21");
  unique(q, option => Array.from({ length: 81 }, (_, i) => -10 + i / 4).every(y =>
    condition(option, { y }) === (4 * y - 7 < 6 * y + 3 && 6 * y + 3 <= 21)));
});
check(8, q => {
  stem(q, "F(x)=x²-4x+7");
  const F = x => x * x - 4 * x + 7;
  unique(q, option => [-3, -1, 0, 1, 2, 3, 5].every(k => {
    const expanded = option.replace(/F\(([^()]*)\)/g, (_, argument) => `(${F(value(argument, { k }))})`);
    const [left, right] = expanded.split("=");
    return close(value(left), value(right));
  }));
});
check(9, q => {
  stem(q, "g(x)=x²+3ax+b", "x+a", "x-a");
  unique(q, option => [-3, -1, 0, 0.5, 2].every(a => {
    const b = -((-a) ** 2 + 3 * a * -a), g = x => x * x + 3 * a * x + b;
    near(g(-a), 0);
    for (const x of [-2, 0, 1, 4]) near(g(x), (x - a) * (x + 4 * a) + g(a));
    return close(value(option, { a }), g(a));
  }));
});
check(10, q => {
  stem(q, "hk>0", "y=(h-x)(k-x)");
  const samples = [[1, 1], [2, 3], [-2, -2], [-4, -1]];
  const truths = samples.map(([h, k]) => {
    const f = x => (h - x) * (k - x);
    return [(f(1) + f(-1) - 2 * f(0)) / 2 > 0, h !== k, f(0) > 0];
  });
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
});
check(11, q => {
  stem(q, "$56000", "4.8%", "每季", "3 年", "最接近的元");
  let balance = 56000;
  for (let quarter = 0; quarter < 3 * 4; quarter++) balance *= 1 + 0.048 / 4;
  const interest = balance - 56000;
  near(interest, 8618.098954224819);
  const approximation = Number(q.solution.match(/利息=.*≈([\d.]+)。/)[1]);
  assert.ok(Math.abs(approximation - interest) < 0.000001, "incorrect unrounded interest");
  numeric(q, Math.round(interest));
});
check(12, q => {
  stem(q, "x:y=7:3", "3x=5z-2y");
  unique(q, option => [-3, 0.5, 4].every(t => {
    const x = 7 * t, y = 3 * t, z = (3 * x + 2 * y) / 5;
    const [a, b] = option.split(":").map(Number);
    return close(a * z, b * y);
  }));
});
check(13, q => {
  stem(q, "均為正數", "u 隨 v 的立方根正變並隨 w 反變");
  const k = 3, samples = [1, 8, 27].flatMap(v => [1, 2, 5].map(w => ({ v, w, u: k * Math.cbrt(v) / w })));
  const invariants = [s => s.u ** 3 * s.w ** 3 / s.v, s => s.v / (s.u * s.w), s => s.w * s.u / Math.cbrt(s.v)];
  statements(q, invariants.map(f => samples.every(s => close(f(s), f(samples[0])))));
});
check(14, q => {
  stem(q, "第一個圖案有 5 點", "多 3n+4 點", "第 6 個");
  const counts = [5];
  for (let n = 1; n < 6; n++) counts.push(counts.at(-1) + 3 * n + 4);
  assert.deepEqual(counts, [5, 12, 22, 35, 51, 70]);
  numeric(q, counts[5]);
});
check(15, q => {
  stem(q, "底半徑均為 r", "高為 3r", "總表面面積比");
  unique(q, option => [0.5, 1, 7].every(radius => {
    const sphere = 4 * Math.PI * radius ** 2;
    const hemisphere = sphere / 2 + Math.PI * radius ** 2;
    const cylinder = 2 * Math.PI * radius ** 2 + 2 * Math.PI * radius * (3 * radius);
    const [a, b] = option.split(":").map(Number);
    return close(a / b, hemisphere / cylinder);
  }));
});
check(16, q => {
  stem(q, "直徑為 26 cm", "長 24 cm", "優弓形", "最接近的 cm²");
  const radius = 26 / 2, halfChord = 24 / 2, height = Math.sqrt(radius ** 2 - halfChord ** 2);
  // Integrate the circular cap directly instead of repeating the solution's sector formula.
  const antiderivative = y => y * Math.sqrt(Math.max(0, radius ** 2 - y ** 2)) + radius ** 2 * Math.asin(y / radius);
  const minor = antiderivative(radius) - antiderivative(height);
  const major = Math.PI * radius ** 2 - minor;
  near(height, 5);
  near(major, 392.184278500837);
  numeric(q, Math.round(major), " cm²");
});
check(17, q => {
  stem(q, "JM:MK=2:3", "KN:NL=4:5", "JMNL 的面積為 77 cm²");
  const J = [5, 0], K = [0, 0], L = [0, 42], M = interpolate(J, K, 2 / 5), N = interpolate(K, L, 4 / 9);
  near(distance(J, M) / distance(M, K), 2 / 3);
  near(distance(K, N) / distance(N, L), 4 / 5);
  const small = area(M, K, N), remaining = area(J, K, L) - small;
  near(remaining, 77);
  numeric(q, small, " cm²");
});
check(18, q => {
  stem(q, "周界為 160 cm", "KL=30 cm", "JE=30 cm", "K 在 E、F 之間");
  const E = [0, 0], J = [0, 30], K = [Math.sqrt((160 / 2 - 30) ** 2 - 30 ** 2), 0];
  const JK = sub(K, J), KL = [-JK[1] * 30 / norm(JK), JK[0] * 30 / norm(JK)];
  const L = K.map((x, i) => x + KL[i]), F = [L[0], 0];
  near(dot(JK, KL), 0);
  near(distance(K, L), 30);
  near(2 * (distance(J, K) + distance(K, L)), 160);
  assert.ok(E[0] < K[0] && K[0] < F[0]);
  near(angle(J, E, K), 90);
  near(angle(K, F, L), 90);
  near(angle(J, K, E), angle(K, L, F));
  numeric(q, distance(E, F), " cm");
  assert.match(q.solution, /（AA）/);
});
check(19, q => {
  stem(q, "等邊三角形", "JM=LN", "∠LKM=34°");
  const J = [0, Math.sqrt(3)], K = [-1, 0], L = [1, 0];
  const M = intersect(J, L, K, [K[0] + Math.cos(34 * r), Math.sin(34 * r)]);
  const N = interpolate(L, K, distance(J, M) / distance(L, K));
  assert.ok(M[1] > 0 && M[1] < J[1] && N[0] > K[0] && N[0] < L[0]);
  near(distance(J, K), distance(J, L));
  near(distance(J, M), distance(L, N));
  near(angle(K, J, M), angle(J, L, N));
  near(angle(L, K, M), 34);
  numeric(q, angle(J, N, K), "°");
  assert.match(q.solution, /（SAS）/);
});
check(20, q => {
  stem(q, "上方相鄰的內角", "下方兩頂點的優角", "I a+b=180°", "II a+d=360°", "III c+d=540°");
  const { paths, labels } = diagram(q), vertices = paths[0].slice(0, 4);
  const nearest = text => {
    const label = labels.find(item => item.text === text);
    assert.ok(label, `missing angle label ${text}`);
    return vertices.map((vertex, index) => ({ index, distance: distance(vertex, label.at) })).sort((a, b) => a.distance - b.distance)[0].index;
  };
  const inner = vertices.map((vertex, i) => angle(vertices[(i + 3) % 4], vertex, vertices[(i + 1) % 4]));
  const a = inner[nearest("a")], b = inner[nearest("b")], c = 360 - inner[nearest("c")], d = 360 - inner[nearest("d")];
  near(a + b, 180);
  near(a + d, 360);
  near(c + d, 540);
  const truths = [30, 70, 90, 110, 150].map(a => {
    const b = 180 - a, c = 360 - b, d = 360 - a;
    return [close(a + b, 180), close(a + d, 360), close(c + d, 540)];
  });
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
});
check(21, q => {
  stem(q, "∠JKO=32°", "∠KOL=152°", "J 位於優弧 KL 上");
  const O = [0, 0], K = polar(0), L = polar(152);
  const candidates = [180 - 2 * 32, 360 - (180 - 2 * 32)];
  const valid = candidates.filter(t => t > 152 && t < 360 && close(angle(polar(t), K, O), 32));
  assert.equal(valid.length, 1);
  const J = polar(valid[0]);
  near(angle(K, O, L), 152);
  numeric(q, angle(J, L, O), "°");
});
check(22, q => {
  stem(q, "在 K 處為直角", "JK=36 cm", "JM=36 cm", "KN=18 cm");
  const J = [36, 0], K = [0, 0], N = [0, 18], centre = [18, 9];
  // The two circle equations imply y=2x and 5x^2=72x. x=0 gives K, not an interior M.
  const M = [72 / 5, 144 / 5], L = intersect(J, M, K, N);
  const radius = distance(centre, J);
  for (const p of [K, N, M]) near(distance(centre, p), radius);
  near(distance(J, M), 36);
  assert.ok(M[0] > 0 && M[0] < J[0] && L[1] > N[1]);
  near(angle(N, M, L), 90);
  near(angle(M, L, N), angle(K, L, J));
  near(distance(M, N) / distance(K, J), distance(M, L) / distance(K, L));
  numeric(q, distance(M, L), " cm");
  assert.match(q.solution, /（AA）/);
});
check(23, q => {
  stem(q, "菱形 JKLM", "∠KLN=θ", "求 JK/MN");
  unique(q, option => [20, 35, 55, 70].every(theta => {
    const J = [-Math.cos(theta * r), 0], K = [0, Math.sin(theta * r)], L = [Math.cos(theta * r), 0], M = [0, -Math.sin(theta * r)], N = [0, 0];
    near(distance(J, K), distance(K, L));
    near(angle(K, L, N), theta);
    const expression = option.replace(/sinθ/g, `(${Math.sin(theta * r)})`).replace(/cosθ/g, `(${Math.cos(theta * r)})`);
    assert.ok(distance(J, K) / distance(M, N) > 1);
    return close(value(expression), distance(J, K) / distance(M, N));
  }));
});
check(24, q => {
  stem(q, "圖中", "mx+ny=5", "I m<0", "II n>5", "III 2m+n<0");
  assert.doesNotMatch(q.prompt, /斜率|截距/, "Candidates must read the graph, not written intercept ranges");
  assert.equal(q.diagram.type, "line2022");
  const { paths, labels } = diagram(q), [axis, vertical, line, minusTwo, one] = paths;
  assert.ok(labels.some(label => label.text === "−2") && labels.some(label => label.text === "1"));
  assert.ok(labels.some(label => label.text === "mx+ny=5"));
  const origin = [vertical[0][0], axis[0][1]];
  const slope = (line[1][1] - line[0][1]) / (line[1][0] - line[0][0]);
  const xIntercept = line[0][0] + (origin[1] - line[0][1]) / slope;
  const yIntercept = line[0][1] + (origin[0] - line[0][0]) * slope;
  assert.ok(slope < 0, "The drawn line rises in Cartesian coordinates");
  assert.ok(xIntercept < minusTwo[0][0], "Read x-intercept to the left of -2");
  assert.ok(one[0][1] < yIntercept && yIntercept < origin[1], "Read y-intercept between 0 and 1");
  const samples = [-2.49, -2, -1, -0.01].flatMap(m => [5.01, 6, 10, 100].map(n => ({ m, n })));
  samples.forEach(({ m, n }) => {
    assert.ok(-m / n > 0 && 0 < 5 / n && 5 / n < 1 && 5 / m < -2);
    assert.ok(2 * m + n > 0);
  });
  statements(q, [samples.every(s => s.m < 0), samples.every(s => s.n > 5), samples.every(s => 2 * s.m + s.n < 0)]);
});
check(25, q => {
  stem(q, "(-3,3√3)", "順時針旋轉 60°", "0°≤θ<360°");
  const P = [-3, 3 * Math.sqrt(3)], rotation = -60 * r;
  const Q = [P[0] * Math.cos(rotation) - P[1] * Math.sin(rotation), P[0] * Math.sin(rotation) + P[1] * Math.cos(rotation)];
  const radius = norm(Q), theta = (Math.atan2(Q[1], Q[0]) / r + 360) % 360;
  unique(q, option => {
    const pair = option.match(/^\((\d+),(\d+)°\)$/);
    assert.ok(pair);
    return close(Number(pair[1]), radius) && close(Number(pair[2]), theta);
  });
  assert.match(q.topic, /極坐標/);
});
check(26, q => {
  stem(q, "3x-4y=24", "PJ=PK");
  const J = [24 / 3, 0], K = [0, 24 / -4], midpoint = interpolate(J, K, 0.5), direction = [3, -4];
  const points = [-3, -1, 0, 1, 4].map(t => midpoint.map((x, i) => x + t * direction[i]));
  points.forEach(P => near(distance(P, J), distance(P, K)));
  unique(q, option => points.every(([x, y]) => {
    const [left, right] = option.split("=");
    return close(value(left, { x, y }), value(right, { x, y }));
  }));
});
check(27, q => {
  stem(q, "O(0,0)", "P(12,4)", "Q(4,8)");
  const O = [0, 0], P = [12, 4], Q = [4, 8];
  assert.ok([...P, ...Q].every(coordinate => coordinate !== 0), "Both coefficient equations must remain coupled");
  assert.ok(area(O, P, Q) > 0, "Three noncollinear points determine one circle");
  const [D, E] = solve2(P[0], P[1], -dot(P, P), Q[0], Q[1], -dot(Q, Q));
  near(12 * D + 4 * E, -160);
  near(4 * D + 8 * E, -80);
  near((3 * 8 - 4) * E, 3 * -80 - -160);
  near(D, -12);
  near(E, -4);
  for (const [x, y] of [O, P, Q]) near(x * x + y * y + D * x + E * y, 0);
  const centre = solve2(2 * P[0], 2 * P[1], dot(P, P), 2 * Q[0], 2 * Q[1], dot(Q, Q));
  const radiusSquared = distance(centre, O) ** 2, midpoint = interpolate(P, Q, 0.5);
  near(centre[0], 6);
  near(centre[1], 2);
  near(radiusSquared, 40);
  assert.deepEqual(midpoint, [8, 6]);
  assert.match(q.solution, /消去 D：20E=-80/);
  const truth = {
    "點 (6,4) 位於圓 C 內": distance([6, 4], centre) ** 2 < radiusSquared,
    "PQ 是 C 的直徑": close(distance(midpoint, centre), 0),
    "C 的面積為 36π": close(radiusSquared, 36),
    "C 的圓心在 x+3y=0 上": close(centre[0] + 3 * centre[1], 0)
  };
  unique(q, option => { assert.ok(Object.hasOwn(truth, option)); return truth[option]; });
});
check(28, q => {
  stem(q, "7d4", "0 至 9", "被 13 整除");
  const digits = Array.from({ length: 10 }, (_, d) => d);
  const remainders = digits.map(d => (700 + 10 * d + 4) % 13);
  assert.deepEqual(remainders, [2, 12, 9, 6, 3, 0, 10, 7, 4, 1]);
  const divisible = digits.filter(d => remainders[d] === 0);
  assert.deepEqual(divisible, [5]);
  const multiples = Array.from({ length: 7 }, (_, i) => (55 + i) * 13);
  assert.deepEqual(multiples.filter(x => x % 10 === 4), [754]);
  numeric(q, divisible.length / digits.length);
});
check(29, q => {
  stem(q, "18 批", "24 批", "32 kg", "40 kg");
  const result = ((18 + 24) * 32 - 18 * 40) / 24;
  near(mean([...Array(18).fill(40), ...Array(24).fill(result)]), 32);
  numeric(q, result, " kg");
});
check(30, q => {
  stem(q, "正整數", "3、6、7、7、x、x、x、y", "平均值及中位數均為 7");
  const valid = [];
  for (let x = 1; x <= 10; x++) for (let y = 1; y <= 30; y++) {
    const data = [3, 6, 7, 7, x, x, x, y];
    if (mean(data) === 7 && median(data) === 7) valid.push({ x, y, data });
  }
  assert.deepEqual(valid.map(({ x, y }) => [x, y]), [[7, 12], [9, 6], [10, 3]]);
  assert.deepEqual(valid.map(v => variance(v.data)), [5.25, 3.75, 7.5]);
  statements(q, [valid.every(v => modes(v.data).length === 1 && modes(v.data)[0] === 7), Math.min(...valid.map(v => range(v.data))) === 6, Math.max(...valid.map(v => variance(v.data))) === 7.5]);
});
check(31, q => {
  stem(q, "哪個數最小");
  const powers = q.options.map(option => {
    const normalized = option.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, text => `^(${[...text].map(x => superscripts[x]).join("")})`);
    const match = normalized.match(/^(\(-?\d+\)|\(\d+\/\d+\)|\d+)\^\((-?\d+)\)$/);
    assert.ok(match, `Unexpected large-power option ${option}`);
    const [a, b = 1n] = match[1].replace(/[()]/g, "").split("/").map(BigInt), exponent = BigInt(match[2]);
    const magnitude = exponent < 0n ? -exponent : exponent;
    assert.ok(magnitude >= 700n, "Do not shrink the powers into direct-calculation exercises");
    let numerator = a ** magnitude, denominator = b ** magnitude;
    if (exponent < 0n) [numerator, denominator] = [denominator, numerator];
    assert.ok(numerator > 0n && denominator > 0n);
    const logarithm = Number(exponent) * (Math.log10(Math.abs(Number(a))) - Math.log10(Number(b)));
    assert.ok(Math.abs(logarithm) > 308, "Retain magnitudes beyond ordinary floating-point power evaluation");
    return { option, a, b, exponent, numerator, denominator, logarithm };
  });
  assert.equal(powers.filter(p => p.a < 0n && p.exponent % 2n === 0n).length, 1);
  assert.equal(powers.filter(p => p.exponent < 0n).length, 1);
  assert.equal(powers.filter(p => p.b > 1n).length, 2);
  // Exact integer cross-products avoid underflow: the three small powers all round to zero as Number.
  const compare = (a, b) => a.numerator * b.denominator - b.numerator * a.denominator;
  const ordered = [...powers].sort((a, b) => compare(a, b) < 0n ? -1 : compare(a, b) > 0n ? 1 : 0);
  for (let i = 1; i < ordered.length; i++) assert.ok(compare(ordered[i - 1], ordered[i]) < 0n);
  unique(q, (_, i) => compare(powers[i], ordered[0]) === 0n);
  near(ordered[0].logarithm, Math.min(...powers.map(p => p.logarithm)));
  const shownLogs = [...q.solution.matchAll(/≈(-?\d+\.\d+)/g)].map(match => Number(match[1])).sort((a, b) => a - b);
  assert.equal(shownLogs.length, 4);
  ordered.forEach((power, i) => assert.ok(Math.abs(power.logarithm - shownLogs[i]) <= 0.0005, "Incorrect log approximation"));
});
check(32, q => {
  stem(q, "0<a<1", "截距分別為 4 及 2", "y=mn^x");
  const intercept = 4, slope = (0 - 4) / (2 - 0);
  const values = [0.125, 0.5, 0.9].map(a => ({ a, m: a ** intercept, n: a ** slope }));
  values.forEach(({ a, m, n }) => {
    for (const x of [-2, 0, 2, 4]) near(Math.log(m * n ** x) / Math.log(a), intercept + slope * x);
  });
  statements(q, [values.every(v => v.m < 1), values.every(v => v.n < 1), values.every(v => close(v.m * v.n ** 2, 1))]);
});
check(33, q => {
  stem(q, "log₉y=3x-2", "(log₉y)²=30x-36", "求 log₃y");
  // Eliminate log_9(y) to solve for x first, independently of the solution's t-substitution.
  const A = 9, B = -42, C = 40, discriminant = B ** 2 - 4 * A * C;
  const xs = [(-B - Math.sqrt(discriminant)) / (2 * A), (-B + Math.sqrt(discriminant)) / (2 * A)];
  const answers = xs.map(x => {
    const y = 9 ** (3 * x - 2);
    assert.ok(y > 0);
    near((Math.log(y) / Math.log(9)) ** 2, 30 * x - 36);
    return Math.log(y) / Math.log(3);
  }).sort((a, b) => a - b);
  unique(q, option => {
    const candidates = option.split(" 或 ").map(Number).sort((a, b) => a - b);
    return candidates.length === answers.length && candidates.every((x, i) => close(x, answers[i]));
  });
});
check(34, q => {
  stem(q, "2A00B000C₁₆");
  const expected = Number(BigInt("0x2A00B000C"));
  assert.ok(Number.isSafeInteger(expected));
  numeric(q, expected);
});
check(35, q => {
  stem(q, "7+5i¹⁴-ki¹⁹+4i²⁵+3ki³²", "實部與虛部相等");
  const multiply = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const power = n => { let z = [1, 0]; for (let i = 0; i < n; i++) z = multiply(z, [0, 1]); return z; };
  const z = k => [[7, [1, 0]], [5, power(14)], [-k, power(19)], [4, power(25)], [3 * k, power(32)]].reduce((acc, [c, v]) => acc.map((x, i) => x + c * v[i]), [0, 0]);
  const difference = k => z(k)[0] - z(k)[1], slope = difference(1) - difference(0);
  assert.notEqual(slope, 0);
  const k = -difference(0) / slope;
  near(z(k)[0], z(k)[1]);
  numeric(q, z(k)[0]);
});
check(36, q => {
  stem(q, "2x+y≥10", "2x+3y≥18", "4x+3y≤26", "5x+4y");
  const boundaries = [[2, 1, 10], [2, 3, 18], [4, 3, 26]], vertices = [];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const [x, y] = solve2(...boundaries[i], ...boundaries[j]);
    assert.ok(2 * x + y >= 10 - 1e-9 && 2 * x + 3 * y >= 18 - 1e-9 && 4 * x + 3 * y <= 26 + 1e-9);
    vertices.push([x, y]);
  }
  const minimum = Math.min(...vertices.map(([x, y]) => 5 * x + 4 * y));
  // A nonnegative combination of the first two bounds proves the global lower bound.
  const [lambda, mu] = solve2(2, 2, 5, 1, 3, 4);
  assert.ok(lambda >= 0 && mu >= 0);
  near(minimum, lambda * 10 + mu * 18);
  numeric(q, minimum);
});
check(37, q => {
  stem(q, "4p²、3、18p", "p 為實數", "求第四項");
  const p = Math.cbrt(3 ** 2 / (4 * 18));
  const terms = [4 * p ** 2, 3, 18 * p];
  assert.ok(p > 0 && terms[0] > 0);
  near(terms[1] / terms[0], terms[2] / terms[1]);
  const ratio = terms[1] / terms[0];
  unique(q, option => {
    const fourth = value(option);
    return close(fourth / terms[2], ratio) && close(terms[2] ** 2, terms[1] * fourth);
  });
});
check(38, q => {
  stem(q, "∠JML=75°", "∠LKV=34°", "∠MJU=47°");
  const arcKL = 2 * 34, arcJM = 2 * 47, arcJK = 2 * 75 - arcKL, arcLM = 360 - arcKL - arcJM - arcJK;
  assert.ok([arcJK, arcKL, arcLM, arcJM].every(x => x > 0));
  const J = polar(0), K = polar(arcJK), L = polar(arcJK + arcKL), M = polar(arcJK + arcKL + arcLM);
  const U = [J[0], J[1] - 1], V = [K[0] - Math.sin(arcJK * r), K[1] + Math.cos(arcJK * r)];
  near(angle(J, M, L), 75);
  near(angle(L, K, V), 34);
  near(angle(M, J, U), 47);
  numeric(q, angle(K, L, M), "°");
});
check(39, q => {
  stem(q, "0°≤x<540°", "sin²x=3cos²x");
  // sin^2(x)=3cos^2(x) is equivalent to cos(2x)=-1/2.
  const roots = [];
  for (let n = -1; n <= 3; n++) for (const phase of [120, 240]) {
    const x = (phase + 360 * n) / 2;
    if (x >= 0 && x < 540) roots.push(x);
  }
  assert.equal(new Set(roots).size, roots.length);
  roots.forEach(x => near(Math.sin(x * r) ** 2, 3 * Math.cos(x * r) ** 2));
  for (const x of [0, 90, 270, 450, 540]) assert.ok(!close(Math.sin(x * r) ** 2, 3 * Math.cos(x * r) ** 2));
  numeric(q, roots.length);
});
check(40, q => {
  stem(q, "JKLMNPQR", "平面 JPQ 與 JPR", "平面 JPR 與 PQR", "不大於 90°");
  const J = [1, 0, 1], K = [1, 0, 0], L = [1, 1, 0], M = [1, 1, 1];
  const N = [0, 1, 1], P = [0, 0, 1], Q = [0, 0, 0], R = [0, 1, 0];
  const edges = [[J, K], [K, L], [L, M], [M, J], [N, P], [P, Q], [Q, R], [R, N], [J, P], [K, Q], [L, R], [M, N]];
  edges.forEach(([a, b]) => near(distance(a, b), 1));
  const normal = (a, b, c) => cross(sub(b, a), sub(c, a));
  const between = (u, v) => Math.acos(Math.min(1, Math.abs(dot(u, v)) / (norm(u) * norm(v)))) / r;
  const alpha = between(normal(J, P, Q), normal(J, P, R));
  const beta = between(normal(J, P, R), normal(P, Q, R));
  near(alpha, 45);
  near(beta, 90);
  near(dot(sub(J, P), sub(Q, P)), 0);
  near(dot(sub(J, P), sub(N, P)), 0);
  unique(q, option => condition(option.replace(/α/g, "a").replace(/β/g, "b"), { a: alpha, b: beta }));
});
check(41, q => {
  stem(q, "J(a,0)", "K(0,b)", "a、b 均為正數", "6x+10y=13a");
  unique(q, option => {
    const [a, b] = option.split(":").map(Number), O = [0, 0], J = [a, 0], K = [0, b];
    const centre = solve2(2 * a, 0, a * a, 0, 2 * b, b * b);
    near(distance(centre, O), distance(centre, J));
    near(distance(centre, O), distance(centre, K));
    return close(6 * centre[0] + 10 * centre[1], 13 * a);
  });
});
check(42, q => {
  stem(q, "首四位", "1、3、5、7", "末三位", "2、4、8", "各用一次");
  const permutations = xs => xs.length ? xs.flatMap((x, i) => permutations(xs.filter((_, j) => i !== j)).map(rest => [x, ...rest])) : [[]];
  const passwords = new Set();
  for (const first of permutations([1, 3, 5, 7])) for (const last of permutations([2, 4, 8])) passwords.add([...first, ...last].join(""));
  assert.ok([...passwords].every(x => x.length === 7));
  numeric(q, passwords.size);
});
check(43, q => {
  stem(q, "3 枚白棋", "1 枚黃棋", "2 枚紅棋", "每次放回", "甲先抽", "乙抽到白棋");
  const red = 2 / 6, white = 3 / 6, yellow = 1 / 6;
  // Absorbing-state equations: A=red*B, B=white+red*A.
  const [A, B] = solve2(1, -red, 0, -red, 1, white);
  near(A, red * B);
  let active = 1, bWhite = 0, ended = 0;
  for (let turn = 0; turn < 80; turn++) {
    if (turn % 2 === 1) bWhite += active * white;
    ended += active * (white + yellow);
    active *= red;
  }
  near(ended + active, 1);
  near(bWhite, A);
  numeric(q, A);
});
check(44, q => {
  stem(q, "中位數為 28", "先增加 25%，再加 6", "原標準分為 -1.5");
  const transform = x => 1.25 * x + 6, data = [12, 20, 28, 35, 45];
  near(median(data), 28);
  const newMedian = median(data.map(transform));
  const scores = [20, 40, 64].flatMap(mu => [2, 8, 12].map(sigma => {
    const x = mu - 1.5 * sigma;
    return (transform(x) - transform(mu)) / (1.25 * sigma);
  }));
  unique(q, option => {
    const [m, z] = option.split("；").map(Number);
    return close(m, newMedian) && scores.every(score => close(z, score));
  });
});
check(45, q => {
  stem(q, "d-8,d-3,d-1,d+2,d+4,d+9", "d-9,d-4,d-2,d+1,d+3,d+8");
  const iqr = xs => median(xs.slice(3)) - median(xs.slice(0, 3));
  const truths = [-100, -2, 0, 4, 17].map(d => {
    const U = [-8, -3, -1, 2, 4, 9].map(x => d + x), V = [-9, -4, -2, 1, 3, 8].map(x => d + x);
    assert.deepEqual(U.map(x => 2 * d - x).reverse(), V);
    return [close(mean(U), mean(V)), close(variance(U), variance(V)), close(iqr(U), iqr(V))];
  });
  statements(q, [0, 1, 2].map(i => truths.every(row => row[i])));
});

assert.deepEqual([...checked].sort((a, b) => a - b), Array.from({ length: 45 }, (_, i) => i + 1));
console.log("2022 Paper 2: 45 independent mathematical checks passed; four unique options and one verified key per question; geometry, domains, statistics and rounding verified; all visible text renders without division slashes or bare roots, with connected solution steps.");
