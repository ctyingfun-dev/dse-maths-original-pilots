"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {value,condition}=require("./verify-2020-paper2.cjs");
const R=Math.PI/180,sum=a=>a.reduce((x,y)=>x+y,0),close=(a,b)=>Math.abs(a-b)<1e-9*Math.max(Number.MIN_VALUE,Math.abs(a),Math.abs(b));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),det=(a,b)=>a[0]*b[1]-a[1]*b[0];
const dist=(a,b)=>Math.hypot(...sub(a,b)),area=(a,b,c)=>Math.abs(det(sub(a,b),sub(c,b)))/2;
const polygon=p=>Math.abs(sum(p.map((a,i)=>det(a,p[(i+1)%p.length]))))/2;
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(dist(a,b)*dist(c,b)))))/R;
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return Math.round(v);};
const variance=a=>{const m=sum(a)/a.length;return sum(a.map(x=>(x-m)**2))/a.length;};
const same=(a,b)=>Array.isArray(a)?Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>same(x,b[i])):typeof a==="number"?a===b||close(a,b):a===b;
function read(){const c={window:{}};for(const f of ["data","diagrams"])vm.runInNewContext(fs.readFileSync(path.join(__dirname,`paper2/${f}-2017.js`),"utf8"),c);return c.window;}
function match(q,re){const m=q.prompt.replace(/\r?\n/g,' ').match(re);assert.ok(m,`Unrecognized conditions ${re}`);return m.slice(1);}
const nums=(q,re)=>match(q,re).map(Number);
function distinct(q,a){for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert.ok(!same(a[i],a[j]),`Q${q.n}: equivalent options`);}
function unique(q,t){assert.equal(t.filter(Boolean).length,1,"exactly one correct option required");const i=t.indexOf(true);assert.equal(q.answer,"ABCD"[i]);assert.equal(q.correct,q.options[i]);}
function numeric(q,v,unit=""){const a=q.options.map(s=>{if(unit){assert.ok(s.endsWith(unit));s=s.slice(0,-unit.length);}return value(s);});distinct(q,a);unique(q,a.map(x=>same(x,v)));}
function expressions(q,samples,f,parse=value){const a=q.options.map(s=>samples.map(v=>parse(s,v))),b=samples.map(f);distinct(q,a);unique(q,a.map(x=>same(x,b)));}
function statements(q,t){const a=q.options.map(s=>(s.match(/III|II|I/g)||[]).sort((a,b)=>a.length-b.length));distinct(q,a);const b=["I","II","III"].filter((_,i)=>t[i]);unique(q,a.map(x=>same(x,b)));}
function eq(s,v){const [a,b]=s.split("="),d=value(a,v)-value(b,v);return Math.abs(d)<1e-12?0:d;}
function line(s){const f=(x,y)=>eq(s,{x,y}),c=f(0,0);return[f(1,0)-c,f(0,1)-c,c];}
function circle(s){const f=(x,y)=>eq(s,{x,y}),c=f(0,0),a=(f(1,0)+f(-1,0)-2*c)/2,b=(f(1,0)-f(-1,0))/2,d=(f(0,1)-f(0,-1))/2;near((f(0,1)+f(0,-1)-2*c)/2,a);const centre=[-b/(2*a),-d/(2*a)];return{centre,radius:Math.sqrt(dot(centre,centre)-c/a)};}
const expectedDiagrams={9:"quadratic2017",13:"dots2017",14:"triangle2017",16:"parallelograms2017",17:"equilateral2017",18:"isosceles2017",19:"spiral2017",21:"diameter2017",22:"rectangle2017",23:"lines2017",28:"bar2017",29:"box2017",31:"transform2017",33:"rootline2017",38:"diagonal2017",39:"pole2017",40:"tangent2017"};
function verify(w=read(),{quiet=false}={}){
  const data=w.PILOT_2017,qs=data.questions,g=w.pilotDiagram2017Geometry,done=[];
  assert.equal(data.year,2017);assert.equal(data.paper,2);assert.equal(data.minutes,75);assert.equal(qs.length,45);
  function check(n,f){const q=qs[n-1];try{assert.equal(q.n,n);assert.equal(q.sourceNo,n);assert.equal(q.section,n<=30?"甲部":"乙部");assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.hints.length);assert.ok(q.solution.split("\n").length>=3);assert.ok(!q.marks&&!q.markingScheme);assert.ok(!/____|填充|改正.*錯誤|橫坐標|縱坐標/.test(JSON.stringify(q)));assert.equal(q.diagram,expectedDiagrams[n]);if(q.diagram){const s=w.pilotDiagram2017(q.diagram);assert.ok(s.includes("<svg")&&!/undefined|NaN|Infinity/.test(s));}f(q);done.push(n);}catch(e){throw Error(`2017 P2 Q${n}: ${e.message}`,{cause:e});}}
  const points=q=>g[q.diagram].points,xs=[-4,-1,-.5,0,.25,1,3,7],pairs=xs.flatMap(x=>xs.map(y=>({x,y})));
  check(1,q=>{const [s]=match(q,/因式分解 (.+)。/);expressions(q,pairs,v=>value(s,v));});
  check(2,q=>{const [s]=match(q,/化簡 (.+)。/);numeric(q,value(s));});
  check(3,q=>{const [s]=match(q,/且 (.+)。以 b/);expressions(q,[-9,-2,-.5,1,4,13].map(b=>({b})),()=>0,(s1,v)=>eq(s,{...v,a:value(s1,v)}));});
  check(4,q=>{const [s]=match(q,/表示 (.+) 的近似值/),v=value(s);const a=q.options.map(o=>{const m=o.match(/^([\d.]+)（準確至([三五六])位(有效數字|小數)）$/);assert.ok(m);return[+m[1],{三:3,五:5,六:6}[m[2]],m[3]];});distinct(q,a);unique(q,a.map(([x,n,t])=>x===+(t==="有效數字"?v.toPrecision(n):v.toFixed(n))));});
  check(5,q=>{const [s]=match(q,/解不等式 (.+)。/);const samples=[-100,0,1.99,2,2.01,3,3.99,4,4.01,100].map(x=>({x}));expressions(q,samples,v=>condition(s,v),condition);});
  check(6,q=>{const [s,a,b]=match(q,/h\(x\)=(.+)。求 h\((.+)\)-h\((.+)\)/);expressions(q,[-7,0,2,11].map(k=>({k})),v=>value(s,{x:value(a),...v})-value(s,{x:value(b),...v}));});
  check(7,q=>{const [s,r,a,b]=match(q,/G\(x\)=(.+)，其中.*x-(\d+) 整除.*除以 (\d+)x\+(\d+)/),c=-value(s,{x:+r,c:0});near(value(s,{x:+r,c}),0);numeric(q,value(s,{x:-b/a,c}));});
  check(8,q=>{const [l,r]=match(q,/且 (.+)≡(.+)。求 n/);const coeff=(s,v)=>(value(s,{x:1,...v})+value(s,{x:-1,...v})-2*value(s,{x:0,...v}))/2;const m=coeff(l,{m:0,n:0}),n=value(l,{x:1,m,n:0})-value(r,{x:1,m,n:0});const coefficient=value(r,{x:1,m,n:1})-value(r,{x:1,m,n:0});const nv=n/coefficient;xs.forEach(x=>near(value(l,{x,m,n:nv}),value(r,{x,m,n:nv})));numeric(q,nv);});
  check(9,q=>{const [h]=nums(q,/y=\(px\+(\d+)\)²\+q/),{p,q:offset}=g[q.diagram];assert.ok(-h/p<0&&offset<0&&(h*h+offset)>0);const samples=[.2,1,3,8].flatMap(p=>[-1,-7,-h*h+.1].map(q=>({p,q})));unique(q,q.options.map(o=>samples.every(v=>o.split(" 及 ").every(s=>condition(s,v)))));});
  check(10,q=>{const [p,r]=nums(q,/\$(\d+).*年利率為 (\d+)%/);match(q,/每半年複息一次.*三年/);const v=Math.round(p*((1+r/200)**6-1));const a=q.options.map(s=>+s.slice(1));distinct(q,a);unique(q,a.map(x=>x===v));});
  check(11,q=>{const [scale,a]=nums(q,/1:(\d+).*面積為 (\d+) cm²/);numeric(q,a*scale**2/1e4," 平方米");});
  check(12,q=>{const [x1,y1,x2,y2,x]=nums(q,/x=(\d+) 時，y=(\d+)；當 x=(\d+) 時，y=(\d+)。\s*求 x=(\d+)/);match(q,/隨 x² 正變/);const b=(y2-y1)/(x2*x2-x1*x1),a=y1-b*x1*x1;numeric(q,a+b*x*x);});
  check(13,q=>{const [first,a,b,target]=nums(q,/有 (\d+) 粒.*加入 \((\d+)n\+(\d+)\).*第 (\d+) 個/);let v=first;const counts=[v];for(let n=1;n<target;n++){v+=a*n+b;if(n<4)counts.push(v);}assert.ok(same(counts,g[q.diagram].counts));numeric(q,v);assert.equal((w.pilotDiagram2017(q.diagram).match(/<circle/g)||[]).length,sum(counts));});
  check(14,q=>{const [base,h,difference]=nums(q,/JL=(\d+) cm、KN=(\d+) cm.*大 (\d+) cm²/),p=points(q);near(dist(p.J,p.L),base);near(dist(p.K,p.N),h);near(dot(sub(p.K,p.N),sub(p.L,p.J)),0);near(area(p.J,p.K,p.N)-area(p.K,p.L,p.N),difference);const a=(base+2*difference/h)/2,b=base-a;assert.ok(a>0&&b>0);numeric(q,base+Math.hypot(a,h)+Math.hypot(b,h)," cm");});
  check(15,q=>{const [r,h,v]=nums(q,/底半徑的 (\d+) 倍.*高的 (\d+) 倍.*體積為 (\d+)π/);numeric(q,3*h*v*Math.PI/(r*r)," cm³");});
  check(16,q=>{const [a,b,v]=nums(q,/KN:NL=(\d+):(\d+).*面積為 (\d+) cm²/),p=points(q);near(dist(p.K,p.N)/dist(p.N,p.L),a/b);for(const [A,B,C,D] of [["J","K","M","L"],["K","L","J","M"],["K","N","P","M"],["N","M","K","P"]])near(det(sub(p[A],p[B]),sub(p[C],p[D])),0);for(const [a,b,c] of [["J","Q","L"],["K","Q","P"],["J","R","L"],["M","R","N"]])near(det(sub(p[a],p[b]),sub(p[c],p[b])),0);numeric(q,v*polygon([p.M,p.P,p.Q,p.R])/area(p.J,p.K,p.Q)," cm²");});
  check(17,q=>{const [s,d,a]=nums(q,/邊長 (\d+) cm.*JM=(\d+) cm.*∠LMN=(\d+)°/),p=points(q);[dist(p.J,p.K),dist(p.K,p.L),dist(p.L,p.J)].forEach(x=>near(x,s));near(dist(p.J,p.M),d);near(angle(p.L,p.M,p.N),a);near(det(sub(p.N,p.K),sub(p.L,p.K)),0);near(det(sub(p.M,p.J),sub(p.K,p.J)),0);numeric(q,dist(p.L,p.N)," cm");});
  check(18,q=>{const [a]=nums(q,/∠LMN=(\d+)°/),p=points(q);near(dist(p.J,p.K),dist(p.K,p.L));near(dist(p.J,p.L),dist(p.J,p.M));near(det(sub(p.J,p.N),sub(p.K,p.L)),0);near(angle(p.L,p.M,p.N),a);numeric(q,angle(p.J,p.K,p.L),"°");});
  check(19,q=>{const p=points(q),s="JKLMNOPQ";for(let i=0;i<7;i++){near(dist(p[s[i]],p[s[i+1]]),g[q.diagram].lengths[i]);if(i<6)near(dot(sub(p[s[i]],p[s[i+1]]),sub(p[s[i+2]],p[s[i+1]])),0);}numeric(q,dist(p.J,p.Q));});
  check(20,q=>{match(q,/N 為 JM 的中點.*∠JKN=∠LKM=∠MKN/);const p={J:[1,1],K:[0,0],L:[-2,0],M:[-1,1],N:[0,1]};near(dist(p.J,p.N),dist(p.M,p.N));near(angle(p.J,p.K,p.N),angle(p.L,p.K,p.M));near(angle(p.J,p.K,p.N),angle(p.M,p.K,p.N));const [claim]=nums(q,/II ∠JKL=(\d+)°/);statements(q,[close(dist(p.J,p.K),dist(p.K,p.M)),close(angle(p.J,p.K,p.L),claim),close(dist(p.J,p.K),dist(p.M,p.K))&&close(dist(p.J,p.N),dist(p.M,p.N))]);});
  check(21,q=>{const [a]=nums(q,/∠JKL=(\d+)°/),p=points(q);for(const v of Object.values(p))near(Math.hypot(...v),1);near(dist(p.J,p.M),2);near(dist(p.K,p.L),dist(p.L,p.M));near(angle(p.J,p.K,p.L),a);numeric(q,angle(p.K,p.N,p.M),"°");});
  check(22,q=>{const [a,b,t]=nums(q,/JK=(\d+) cm、KL=(\d+) cm.*∠LKN=(\d+)°/),p=points(q);near(dist(p.J,p.K),a);near(dist(p.K,p.L),b);near(angle(p.L,p.K,p.N),t);near(dot(sub(p.J,p.M),sub(p.L,p.M)),0);assert.ok(b*Math.tan(t*R)<a);numeric(q,Math.round(Math.atan2(b,a-b*Math.tan(t*R))/R),"°");});
  check(23,q=>{const [intercept]=nums(q,/截距為 (-?\d+)/),m=g[q.diagram];near(m.n/m.m,intercept);assert.ok(m.m<m.p&&m.p<0&&m.n>0&&m.q<0);const rel=match(q,/I (.+?)；II (.+?)；III (.+?)。/),samples=[];for(const p of [-.2,-.5,-1])for(const m of [p-1,p-4])for(const q of [-1,-4])samples.push({p,m,n:intercept*m,q});statements(q,rel.map(s=>samples.every(v=>condition(s,v))));});
  check(24,q=>{const [s,intercept]=match(q,/垂直於直線 (.+)。若 R 的 x 截距為 (-?\d+)/),l=line(s),a=q.options.map(line);distinct(q,a);unique(q,a.map(v=>Math.abs(v[0]*l[0]+v[1]*l[1])<1e-9&&Math.abs(v[0]*intercept+v[2])<1e-9));});
  check(25,q=>{const a=nums(q,/\((\d+),(\d+)°\)、\((\d+),(\d+)°\) 及 \((\d+),(\d+)°\)/),p=[];for(let i=0;i<6;i+=2)p.push([a[i]*Math.cos(a[i+1]*R),a[i]*Math.sin(a[i+1]*R)]);numeric(q,Math.abs(det(sub(p[1],p[0]),sub(p[2],p[0])))/dist(p[0],p[2]));});
  check(26,q=>{const [s,t]=match(q,/分別為 (.+?) 及 (.+?)。設/),a=circle(s),b=circle(t);statements(q,[Math.abs(det(a.centre,b.centre))<1e-9,close(a.radius,b.radius),close(Math.hypot(...a.centre),Math.hypot(...b.centre))]);});
  check(27,q=>{const [s,t]=match(q,/圓 (.+?) 上.*方程為 (.+?)，其中/),c=circle(s).centre;numeric(q,-eq(t,{x:c[0],y:c[1],k:0}));});
  check(28,q=>{const [limit]=nums(q,/少於 (\d+) 個/),d=g[q.diagram];assert.equal(d.values.length,d.frequencies.length);numeric(q,sum(d.frequencies.filter((_,i)=>d.values[i]<limit))/sum(d.frequencies));});
  check(29,q=>{match(q,/下四分位數/);const a=g[q.diagram].summary;assert.ok(a.every((v,i)=>!i||v>a[i-1]));numeric(q,a[1]);});
  check(30,q=>{const [s,mean]=match(q,/考慮正整數 (.+)、m、n。.*平均值為 (\d+)/),a=s.split("、").map(Number),total=+mean*(a.length+2)-sum(a),rel=match(q,/I (.+?)；II (.+?)；III (.+?)。/),cases=[];for(let m=1;m<total;m++){const data=[...a,m,total-m].sort((a,b)=>a-b),freq=new Map();data.forEach(x=>freq.set(x,(freq.get(x)||0)+1));const max=Math.max(...freq.values()),modes=[...freq].filter(v=>v[1]===max).map(v=>v[0]);assert.equal(modes.length,1);cases.push({a:modes[0],b:data[4],c:data.at(-1)-data[0]});}assert.equal(cases.length,total-1);statements(q,rel.map(s=>cases.every(v=>condition(s,v))));});
  check(31,q=>{const [factor]=nums(q,/f\(x\/(\d+)\)/),d=g[q.diagram],[a,b,c]=d.source,target=[a*factor,b*factor,c];distinct(q,d.choices);unique(q,q.options.map(o=>{const i=["圖甲","圖乙","圖丙","圖丁"].indexOf(o);assert.ok(i>=0);return same(d.choices[i],target);}));});
  check(32,q=>{const [s]=match(q,/把 (.+) 表示/);const terms=s.split("+").map(t=>{const m=t.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);assert.ok(m);return BigInt(m[1])**BigInt([...m[2]].map(c=>"⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join(""));}),expected=terms.reduce((a,b)=>a+b,0n);const a=q.options.map(s=>{const m=s.match(/^\(([0-9A-F]+)\)₁₆$/);assert.ok(m);return BigInt("0x"+m[1]);});distinct(q,a);unique(q,a.map(v=>v===expected));});
  check(33,q=>{const [xint,yint]=g[q.diagram].intercepts;const samples=[-3,-1,0,1,xint].map(x=>({x}));expressions(q,samples,v=>(yint-yint*v.x/xint)**2,(s,v)=>value(s.split("=")[1],v));});
  check(34,q=>{const [base,a,c]=match(q,/log([₀-₉]+)y=x-(\d+) 及 2\(log[₀-₉]+y\)²=(\d+)-x/);const b=+base.split("").map(x=>"₀₁₂₃₄₅₆₇₈₉".indexOf(x)).join("");assert.ok(b>0&&b!==1);const discriminant=1+8*(+c-a),roots=[(-1+Math.sqrt(discriminant))/4,(-1-Math.sqrt(discriminant))/4],expected=roots.map(t=>b**t).sort((x,y)=>x-y);const opts=q.options.map(s=>s.split(" 或 ").map(s=>value(s)).sort((x,y)=>x-y));distinct(q,opts);unique(q,opts.map(v=>same(v,expected)));});
  check(35,q=>{const [a,b,c]=nums(q,/若 (\d+)\/\((\d+)-(\d+)i\)\+ki/);numeric(q,-a*c/(b*b+c*c));});
  check(36,q=>{const sequences=match(q,/I (.+?)；II (.+?)；III (.+?)。/).map(s=>s.split("、").map(s=>value(s)));statements(q,sequences.map(a=>close(a[1]-a[0],a[2]-a[1])));});
  check(37,q=>{const [ymax,a,b,offset]=nums(q,/y≤(\d+)、x-y-(\d+)≤0、x\+y-(\d+)≥0.*求 x-2y\+(\d+)/);const vertices=[[(a+b)/2,(b-a)/2],[a+ymax,ymax],[b-ymax,ymax]];assert.ok(vertices.every(([x,y])=>y<=ymax&&x-y<=a&&x+y>=b));numeric(q,Math.max(...vertices.map(([x,y])=>x-2*y+offset)));});
  check(38,q=>{const [a,b,c]=nums(q,/JK=(\d+) cm、KL=(\d+) cm.*JN=(\d+) cm/),p=points(q);near(dist(p.J,p.K),a);near(dist(p.K,p.L),b);near(dist(p.J,p.N),c);near(det(sub(p.N,p.J),sub(p.L,p.J)),0);near(dot(sub(p.K,p.J),sub(p.M,p.J)),0);const t=c/Math.hypot(a,b);numeric(q,Math.hypot(a*t,b*(1-t))," cm");});
  check(39,q=>{const [a,h,c,b]=nums(q,/JK=(\d+) 米、JM=(\d+) 米、KL=(\d+) 米、LM=(\d+) 米/),p=points(q);near(dist(p.J,p.K),a);near(dist(p.J,p.M),h);near(dist(p.K,p.L),c);near(dist(p.L,p.M),b);near(dot(sub(p.J,p.M),sub(p.L,p.M)),0);near(dot(sub(p.J,p.M),sub(p.K,p.M)),0);const d=Math.sqrt(a*a-h*h);near(d*d+b*b,c*c);numeric(q,Math.round(Math.asin(d/a)/R),"°");});
  check(40,q=>{const [a,b]=nums(q,/∠KJM=(\d+)°、∠KLO=(\d+)°/),p=points(q);for(const k of ["J","K","L"])near(dist(p.O,p[k]),1);near(dot(sub(p.O,p.J),sub(p.N,p.M)),0);near(angle(p.K,p.J,p.M),a);near(angle(p.K,p.L,p.O),b);numeric(q,angle(p.J,p.K,p.L),"°");});
  check(41,q=>{const [a,b,c]=nums(q,/直線 (\d+)x\+(\d+)y=(\d+)p/),aopts=q.options.map(s=>s.split(":").map(Number)),ratios=aopts.map(([p,q])=>p/q);distinct(q,ratios);unique(q,aopts.map(([p,q])=>{const r=(p+q-Math.hypot(p,q))/2;return close((a+b)*r,c*p);}));});
  check(42,q=>{const [n,m,a,b]=nums(q,/有 (\d+) 部不同的相機及 (\d+) 部不同的錄音機.*選出 (\d+) 部相機及 (\d+) 部錄音機/);numeric(q,choose(n,a)*choose(m,b));});
  check(43,q=>{const [p,n,k]=nums(q,/概率為 ([\d.]+).*培植 (\d+) 粒.*至多 (\d+) 粒/);assert.ok(q.prompt.includes("互相獨立"));let v=0;for(let i=0;i<=k;i++)v+=choose(n,i)*p**i*(1-p)**(n-i);numeric(q,v);near(v,1-p**n);});
  check(44,q=>{const [mean,x,z]=nums(q,/平均質量為 (\d+) g.*質量為 (\d+) g.*標準分為 (-?[\d.]+)/);assert.ok((x-mean)/z>0);numeric(q,(x-mean)/z," g");});
  check(45,q=>{const [scale]=nums(q,/乘以 (\d+) 後/),claims=match(q,/I m₂=(\d+)m₁；II r₂=(\d+)r₁；III v₂=(\d+)v₁/).map(Number),a=[1,1,2,3,4,5,6],b=a.map(x=>scale*x);near(variance(b)/variance(a),scale*scale);statements(q,[claims[0]===scale,claims[1]===scale,claims[2]===scale*scale]);});
  assert.ok(same(qs.filter(q=>q.topic.includes("極坐標")).map(q=>q.n),[25]));
  if(!quiet)console.log(`2017 Paper 2: independently verified ${done.length} questions, 180 options and ${Object.keys(expectedDiagrams).length} diagrams.`);
  return true;
}
function selfTest(){let rejected=0;const reject=mutate=>{const w=read();mutate(w);assert.throws(()=>verify(w,{quiet:true}));rejected++;};
  for(let i=0;i<45;i++){reject(w=>{const q=w.PILOT_2017.questions[i];q.answer="ABCD"[("ABCD".indexOf(q.answer)+1)%4];});reject(w=>{const q=w.PILOT_2017.questions[i];q.options["ABCD".indexOf(q.answer)]=q.options[("ABCD".indexOf(q.answer)+1)%4];});}
  const changes=[[1,"4x²","5x²"],[2,"123","124"],[3,"7b","8b"],[5,"9-x","12-x"],[6,"3x²-4x","3x²-5x"],[7,"x-4","x-5"],[8,"+20","+21"],[10,"3500","4000"],[11,"30000","20000"],[12,"y=34","y=35"],[13,"2n+3","2n+4"],[14,"96","97"],[15,"54π","60π"],[16,"108","120"],[17,"JM=5","JM=6"],[18,"128°","130°"],[20,"120°","135°"],[21,"116°","115°"],[22,"35°","40°"],[23,"為 -2","為 -3"],[24,"為 -5","為 -6"],[25,"(8,260°)","(10,260°)"],[26,"-12=0","-16=0"],[27,"-8x","-10x"],[28,"少於 6","少於 7"],[30,"為 6","為 7"],[31,"x/3","x/2"],[32,"8⁵","8⁶"],[34,"5-x","6-x"],[35,"26/","39/"],[36,"16π","17π"],[37,"+35","+36"],[38,"JN=30","JN=31"],[39,"JK=26","JK=27"],[40,"64°","65°"],[41,"=2p","=3p"],[42,"12 名","13 名"],[43,"0.6","0.7"],[44,"44 分","45 分"],[45,"乘以 5","乘以 6"]];
  changes.find(v=>v[0]===26).splice(1,2,"+12x","+14x");
  changes.find(v=>v[0]===42).splice(1,2,"12 部","13 部");
  changes.find(v=>v[0]===44).splice(1,2,"44 g","45 g");
  for(const [n,a,b] of changes){try{reject(w=>{const q=w.PILOT_2017.questions[n-1];assert.ok(q.prompt.includes(a));q.prompt=q.prompt.replace(a,b);});}catch(e){throw Error(`Counterexample Q${n}: ${a} -> ${b}`,{cause:e});}}
  reject(w=>{w.pilotDiagram2017Geometry.spiral2017.points.Q[1]-=1;});
  reject(w=>{w.pilotDiagram2017Geometry.box2017.summary[1]+=1;});
  reject(w=>{w.pilotDiagram2017Geometry.rootline2017.intercepts[1]+=1;});
  console.log(`2017 Paper 2 counterexamples: rejected ${rejected} altered conditions, diagrams, keys and options.`);
}
if(require.main===module){verify();selfTest();}
module.exports={read,verify,selfTest};
