const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

// Source question pages and the full English scheme were inspected as images.
const sourcePages=[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,20,22];
const schemePages=[3,3,3,3,4,4,4,5,5,6,6,7,8,9,10,10,11,12,13];
const sourceMarks=[3,3,3,3,4,4,5,5,5,6,6,6,8,9,5,5,6,7,12];
const groups=[null,{a:1,b:2},{a:1,b:1,c:1},null,null,{a:3,b:1},{a:3,b:2},{a:3,b:2},{a:3,b:2},
  {a:4,b:2},{a:4,b:2},{a:3,b:3},{a:3,b:5},{a:3,b:6},{a:3,b:2},{a:2,b:3},{a:2,b:4},{a:2,b:5},{a:3,b:2,c:7}];
const sum=xs=>xs.reduce((s,x)=>s+x,0),rad=Math.PI/180;
const near=(a,b,label="numeric equality",tol=1e-9)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(a,b)=>{const d=gcd(a,b);return b/d===1?String(a/d):`${a/d}/${b/d}`;};
const smallFraction=x=>{for(let d=1;d<=10000;d++)if(Math.abs(x*d-Math.round(x*d))<1e-9)return frac(Math.round(x*d),d);throw Error("No small rational found");};
const sup=n=>String(n).replace(/[0-9-]/g,c=>c==="-"?"⁻":"⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]);
const unsup=s=>Number([...s].map(c=>c==="⁻"?"-":"⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join(""));
const median=xs=>{const a=[...xs].sort((x,y)=>x-y),m=a.length/2;return a.length%2?a[Math.floor(m)]:(a[m-1]+a[m])/2;};
const mode=xs=>{const f=new Map();xs.forEach(x=>f.set(x,(f.get(x)||0)+1));const max=Math.max(...f.values());return [...f].filter(([,n])=>n===max).map(([x])=>x);};
const choose=(n,k)=>{let p=1;for(let i=1;i<=k;i++)p=p*(n-i+1)/i;return p;};
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dist=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(dist(a,b)*dist(c,b)))))/rad;
const triangleArea=(a,b,c)=>Math.hypot(...cross3(sub(b,a),sub(c,a)))/2;

// Small formal polynomial ring in x and k. Identities are coefficient checks,
// not a finite set of samples, and the parser reads the delivered expressions.
const con=n=>n?{"0,0":n}:{},X={"1,0":1},K={"0,1":1};
const add=(...ps)=>{const r={};for(const p of ps)for(const [key,c] of Object.entries(p))r[key]=(r[key]||0)+c;return Object.fromEntries(Object.entries(r).filter(([,v])=>v!==0));};
const scale=(p,c)=>add(Object.fromEntries(Object.entries(p).map(([key,v])=>[key,v*c])));
const mul=(p,q)=>{const r={};for(const [a,ca] of Object.entries(p))for(const [b,cb] of Object.entries(q)){const aa=a.split(",").map(Number),bb=b.split(",").map(Number),key=`${aa[0]+bb[0]},${aa[1]+bb[1]}`;r[key]=(r[key]||0)+ca*cb;}return add(r);};
const pow=(p,n)=>{assert(Number.isInteger(n)&&n>=0);let r=con(1);for(let i=0;i<n;i++)r=mul(r,p);return r;};
const eq=(p,q,label)=>assert.deepEqual(add(p,scale(q,-1)),{},label);
const ev=(p,x,k=0)=>sum(Object.entries(p).map(([key,c])=>{const [a,b]=key.split(",").map(Number);return c*x**a*k**b;}));
const substituteX=(p,q)=>add(...Object.entries(p).map(([key,c])=>{const [a,b]=key.split(",").map(Number);return scale(mul(pow(q,a),pow(K,b)),c);}));
function polynomial(source) {
  const normalized=source.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>`^${unsup(s)}`).replaceAll("×","*").replaceAll("−","-").replace(/\s/g,"");
  const tokens=normalized.match(/\d+(?:\.\d+)?|[xk()+\-*/^]/g)||[];
  assert.equal(tokens.join(""),normalized,`unsupported polynomial ${source}`);
  let i=0;
  function atom(){let p,t=tokens[i++];if(t==="("){p=expression();assert.equal(tokens[i++],")");}else if(t==="x")p=X;else if(t==="k")p=K;else {assert(/^\d/.test(t),source);p=con(Number(t));}if(tokens[i]==="^"){i++;p=pow(p,Number(tokens[i++]));}return p;}
  function unary(){if(tokens[i]==="+"){i++;return unary();}if(tokens[i]==="-"){i++;return scale(unary(),-1);}return atom();}
  function product(){let p=unary();while(i<tokens.length){const t=tokens[i];if(t==="*"||t==="/"){i++;const q=unary();if(t==="*")p=mul(p,q);else {assert(Object.keys(q).length===1&&q["0,0"]!==undefined);p=scale(p,1/q["0,0"]);}}else if(t==="("||t==="x"||t==="k"||/^\d/.test(t))p=mul(p,unary());else break;}return p;}
  function expression(){let p=product();while(tokens[i]==="+"||tokens[i]==="-"){const sign=tokens[i++]==="+"?1:-1;p=add(p,scale(product(),sign));}return p;}
  const p=expression();assert.equal(i,tokens.length,source);return p;
}
function load(){const context={window:{}};for(const file of ["paper1/data-2020.js","paper1/diagrams-2020.js","paper1/math.js"])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),"utf8"),context,{filename:file,timeout:1000});return context.window;}
const textLeaves=v=>typeof v==="string"?[v]:v&&typeof v==="object"?Object.values(v).flatMap(textLeaves):[];

