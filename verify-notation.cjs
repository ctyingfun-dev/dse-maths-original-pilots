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
  const render = load(`paper${paper}/math.js`).mathText;
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
  for (const year of [2024,2025,2026]) {
    const data = Object.values(load(`paper${paper}/data-${year}.js`))[0];
    assert.equal(data.questions.length, paper === 1 ? 19 : 45);
    assert.doesNotMatch(JSON.stringify(data), /[橫縱横纵]|恆等於|恒等于/);
    questions += data.questions.length;
    if (paper === 2) {
      const identity = data.questions[year === 2024 ? 5 : year === 2025 ? 2 : 4];
      assert.ok(identity.prompt.includes("≡"));
      if (year === 2026) {
        const q = data.questions;
        assert.match(q[13].solution, /共同 z 截距/);
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
  summaries += items.length;
}
console.log(`Notation verified: ${questions} questions, ${summaries} topic summaries, both math renderers.`);
