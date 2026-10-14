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
const mathSandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"paper1/math.js"),"utf8"),mathSandbox);
const renderMath=mathSandbox.window.mathText;
assert.ok(renderMath("54.23/80").includes('aria-label="54.23 除以 80"'),"小數分子不可被拆開");
assert.ok(renderMath(p1.questions[1].prompt).includes('aria-label="((a²b³)⁴) 除以 (a¹¹b⁻²)"'),"乘積冪須完整置於分子");
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

// Independently calculate every Paper 1 item, including alternate-root cases.
const checks = [
  [1,1, p1.questions[0].answer==="m=(3n-30)/7" && [-10,0,3,20].every(n=>{
    const m=(3*n-30)/7;
    return Math.abs(m/3-2-(4*m-n)/5)<1e-12;
  })],
  [1,2, p1.questions[1].answer==="b¹⁴/a³" && [2,3,5].every(a=>[1,2,3].every(b=>{
    const expression=(a*a*b**3)**4/(a**11*b**-2);
    return Math.abs(expression/(b**14/a**3)-1)<1e-12;
  }))],
  [1,3, p1.questions[2].answer==="15" && (-6)*(-6)+3*(-12)===0],
  [1,4, p1.questions[3].answer==="(3x-2)(2xy+5y-3)" && [-3,0,1,4].every(x=>[-2,0,5].every(y=>
    6*x*x*y+11*x*y-10*y===y*(3*x-2)*(2*x+5) &&
    6*x*x*y+11*x*y-10*y-9*x+6===(3*x-2)*(2*x*y+5*y-3)
  ))],
  [1,5, p1.questions[4].answer==="320" && 660-320-84===.8*320],
  [1,6, p1.questions[5].answer==="-5" && [-10,-6,-5.01,-5,-4.99,0,6,10].every(x=>
    ((2*x-5<7 && 7<=(3-5*x)/4)===(x<=-5))
  )],
  [1,7, 0.9*(320+80) === 320+40 && 40/320*100 === 12.5],
  [1,8, 9/15===15/25 && 16+9===15+10],
  [1,9, (75.5*2+85.5*4+95.5*6+105.5*5+115.5*3)/20 === 97],
  [1,10, (() => {
    const q=p1.questions[9];
    const valuesFor=w=>q.diagram.rows.flatMap(row=>row.leaves.map(leaf=>10*row.stem+(leaf==="w"?w:leaf)));
    const median=values=>(values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2;
    const candidates=Array.from({length:10},(_,i)=>i).filter(w=>{
      const values=valuesFor(w);
      const half=values.length/2;
      return 3*(values.at(-1)-values[0])===7*(median(values.slice(half))-median(values.slice(0,half)));
    });
    if(candidates.length!==1 || candidates[0]!==2) return false;
    const values=valuesFor(candidates[0]);
    const frequencies=new Map();
    for(const value of values) frequencies.set(value,(frequencies.get(value)||0)+1);
    const maximum=Math.max(...frequencies.values());
    const modes=[...frequencies].filter(([,frequency])=>frequency===maximum).map(([value])=>value);
    if(values.length!==20 || modes.length!==1 || modes[0]!==36) return false;
    let pairs=0;
    for(let i=0;i<values.length;i++) for(let j=i+1;j<values.length;j++) pairs+=values[i]+values[j]>2*modes[0];
    const total=values.length*(values.length-1)/2;
    const [numerator,denominator]=q.answer.split("/").map(Number);
    return pairs===7 && total===190 && pairs/total===numerator/denominator;
  })()],
  [1,11, p1.questions[10].answer==="16" && -4/9*9+4===0 && -4/9*36+4===-12 && 6+2*Math.hypot(3,4)===16],
  [1,12, (()=>{
    const h=[1,4],p=[6,-6],k=[-5,-4],q=[-10,6];
    const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
    const vertices=[h,p,k,q];
    const twiceArea=Math.abs(vertices.reduce((sum,a,i)=>{
      const b=vertices[(i+1)%4];
      return sum+a[0]*b[1]-a[1]*b[0];
    },0));
    return p1.questions[11].answer==="100" && p[1]===-2*p[0]+6 &&
      vertices.every((a,i)=>Math.abs(distance(a,vertices[(i+1)%4])-5*Math.sqrt(5))<1e-12) &&
      twiceArea/2===100 && distance(h,k)*distance(p,q)/2===100;
  })()],
  [1,13, 4/3*6**3*8/(1+8+27)===64 && 2*3*(3+24)>4*6**2],
  [1,14, (() => {
    const q=p1.questions[13], tolerance=1e-8;
    if(q.answer!=="不是；b=-63 或 1" || q.solution.length!==2 || !q.prompt.includes("商為 x+7") || !q.prompt.includes("是否只有一個")) return false;
    const candidates=[-63,1];
    const rootsFor=b=>{
      const discriminant=144-4*(35+b);
      const roots=[2];
      if(discriminant>=-tolerance) {
        const radical=Math.sqrt(Math.abs(discriminant)<tolerance?0:discriminant);
        roots.push((-12+radical)/2,(-12-radical)/2);
      }
      return roots.filter((root,i)=>roots.findIndex(value=>Math.abs(value-root)<tolerance)===i);
    };
    const samples=[-100,...candidates.flatMap(b=>[b-1e-4,b,b+1e-4]),-10,-1,0,10];
    return samples.every(b=>{
      const p=x=>(x*x+3*x-10)*(x+7)+b*(x-2);
      if(p(2)!==0) return false;
      if(![-3,0,1,2,5].every(x=>Math.abs(p(x)-(x-2)*(x*x+12*x+35+b))<tolerance)) return false;
      const roots=rootsFor(b);
      const hasTwo=candidates.some(value=>Math.abs(value-b)<tolerance);
      return roots.every(root=>Math.abs(p(root))<tolerance) && (roots.length===2)===hasTwo;
    });
  })()],
  [1,15, (()=>{
    const colors=[...Array(4).fill("R"),...Array(4).fill("W"),...Array(5).fill("B")];
    let total=0,red=0,union=0;
    for(let a=0;a<10;a++) for(let b=a+1;b<11;b++) for(let c=b+1;c<12;c++) for(let d=c+1;d<13;d++) {
      const draw=[a,b,c,d].map(i=>colors[i]);
      const r=draw.filter(x=>x==="R").length===2,w=draw.filter(x=>x==="W").length===2;
      total++; red+=r; union+=r||w;
    }
    return total===715 && red===216 && union===396 && union/total===36/65 && p1.questions[14].answer==="36/65";
  })()],
  [1,16, (()=>{
    const points=[[5,7],[-2,6],[2,-2]];
    const reflectedP=[5-2*(5+3*7-11)/10,7-6*(5+3*7-11)/10];
    return !p1.questions[15].prompt.includes("R(2") && reflectedP[0]===2 && reflectedP[1]===-2 &&
      points.every(([x,y])=>(x-2)**2+(y-3)**2===25) && 7*2+3===17 && 2+3*3===11 &&
      3*17+4*(-2)===43 && Math.hypot(17-5,-2-7)===15 && Math.hypot(17-2,0)===15;
  })()],
  [1,17, (() => {
    const rad=x=>x*Math.PI/180, deg=x=>x*180/Math.PI;
    const ac=Math.sqrt(60**2+90**2-2*60*90*Math.cos(rad(60)));
    const cad=deg(Math.asin(90*Math.sin(rad(60))/ac));
    const bca=125-(180-60-cad);
    const abc=deg(Math.asin(ac*Math.sin(rad(bca))/80));
    const bad=cad+180-bca-abc;
    const elevation=deg(Math.asin(60*Math.sin(rad(bad))*Math.sin(rad(65))/80));
    return Math.abs(ac-30*Math.sqrt(7))<1e-9 && Math.abs(bad-94.2797)<.001 && elevation<50 && p1.questions[16].answer==="是";
  })()],
  [1,18, (()=>{
    const g=n=>5*4**(n-1),t=n=>Math.log2(5)+2*(n-1),sum=k=>k*(Math.log2(5)+k-1);
    return g(2)===20 && g(5)===1280 && [1,3,10].every(n=>Math.abs(t(n+1)-t(n)-2)<1e-12) &&
      sum(315)<100000 && sum(316)>100000 && p1.questions[17].answer==="315";
  })()],
  [1,19, (()=>{
    const close=(a,b)=>Math.abs(a-b)<1e-8,d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(p1.questions[18].answer!=="有可能；k=2" || !p1.questions[18].prompt.includes("利用配方法")) return false;
    return [.25,1,2,3].every(k=>{
      const a=[2+30*k,7+40*k],b=[2-30*k,7-40*k],c=[2+96*k,7-72*k],m=[2,7];
      const i=[2+80*k/3,7-20*k],j=[2+119*k/3,7-119*k/4],pointD=[6-45*k,6-119*k/4];
      const h=x=>-x*x+(4+60*k)*x-900*k*k-80*k+3;
      const area=6000*k*k,semi=180*k;
      const weightedI=a.map((value,index)=>(d(b,c)*value+d(a,c)*b[index]+d(a,b)*c[index])/(2*semi));
      const diagonalX=close(b[0]+i[0],pointD[0]+j[0]),diagonalY=close(b[1]+i[1],pointD[1]+j[1]);
      return close(h(a[0]),a[1]) && close(14-h(4-b[0]),b[1]) &&
        close(d(a,m),50*k) && close(d(c,m),120*k) && close(d(a,c),130*k) &&
        close(d(i,m),area/semi) && weightedI.every((value,index)=>close(value,i[index])) &&
        close(d(j,a),d(j,b)) && close(d(j,a),d(j,c)) && close(d(i,j),65*k/4) &&
        diagonalX===close(k,2) && diagonalY===close(k,2) &&
        !close((j[0]-i[0])*(b[1]-i[1])-(j[1]-i[1])*(b[0]-i[0]),0);
    });
  })()],
  ...require("./verify-paper2.cjs")(p2)
];
for (const [paper,n,valid] of checks) assert.ok(valid, `卷${paper} 第${n}題獨立算式`);
console.log(`題目結構、答案鍵及 ${checks.length} 項獨立算式核對通過：卷一 ${p1.questions.length} 題、卷二 ${p2.questions.length} 題。卷一評分參考配分為35+35+35=105。`);