function verifySvgGeometry(svg,n,result) {
  const polylines=[...svg.matchAll(/<path d="([^"]+)"/g)].map(([,d])=>{
    if(!/^M[-\d. eE+]+(?:L[-\d. eE+]+)+$/.test(d))return null;
    return d.slice(1).split("L").map(pair=>{
      const point=pair.trim().split(/\s+/).map(Number);
      assert.equal(point.length,2);assert(point.every(Number.isFinite));return point;
    });
  });
  const pointNear=(actual,expected,label)=>{assert.equal(actual.length,expected.length);actual.forEach((x,i)=>near(x,expected[i],label));};
  if(n===8) {
    const [outer,inner,diagonal]=polylines;
    assert.deepEqual([outer.length,inner.length,diagonal.length],[4,3,2]);
    const [N,L,J,N2]=outer,[K,M,L2]=inner,[N3,K2]=diagonal;
    pointNear(N,N2,"Q8 closed outline");pointNear(L,L2,"Q8 joined L");pointNear(N,N3,"Q8 joined N");pointNear(K,K2,"Q8 joined K");
    near(cross(sub(K,J),sub(L,J)),0,"Q8 K on JL");
    near(cross(sub(M,J),sub(N,J)),0,"Q8 M on JN");
    near(cross(sub(K,M),sub(L,N)),0,"Q8 KM parallel LN");
    const recover=([x,y])=>[(x-35)/32,(235-y)/42];
    for(const [name,point] of Object.entries({J,K,L,M,N}))pointNear(recover(point),result[name],`Q8 ${name} delivered coordinates`);
    near(dist(recover(J),recover(K)),dist(recover(K),recover(N)),"Q8 equal legs");
    near(angle(recover(L),recover(J),recover(N)),angle(result.L,result.J,result.N),"Q8 given angle at J");
  }
  if(n===18) {
    const circle=svg.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/);assert(circle);
    const [cx,cy,radius]=circle.slice(1).map(Number),O=[cx,cy],[[J,L,T,J2],[J3,K]]=polylines;
    pointNear(J,J2,"Q18 closed outline");pointNear(J,J3,"Q18 joined J");
    for(const point of [J,K,L])near(dist(point,O),radius,"Q18 delivered points on circle");
    near(cross(sub(K,T),sub(L,T)),0,"Q18 T,K,L collinear");
    near(dot(sub(J,O),sub(T,J)),0,"Q18 delivered tangent");
    pointNear(K.map((x,i)=>(x+L[i])/2),O,"Q18 KL is diameter");
    near(dist(T,J)/dist(T,K),dist(result.T,result.J)/dist(result.T,result.K),"Q18 actual given lengths ratio");
    near(dist(J,K)/dist(J,L),result.legs[0]/result.legs[1],"Q18 actual right-triangle legs");
  }
  if(n===19) {
    const points=svg.match(/<polygon points="([^"]+)"/);assert(points);
    const polygon=points[1].split(" ").map(pair=>pair.split(",").map(Number));
    assert.equal(polygon.length,4);assert.equal(polylines[1].length,5);
    const projection=([x,y,z])=>[50+2.6*x+.9*y,270+.25*x-.6*y-5*z];
    ["A","B","C","D"].forEach((name,i)=>{
      pointNear(polygon[i],projection(result[name]),`Q19 ${name} independent 3D projection`);
      pointNear(polylines[1][i],polygon[i],`Q19 ${name} fill matches outline`);
    });
    pointNear(polylines[1][4],polygon[0],"Q19 closed outline");
    const ground=[[-8,-20,0],[110,-20,0],[110,38,0],[-8,38,0],[-8,-20,0]].map(projection);
    assert.equal(polylines[0].length,ground.length);
    ground.forEach((p,i)=>pointNear(polylines[0][i],p,"Q19 ground plane at zero height"));
  }
}

