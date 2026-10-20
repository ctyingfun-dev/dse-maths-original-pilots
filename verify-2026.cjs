const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function load(paper) {
  const sandbox = {window:{}};
  const source = fs.readFileSync(path.join(__dirname, `paper${paper}`, "data-2026.js"), "utf8");
  vm.runInNewContext(source, sandbox, {filename:`paper${paper}/data-2026.js`});
  return sandbox.window.PILOT;
}

const p1 = load(1);
const p2 = load(2);
assert.match(p1.questions[6].prompt, /按每位學員計算成本，原定學費比成本多 \$160/);
assert.match(p1.questions[6].prompt, /學費打八折後.*每招收一位學員仍賺 \$48/);
assert.doesNotMatch(p1.questions[6].prompt, /早鳥|每人定價|每人成本|原定學費為成本加/);
assert.ok(p1.questions[6].hints.slice(0,2).every(hint=>hint.includes("學費")));
assert.ok(p1.questions[6].solution[0].steps[0].text.every(line=>line.includes("學費")));
const mathSandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"paper1/math.js"),"utf8"),mathSandbox);
const renderMath=mathSandbox.window.mathText;
assert.ok(renderMath("54.23/80").includes('aria-label="54.23 除以 80"'),"小數分子不可被拆開");
assert.ok(renderMath(p1.questions[1].prompt).includes('aria-label="((r³s²)³) 除以 (r¹⁴s⁻⁵)"'),"乘積冪須完整置於分子");
assert.ok(renderMath("KM//NP").includes('class="math-relation"'),"雙斜線平行關係不得當成分式");
assert.ok(renderMath("φ/2").includes('aria-label="φ 除以 2"'),"希臘變數分式");
assert.ok(renderMath("log₂[(G(n+1))/(G(n))]").includes('aria-label="(G(n+1)) 除以 (G(n))"'),"函數比須完整置於分式");
assert.ok(renderMath("b¹⁴/a³").includes('aria-label="b¹⁴ 除以 a³"'),"多位上標須完整置於分子");
assert.ok(renderMath("sin∠ABC=(AC sin∠BCA)/80").includes('aria-label="(AC sin∠BCA) 除以 80"'),"三角函數乘積須完整置於分子");
const paper1Marks = [3,3,3,4,4,4,4,5,5,6,6,7,8,8,4,6,6,7,12];
const sourceGroups = [{},{},{},{},{},{},{},{},{},{a:3,b:3},{a:3,b:3},{a:2,b:5},{a:3,b:5},{a:3,b:5},{a:2,b:2},{a:3,b:3},{a:4,b:2},{a:2,b:5},{a:2,b:1,c:9}];
assert.equal(p1.questions.length, 19);
assert.equal(p2.questions.length, 45);
for (const data of [p1,p2]) {
  for (const [i,q] of data.questions.entries()) {
    assert.equal(q.n, i+1, `卷${data.paper} 題號`);
    assert.ok(q.prompt && q.answer && q.solution && q.hints.length >= 3, `卷${data.paper} 第${q.n}題資料`);
    if (data.paper === 1) {
      assert.ok(Array.isArray(q.solution) && q.solution.length, `卷一第${q.n}題評分參考`);
      const total = q.solution.reduce((sum, part) => {
        assert.ok(Array.isArray(part.steps) && part.steps.length, `卷一第${q.n}題評分步驟`);
        return sum + part.steps.reduce((subtotal, step) => {
          assert.match(step.marks, /^[1-9]\d*[MA]$/);
          assert.ok(Array.isArray(step.text) && step.text.length && step.text.every(line => typeof line === "string" && line.trim()));
          return subtotal + parseInt(step.marks, 10);
        }, 0);
      }, 0);
      assert.equal(total, paper1Marks[i], `卷一第${q.n}題評分總和`);
      assert.equal(JSON.stringify(q.markGroups || {}), JSON.stringify(sourceGroups[i]), `卷一第${q.n}題原卷分題配分`);
      for (const [label, expected] of Object.entries(sourceGroups[i])) {
        const subtotal=q.solution.filter(part=>part.part.startsWith(`(${label})`))
          .reduce((sum,part)=>sum+part.steps.reduce((value,step)=>value+parseInt(step.marks,10),0),0);
        assert.equal(subtotal, expected, `卷一第${q.n}題(${label})評分參考`);
      }
    }
    if (data.paper === 2) {
      assert.equal(q.sourceNo, q.n);
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.equal(q.options["ABCD".indexOf(q.answer)], q.correct, `卷二第${q.n}題答案鍵`);
      assert.equal(q.section, q.n <= 30 ? "甲部" : "乙部");
    }
  }
}
for (const [start,end] of [[0,9],[9,14],[14,19]]) {
  assert.equal(paper1Marks.slice(start,end).reduce((sum,mark)=>sum+mark,0),35);
}

