"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {value}=require("./verify-2020-paper2.cjs");
const R=Math.PI/180,close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const near=(a,b)=>assert.ok(close(a,b),`${a} != ${b}`),sum=a=>a.reduce((a,b)=>a+b,0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),det=(a,b)=>a[0]*b[1]-a[1]*b[0];
const distance=(a,b)=>Math.hypot(...sub(a,b));
const area=(a,b,c)=>Math.abs(det(sub(a,b),sub(c,b)))/2;
const polygon=a=>Math.abs(sum(a.map((p,i)=>det(p,a[(i+1)%a.length]))))/2;
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(distance(a,b)*distance(c,b)))))/R;
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return Math.round(v);};
const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
function read(){const c={window:{}};for(const name of ["data","diagrams"])vm.runInNewContext(fs.readFileSync(path.join(__dirname,`paper2/${name}-2019.js`),"utf8"),c);return c.window;}
function match(q,re){const m=q.prompt.match(re);assert.ok(m,`Q${q.n}: unrecognized conditions ${re}`);return m.slice(1);}
function nums(q,re){return match(q,re).map(Number);}
function unique(q,truths){assert.equal(truths.filter(Boolean).length,1,`Q${q.n}: not exactly one valid choice`);const i=truths.indexOf(true);assert.equal(q.answer,"ABCD"[i],`Q${q.n} key`);assert.equal(q.correct,q.options[i],`Q${q.n} correct field`);}
function distinct(a,q){for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)assert.ok(typeof a[i]==="number"?!close(a[i],a[j]):JSON.stringify(a[i])!==JSON.stringify(a[j]),`Q${q.n}: equivalent options`);}
function numeric(q,n,unit="",vars={}){const a=q.options.map(s=>{if(unit){assert.ok(s.endsWith(unit));s=s.slice(0,-unit.length);}return value(s,vars);});distinct(a,q);unique(q,a.map(v=>close(v,n)));}
function formula(q,samples,fn){const a=q.options.map(s=>samples.map(v=>value(s,v))),expected=samples.map(fn);distinct(a,q);unique(q,a.map(v=>v.every((x,i)=>close(x,expected[i]))));}
function statements(q,truths){const a=q.options.map(s=>(s.match(/III|II|I/g)||[]).sort((a,b)=>a.length-b.length));distinct(a,q);const target=["I","II","III"].filter((_,i)=>truths[i]);unique(q,a.map(v=>v.join(",")===target.join(",")));}
function text(q,correct){distinct(q.options,q);unique(q,q.options.map(s=>s===correct));}
function verify(w=read(),{quiet=false}={}){
  const data=w.PILOT_2019,qs=data.questions,g=w.pilotDiagram2019Geometry,done=new Set(),diagrams=new Set();
  assert.equal(data.year,2019);assert.equal(data.paper,2);assert.equal(data.minutes,75);assert.equal(qs.length,45);
  const check=(n,fn)=>{const q=qs[n-1];assert.equal(q.n,n);assert.equal(q.sourceNo,n);assert.equal(q.section,n<=30?"甲部":"乙部");assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4,`Q${n}: duplicate options`);assert.ok(q.hints.length);assert.ok(q.solution.split("\n").length>=3);assert.ok(!q.markingScheme);assert.ok(!/極坐標/.test(q.prompt));fn(q);done.add(n);};
  const diagram=q=>{assert.ok(q.diagram);diagrams.add(q.diagram);const html=w.pilotDiagram2019(q.diagram);assert.ok(html.includes("<svg")&&!/NaN|undefined/.test(html));return g[q.diagram].points;};
  const xs=[-3,-1,1,2,4],pairs=xs.flatMap(x=>xs.map(y=>({x,y})));
  check(1,q=>{const [expr]=match(q,/化簡 (.+)。/);formula(q,pairs,v=>value(expr,v));});
  check(2,q=>{const [expr]=match(q,/化簡 (.+)。/);formula(q,xs.map(x=>({x})),v=>value(expr,v));});
  check(3,q=>{const[a,b,c,d,e]=nums(q,/(\d+)x-(\d+)y=(\d+)=(\d+)x\+(\d+)y/);numeric(q,c*(a-d)/(a*e+b*d));});
  check(4,q=>{const[p,c,h]=nums(q,/\(x-(\d+)\)\(x\+a\)-(\d+)≡\(x-(\d+)\)²\+b/),a=p-2*h;numeric(q,-p*a-c-h*h);});
  check(5,q=>{const[a,b,c]=nums(q,/y=(\d+)-(\d+)\/\(x\+(\d+)\)/);formula(q,[-2,0,1,2,3].map(y=>({y})),v=>b/(a-v.y)-c);});
  check(6,q=>{const[lo,hi]=nums(q,/若 ([.\d]+)<x<([.\d]+)/);const points=[lo+(hi-lo)*.001,(lo+hi)/2,hi-(hi-lo)*.001];const a=q.options.map(s=>{const m=s.match(/^([.\d]+)（準確至([兩三])位(有效數字|小數)）$/);assert.ok(m);const places=m[2]==="兩"?2:3;return points.every(x=>close(+m[1],m[3]==="小數"?+x.toFixed(places):+x.toPrecision(places)));});unique(q,a);});
  check(7,q=>{const[a,b,c,d,e,f,h]=nums(q,/-([\d]+)\(x-(\d+)\)\+(\d+)<(\d+) 或 \((\d+)x-(\d+)\)\/(\d+)>1/);const lower=Math.min((a*b+c-d)/a,(h+f)/e);numeric(q,Math.floor(lower)+1);});
  check(8,q=>{const[expr]=match(q,/h\(x\)=(.+)。求/);formula(q,xs.map(c=>({c})),v=>value(expr,{...v,x:v.c})+value(expr,{...v,x:-v.c}));});
  check(9,q=>{const[a,b,c,d]=nums(q,/多項式 (\d+)x⁴\+kx³-(\d+)x-(\d+) 可被 (\d+)x\+k/);unique(q,q.options.map(s=>{const k=value(s),x=-k/d;return close(a*x**4+k*x**3-b*x-c,0);}));numeric(q,c*d/b);});
  check(10,q=>{const[a,b,c,x,y]=nums(q,/y=\((\d+)-x\)\(x\+(\d+)\)\+(\d+).*\(\s*(-?\d+),(\d+)\)/s);match(q,/I 圖像開口向下；II 圖像通過 \(2,12\)；III x 截距為 -1 及 4/);const f=x=>(a-x)*(x+b)+c;statements(q,[true,close(f(x),y),close(f(-1),0)&&close(f(4),0)]);});
  check(11,q=>{const[p,r]=nums(q,/\$(\d+).*年利率為 (\d+)%/);match(q,/每季複息一次。六年後/);const expected=Math.round(p*(1+r/400)**24);const a=q.options.map(s=>{assert.ok(/^\$\d+$/.test(s));return +s.slice(1);});distinct(a,q);unique(q,a.map(v=>v===expected));});
  check(12,q=>{const[a,b,c]=nums(q,/\$(\d+) 及 \$(\d+).*為 \$(\d+)/);const ratios=q.options.map(s=>{const p=s.split(":").map(Number);return p[0]/p[1];});distinct(ratios,q);unique(q,ratios.map(v=>close(v,(b-c)/(c-a))));});
  check(13,q=>{const[a,b]=nums(q,/減少 (\d+)% 而 y 增加 (\d+)%/);match(q,/z 隨 x 的平方正變且隨 y 的平方根反變/);const change=((1-a/100)**2/Math.sqrt(1+b/100)-1)*100;const vals=q.options.map(s=>{const m=s.match(/(減少|增加) (\d+)%/);assert.ok(m);return +m[2]*(m[1]==="減少"?-1:1);});distinct(vals,q);unique(q,vals.map(v=>close(v,change)));});
  check(14,q=>{const[a,d,n]=nums(q,/有 (\d+) 粒.*多 (\d+) 粒。求第 (\d+) 個/);diagram(q);assert.deepEqual(Array.from(g[q.diagram].counts),[a,a+d,a+2*d]);numeric(q,a+(n-1)*d);});
  check(15,q=>{const[s,h]=nums(q,/底邊長為 (\d+) cm，高為 (\d+) cm/);numeric(q,s*s+2*s*Math.hypot(h,s/2)," cm²");});
  check(16,q=>{const[a,b,c,given]=nums(q,/KN:NP:PL=(\d+):(\d+):(\d+).*為 (\d+) cm²/s),p=diagram(q);near(distance(p.K,p.N)/a,distance(p.N,p.P)/b);near(distance(p.N,p.P)/b,distance(p.P,p.L)/c);near(distance(p.J,p.N),distance(p.N,p.P));near(distance(p.N,p.P),distance(p.P,p.Q));near(angle(p.J,p.N,p.P),90);near(det(sub(p.U,p.M),sub(p.K,p.M)),0);near(det(sub(p.V,p.M),sub(p.K,p.M)),0);near(det(sub(p.U,p.J),sub(p.N,p.J)),0);near(det(sub(p.V,p.P),sub(p.Q,p.P)),0);near(det(sub(p.J,p.K),sub(p.M,p.L)),0);numeric(q,given*polygon([p.L,p.M,p.V,p.P])/area(p.J,p.K,p.U)," cm²");});
  check(17,q=>{const[e]=nums(q,/∠LMN=(\d+)°/),p=diagram(q);near(angle(p.L,p.M,p.N),e);near(distance(p.J,p.K),distance(p.K,p.M));near(distance(p.K,p.L),distance(p.L,p.M));near(det(sub(p.J,p.K),sub(p.L,p.K)),0);near(det(sub(p.J,p.M),sub(p.N,p.M)),0);numeric(q,angle(p.J,p.L,p.M),"°");});
  check(18,q=>{const[mult,len]=match(q,/JM=MN=(\d+)NK.*NL=(.+?) cm/s),p=diagram(q);near(distance(p.J,p.K),distance(p.J,p.L));near(distance(p.J,p.M),distance(p.M,p.N));near(distance(p.M,p.N),+mult*distance(p.N,p.K));near(angle(p.J,p.M,p.P),90);near(det(sub(p.P,p.M),sub(p.L,p.N)),0);near(det(sub(p.P,p.J),sub(p.L,p.J)),0);near(distance(p.N,p.L),value(len));numeric(q,distance(p.N,p.P)," cm");});
  check(19,q=>{const[a,b,c]=nums(q,/JK=(\d+) cm、JM=(\d+) cm 及 KL=(\d+) cm/),p=diagram(q);near(distance(p.J,p.K),a);near(distance(p.J,p.M),b);near(distance(p.K,p.L),c);near(angle(p.J,p.K,p.M),90);near(det(sub(p.J,p.K),sub(p.M,p.L)),0);numeric(q,polygon([p.J,p.K,p.L,p.M])," cm²");});
  check(20,q=>{const[e]=nums(q,/∠KNP=(\d+)°/),p=diagram(q);near(angle(p.K,p.N,p.P),e);near(distance(p.K,p.N),distance(p.N,p.P));const sides=[distance(p.J,p.K),distance(p.K,p.L),distance(p.L,p.M),distance(p.M,p.J)];sides.forEach(v=>near(v,sides[0]));near(det(sub(p.N,p.J),sub(p.K,p.J)),0);near(det(sub(p.P,p.K),sub(p.L,p.K)),0);numeric(q,angle(p.K,p.M,p.L),"°");});
  check(21,q=>{const[e]=nums(q,/∠LOM=(\d+)°/),p=diagram(q);for(const n of ["J","K","L","M"])near(distance(p.O,p[n]),1);near(angle(p.J,p.O,p.K),180);near(distance(p.J,p.L),distance(p.K,p.M));near(angle(p.L,p.O,p.M),e);numeric(q,angle(p.J,p.K,p.M),"°");});
  check(22,q=>{match(q,/∠KJL=θ、∠NLM=φ。求 LM\/JL/);const p=diagram(q);near(angle(p.J,p.K,p.L),90);near(angle(p.K,p.L,p.N),90);near(angle(p.L,p.N,p.J),90);near(det(sub(p.M,p.J),sub(p.N,p.J)),0);const samples=[{θ:angle(p.K,p.J,p.L),φ:angle(p.N,p.L,p.M)},{θ:40,φ:20},{θ:62,φ:31}];formula(q,samples,v=>Math.cos(v.θ*R)/Math.cos(v.φ*R));near(distance(p.L,p.M)/distance(p.J,p.L),Math.cos(samples[0].θ*R)/Math.cos(samples[0].φ*R));});
  check(23,q=>{const[c]=nums(q,/ax\+by\+(\d+)=0/);match(q,/I a>b；II a>-4；III b>-6/);diagram(q);const d=g[q.diagram];near(d.c,c);assert.ok(-c/d.a>d.xBound);assert.ok(-c/d.b>0&&-c/d.b<d.yBound);near(d.xBound,6);near(d.yBound,4);statements(q,[true,true,false]);});
  check(24,q=>{const[a,b,c]=nums(q,/直線 (\d+)x\+(\d+)y\+k=0 與 kx\+(\d+)y/);numeric(q,-b*c/a);});
  check(25,q=>{const[x,y,t]=nums(q,/坐標為 \((-?\d+),(-?\d+)\).*向右平移 (\d+) 單位/);match(q,/順時針旋轉 90°.*求 L 的 y 坐標/);numeric(q,-(x+t));assert.ok(Number.isFinite(y));});
  check(26,q=>{const[a,b,c,d]=nums(q,/R 的方程為 (\d+)x-(\d+)y\+(\d+)=0.*恆為 (\d+) 單位/);assert.ok(a*a+b*b>0&&d>0&&Number.isFinite(c));text(q,"一對平行直線");});
  check(27,q=>{const[a,b,c,d]=nums(q,/為 (\d+)x²\+3y²-(\d+)x\+(\d+)y\+(\d+)=0/);const cx=b/(2*a),cy=-c/(2*a),r2=cx*cx+cy*cy-d/a;match(q,/I 圓 C 的面積為 4π；II 點 \(3,-3\) 在圓 C 外；III 圓心位於第四象限/);statements(q,[close(r2,4),(3-cx)**2+(-3-cy)**2>r2,cx>0&&cy<0]);});
  check(28,q=>{const[a,b]=nums(q,/整數 (\d+) 至 (\d+)/),n=b-a+1;match(q,/同時取出兩條.*連續整數/);numeric(q,(n-1)/choose(n,2));});
  check(29,q=>{match(q,/I 中位數；II 平均值；III 四分位數間距/);statements(q,[true,false,true]);});
  check(30,q=>{const[n]=nums(q,/(\d+) 次測試/),rows=q.table.rows,values=rows[0].slice(1).map(Number),freqs=rows[1].slice(1).map(Number),all=values.flatMap((v,i)=>Array(freqs[i]).fill(v));assert.equal(all.length,n);const stats={"眾數":values[freqs.indexOf(Math.max(...freqs))],"中位數":median(all),"下四分位數":median(all.slice(0,n/2)),"上四分位數":median(all.slice(n/2))};unique(q,q.options.map(s=>{const m=s.match(/^(眾數|中位數|下四分位數|上四分位數)為 (\d+)$/);assert.ok(m);return close(stats[m[1]],+m[2]);}));});
  check(31,q=>{const[a,b]=nums(q,/截距分別為 (\d+) 及 (\d+)/);match(q,/log₄y 是 log₂x/);const meanings=q.options.map(s=>{const sides=s.split("=");assert.equal(sides.length,2);return [0,1,2].map(u=>value(sides[0],{x:2**u,y:4**(b-b*u/a)})/value(sides[1]));});distinct(meanings,q);unique(q,meanings.map(v=>v.every(x=>close(x,1))));});
  check(32,q=>{match(q,/5=2\/\(3logx-1\)\+2\/\(2logx\+1\).*求 log\(1\/x\)/);const meanings=q.options.map(s=>s.split(" 或 ").map(value).sort((a,b)=>a-b));distinct(meanings,q);unique(q,meanings.map(v=>v.length===2&&v.every(t=>{const u=-t;return !close(3*u-1,0)&&!close(2*u+1,0)&&close(2/(3*u-1)+2/(2*u+1),5);})));});
  check(33,q=>{const[bits]=match(q,/二進制數 ([01]+)₂/);numeric(q,parseInt(bits,2));});
  check(34,q=>{const[n,b]=nums(q,/\((\d+)\+i⁹\)\/\(a\+(\d+)i\)-i¹⁰/);formula(q,[-5,-3,-1,0,1,3,5].map(a=>({a})),v=>(n*v.a+b)/(v.a*v.a+b*b)+1);});
  check(35,q=>{const[c,a,d,b,e,u,v,z]=nums(q,/x\+3y≥(\d+)、(\d+)x-3y≥(-?\d+) 及 (\d+)x\+3y≤(\d+)。求 (\d+)x\+(\d+)y\+(\d+)/);const lines=[[1,3,c],[a,-3,d],[b,3,e]],points=[];for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const[A,B,C]=lines[i],[D,E,F]=lines[j],den=A*E-B*D;const x=(C*E-B*F)/den,y=(A*F-C*D)/den;assert.ok(x+3*y>=c-1e-9&&a*x-3*y>=d-1e-9&&b*x+3*y<=e+1e-9);points.push([x,y]);}numeric(q,Math.max(...points.map(([x,y])=>u*x+v*y+z)));});
  check(36,q=>{const[i,j,s,k,l,t,n]=nums(q,/第 (\d+) 項與第 (\d+) 項之和為 (\d+)，第 (\d+) 項與第 (\d+) 項之和為 (\d+)。求第 (\d+) 項/);assert.equal(k-i,l-j);const r=(t/s)**(1/(k-i)),a=s/(r**(i-1)+r**(j-1));numeric(q,a*r**(n-1));});
  check(37,q=>{const[m,c,b,d,h]=nums(q,/y=(\d+)x\+(\d+).*2x²\+2y²\+kx-(\d+)y-(\d+)=0.*坐標為 (\d+)/s);const A=2*(1+m*m),knownB=4*m*c-b*m,k=-2*h*A-knownB,C=2*c*c-b*c-d;assert.ok((knownB+k)**2-4*A*C>0);numeric(q,k);});
  check(38,q=>{const[r,e]=nums(q,/OJ=(\d+) cm、∠JOL=(\d+)°/),p=diagram(q);near(distance(p.O,p.J),r);near(distance(p.O,p.K),r);near(distance(p.J,p.K),r);near(angle(p.J,p.O,p.L),e);near(det(sub(p.M,p.J),sub(p.L,p.J)),0);near(det(sub(p.M,p.O),sub(p.K,p.O)),0);const sector=angle(p.K,p.O,p.L)/360*Math.PI*r*r;numeric(q,Math.round(sector-area(p.O,p.L,p.M))," cm²");});
  check(39,q=>{const[a,b,c]=nums(q,/∠KJM=(\d+)°、∠NJT=(\d+)° 及 ∠MLN=(\d+)°/),p=diagram(q);for(const n of ["J","K","L","M","N"])near(Math.hypot(...p[n]),1);near(dot(p.J,sub(p.T,p.J)),0);near(angle(p.K,p.J,p.M),a);near(angle(p.N,p.J,p.T),b);near(angle(p.M,p.L,p.N),c);numeric(q,angle(p.J,p.M,p.K),"°");});
  check(40,q=>{const[a,b,c]=nums(q,/∠JLK=(\d+)°[\s\S]*?∠JNK=(\d+)°[\s\S]*?∠LKN=(\d+)°/),p=diagram(q);near(angle(p.J,p.L,p.K),a);near(angle(p.J,p.N,p.K),b);near(angle(p.L,p.K,p.N),c);near(dot(sub(p.J,p.K),sub(p.L,p.K)),0);near(dot(sub(p.J,p.K),sub(p.N,p.K)),0);numeric(q,Math.round(angle(p.L,p.J,p.N)),"°");});
  check(41,q=>{match(q,/在 K 處為直角.*I 垂心為 K；II 形心位於 JL 上；III 內心位於三角形內/s);statements(q,[true,false,true]);});
  check(42,q=>{const[a,b,c,k]=nums(q,/有 (\d+) 本旅遊書、(\d+) 本歷史書及 (\d+) 本科普書.*選出 (\d+) 本/);match(q,/至少有一本歷史書/);numeric(q,1-choose(a+c,k)/choose(a+b+c,k));});
  check(43,q=>{const[a,b,c]=match(q,/分別為 (.+?)、(.+?) 及 (.+?)，三次測試互相獨立/);match(q,/至多兩台測試成功/);numeric(q,1-value(a)*value(b)*value(c));});
  check(44,q=>{const[sd,x,z,other]=nums(q,/標準差為 (\d+) cm.*長 (\d+) cm.*為 ([.\d]+)。.*為 (-?[.\d]+)/s);numeric(q,x-z*sd+other*sd," cm");});
  check(45,q=>{const[a,b]=nums(q,/乘以 (\d+) 後再減去 (\d+)/);match(q,/I 新平均值為 4m-7；II 新分布域為 4r-7；III 新方差為 16v/);statements(q,[a===4&&b===7,b===0&&a===4,a*a===16]);});
  assert.equal(done.size,45);assert.equal(diagrams.size,12);assert.equal(Object.keys(g).length,12);
  if(!quiet)console.log("2019 Paper 2: 45 condition-derived checks, 180 options, 12 geometric/SVG contracts, 30+15 sections; no polar item or MC method marks.");
  return {questions:45,diagrams:12,polar:[]};
}
if(require.main===module){verify();if(process.argv.includes("--self-test")){
  let rejected=0;
  for(let n=0;n<45;n++){
    let w=read(),q=w.PILOT_2019.questions[n];q.answer="ABCD"[("ABCD".indexOf(q.answer)+1)%4];
    assert.throws(()=>verify(w,{quiet:true}),`Q${n+1}: changed key accepted`);rejected++;
    w=read();q=w.PILOT_2019.questions[n];q.options[0]=q.options[1];
    assert.throws(()=>verify(w,{quiet:true}),`Q${n+1}: duplicate accepted`);rejected++;
  }
  const changes=[
    ["(2x-y)","(3x-y)"],["8x⁵","9x⁵"],["80","96"],["x-5","x-6"],["7/(x+3)","9/(x+3)"],
    ["0.004272","0.005272"],["26","29"],["3cx²","4cx²"],["-20","-25"],["(2,12)","(2,13)"],
    ["48000","50000"],["$150","$160"],["30%","20%"],["第 12","第 13"],["24 cm","25 cm"],
    ["16 cm²","20 cm²"],["72°","74°"],["3NK","4NK"],["13 cm","14 cm"],["76°","78°"],
    ["64°","66°"],["LM/JL","JL/LM"],["24=0","30=0"],["20y","24y"],["12 單位","13 單位"],
    ["恆為 5","恆為 0"],["27=0","30=0"],["4 至 15","4 至 16"],["I 中位數","I 標準差"],["50 次","51 次"],
    ["6 及 5","7 及 5"],["5=2/","6=2/"],["10101000011010","10101000011011"],["5+i","6+i"],["48","54"],
    ["2304","4608"],["坐標為 1","坐標為 2"],["18 cm","20 cm"],["70°","72°"],["44°","46°"],
    ["垂心為 K","垂心為 J"],["6 本歷史書","7 本歷史書"],["1/2","1/3"],["82 cm","86 cm"],["乘以 4","乘以 5"]
  ];
  changes.forEach(([before,after],i)=>{const w=read(),q=w.PILOT_2019.questions[i];assert.ok(q.prompt.includes(before));q.prompt=q.prompt.replace(before,after);assert.throws(()=>verify(w,{quiet:true}),`Q${i+1}: changed conditions accepted`);rejected++;});
  for(const key of Object.keys(read().pilotDiagram2019Geometry)){
    const w=read(),d=w.pilotDiagram2019Geometry[key];
    if(d.points)d.points[Object.keys(d.points)[0]][0]+=.7;else if(d.counts)d.counts[0]++;else d.a=Math.abs(d.a);
    assert.throws(()=>verify(w,{quiet:true}),`${key}: invalid geometry accepted`);rejected++;
  }
  console.log(`Mutation self-test: ${rejected} cases rejected (45 keys, 45 duplicate choices, 45 changed conditions, 12 diagrams).`);
}}
module.exports={read,verify};
