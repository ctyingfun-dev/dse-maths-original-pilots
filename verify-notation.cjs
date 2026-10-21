const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(relative) {
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, relative), "utf8"), context);
  return context.window;
}

let questions = 0;
let summaries = 0;
for (const paper of [1,2]) {
  const {mathText:render,solutionLines} = load(`paper${paper}/math.js`);
  const lines=text=>Array.from(solutionLines(text));
  assert.deepEqual(lines("設 h=7c 及 j=5c。"),["設 h=7c 及 j=5c。"]);
  assert.deepEqual(lines("R(10,5-h)；由共線，(5-h)/10=(-10)/5。"),["R(10,5-h)；","由共線，(5-h)/10=(-10)/5。"]);
  assert.deepEqual(lines("周界=40+45+10=95 cm。"),["周界=40+45+10=95 cm。"]);
  assert.deepEqual(lines("sin h=3/5、cos h=4/5。"),["sin h=3/5、cos h=4/5。"]);
  assert.deepEqual(lines("f=7、8、9。"),["f=7、8、9。"]);
  assert.deepEqual(lines("F(x)=(x+1)/(x-1)=2。"),["F(x)=(x+1)/(x-1)=2。"]);
  assert.deepEqual(lines("log₁₁α+log₁₁β=log₁₁(11²)=2。"),["log₁₁α+log₁₁β=log₁₁(11²)=2。"]);
  assert.equal(render("logᵣ625"),"log<sub><var>r</var></sub>625");
  for(const [source,top,bottom] of [
    ["sin∠KJL/7","sin∠KJL","7"],["sin65°/8","sin65°","8"],
    ["C(6,2)/C(9,2)","C(6,2)","C(9,2)"],["6%/4","6%","4"],
    ["a/b/c","a/b","c"],["(6/2)²/(8/4)³","(6/2)²","(8/4)³"],
    ["[(3/2)×42³]/(6×42²)","[(3/2)×42³]","(6×42²)"],
    ["(120-595/12)(119-169/2)/2","(120-595/12)(119-169/2)","2"]
  ]) assert.ok(render(source).includes(`aria-label="${top} 除以 ${bottom}"`),source);
  assert.match(render("x^(2/3)"), /<sup><span class="math-frac"/);
  assert.match(render("√(a/b)"), /<msqrt><mtext><span class="math-radicand"><span class="math-frac"/);
  for(const source of ["√t","√58","√207.5393863","√(34/5)","√((3√3)²+3²)","33/(5√58)","1/√3","√[(Σx²)/N-((Σx)/N)²]"]) {
    const rendered=render(source);
    assert.equal((rendered.match(/<msqrt>/g)||[]).length,(source.match(/√/g)||[]).length,source);
    assert.doesNotMatch(rendered.replace(/<[^>]+>/g,""),/√/,source);
  }
  assert.match(render("6√10π"), /<span class="math-radicand">10<\/span><\/mtext><\/msqrt><\/math><var>π<\/var>$/);
  assert.match(render("√3d"), /<span class="math-radicand">3<\/span><\/mtext><\/msqrt><\/math><var>d<\/var>$/);
  assert.equal(render("12÷5"),render("12/5"));
  assert.equal(render("a⁴b¹⁴"), "<var>a</var><sup>4</sup><var>b</var><sup>14</sup>");
  assert.equal(render("a⁻⁵"), render("a^(-5)"));
  assert.equal(render("aₙ₊₂"), "<var>a</var><sub><var>n</var><span class=\"math-op\">+</span>2</sub>");
  assert.equal(render("log₂x"), "log<sub>2</sub><var>x</var>");
  assert.doesNotMatch(render("180 g，10 g，280 g，質量（g），27.9 kg"), /<var>g<\/var>/);
  assert.match(render("g=t-2975/(2t)"), /^<var>g<\/var>/);
  assert.match(render("2g及g(t)"), /<var>g<\/var>/);
  for(const criterion of ["SAS","SSS","ASA","AAS","RHS","AA"]) assert.equal(render(criterion),criterion);
  assert.equal(render("log_(β)α"), "log<sub><var>β</var></sub><var>α</var>");
  assert.match(render("a⁻⁵b²/((a³b⁴)⁻³)"), /<sup>4<\/sup>/);
  assert.doesNotMatch(render("a⁻⁵b²/((a³b⁴)⁻³)").replace(/<[^>]+>/g,""), /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/);
  const half = render("½");
  assert.match(half, /class="math-frac" role="math" aria-label="1 除以 2"/);
  assert.match(half, /<span aria-hidden="true">1<\/span><span aria-hidden="true">2<\/span>/);
  for (const text of ["½ab sinφ", "½a² sinφ", "½×7×18", "½(9-h)"]) {
    assert.ok(render(text).startsWith(half), text);
    assert.ok(!render(text).includes("½"), text);
  }
  assert.match(render("a≡b"), /<span class="math-op">≡<\/span>/);
  assert.match(render("a≡-2"), /<span class="math-unary">−<\/span>2/);
  assert.match(render("x 坐標及 y 坐標"), /<var>x<\/var> 坐標及 <var>y<\/var> 坐標/);
  for (const year of [2022,2023,2024,2025,2026]) {
    const data = Object.values(load(`paper${paper}/data-${year}.js`))[0];
    assert.equal(data.questions.length, paper === 1 ? 19 : 45);
    assert.doesNotMatch(JSON.stringify(data), /[橫縱横纵]|恆等於|恒等于/);
    assert.doesNotMatch(JSON.stringify(data), /角邊角|角角邊|邊角邊|邊邊邊|斜邊直角邊/);
    for(const q of data.questions) {
      const solution=Array.isArray(q.solution)?q.solution.flatMap(p=>p.steps.flatMap(s=>s.text)):[q.solution];
      for(const text of [q.prompt,q.answer,q.correct,...q.hints,...solution,...(q.options||[])].filter(Boolean)) {
        const visible=render(text).replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,"").replace(/<[^>]+>/g,"");
        assert.doesNotMatch(visible,/[\/÷]/,`${year} P${paper} Q${q.n}: ${text}`);
        assert.doesNotMatch(visible,/√/,`${year} P${paper} Q${q.n}: uncovered root: ${text}`);
      }
    }
    questions += data.questions.length;
    if (paper === 2) {
      const identity = data.questions[year === 2024 ? 5 : year === 2022 || year === 2025 ? 2 : 4];
      assert.ok(identity.prompt.includes("≡"));
      if (year === 2026) {
        const q = data.questions;
        assert.match(q[13].solution, /共同(?:的)? z 截距/);
        assert.match(q[14].prompt, /z 截距.*y 截距/);
        assert.match(q[23].prompt, /x 坐標/);
        assert.match(q[26].prompt, /圓心的 x 坐標/);
        assert.match(q[34].prompt, /z 截距.*y 截距/);
        assert.match(q[35].prompt, /log₂V 軸及 t 軸/);
        assert.equal(q[18].options.filter(option=>option.startsWith("½")).length, 3);
      }
    } else if (year === 2026) {
      assert.match(data.questions[10].hints.join(""), /t 截距/);
    }
  }
  const topics = load(`paper${paper}/dse-topics.js`).DSE_TOPICS;
  const items = topics.groups || topics.questions;
  assert.doesNotMatch(JSON.stringify(items), /[橫縱横纵]/);
  assert.doesNotMatch(JSON.stringify(items), /角邊角|角角邊|邊角邊|邊邊邊|斜邊直角邊/);
  summaries += items.length;
}
console.log(`Notation verified: ${questions} questions, ${summaries} topic summaries, both math renderers.`);