const close=(a,b)=>Math.abs(a-b)<1e-8;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const p1Expected=["u=(84-4v)/13","s¹¹/r⁵","25/2","(4r+3)(3rs-7s+5)","530","-9","12%","20 cm","347/6","9/190","36","104","是","不是；v=8 或 289/8","620/1001","否","是","385","有可能；t=3"];
p1Expected.forEach((answer,i)=>assert.equal(p1.questions[i].answer,answer,`卷一第${i+1}題答案`));
// Calculate from the new conditions, without reading the worked answers.
const p1Checks=[
  [-10,0,3,20].every(v=>{const u=(84-4*v)/13;return close(u/4+3,(5*u+v)/7);}),
  [2,3,5].every(r=>[1,2,3].every(s=>close(((r**3*s**2)**3/(r**14*s**-5))/(s**11/r**5),1))),
  close((-3-5)*(-3+25/2-5)+(10-4)*(10-4),0),
  [-3,0,1,4].every(r=>[-2,0,5].every(s=>
    12*r*r*s-19*r*s-21*s===s*(4*r+3)*(3*r-7) &&
    12*r*r*s-19*r*s-21*s+20*r+15===(4*r+3)*(3*r*s-7*s+5))),
  918-530-70===.6*530,
  [-20,-9,-61/7,-8.7,0,3,5].every(t=>(5*t+9<24 && 24<=(11-7*t)/3)===(t<=-61/7)) &&
    5*(-9)+9<24 && 24<=(11+63)/3 && ! (24<=(11+56)/3),
  .8*(400+160)===400+48 && 48/400*100===12,
  16/20===20/25 && 9+16===20+5,
  (35.5*3+45.5*6+55.5*8+65.5*7+75.5*6)/30===347/6 && 3+6===9 && 9+8+7===24,
  (()=>{
    const q=p1.questions[9],median=a=>(a[(a.length-2)/2]+a[a.length/2])/2;
    assert.equal(q.diagram.key,undefined);
    const valuesFor=u=>q.diagram.rows.flatMap(row=>row.leaves.map(leaf=>10*row.stem+(leaf==="u"?u:leaf)));
    const candidates=Array.from({length:10},(_,u)=>u).filter(u=>{
      const a=valuesFor(u);return 2*(a.at(-1)-a[0])===5*(median(a.slice(10))-median(a.slice(0,10)));
    });
    if(candidates.join(",")!=="7") return false;
    const a=valuesFor(7),frequencies=new Map();
    a.forEach(v=>frequencies.set(v,(frequencies.get(v)||0)+1));
    const modes=[...frequencies].filter(([,f])=>f===Math.max(...frequencies.values())).map(([v])=>v);
    let pairs=0;
    for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++) pairs+=a[i]+a[j]>76;
    return a.length===20 && modes.join(",")==="38" && pairs===9;
  })(),
  close(-12/25*25+12,0) && -12/25*100+12===-36 && 10+2*Math.hypot(5,12)===36,
  (()=>{
    const vertices=[[-1,4],[-6,-10],[5,0],[10,14]];
    const area=Math.abs(vertices.reduce((sum,p,i)=>{const n=vertices[(i+1)%4];return sum+p[0]*n[1]-p[1]*n[0];},0))/2;
    return vertices[1][1]===3*vertices[1][0]+8 && vertices.every((p,i)=>close(distance(p,vertices[(i+1)%4]),Math.sqrt(221))) &&
      area===104 && close(distance(vertices[0],vertices[2])*distance(vertices[1],vertices[3])/2,104);
  })(),
  close(4/3*11**3*27/99,484) && Math.sqrt(484/4)===11 && close(2*(44/3)*(44/3+16/3),1760/3) && 1760/3>4*11**2,
  (()=>{
    const f=(t,v)=>(t*t-4*t-12)*(2*t+5)+v*(t+2);
    const derivative=(t,v)=>6*t*t-6*t-44+v;
    return [-100,0,8,20,289/8,50].every(v=>[-3,-2,0,2,5].every(t=>close(f(t,v),(t+2)*(2*t*t-7*t-30+v)))) &&
      close(f(-2,8),0) && close(derivative(-2,8),0) &&
      close(f(7/4,289/8),0) && close(derivative(7/4,289/8),0) &&
      [-10,0,7.99,8.01,36,37].every(v=>!close(derivative(-2,v),0) && !close(289-8*v,0));
  })(),
  (()=>{
    let total=0,first=0,union=0;
    for(let a=0;a<11;a++) for(let b=a+1;b<12;b++) for(let c=b+1;c<13;c++) for(let d=c+1;d<14;d++) {
      const draw=[a,b,c,d],food=draw.filter(i=>i<5).length===2,book=draw.filter(i=>i>=5&&i<10).length===2;
      total++;first+=food;union+=food||book;
    }
    return total===1001 && first===360 && union===620;
  })(),
  (()=>{
    const j=[4,6],l=[5,1],center=[-3,2],n=[16/3,11/3];
    return [j,[-7,9],l].every(p=>close(distance(p,center)**2,65)) &&
      close((j[0]+l[0])/2-5*(j[1]+l[1])/2+13,0) &&
      close((j[0]-center[0])*(n[0]-j[0])+(j[1]-center[1])*(n[1]-j[1]),0) &&
      close((l[0]-center[0])*(n[0]-l[0])+(l[1]-center[1])*(n[1]-l[1]),0) &&
      close(distance(n,j),distance(n,l)) && !close(distance(j,l)**2,2*distance(n,j)**2);
  })(),
  (()=>{
    const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
    const jl=Math.sqrt(55**2+76**2-2*55*76*Math.cos(rad(68)));
    const ljm=deg(Math.acos((55**2+jl**2-76**2)/(110*jl)));
    const klj=118-(180-68-ljm),jkl=deg(Math.asin(jl*Math.sin(rad(klj))/84));
    const kjm=360-68-118-jkl,elevation=deg(Math.asin(55*Math.sin(rad(kjm))*Math.sin(rad(62))/75));
    return Math.abs(jl-75.2946803)<1e-6 && Math.abs(kjm-113.853779)<1e-6 && Math.abs(elevation-36.312302)<1e-6 && elevation<45;
  })(),
  (()=>{
    const a=n=>14*3**(n-1),b=n=>Math.log(a(n))/Math.log(3),sum=j=>j*(2*Math.log(14)/Math.log(3)+j-1)/2;
    return a(2)===42 && a(5)===1134 && [1,3,10].every(n=>close(b(n+1)-b(n),1)) &&
      sum(385)<75000 && sum(386)>75000;
  })(),
  [.25,1,2,3,4].every(t=>{
    const j=[-4+12*t,6-9*t],k=[-4-12*t,6+9*t],l=[-4+12*t,6+16*t],n=[-4,6];
    const p=[-4+9*t/2,6+6*t],q=[-4+21*t/8,6+7*t/2],r=[-1-89*t/8,12+19*t/2];
    const f=x=>-2*x*x+(48*t-16)*x-288*t*t+183*t-26;
    const weights=[distance(k,l),distance(j,l),distance(j,k)],perimeter=weights.reduce((a,b)=>a+b);
    const weighted=j.map((_,i)=>(weights[0]*j[i]+weights[1]*k[i]+weights[2]*l[i])/perimeter);
    return close(f(j[0]),j[1]) && close(12-f(-8-k[0]),k[1]) &&
      close(distance(j,n),15*t) && close(distance(l,n),20*t) && close(distance(j,l),25*t) &&
      weighted.every((v,i)=>close(v,p[i])) && close(distance(p,n),300*t*t/(perimeter/2)) &&
      close(distance(q,j),distance(q,k)) && close(distance(q,j),distance(q,l)) && close(distance(p,q),25*t/8) &&
      close(k[0]+p[0],r[0]+q[0])===close(t,3) && close(k[1]+p[1],r[1]+q[1])===close(t,3) &&
      !close((q[0]-p[0])*(k[1]-p[1])-(q[1]-p[1])*(k[0]-p[0]),0);
  })
];
const checks=[...p1Checks.map((valid,i)=>[1,i+1,valid]),...require("./verify-paper2.cjs")(p2)];
for (const [paper,n,valid] of checks) assert.ok(valid, `卷${paper} 第${n}題獨立算式`);
console.log(`題目結構、答案鍵及 ${checks.length} 項獨立算式核對通過：卷一 ${p1.questions.length} 題、卷二 ${p2.questions.length} 題。卷一評分參考配分為35+35+35=105。`);
