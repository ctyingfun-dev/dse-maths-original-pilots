const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const load=file=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(file,"utf8"),context);
  return context.window;
};
assert.equal(fs.readFileSync("paper1/math.js","utf8"),fs.readFileSync("paper2/math.js","utf8"));
let checked=0;
for(const paper of [1,2]) {
  const {solutionLayout:layout,solutionHtml:html}=load(`paper${paper}/math.js`);
  const short=layout("log₁₁α+log₁₁β=log₁₁(11²)=2。");
  assert.equal(short.length,1);
  assert.equal(short[0].rows.length,1);
  assert.match(short[0].rows[0].rhs,/=2。$/);
  assert.equal(layout(["x=2。","y=3。"]).length,2,"New steps must start afresh");
  assert.equal(layout(["x=2+3","=5。"]).length,1,"Only an explicit continuation joins a calculation");
  assert.doesNotMatch(html("y=-119(119-169)/(2t)=5950/(2t)=2975/t。"),/equation-left|equation-relation|equation-right/);
  const substitution=layout("代入 b=40、h=8：B(j)=j[80+8(j-1)]/2。");
  assert.equal(substitution[0].text,"代入 b=40、h=8：");
  for(const year of [2018,2019,2020,2021,2022,2023,2024,2025,2026]) {
    const data=Object.values(load(`paper${paper}/data-${year}.js`))[0];
    for(const q of data.questions) {
      const groups=paper===1?q.solution.flatMap(part=>part.steps.map(step=>step.text)):[q.solution];
      for(const group of groups) {
        for(const block of layout(group)) {
          if(block.type==="calculation") assert.ok(block.rows[0].lhs,`${year} P${paper} Q${q.n}: disconnected continuation`);
          else assert.doesNotMatch(block.text,/^(所以|因此|故|得)[，。；]?$/,`${year} P${paper} Q${q.n}: isolated connective`);
        }
      }
      checked++;
    }
  }
}
console.log(`Solution standard verified: ${checked} questions, independent left-aligned steps, no detached calculation chains.`);