function verify(data,window=null) {
  const records=[],workLinks=new Map();
  const q=n=>data.questions[n-1],match=(n,re)=>{const m=q(n).prompt.match(re);assert(m,`Q${n}: missing source input ${re}`);return m;};
  const work=(n,...parts)=>{const text=q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join("\n");for(const p of parts)assert(text.includes(p),`Q${n}: missing independently calculated step ${p}`);workLinks.set(n,[...(workLinks.get(n)||[]),...parts]);};
  const answer=(n,expected,results)=>{assert.equal(q(n).answer,expected,`Q${n}: independent answer`);records.push({n,sourcePage:sourcePages[n-1],schemePage:schemePages[n-1],marks:q(n).marks,answer:expected,results});};
  assert.equal(data.year,2020);assert.equal(data.paper,1);assert.equal(data.minutes,135);assert.equal(data.questions.length,19);
  for(const [i,item] of data.questions.entries()) {
    assert.equal(item.n,i+1);assert.equal(item.sourceNo,i+1);assert.equal(item.marks,sourceMarks[i]);
    assert.equal(item.section,i<9?"甲一":i<14?"甲二":"乙部");
    assert(item.topic&&item.prompt&&item.answer&&item.hints.length&&item.hints.every(s=>s.trim()));
    const all=textLeaves(item).join("\n");
    assert.doesNotMatch(all,/填空|找錯|改錯|[橫縱横纵]|恆等於|½|÷|角邊角|邊角邊|角角邊|斜邊直角邊|（等角）|待補|TODO/);
    assert.doesNotMatch(item.prompt,/寫出/);
    const allocated={},totals=[];
    for(const p of item.solution)for(const s of p.steps) {
      assert.match(s.marks,/^[1-9]\d*[MA]$/);assert(Array.isArray(s.text)&&s.text.length);
      s.text.forEach(t=>{assert(typeof t==="string"&&t.trim());assert.doesNotMatch(t,/(?:^|[。；\n])\s*[=≈]/);});
      const mark=parseInt(s.marks,10),part=p.part.match(/^\(([a-z])\)/)?.[1];totals.push(mark);
      if(part)allocated[part]=(allocated[part]||0)+mark;
    }
    assert.equal(sum(totals),item.marks,`Q${i+1} total`);
    if(groups[i]){assert.deepEqual(item.markGroups,groups[i]);assert.deepEqual(allocated,groups[i]);}
    else assert.equal(item.markGroups,undefined);
  }
  assert.deepEqual(["甲一","甲二","乙部"].map(s=>sum(data.questions.filter(q=>q.section===s).map(q=>q.marks))),[35,35,35]);
  assert(!data.questions.some(q=>/極[坐座]標|polar/i.test(q.topic+q.prompt)),"2020 Paper 1 has no polar-coordinate item");

  {
    const m=match(1,/\(x([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)y([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)\)([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)\/x([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
    const [a,b,p,c]=m.slice(1).map(unsup),ex=a*p-c,ey=b*p;assert(ex>0&&ey<0);
    for(const x of [-2,-.5,.5,2])for(const y of [-3,-.5,.5,3])near((x**a*y**b)**p/x**c,x**ex/y**(-ey));
    work(1,`x${sup(a*p)}y${sup(b*p)}`,`x${sup(ex)}/y${sup(-ey)}`);
    answer(1,`x${sup(ex)}/y${sup(-ey)}`,{inputExponents:[a,b,p,c],resultExponents:[ex,ey]});
  }
  {
    const p=polynomial(match(2,/\(a\) ([^；]+)/)[1]),q2=polynomial(match(2,/\(b\) ([^。]+)/)[1]);
    const factors=q(2).answer.split("；");assert.equal(factors.length,2);
    eq(polynomial(factors[0]),p,"Q2a exact expansion");eq(polynomial(factors[1]),q2,"Q2b exact expansion");
    eq(q2,mul(pow(X,2),p),"Q2 dependency");
    const roots=[];for(let x=-30;x<=30;x++)if(ev(p,x)===0)roots.push(x);assert.equal(roots.length,2);
    const factor=x=>x<0?`(x+${-x})`:`(x-${x})`,expected=factor(roots[1])+factor(roots[0]);
    work(2,expected,`x²${expected}`);answer(2,`${expected}；x²${expected}`,{roots,expanded:p});
  }
  {
    const value=Number(match(3,/數值 (\d+\.\d+)/)[1]);
    const ceil=100*Math.ceil(value/100),floor=Math.floor(value*100)/100,unit=10**(Math.floor(Math.log10(value))-1),rounded=Math.round(value/unit)*unit;
    work(3,String(ceil),floor.toFixed(2),String(rounded));answer(3,`${ceil}；${floor.toFixed(2)}；${rounded}`,{value,ceilHundreds:ceil,floorTwoDecimals:floor,twoSignificantFigures:rounded});
  }
  {
    const m=match(4,/a\/b=(\d+)\/(\d+) 及 (\d+)a=(\d+)c/),[a,b,left,right]=m.slice(1).map(Number),c=a*left/right;
    const z=match(4,/計算 \(b\+(\d+)c\)\/\((\d+)a\+b\)/),[u,v]=z.slice(1).map(Number),num=b+u*c,den=v*a+b;
    near(a/b,Number(m[1])/Number(m[2]));near(left*a,right*c);assert(den!==0);
    work(4,`a:b:c=${a}:${b}:${c}`,`${num}t/(${den}t)=${frac(num,den)}`);answer(4,frac(num,den),{ratio:[a,b,c],numerator:num,denominator:den});
  }
  {
    const pct=Number(match(5,/多 (\d+)%/)[1]),difference=Number(match(5,/相差 (\d+)/)[1]),afternoon=difference*100/pct,morning=afternoon+difference;
    assert(Number.isInteger(afternoon)&&Number.isInteger(morning));near((morning-afternoon)/afternoon,pct/100);
    work(5,`x=${difference}/${pct/100}=${afternoon}`,`${morning} 人`);answer(5,`${morning}人`,{afternoon,morning,difference,percent:pct});
  }
  {
    const clauses=match(6,/條件 (.+) 或 (.+)。/).slice(1),ps=clauses.map(s=>{const [l,r]=s.split(">");return add(polynomial(l),scale(polynomial(r),-1));});
    const bounds=ps.map(p=>-((p["0,0"]||0)/p["1,0"]));near(bounds[0],bounds[1]);assert(ps[0]["1,0"]<0&&ps[1]["1,0"]>0);
    const satisfies=x=>ps.some(p=>ev(p,x)>1e-10);let largest=-1;while(!satisfies(largest))largest--;assert(largest>-20);
    for(const x of [-10,-2,-1,0,.5,5,...bounds])assert.equal(satisfies(x),Math.abs(x-bounds[0])>1e-10);
    const bound=smallFraction(bounds[0]);
    work(6,`x<${bound}`,`x>${bound}`,`x≠${bound}`,`最大負整數為 ${largest}`);
    answer(6,`x≠${bound}；${largest}`,{bound:bounds[0],largestNegativeInteger:largest});
  }
  {
    const base=polynomial(match(7,/h\(x\)=([^，]+)/)[1].replace("+c","")),a=base["2,0"],b=base["1,0"],c=b*b/(4*a);
    const shift=Number(match(7,/y=h\(x\)-(\d+)/)[1]),delta=b*b-4*a*(c-shift),roots=[(-b-Math.sqrt(delta))/(2*a),(-b+Math.sqrt(delta))/(2*a)];
    near(b*b-4*a*c,0);roots.forEach(x=>near(ev(base,x)+c-shift,0));assert(roots[0]!==roots[1]);
    const workedFactor=q(7).solution[1].steps[0].text.at(-1).split("=").at(-1).replace("。","");
    eq(polynomial(workedFactor),add(base,con(c-shift)),"Q7 actual factored intercept equation");
    work(7,`c=${b*b}/${4*a}=${c}`,`x=${roots[1]} 或 x=${roots[0]}`);
    answer(7,`c=${c}；${roots[0]}及${roots[1]}`,{coefficients:[a,b,c],shift,roots});
  }
  {
    const alpha=Number(match(8,/∠LJN=(\d+)°/)[1]),beta=Number(match(8,/∠JMK=(\d+)°/)[1]),a=Math.tan(alpha*rad),b=Math.tan(beta*rad);
    assert.equal(q(8).diagram.alpha,alpha);assert.equal(q(8).diagram.beta,beta);
    const J=[10,0],N=[0,0],K=[5,5*a],L=[10*a/(a+b),10*a*b/(a+b)],M=[5-5*a/b,0];
    const slope=L[1]/(L[0]-M[0]),px=slope*M[0]/(slope-a),P=[px,a*px],first=beta-alpha,theta=angle(K,M,L);
    near(dist(J,K),dist(K,N));near(cross(sub(K,M),sub(L,N)),0);near(cross(sub(P,K),sub(N,K)),0);near(cross(sub(P,L),sub(M,L)),0);
    near(angle(L,J,N),alpha);near(angle(J,M,K),beta);near(angle(K,N,L),first);near(angle(L,P,N),180-first-theta);
    work(8,`${beta}°-${alpha}°=${first}°`,`180°-${first}°-θ=${180-first}°-θ`);
    answer(8,`${first}°；${180-first}°-θ`,{J,K,L,M,N,P,theta,angleLPN:angle(L,P,N)});
  }
  {
    const values=q(9).diagram.rows[0].slice(1).map(Number),frequencies=q(9).diagram.rows[1].slice(1).map(Number);
    assert(values.length===frequencies.length&&frequencies.every(Number.isInteger));
    const xs=values.flatMap((x,i)=>Array(frequencies[i]).fill(x)),n=xs.length,sx=sum(xs),sx2=sum(xs.map(x=>x*x)),mean=sx/n,med=median(xs),sd=Math.sqrt(sum(xs.map(x=>(x-mean)**2))/n);
    const newValue=Number(match(9,/整理了 (\d+) 箱/)[1]),newMedian=median([...xs,newValue]),change=med-newMedian;assert(change>0);
    work(9,`Σfx=${values.map((v,i)=>`${v}×${frequencies[i]}`).join("+")}=${sx}`,`Σfx²=${values.map((v,i)=>`${v}²×${frequencies[i]}`).join("+")}=${sx2}`,`σ=√[${sx2}/${n}-(${sx}/${n})²]`,`減幅=${smallFraction(med)}-${newMedian}=${smallFraction(change)}`);
    answer(9,`${frac(sx,n)}；${smallFraction(med)}；${sd.toPrecision(3)}箱；減少${smallFraction(change)}箱`,{values,frequencies,n,sx,sx2,mean,median:med,populationSd:sd,newMedian});
  }
  {
    const [h1,h2,e1,e2]=match(10,/高度為 (\d+) cm 及 (\d+) cm 的產品，每次耗能分別為 (\d+) 焦耳 及 (\d+) 焦耳/).slice(1).map(Number);
    const target=Number(match(10,/\(a\) 加工一件高度為 (\d+) cm/)[1]),larger=Number(match(10,/\(b\) 加工一件高度為 (\d+) cm/)[1]);
    assert.match(q(10).prompt,/E 由啟動時的固定耗能及隨 h³ 正變的加工耗能/);
    assert(q(10).prompt.includes(`分兩次啟動機器、每次加工一件高度為 ${target} cm`));
    assert.doesNotMatch(textLeaves(q(10)).join("\n"),/木製模型|費用|售價|\$|\bJ\b/);
    const b=(e2-e1)/(h2**3-h1**3),a=e1-b*h1**3,energy=h=>a+b*h**3;
    near(energy(h1),e1);near(energy(h2),e2);assert(a>0&&b>0);
    work(10,`a+${h1**3}b=${e1}`,`a+${h2**3}b=${e2}`,`b=${b}`,`E=${a}+${b}h³`,`${a}+${b}×${target}³=${a}+${b*target**3}=${energy(target)}`,`總耗能=2×${energy(target)}=${2*energy(target)} 焦耳`,`${energy(larger)}<${2*energy(target)}`);
    answer(10,`${energy(target)} 焦耳；${energy(larger)>2*energy(target)?"是":"否"}`,{fixed:a,cubic:b,targetEnergy:energy(target),largerEnergy:energy(larger),twoSmall:2*energy(target)});
  }
  {
    const rows=q(11).diagram.rows;assert.equal(rows.flatMap(r=>r.leaves).filter(x=>x==="d").length,1);
    const dataAt=d=>rows.flatMap(({stem,leaves})=>leaves.map(l=>10*stem+(l==="d"?d:Number(l)))).sort((a,b)=>a-b);
    const multiplier=Number(match(11,/間距的 (\d+) 倍/)[1]);
    const accepted=[];
    for(let d=0;d<10;d++){const xs=dataAt(d),mid=xs.length/2,q1=median(xs.slice(0,mid)),q3=median(xs.slice(mid));if(xs.at(-1)-xs[0]===multiplier*(q3-q1))accepted.push(d);}
    assert.equal(accepted.length,1,"Q11 unique digit");
    const d=accepted[0],xs=dataAt(d),n=xs.length,q1=median(xs.slice(0,n/2)),q3=median(xs.slice(n/2)),modes=mode(xs);assert.equal(modes.length,1);
    assert.equal(Number(match(11,/顯示 (\d+) 宗任務/)[1]),n);
    assert.match(q(11).prompt,/單位為分鐘/);assert.match(q(11).prompt,/每宗被選中的機會相同/);
    assert.doesNotMatch(textLeaves(q(11)).join("\n"),/樣本片|質量|重量|\b(?:g|kg)\b/);
    const fav=xs.filter(x=>x>=modes[0]),probability=frac(fav.length,n);
    work(11,`Q₁=${q1} 分鐘，Q₃=${q3} 分鐘`,`四分位數間距=${q3}-${q1}=${q3-q1} 分鐘`,`d=${multiplier*(q3-q1)}-${dataAt(0).at(-1)-xs[0]}=${d}`,`眾數為 ${modes[0]} 分鐘`,fav.join("、"),`概率為 ${probability}`);
    answer(11,`d=${d}；${probability}`,{digitCandidates:accepted,values:xs,q1,q3,range:xs.at(-1)-xs[0],mode:modes[0],favourable:fav});
  }
  {
    const [h,r]=match(12,/高為 (\d+) cm，底半徑為 (\d+) cm/).slice(1).map(Number),lower=2*r/3,upper=r/3,depth=h/3;
    // Independently use the frustum formulas rather than subtracting cones.
    const volume=depth*(lower*lower+lower*upper+upper*upper)/3;
    const frustumSlant=Math.hypot(depth,lower-upper),surface=(lower+upper)*frustumSlant,slant=Math.hypot(h,r);
    near(volume,r*r*h/3*((2/3)**3-(1/3)**3));near(surface,r*slant*((2/3)**2-(1/3)**2));
    work(12,`${r}×${h/3}/${h}=${upper} cm`,`${r}×${2*h/3}/${h}=${lower} cm`,`√(${h}²+${r}²)=√${h*h+r*r}=${slant} cm`,`${volume}π cm³`,`${surface}π cm²`);
    answer(12,`${volume}π cm³；${surface}π cm²`,{height:h,radius:r,frustumHeight:depth,radii:[upper,lower],slant,volumePi:volume,surfacePi:surface});
  }
  {
    const root=Number(match(13,/含因式 x-(\d+)/)[1]),divisorConstant=Number(match(13,/除以 x²-(\d+)/)[1]),remainderConstant=Number(match(13,/kx\+(\d+)/)[1]);
    const otherRoot=-Number(match(13,/x\+(\d+) 也是/)[1]),atZero=Number(match(13,/餘數為 (\d+)/)[1]);
    assert.equal(root*root,divisorConstant);assert(otherRoot!==root&&otherRoot!==-root);
    const k=-remainderConstant/root,B=atZero/(root*otherRoot),u=-root;
    const remainderAtU=k*u+remainderConstant,A=((remainderAtU/((u-root)*(u-otherRoot)))-B)/u;
    assert(A!==0);const third=-B/A,roots=[root,otherRoot,third],p=mul(mul(add(X,con(-root)),add(X,con(-otherRoot))),add(scale(X,A),con(B)));
    roots.forEach(x=>near(ev(p,x),0));near(ev(p,0),atZero);near(ev(p,u),remainderAtU);
    const divisor=add(pow(X,2),con(-divisorConstant)),quotient=add(scale(X,p["3,0"]),con(p["2,0"]));
    eq(p,add(mul(divisor,quotient),scale(X,k),con(remainderConstant)),"Q13 exact quotient/remainder identity");
    const actual=q(13).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).find(t=>t.startsWith("g(x)≡(x-"));assert(actual);
    eq(polynomial(actual.split("≡").at(-1).replace("。","")),p,"Q13 actual worked factorization");
    work(13,`k=-${remainderConstant}/${root}=${k}`,`b=${B}`,`a=${A}`,`g(-2)=((-2)²-${divisorConstant})q(-2)${k}×(-2)+${remainderConstant}=${remainderAtU}`);
    answer(13,`k=${k}；${roots.every(Number.isInteger)?"是":"否"}，根為${roots[0]}、${roots[1]}及${roots[2]}`,{k,coefficients:p,linearFactor:[A,B],roots,quotient});
  }
  {
    const [ux,uy,vx,vy]=match(14,/分別為 \((-?\d+),(-?\d+)\) 及 \((-?\d+),(-?\d+)\)/).slice(1).map(Number),ny=Number(match(14,/y 坐標為 (-?\d+)/)[1]);assert.equal(uy,vy);
    const U=[ux,uy],V=[vx,vy],N=[(ux+vx)/2,ny],radius2=dist(U,N)**2,dx=V[0]-N[0],dy=V[1]-N[1],direction=[dx,dy];
    const t=2*dot(sub(N,U),direction)/dot(direction,direction),H=U.map((x,i)=>x+t*direction[i]);assert(t>0);
    near(dist(U,N),dist(V,N));near(dist(H,N)**2,radius2);near(cross(sub(H,U),sub(V,N)),0);
    // Reflect the line through V,N in the parallel locus to get the second line.
    const lineConstant=-dy*vx+dx*vy,locusConstant=-dy*ux+dx*uy,otherConstant=2*locusConstant-lineConstant;
    for(const s of [-2,0,.5,4]){const P=U.map((x,i)=>x+s*direction[i]);near(Math.abs(dy*P[0]-dx*P[1]+lineConstant),Math.abs(dy*P[0]-dx*P[1]+otherConstant));}
    const measured=angle(N,U,H),alpha=angle(U,V,N),threshold=Number(match(14,/小於 (\d+)°/)[1]);near(measured,2*alpha);
    const r2=Math.round(radius2),equation=`(x-${N[0]})²+(y+${-ny})²=${r2}`,line=`${dy}x-${dx}y+${locusConstant}=0`;
    work(14,`N(${N[0]},${ny})`,`半徑²=NU²=(${ux}-${N[0]})²+(${uy}+${-ny})²=${dx*dx}+${dy*dy}=${r2}`,line,`≈${alpha.toFixed(6)}°`,`≈${measured.toFixed(6)}°>${threshold}°`);
    answer(14,`${equation}；平行；${line}；${measured<threshold?"是":"否"}，約${measured.toPrecision(3)}°`,{U,V,N,H,radius2:r2,locus:[dy,-dx,locusConstant],otherLine:[dy,-dx,otherConstant],angle:measured});
  }
  {
    const counts=match(15,/翻譯組有 (\d+) 人、設計組有 (\d+) 人及攝影組有 (\d+) 人/).slice(1).map(Number),draw=Number(match(15,/隨機選出 (\d+) 人/)[1]),n=sum(counts),specialties=counts.flatMap((c,i)=>Array(c).fill(i));
    assert.match(q(15).prompt,/各人只屬其中一組/);assert.match(q(15).prompt,/每個四人組合被選中的機會相同/);
    assert.doesNotMatch(textLeaves(q(15)).join("\n"),/圓牌|同色|顏色|紅色|白色|黑色/);
    let all=0,sameSpecialty=0,mixed=0;
    const enumerate=(start,picked)=>{if(picked.length===draw){all++;if(new Set(picked.map(i=>specialties[i])).size===1)sameSpecialty++;else mixed++;return;}for(let i=start;i<=n-(draw-picked.length);i++)enumerate(i+1,[...picked,i]);};enumerate(0,[]);
    assert.equal(all,choose(n,draw));assert.equal(sameSpecialty,sum(counts.filter(c=>c>=draw).map(c=>choose(c,draw))));assert.equal(sameSpecialty+mixed,all);
    work(15,`C(${n},${draw})`,String(all),`=${sameSpecialty}`,`${sameSpecialty}/${all}=${frac(sameSpecialty,all)}`,`1-${frac(sameSpecialty,all)}`,frac(mixed,all));
    answer(15,`${frac(sameSpecialty,all)}；${frac(mixed,all)}`,{counts,draw,totalSubsets:all,sameSpecialty,mixed});
  }
  {
    const [j,l,aJ,aL]=match(16,/第 (\d+) 項及第 (\d+) 項分別為 (\d+) 及 (\d+)/).slice(1).map(Number),gap=l-j;
    const [coefficient,exponent]=match(16,/大於 (\d+)×10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/).slice(1),limit=Number(coefficient)*10**unsup(exponent);
    const div=gcd(aJ,aL),num=Math.round((aL/div)**(1/gap)),den=Math.round((aJ/div)**(1/gap));assert.equal(num**gap,aL/div);assert.equal(den**gap,aJ/div);
    const r=num/den,a=aJ/r**(j-1),factor=a/(r-1),bound=Math.log(limit/factor+1)/Math.log(r),n=Math.floor(bound)+1;assert(r>1&&Number.isInteger(a));
    near(a*r**(l-1),aL);
    const exactLimit=BigInt(coefficient)*10n**BigInt(unsup(exponent));
    const exactComparison=m=>{let numerator=0n;const nn=BigInt(num),dd=BigInt(den);for(let i=0;i<m;i++)numerator+=BigInt(a)*nn**BigInt(i)*dd**BigInt(m-1-i);return numerator-exactLimit*dd**BigInt(m-1);};
    assert(exactComparison(n-1)<0n);assert(exactComparison(n)>0n);
    work(16,`r³=${aL}/${aJ}=${frac(aL,aJ)}`,`r=${num}/${den}`,`a=${aJ}/(${num}/${den})²=${aJ}×${den*den}/${num*num}=${a}`,`n>${bound.toFixed(6)}`,`最小 n 為 ${n}`,`S${sup(n-1).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>"₀₁₂₃₄₅₆₇₈₉"["⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)])}`);
    answer(16,`${a}；${n}`,{termIndices:[j,l],terms:[aJ,aL],ratio:[num,den],first:a,realBound:bound,minimumN:n,previousSum:factor*(r**(n-1)-1),nextSum:factor*(r**n-1),exactNeighbourComparisons:true});
  }
  {
    const p=polynomial(match(17,/r\(x\)=([^，]+)/)[1]),linearInX=Object.fromEntries(Object.entries(p).filter(([s])=>s.startsWith("1,")).map(([s,c])=>[`0,${s.split(",")[1]}`,c]));
    const vx=scale(linearInX,-1/(2*p["2,0"])),vy=substituteX(p,vx),shift=Number(match(17,/y=r\(x\+(\d+)\)/)[1]),cy=Number(match(17,/外心為 \(0,(-?\d+)\)/)[1]);
    assert.equal(Number(match(17,/y=-r\(x-(\d+)\)/)[1]),shift);
    const D=[add(vx,con(-shift)),vy],E=[add(vx,con(shift)),scale(vy,-1)];
    const cd2=add(pow(D[0],2),pow(add(D[1],con(-cy)),2)),ce2=add(pow(E[0],2),pow(add(E[1],con(-cy)),2)),difference=add(ce2,scale(cd2,-1));
    const a=difference["0,2"],b=difference["0,1"],c=difference["0,0"],disc=b*b-4*a*c;assert(a>0&&disc<0);
    eq(p,add(pow(add(X,scale(vx,-1)),2),vy),"Q17 completing the square identity");
    const actual=q(17).solution.flatMap(p=>p.steps.flatMap(s=>s.text));
    eq(polynomial(actual.find(t=>t.startsWith("CD²=k")).slice(4,-1)),cd2,"Q17 delivered CD squared");
    eq(polynomial(actual.find(t=>t.startsWith("CE²=k")).slice(4,-1)),ce2,"Q17 delivered CE squared");
    const g=gcd(gcd(a,b),c),normalizedDisc=(b/g)**2-4*(a/g)*(c/g);
    work(17,`D(2k-${shift},k²+6)`,`E(2k+${shift},-k²-6)`,`${a}k²+${b}k+${c}=0`,`=${normalizedDisc}<0`,`不存在符合條件的 F`);
    answer(17,`(2k,k²+6)；不存在`,{vertex:[vx,vy],D,E,cd2,ce2,difference,discriminant:disc,normalizedDiscriminant:normalizedDisc});
  }
  {
    const tangent=Number(match(18,/TJ=(\d+) cm/)[1]),nearDistance=Number(match(18,/TK=(\d+) cm/)[1]),threshold=Number(match(18,/超過 (\d+) 米/)[1]);
    assert.doesNotMatch(textLeaves(q(18)).join("\n"),/\bm\b/,"Q18 uses 米 for metre units; cm and point J are retained");
    assert.equal(q(18).diagram.tangent,tangent);assert.equal(q(18).diagram.near,nearDistance);
    const far=tangent*tangent/nearDistance,diameter=far-nearDistance,radius=diameter/2,center=[0,radius],J=[0,0],T=[tangent,0],centerDistance=dist(T,center);
    assert(diameter>0);near(centerDistance-radius,nearDistance);near(centerDistance+radius,far);
    const direction=sub(center,T).map(x=>x/centerDistance),K=T.map((x,i)=>x+nearDistance*direction[i]),L=T.map((x,i)=>x+far*direction[i]);
    for(const p of [J,K,L])near(dist(p,center),radius);near(dot(sub(center,J),sub(T,J)),0,"Q18 tangent perpendicular to radius");
    near(angle(T,J,K),angle(T,L,J));near(angle(J,T,K),angle(L,T,J));near(angle(K,J,L),90);
    const jk=dist(J,K),jl=dist(J,L),perimeter=(jk+jl+diameter)/100;near(jk/jl,nearDistance/tangent);
    const d=gcd(nearDistance,tangent),legRatio=[nearDistance/d,tangent/d],hyp=Math.hypot(...legRatio);assert(Number.isInteger(hyp));
    work(18,"∠TJK=∠JLK=∠TLJ","∠JTK=∠LTJ","△JTK∼△LTJ（AA）",`${tangent}²/${nearDistance}=${far}`,`KL=${diameter} cm`,`JK=${legRatio[0]}×${diameter/hyp}=${Math.round(jk)} cm`,`JL=${legRatio[1]}×${diameter/hyp}=${Math.round(jl)} cm`,`${perimeter.toFixed(2)} 米>${threshold} 米`);
    answer(18,`AA；${diameter}π cm；${perimeter>threshold?"是":"否"}，${perimeter.toFixed(2)} 米`,{J,K,L,T,center,radius,diameter,legs:[jk,jl],perimeterMetres:perimeter});
  }
  {
    const [ab,ad,b,c,a]=match(19,/AB=(\d+) 米、AD=(\d+) 米[、，]\s*∠ABC=(\d+)°、∠ACB=(\d+)° 及 ∠BAD=(\d+)°/).slice(1).map(Number),tilt=Number(match(19,/所成的角為 (\d+)°/)[1]),threshold=Number(match(19,/至多為 (\d+)°/)[1]);
    assert(q(19).prompt.includes(`AD=${ad} 米，\n∠ABC`),"Q19 grouped dimensions/angles keep the intentional line break");
    assert.match(q(19).prompt,/共面的測站 A、B、C、D/);assert.match(q(19).prompt,/B、C 位於同一水平基準面上，A、D 位於該基準面上方/);
    assert.doesNotMatch(textLeaves(q(19)).join("\n"),/薄板|紙卡|地面|cm|高程|\bm\b/);
    assert.deepEqual(q(19).diagram,{type:"inclinedCard2020",ab,ad,angleB:b,angleC:c,angleA:a,tilt});
    const A0=[ab*Math.cos(b*rad),ab*Math.sin(b*rad),0],B0=[0,0,0],direction=(180+b+a)*rad;
    const D0=[A0[0]+ad*Math.cos(direction),A0[1]+ad*Math.sin(direction),0];
    // Intersect the ray from A forming the given angle at C with the x axis.
    const C0=[A0[0]+A0[1]/Math.tan(c*rad),0,0],T0=[A0[0]-A0[1]/Math.tan(direction),0,0];
    assert(C0[0]>0&&D0[1]>0&&T0[0]>C0[0]);
    near(angle(A0,B0,C0),b);near(angle(A0,C0,B0),c);near(angle(B0,A0,D0),a);near(dist(A0,D0),ad);
    const rotate=([x,y])=>[x,y*Math.cos(tilt*rad),y*Math.sin(tilt*rad)],A=rotate(A0),B=rotate(B0),C=rotate(C0),D=rotate(D0),T=rotate(T0);
    const ac=dist(A,C),cd=dist(C,D),area=triangleArea(A,B,C)+triangleArea(A,C,D),heightA=A[2],heightD=D[2],lineAngle=Math.asin(heightD/cd)/rad;
    const normal=cross3(sub(A,B),sub(C,B));near(Math.acos(Math.abs(normal[2])/Math.hypot(...normal))/rad,tilt,"Q19 actual dihedral");
    near(dist(A,T),ab);near(dist(D,T),ab-ad);near(heightD/heightA,(ab-ad)/ab);
    const G=[A[0],A[1],0],H=[A[0],0,0],K=[D[0],D[1],0];near(angle(A,H,G),tilt);near(angle(D,C,K),lineAngle);
    near(angle(D,K,T),90);near(angle(A,G,T),90);near(angle(D,T,K),angle(A,T,G));
    near(area,.5*ab*ac*Math.sin((180-b-c)*rad)+.5*ac*ad*Math.sin((a-(180-b-c))*rad));
    work(19,`${ab}sin${b}°/sin${c}°≈${ac.toFixed(6)} 米`,`∠CAD=${a}°-${180-b-c}°=${a-(180-b-c)}°`,`${cd.toFixed(6)} 米`,`${area.toFixed(6)} 平方米`,`${ab}sin${b}°sin${tilt}°`,`${heightA.toFixed(6)} 米`,`DT=${ab}-${ad}=${ab-ad} 米`,`△DKT∼△AGT（AA）`,`${heightD.toFixed(6)} 米`,`${lineAngle.toFixed(6)}°<${threshold}°`);
    answer(19,`${cd.toPrecision(3)} 米；${Number(area.toPrecision(3))} 平方米；${heightA.toPrecision(3)} 米；${lineAngle<=threshold?"是":"否"}，約${lineAngle.toPrecision(3)}°`,{A,B,C,D,T,G,H,K,diagonal:ac,sideCD:cd,area,heightA,heightD,lineAngle,dihedral:tilt});
  }

  let notationStrings=0,solutionSteps=0;
  if(window) {
    const notation=(html,label)=>{
      const visible=html.replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,"").replace(/<[^>]+>/g,"");
      assert.doesNotMatch(visible,/[\/÷√]/,`${label}: unrendered fraction/root`);
      assert.doesNotMatch(html,/<var>(?:cm|kg|mm|mL)<\/var>|<var>c<\/var>\s*<var>m<\/var>/,`${label}: italic unit`);
    };
    for(const item of data.questions) {
      for(const text of textLeaves(item)) {
        const html=window.mathText(text);notation(html,`Q${item.n}`);
        assert.equal((html.match(/<msqrt>/g)||[]).length,(text.match(/√/g)||[]).length);
        if(item.n===10)assert.doesNotMatch(html,/<var>J<\/var>/,"Q10 energy units must not render as an italic variable");
        if([18,19].includes(item.n))assert.doesNotMatch(html,/<var>m<\/var>/,`Q${item.n} metre units must not render as an italic variable`);
        notationStrings++;
      }
      for(const p of item.solution)for(const s of p.steps) {notation(window.solutionHtml(s.text),`Q${item.n} worked solution`);solutionSteps++;for(const block of window.solutionLayout(s.text))if(block.type==="calculation")assert(block.rows[0].lhs);}
    }
    assert.strictEqual(window.PAPER1_PILOTS[2020],window.PILOT_2020);
    assert.strictEqual(window.PAPER1_DIAGRAMS_BY_YEAR[2020],window.pilotDiagram2020);
    for(const n of [8,11,18,19]) {
      const svg=window.pilotDiagram2020(q(n).diagram.type);assert(svg.startsWith('<figure class="diagram">'));assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
      const box=svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number),texts=[...svg.matchAll(/<text x="([^"]+)" y="([^"]+)"[^>]*>([^<]+)<\/text>/g)];
      for(const [,x,y] of texts){assert(+x>=box[0]&&+x<box[0]+box[2],`Q${n} label x`);assert(+y>=box[1]&&+y<=box[1]+box[3],`Q${n} label y`);}
      const labels=texts.map(t=>t[3]);
      if(n===8)assert.deepEqual(labels,["J","K","L","M","N","P"]);
      if(n===11){assert.deepEqual(labels.slice(2),q(11).diagram.rows.flatMap(r=>[String(r.stem),...r.leaves.map(String)]));assert.match(svg,/任務完成時間/);assert.match(svg,/分鐘/);assert.doesNotMatch(svg,/樣本片|質量/);}
      if(n===18)assert.deepEqual(labels,["J","K","L","T"]);
      if(n===19){assert.deepEqual(labels,["A","B","C","D"]);assert.match(svg,/斜坡上的共面測站/);assert.match(svg,/水平基準面/);assert.doesNotMatch(svg,/薄板|地面/);}
      verifySvgGeometry(svg,n,records[n-1].results);
    }
    assert.equal(window.pilotDiagram2020("unknown"),"");
  }
  return {year:2020,paper:1,questionCount:records.length,sourceQuestionPageCount:new Set(sourcePages).size,sourcePageCount:24,schemePageCount:13,sections:[35,35,35],marks:105,polarItems:[],diagramKeys:[8,11,18,19].map(n=>q(n).diagram.type),notationStrings,solutionSteps,questions:records,workLinks};
}

function mutationTests(data,report) {
  let rejected=0;
  const reject=(label,mutate)=>{const altered=structuredClone(data);mutate(altered);assert.throws(()=>verify(altered),undefined,`Mutation survived: ${label}`);rejected++;};
  for(let n=1;n<=19;n++) {
    reject(`Q${n} answer`,d=>{d.questions[n-1].answer+="[changed]";});
    reject(`Q${n} marks`,d=>{d.questions[n-1].marks++;});
    reject(`Q${n} linked working`,d=>{const fragment=report.workLinks.get(n).at(-1);for(const p of d.questions[n-1].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replaceAll(fragment,"[changed working]"));});
    reject(`Q${n} input`,d=>{
      const q=d.questions[n-1];
      if(n===1)q.prompt=q.prompt.replace("x²","x³");
      else if(n===9)q.diagram.rows[1][1]=String(Number(q.diagram.rows[1][1])+1);
      else if(n===11)q.diagram.rows[0].leaves[0]++;
      else q.prompt=q.prompt.replace(/\d+(?:\.\d+)?/,x=>String(Number(x)+1));
    });
  }
  for(const [n,key] of [[8,"alpha"],[18,"tangent"],[19,"tilt"]])reject(`Q${n} diagram disagrees`,d=>{d.questions[n-1].diagram[key]++;});
  reject("Q9 sample denominator",d=>{for(const p of d.questions[8].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("987/48","987/47"));});
  reject("Q13 incomplete cubic factor",d=>{for(const p of d.questions[12].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("≡-3(x-2)(x+4)(x+3)","≡-3(x-2)(x+4)(x+5)"));});
  reject("Q17 false distance expansion",d=>{for(const p of d.questions[16].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("CD²=k⁴+12k²-12k+25","CD²=k⁴+13k²-12k+25"));});
  reject("Q18 wrong similarity correspondence",d=>{for(const p of d.questions[17].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("△JTK∼△LTJ","△JTK∼△LJT"));});
  reject("Q19 inverted projection ratio",d=>{for(const p of d.questions[18].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("DT=70-42=28 米","DT=70+42=112 米"));});
  reject("Q10 startup counted only once",d=>{for(const p of d.questions[9].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("總耗能=2×212=424 焦耳","總耗能=20+2×192=404 焦耳"));});
  reject("Q10 missing separate startups",d=>{d.questions[9].prompt=d.questions[9].prompt.replace("分兩次啟動機器","啟動機器一次");});
  reject("Q11 unequal record sampling",d=>{d.questions[10].prompt=d.questions[10].prompt.replace("每宗被選中的機會相同","按完成時間長短選取");});
  reject("Q15 overlapping specialties",d=>{d.questions[14].prompt=d.questions[14].prompt.replace("各人只屬其中一組","各人可屬多於一組");});
  reject("Q15 unequal teams",d=>{d.questions[14].prompt=d.questions[14].prompt.replace("每個四人組合被選中的機會相同","先隨機選專長組別，再選人員");});
  reject("Q19 missing coplanarity",d=>{d.questions[18].prompt=d.questions[18].prompt.replace("共面的測站","測站");});
  reject("Q19 mixed length units",d=>{for(const p of d.questions[18].solution)for(const s of p.steps)s.text=s.text.map(t=>t.replace("17.183780 米","17.183780 cm"));});
  reject("Q10 italic energy unit regression",d=>{d.questions[9].hints.push("耗能為 212 J。");});
  reject("Q18 italic metre unit regression",d=>{d.questions[17].hints.push("周界為 15.12 m。");});
  reject("Q19 italic metre unit regression",d=>{d.questions[18].hints.push("高度為 22.8 m。");});
  return rejected;
}

function svgMutationTests(window,report) {
  const replacements=[
    [8,svg=>svg.replace(/(<path d="M)[^ ]+/,(_,prefix)=>prefix+"36")],
    [18,svg=>svg.replace(/(<circle cx=")[^"]+/,(_,prefix)=>prefix+"151")],
    [18,svg=>svg.replace(/( r=")[^"]+/,(_,prefix)=>prefix+"116")],
    [19,svg=>svg.replace(/(<polygon points=")[^,]+/,(_,prefix)=>prefix+"0")],
    [19,svg=>svg.replace(/(<path d="M)[^ ]+/,(_,prefix)=>prefix+"12")]
  ];
  for(const [n,mutate] of replacements) {
    const original=window.pilotDiagram2020(window.PILOT_2020.questions[n-1].diagram.type),changed=mutate(original);
    assert.notEqual(changed,original);
    assert.throws(()=>verifySvgGeometry(changed,n,report.questions[n-1].results),undefined,`Q${n} SVG mutation survived`);
  }
  return replacements.length;
}

const window=load(),data=JSON.parse(JSON.stringify(window.PILOT_2020)),report=verify(data,window);
report.rejectedMutations=process.argv.includes("--self-test")?mutationTests(data,report):0;
report.rejectedSvgMutations=process.argv.includes("--self-test")?svgMutationTests(window,report):0;
delete report.workLinks;
if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
else {
  console.log(`2020 Paper 1: ${report.questionCount} independently solved questions; 35+35+35=105 marks; 16 question-bearing source pages visually reviewed; no polar-coordinate items.`);
  for(const q of report.questions)console.log(`Q${q.n} [source p${q.sourcePage}, scheme p${q.schemePage}, ${q.marks} marks]: ${q.answer}`);
  console.log(`Actual prompts, data tables, diagram inputs, worked substitutions, polynomial identities, source part groups, units and roots checked; ${report.notationStrings} notation strings and ${report.solutionSteps} marked steps rendered.`);
  if(report.rejectedMutations)console.log(`Verifier self-test: ${report.rejectedMutations} deliberate data/answer/working/mark mutations rejected.`);
  if(report.rejectedSvgMutations)console.log(`SVG self-test: ${report.rejectedSvgMutations} deliberately corrupted diagram coordinates/radii rejected; actual SVG geometry checked against independently solved models.`);
}
