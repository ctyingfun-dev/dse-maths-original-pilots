"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const rad=Math.PI/180;
const sum=a=>a.reduce((x,y)=>x+y,0),mean=a=>sum(a)/a.length;
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const near=(a,b,label="")=>assert.ok(close(a,b),`${label}: ${a} != ${b}`);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>sum(a.map((v,i)=>v*b[i]));
const det=(a,b)=>a[0]*b[1]-a[1]*b[0],dist=(a,b)=>Math.hypot(...sub(a,b));
const area=(a,b,c)=>Math.abs(det(sub(a,b),sub(c,b)))/2;
const polygon=p=>Math.abs(sum(p.map((v,i)=>det(v,p[(i+1)%p.length]))))/2;
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(dist(a,b)*dist(c,b)))))/rad;
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const median=a=>{a=[...a].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const factorial=n=>{let v=1;for(let i=2;i<=n;i++)v*=i;return v;};
const choose=(n,k)=>{if(k<0||k>n)return 0;let a=1;for(let i=1;i<=Math.min(k,n-k);i++)a=a*(n-i+1)/i;return Math.round(a);};
const supers=Object.fromEntries([..."⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺"].map((v,i)=>[v,"0123456789-+"[i]]));
const normalize=s=>s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g,t=>`^(${[...t].map(x=>supers[x]).join("")})`).replace(/−/g,"-").replace(/×/g,"*").replace(/\[/g,"(").replace(/\]/g,")").replace(/\s|°/g,"");

// A restricted mathematical parser. No solution text or answer key is evaluated.
function value(source,vars={}) {
  const log=source.match(/^log([₀-₉]+)(.+)$/);
  if(log){const base=Number([...log[1]].map(c=>"₀₁₂₃₄₅₆₇₈₉".indexOf(c)).join(""));return Math.log(value(log[2],vars))/Math.log(base);}
  const input=normalize(source),tokens=input.match(/\d+(?:\.\d+)?|\.\d+|sin|cos|log|[A-Za-zα-ωπ]|[()+*/^√-]/g)||[];
  assert.equal(tokens.join(""),input,`Unparsed arithmetic: ${source}`);let i=0;
  function atom(){
    const t=tokens[i++];
    if(t==="("){const v=expr();assert.equal(tokens[i++],")",source);return v;}
    if(t==="√")return Math.sqrt(power());
    if(t==="sin"||t==="cos"||t==="log"){const v=atom();return t==="log"?Math.log10(v):Math[t](v*rad);}
    if(/^\d|^\./.test(t||""))return +t;
    if(t==="π")return Math.PI;
    assert.ok(Object.hasOwn(vars,t),`Unknown variable ${t}: ${source}`);return vars[t];
  }
  function power(){const a=atom();if(tokens[i]!=="^")return a;i++;return a**unary();}
  function unary(){if(tokens[i]==="+"){i++;return unary();}if(tokens[i]==="-"){i++;return -unary();}return power();}
  function product(){let a=unary();while(i<tokens.length){const t=tokens[i];if(t==="*"||t==="/"){i++;const b=unary();if(t==="/")assert.notEqual(b,0);a=t==="*"?a*b:a/b;}else if(t==="("||t==="√"||/^[A-Za-zα-ωπ\d.]/.test(t))a*=unary();else break;}return a;}
  function expr(){let a=product();while(tokens[i]==="+"||tokens[i]==="-"){const t=tokens[i++],b=product();a+=t==="+"?b:-b;}return a;}
  const result=expr();assert.equal(i,tokens.length,source);assert.ok(Number.isFinite(result),source);return result;
}
function condition(s,vars){
  if(s.includes("或"))return s.split(/\s*或\s*/).some(x=>condition(x,vars));
  const parts=s.replace(/°/g,"").split(/(≤|≥|<|>|=)/),cmp={"<":(a,b)=>a<b,">":(a,b)=>a>b,"≤":(a,b)=>a<=b||close(a,b),"≥":(a,b)=>a>=b||close(a,b),"=":close};
  assert.ok(parts.length>=3&&parts.length%2===1,s);
  for(let i=1;i<parts.length;i+=2)if(!cmp[parts[i]](value(parts[i-1],vars),value(parts[i+1],vars)))return false;
  return true;
}
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)?a.length===b.length&&a.every((v,i)=>same(v,b[i])):typeof a==="number"&&typeof b==="number"?close(a,b):a===b;
function match(q,re){const m=q.prompt.match(re);assert.ok(m,`Q${q.n} changed/unrecognized conditions: ${re}`);return m.slice(1);}
function nums(q,re){return match(q,re).map(Number);}
function distinct(q,values){assert.equal(values.length,4);for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert.ok(!same(values[i],values[j]),`Q${q.n}: equivalent options ${i},${j}`);}
function unique(q,truths){assert.equal(truths.filter(Boolean).length,1,`Q${q.n}: not one correct option`);const index=truths.indexOf(true);assert.equal(q.answer,"ABCD"[index],`Q${q.n} key`);assert.equal(q.correct,q.options[index],`Q${q.n} correct field`);}
function numeric(q,expected,unit="",vars={}){const values=q.options.map(s=>{if(unit){assert.ok(s.endsWith(unit));s=s.slice(0,-unit.length);}return value(s,vars);});distinct(q,values);unique(q,values.map(v=>close(v,expected)));}
function expressions(q,samples,expected,fn=value){const meanings=q.options.map(s=>samples.map(v=>fn(s,v))),targets=samples.map(expected);distinct(q,meanings);unique(q,meanings.map(a=>same(a,targets)));}
function statements(q,truths){const meanings=q.options.map(s=>(s.match(/III|II|I/g)||[]).sort((a,b)=>a.length-b.length));meanings.forEach(a=>assert.equal(a.length,new Set(a).size));distinct(q,meanings);const target=["I","II","III"].filter((_,i)=>truths[i]);unique(q,meanings.map(a=>same(a,target)));}
function relations(q){return match(q,/\nI (.+?)；II (.+?)；III (.+?)。/);}
function eq(s,vars){const [a,b]=s.split("=");assert.ok(b!==undefined,s);return value(a,vars)-value(b,vars);}
function line(s,vars={}){const c=eq(s,{...vars,x:0,y:0});return [eq(s,{...vars,x:1,y:0})-c,eq(s,{...vars,x:0,y:1})-c,c];}
function solveLines(a,b){const d=a[0]*b[1]-a[1]*b[0];assert.notEqual(d,0);return [(a[1]*b[2]-a[2]*b[1])/d,(a[2]*b[0]-a[0]*b[2])/d];}
function circle(s,vars={}){
  const f=(x,y)=>eq(s,{...vars,x,y}),c=f(0,0),a=(f(1,0)+f(-1,0)-2*c)/2,b=(f(1,0)-f(-1,0))/2,d=(f(0,1)-f(0,-1))/2;
  near((f(0,1)+f(0,-1)-2*c)/2,a,"equal quadratic coefficients");near(f(1,1),a*2+b+d+c,"no mixed term");assert.ok(a>0);
  const centre=[-b/(2*a),-d/(2*a)],radius=Math.sqrt(dot(centre,centre)-c/a);assert.ok(radius>0);return {centre,radius};
}
function read(){const sandbox={window:{}};vm.createContext(sandbox);for(const f of ["paper2/data-2020.js","paper2/diagrams-2020.js"])vm.runInContext(fs.readFileSync(path.join(__dirname,f),"utf8"),sandbox,{filename:f});return sandbox.window;}
const expectedDiagrams={8:"lines2020",12:"dots2020",14:"bounds2020",17:"trapezia2020",18:"parallelogram2020",19:"reflex2020",20:"triangles2020",21:"rectangle2020",22:"circle2020",29:"bars2020",33:"exponential2020",34:"transform2020",38:"prism2020",39:"tangents2020"};

function verify(w,{quiet=false}={}){
  const data=w.PILOT_2020,qs=data.questions,g=w.pilotDiagram2020Geometry;
  assert.equal(data.year,2020);assert.equal(data.paper,2);assert.equal(data.minutes,75);assert.equal(qs.length,45);
  const done=new Set(),diagramDone=new Set();
  function check(n,fn){const q=qs[n-1];try{fn(q);done.add(n);}catch(error){throw new Error(`Q${n}: ${error.message}`,{cause:error});}}
  function points(q){assert.equal(q.diagram.type,expectedDiagrams[q.n]);diagramDone.add(q.n);return g[q.diagram.type].points;}
  qs.forEach((q,i)=>{
    assert.equal(q.n,i+1);assert.equal(q.sourceNo,i+1);assert.equal(q.section,i<30?"甲部":"乙部");assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.ok(q.hints.length>=1&&q.hints.length<=2);assert.ok(q.solution.split("\n").length>=3);assert.ok(!Object.hasOwn(q,"marks"));
    assert.ok(!/____|填充|改正.*錯誤|修正.*錯誤|寫出/.test(q.prompt));
    assert.ok(!/橫坐標|縱坐標|橫截距|縱截距/.test(JSON.stringify(q)));
    if(expectedDiagrams[q.n]){assert.equal(q.diagram.type,expectedDiagrams[q.n]);const svg=w.pilotDiagram2020(q.diagram.type);assert.ok(svg.includes("<svg")&&svg.includes("<figure"));assert.ok(!/NaN|undefined|Infinity/.test(svg));}
    else assert.equal(q.diagram,undefined);
  });
  assert.deepEqual(Array.from(qs.filter(q=>q.topic.includes("極坐標")),q=>q.n),[24]);
  // Algebra identities use overdetermined grids, including negative/fractional
  // values, zero when admissible, and points close to excluded denominators.
  check(1,q=>{const [s]=match(q,/將 (.+) 化簡/);expressions(q,[-7,-3,-1,-.5,.2,.75,1,2,4,9].map(x=>({x})),v=>value(s,v));});
  check(2,q=>{const [s]=match(q,/已知 (.+)。以 x/);const samples=[-6,-2,-.5,0,.5,1,2,4,4.9,5.1,6,8].map(x=>({x}));expressions(q,samples,()=>0,(o,v)=>eq(s,{...v,y:value(o,v)}));});
  check(3,q=>{const [s]=match(q,/化簡 (.+)。/);expressions(q,[-4,-1,-.7,-.5,0,.3,.6,.7,1,2,8].map(x=>({x})),v=>value(s,v));});
  check(4,q=>{const [s]=match(q,/因式分解 (.+)。/);const samples=[-3,-1,0,1,2,4].flatMap(x=>[-2,-.5,0,1,3].map(y=>({x,y})));expressions(q,samples,v=>value(s,v));});
  check(5,q=>{const [s,a,b]=match(q,/h\(x\)=(.+)，t.+求 h\((.+)\)-h\((.+)\)。/);expressions(q,[-5,-2,-.5,0,.25,1,3,7].map(t=>({t})),v=>value(s,{x:value(a,v)})-value(s,{x:value(b,v)}));});
  check(6,q=>{const [s,root,target]=match(q,/q\(x\)=(.+) 含有因式 x\+(\d+).+求 q\((\d+)\)/);const b=value(s,{a:0,x:-root}),m=value(s,{a:1,x:-root})-b,a=-b/m;near(value(s,{a,x:-root}),0);numeric(q,value(s,{a,x:+target}));});
  check(7,q=>{const [lhs,rhs]=match(q,/滿足 (.+)≡(.+)。求 k/);const coeff=(s,v)=>value(s,{...v,x:1})-value(s,{...v,x:0});const b=coeff(lhs,{h:0}),m=coeff(lhs,{h:1})-b,h=(coeff(rhs,{k:0})-b)/m,k=value(lhs,{x:0,h})-value(rhs,{x:0,k:0});for(const x of [-3,0,1,5])near(value(lhs,{x,h}),value(rhs,{x,k}));numeric(q,k);});
  check(8,q=>{
    const [first,second]=match(q,/分別為 (.+?) 及 (.+?)，其中/),m=g[q.diagram.type],c1=line(first,m),c2=line(second,m);
    assert.ok(-c1[0]/c1[1]>0&&-c2[0]/c2[1]<0);assert.ok(-c1[2]/c1[1]>0&&-c2[2]/c2[1]>-c1[2]/c1[1]);
    const cs=relations(q),samples=[];
    for(const a of [-.2,-1,-4,-11])for(const b of [.3,2,7])for(const delta of [.01,1,10]){const v={a,b,c:0},l=line(first,v),y=-l[2]/l[1]+delta;v.c=-line(second,v)[1]*y;samples.push(v);}
    statements(q,cs.map(s=>samples.every(v=>condition(s,v))));diagramDone.add(8);
  });
  check(9,q=>{const [profit]=nums(q,/盈利百分率為 ([\d.]+)%/);numeric(q,100*profit/(100+profit));});
  check(10,q=>{const [actual,map]=nums(q,/面積為 ([\d.]+) km².+佔 ([\d.]+) cm²/);const ratio=Math.sqrt(actual*1e10/map);const opts=q.options.map(s=>s.split(":").map(Number));distinct(q,opts.map(([a,b])=>a/b));unique(q,opts.map(([a,b])=>close(b/a,ratio)));});
  check(11,q=>{const [x,y,z,u,v]=nums(q,/當 x=(\d+)、y=(\d+) 時，z=(\d+)。求 x=(\d+)、y=(\d+)/);assert.ok(q.prompt.includes("立方")&&q.prompt.includes("平方根正變"));numeric(q,z*(u/x)**3*Math.sqrt(v/y));});
  check(12,q=>{const [first,a,b,target]=nums(q,/有 (\d+) 粒.+多 (\d+)n\+(\d+) 粒.+第 (\d+) 個圖案的點子/);let result=first;const counts=[first];for(let n=1;n<target;n++){result+=a*n+b;if(n<3)counts.push(result);}numeric(q,result);assert.deepEqual(Array.from(g[q.diagram.type].counts),counts);near(g[q.diagram.type].first,first);assert.deepEqual(Array.from(g[q.diagram.type].increment),[a,b]);assert.equal((w.pilotDiagram2020(q.diagram.type).match(/<circle/g)||[]).length,sum(counts));diagramDone.add(12);});
  check(13,q=>{const cs=match(q,/滿足 (.+) 及 (.+) 的 x/),samples=Array.from({length:81},(_,i)=>({x:(i-40)/4}));expressions(q,samples,v=>cs.every(s=>condition(s,v)),condition);});
  check(14,q=>{
    const p=points(q),h=dist(p.J,p.K),b=dist(p.K,p.L),s=dist(p.L,p.M),t=dist(p.J,p.N);
    for(const v of [h,b,s,t])assert.ok(Number.isInteger(v));near(dot(sub(p.J,p.K),sub(p.L,p.K)),0);near(dot(sub(p.K,p.L),sub(p.M,p.L)),0);near(dot(sub(p.K,p.J),sub(p.N,p.J)),0);
    const svg=w.pilotDiagram2020(q.diagram.type);for(const v of [h,b,s,t])assert.ok(svg.includes(`>${v} cm</text>`));assert.ok(q.prompt.includes("最接近的 cm"));
    const measure=(h,b,s,t)=>(b*(h+s)+t*(h-s))/2;near(measure(h,b,s,t),polygon([p.J,p.K,p.L,p.M,p.N]));
    assert.ok(b-.5>t+.5&&h-.5>s+.5);const lo=measure(h-.5,b-.5,s-.5,t-.5),hi=measure(h+.5,b+.5,s+.5,t+.5);
    const corners=[];for(let mask=0;mask<16;mask++)corners.push(measure(...[h,b,s,t].map((v,i)=>v+((mask>>i)&1?.5:-.5))));near(Math.min(...corners),lo);near(Math.max(...corners),hi);
    const samples=[lo-1,lo,lo+.01,(lo+hi)/2,hi-.01,hi,hi+1,...q.options.flatMap(o=>o.match(/[\d.]+/g).map(Number))].map(A=>({A}));expressions(q,samples,v=>v.A>=lo&&v.A<hi,condition);
  });
  check(15,q=>{const [decrease]=nums(q,/減少 (\d+)%/);numeric(q,100*(1/(1-decrease/100)-1));});
  check(16,q=>{const [r,h,V,R,H]=nums(q,/半徑為 (\d+)a cm，高為 (\d+)b cm，體積為 (\d+) cm³.+半徑為 (\d+)a cm，高為 (\d+)b cm/);numeric(q,V*R*R*H/(3*r*r*h)," cm³");});
  check(17,q=>{const [a,b,c]=nums(q,/OJ:JK:KR=(\d+):(\d+):(\d+)/),p=points(q);near(dist(p.O,p.J)/a,dist(p.J,p.K)/b);near(dist(p.J,p.K)/b,dist(p.K,p.R)/c);for(const pair of [["J","M"],["K","N"]])near(det(sub(p[pair[1]],p[pair[0]]),sub(p.S,p.R)),0);const v=polygon([p.J,p.K,p.N,p.M])/polygon([p.K,p.R,p.S,p.N]);near(v,((a+b)**2-a*a)/((a+b+c)**2-(a+b)**2));const opts=q.options.map(o=>{const [x,y]=o.split(":").map(Number);return x/y;});distinct(q,opts);unique(q,opts.map(x=>close(x,v)));});
  check(18,q=>{const [a,b,A]=nums(q,/JN:NM=(\d+):(\d+).+面積為 (\d+) cm²/),p=points(q);near(dist(p.J,p.N)/dist(p.N,p.M),a/b);near(dist(p.K,p.P),dist(p.M,p.N));near(area(p.J,p.N,p.Q),A);for(const [a,b,c] of [["L","K","P"],["N","Q","P"],["J","Q","K"],["K","R","M"],["L","R","Q"]])near(det(sub(p[a],p[b]),sub(p[c],p[b])),0);near(det(sub(p.J,p.M),sub(p.K,p.L)),0);near(det(sub(p.J,p.K),sub(p.M,p.L)),0);numeric(q,area(p.L,p.M,p.R)," cm²");near(area(p.L,p.M,p.R)/A,(a+b)**3/(a*a*(a+2*b)));});
  check(19,q=>{const p=points(q),alpha=angle(p.U,p.A,p.B),beta=360-angle(p.A,p.B,p.C),gamma=angle(p.V,p.C,p.B);near(det(sub(p.U,p.A),sub(p.C,p.V)),0);near(beta,180+gamma-alpha);assert.ok(beta>180);const cs=relations(q),samples=[];for(const a of [5,15,30,50])for(const c of [75,110,140])if(c>a)samples.push({α:a,β:180+c-a,γ:c});statements(q,cs.map(s=>samples.every(v=>condition(s,v))));});
  check(20,q=>{const [theta,phi]=nums(q,/∠MLN=(\d+)°，∠JML=∠LJM=(\d+)°/),p=points(q);near(dist(p.J,p.K),dist(p.K,p.L));near(dist(p.J,p.L),dist(p.K,p.L));near(dist(p.L,p.M),dist(p.L,p.N));near(angle(p.M,p.L,p.N),theta);near(angle(p.J,p.M,p.L),phi);near(angle(p.L,p.J,p.M),phi);const result=angle(p.L,p.K,p.N);near(result,(theta-2*phi+60)/2);numeric(q,result,"°");});
  check(21,q=>{const [a,b,c]=nums(q,/KN=(\d+) cm、LN=(\d+) cm 及 KL=(\d+) cm/),p=points(q);near(dist(p.K,p.N),a);near(dist(p.L,p.N),b);near(dist(p.K,p.L),c);near(a*a+b*b,c*c);near(det(sub(p.N,p.J),sub(p.M,p.J)),0);near(dot(sub(p.J,p.K),sub(p.L,p.K)),0);numeric(q,polygon([p.J,p.K,p.L,p.M])," cm²");near(polygon([p.J,p.K,p.L,p.M]),a*b);});
  check(22,q=>{const [a,b,theta,phi]=nums(q,/JK=(\d+) cm、KL=(\d+) cm、∠JKL=(\d+)° 及 ∠LNM=(\d+)°/),p=points(q),m=g[q.diagram.type];for(const v of Object.values(p))near(dist(v,m.centre),m.radius);near(dist(p.J,p.K),a);near(dist(p.K,p.L),b);near(angle(p.J,p.K,p.L),theta);near(angle(p.L,p.N,p.M),phi);near(dist(p.L,p.M),Math.hypot(a,b)*Math.sin(phi*rad));numeric(q,Math.round(dist(p.L,p.M))," cm");});
  check(23,q=>{const [d,bearing]=nums(q,/以東 (\d+) km.+沿 N(\d+)°W/),u=[-Math.sin(bearing*rad),Math.cos(bearing*rad)],offset=[-d,0],t=dot(offset,u);assert.ok(t>0);numeric(q,dist(offset,u.map(x=>x*t))," km");});
  check(24,q=>{const [shift,x,y]=nums(q,/向左平移 (\d+) 單位.+反射影像為 \(([-\d]+),([-\d]+)\)/),target=[-x+shift,y];const opts=q.options.map(s=>{const [r,t]=s.slice(1,-1).split(",");const a=value(t)*rad;return [value(r)*Math.cos(a),value(r)*Math.sin(a)];});distinct(q,opts);unique(q,opts.map(v=>same(v,target)));});
  check(25,q=>{const [a,b,radius]=match(q,/直線 (.+?) 與 (.+?) 相交於 A.+PA=(\d+)/),centre=solveLines(line(a),line(b)),R=+radius;assert.ok(R>0);for(let d=0;d<360;d+=30){const p=[centre[0]+R*Math.cos(d*rad),centre[1]+R*Math.sin(d*rad)];near(dist(p,centre),R);}const meanings={"圓":"constant-distance","正方形":"square","直線":"line","線段":"segment"};distinct(q,q.options.map(o=>meanings[o]));unique(q,q.options.map(o=>meanings[o]==="constant-distance"));});
  check(26,q=>{const [a,b]=match(q,/方程為 (.+?)，其中.+直線 (.+?)，求/),l=line(b),co=line(a,{k:1}),k0=line(a,{k:0}),k=-(k0[0]*l[0]+k0[1]*l[1])/((co[0]-k0[0])*l[0]+(co[1]-k0[1])*l[1]),L=line(a,{k});near(L[0]*l[0]+L[1]*l[1],0);numeric(q,-L[2]/L[1]);});
  check(27,q=>{const [a,b]=match(q,/分別為 (.+?) 及 (.+?)。下列/),c1=circle(a),c2=circle(b),d=dist(c1.centre,c2.centre);assert.ok(q.prompt.includes("I C₁ 的圓心在 C₂ 上")&&q.prompt.includes("II 兩圓半徑相等")&&q.prompt.includes("III 兩圓有兩個相異交點"));statements(q,[close(d,c2.radius),close(c1.radius,c2.radius),Math.abs(c1.radius-c2.radius)<d&&d<c1.radius+c2.radius]);});
  check(28,q=>{const [list,limit]=match(q,/標有 (.+?)。.+乘積大於 (\d+)/),cards=list.split("、").map(Number);let count=0,total=0;for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){total++;if(cards[i]*cards[j]>+limit)count++;}numeric(q,count/total);});
  check(29,q=>{const [N]=nums(q,/(\d+) 名學生/),m=g[q.diagram.type],values=m.values.flatMap((v,i)=>Array(m.frequencies[i]).fill(v));assert.equal(values.length,N);const half=N/2,Q1=median(values.slice(0,half)),Q3=median(values.slice(half));numeric(q,Q3-Q1);const svg=w.pilotDiagram2020(q.diagram.type),heights=[...svg.matchAll(/<rect[^>]*height="([\d.]+)"/g)].map(m=>+m[1]);assert.equal(heights.length,m.frequencies.length);heights.forEach((h,i)=>near(h/m.frequencies[i],heights[0]/m.frequencies[0]));diagramDone.add(29);});
  check(30,q=>{const [list,range]=match(q,/整數為 (.+)、m、n，其分布域為 (\d+)/),known=list.split("、").map(Number),[c1,c2]=match(q,/I (.+?)；II (.+?)；III/),[mode]=nums(q,/III (\d+) 必定是唯一眾數/),lo=Math.min(...known),hi=Math.max(...known);assert.equal(hi-lo,+range);const truths=[true,true,true];for(let m=lo;m<=hi;m++)for(let n=lo;n<=hi;n++){const a=[...known,m,n],counts=new Map();for(const v of a)counts.set(v,(counts.get(v)||0)+1);const modes=[...counts].filter(([,v])=>v===Math.max(...counts.values())).map(([v])=>v);truths[0]&&=condition(c1,{x:median(a)});truths[1]&&=condition(c2,{y:mean(a)});truths[2]&&=modes.length===1&&modes[0]===mode;}statements(q,truths);});
  check(31,q=>{const [hex]=match(q,/數 ([0-9A-F]+)₁₆/),target=BigInt(`0x${hex}`),opts=q.options.map(s=>{const m=normalize(s).match(/^(\d+)\*2\^\((\d+)\)\+(\d+)$/);assert.ok(m);return BigInt(m[1])*2n**BigInt(m[2])+BigInt(m[3]);});distinct(q,opts);unique(q,opts.map(v=>v===target));});
  check(32,q=>{const [subscript,b,c,rhs]=match(q,/\(log([₀-₉])x\)²-(\d+)log[₀-₉]x\+(\d+)=([\d]*)log[₀-₉]x/),base="₀₁₂₃₄₅₆₇₈₉".indexOf(subscript),B=+b+(rhs===""?1:+rhs),C=+c,disc=B*B-4*C;assert.ok(base>0&&base!==1&&disc>0);const roots=[(B-Math.sqrt(disc))/2,(B+Math.sqrt(disc))/2];for(const t of roots)near(t*t-(+b)*t+C,(rhs===""?1:+rhs)*t);numeric(q,base**sum(roots));});
  check(33,q=>{const [coefficient]=nums(q,/g\(x\)=(\d+)a\^x/),m=g[q.diagram.type];near(m.coefficient,coefficient);assert.ok(m.a>1&&m.b>0&&m.b<1);near(m.a*m.b,1);const cs=relations(q),samples=[1.01,1.3,2,4,11].map(a=>({a,b:1/a}));statements(q,cs.map(s=>samples.every(v=>condition(s,v))));for(const x of [-2,-1,0,.5,2])near(m.coefficient*m.a**(-x),m.coefficient*m.b**x);diagramDone.add(33);});
  check(34,q=>{const [x]=nums(q,/當 x=(\d+) 時/),[a,b]=g[q.diagram.type].intercepts;assert.ok(q.prompt.includes("x³ 與 √y"));const sqrtY=b*(1-x**3/a);assert.ok(sqrtY>=0);numeric(q,sqrtY**2);const svg=w.pilotDiagram2020(q.diagram.type);assert.ok(svg.includes(`>${String(a).replace("-","−")}</text>`)&&svg.includes(`>${b}</text>`));diagramDone.add(34);});
  check(35,q=>{const groups=match(q,/\nI (.+?)；\nII (.+?)；\nIII (.+?)。/).map(s=>s.split("、"));assert.ok(groups.every(g=>g.length===3));const tests=[.1,.5,1,2,17,45,90,180,270,360];const truths=groups.map(g=>tests.every(a=>{const vs=g.map(s=>value(s,{a}));return close(vs[1]-vs[0],vs[2]-vs[1]);}));statements(q,truths);});
  check(36,q=>{const [min,max,c1,c2,objective,target]=match(q,/不等式 (\d+)≤x≤(\d+)、(.+?)≥0 及 (.+?)≤0 定義。已知 (.+?)\+k 在 D 上的最小值為 (\d+)/),l1=line(c1+"=0"),l2=line(c2+"=0"),p=[];for(const x of [+min,+max])for(const l of [l1,l2])p.push([x,-(l[0]*x+l[2])/l[1]]);const feasible=([x,y])=>x>=+min&&x<=+max&&value(c1,{x,y})>=-1e-9&&value(c2,{x,y})<=1e-9;assert.ok(p.every(feasible));const opt=Math.min(...p.map(([x,y])=>value(objective,{x,y})));numeric(q,+target-opt);});
  check(37,q=>{const [a,b]=nums(q,/z₁=\((\d+)\+ki\).+z₂=\(k\+(\d+)i\)/);assert.ok(q.prompt.includes("/(1+i)")&&q.prompt.includes("/(2-i)"));const divide=([x,y],[u,v])=>[(x*u+y*v)/(u*u+v*v),(y*u-x*v)/(u*u+v*v)],imag=k=>divide([a,k],[1,1])[1]-divide([k,b],[2,-1])[1],k=-imag(0)/(imag(1)-imag(0)),z1=divide([a,k],[1,1]),z2=divide([k,b],[2,-1]);near(z1[1],z2[1]);numeric(q,z1[0]-z2[0]);});
  check(38,q=>{
    const [edge,low,high,multiplier]=nums(q,/JK=JL=(\d+) cm、JQ=(\d+) cm、NQ=(\d+) cm，且 KM=(\d+)k cm/),p=points(q);
    near(dist(p.J,p.K),edge);near(dist(p.J,p.L),edge);near(dist(p.J,p.Q),low);near(dist(p.N,p.Q),high);near(dist(p.J,p.N),low+high);
    for(const [bottom,top] of [["J","N"],["K","P"],["L","M"]])assert.ok(same(sub(p[top],p[bottom]),sub(p.N,p.J)));
    near(dot(sub(p.N,p.J),sub(p.K,p.J)),0);near(dot(sub(p.N,p.J),sub(p.L,p.J)),0);
    const examples=[.3,.7,1.2,1.7,2.3,2.9].map(theta=>{const K=[edge,0,0],M=[edge*Math.cos(theta),edge*Math.sin(theta),low+high],Q=[0,0,low];return {k:dist(K,M)/multiplier,expected:Math.hypot(...cross3(sub(K,Q),sub(M,Q)))/2};});
    const modelArea=Math.hypot(...cross3(sub(p.K,p.Q),sub(p.M,p.Q)))/2;examples.push({k:dist(p.K,p.M)/multiplier,expected:modelArea});
    expressions(q,examples,v=>v.expected,(s,v)=>{assert.ok(s.endsWith(" cm²"));return value(s.slice(0,-4),v);});
  });
  check(39,q=>{const [alpha,beta]=nums(q,/∠JMN=(\d+)° 及 ∠KLT=(\d+)°/),p=points(q),m=g[q.diagram.type];for(const a of ["J","K","L"])near(dist(p[a],m.centre),m.radius);for(const a of ["L","M","N"])near(dist(p[a],m.innerCentre),m.innerRadius);near(det(sub(p.J,p.M),sub(p.L,p.M)),0);near(det(sub(p.J,p.N),sub(p.K,p.N)),0);near(dot(sub(p.N,m.innerCentre),sub(p.K,p.J)),0);near(dot(sub(p.L,m.centre),sub(p.T,p.P)),0);near(dot(sub(p.L,m.innerCentre),sub(p.T,p.P)),0);near(angle(p.J,p.M,p.N),alpha);near(angle(p.K,p.L,p.T),beta);const result=angle(p.J,p.K,p.L);near(result,2*alpha+beta-180);numeric(q,result,"°");});
  check(40,q=>{const [a,b,Ix]=match(q,/直線為 (.+?)、(.+?) 及 x=a.+x 坐標為 (\d+)/),L=line(a),M=line(b);near(L[0],M[0]);near(L[1],-M[1]);near(L[2],M[2]);const apex=solveLines(L,M),x=+Ix,r=Math.abs(L[0]*x+L[2])/Math.hypot(L[0],L[1]),candidates=[x-r,x+r].filter(a=>(x-apex[0])*(x-a)<0);assert.equal(candidates.length,1);numeric(q,candidates[0]);});
  check(41,q=>{
    const [circ,l]=match(q,/使圓 (.+?) 與直線 (.+?) 至少/),L=line(l),quad=c=>{const f=x=>eq(circ,{x,y:-(L[0]*x+L[2])/L[1],c}),C=f(0),A=(f(1)+f(-1)-2*C)/2,B=(f(1)-f(-1))/2;return B*B-4*A*C;};
    const C=quad(0),A=(quad(1)+quad(-1)-2*C)/2,B=(quad(1)-quad(-1))/2,D=B*B-4*A*C,roots=[(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)];
    const samples=[-100,-50,0,50,100,...roots.flatMap(v=>[v-1,v-.001,v,v+.001,v+1]),...q.options.flatMap(o=>o.match(/-?\d+/g).map(Number))].map(c=>({c}));
    for(const v of samples)circle(circ,v);expressions(q,samples,v=>quad(v.c)>=-1e-8,condition);
  });
  check(42,q=>{const [m,n]=nums(q,/(\d+) 名導賞員與 (\d+) 名攝影師/);const memo=new Map();function types(a,b,last){if(!a&&!b)return 1;const key=[a,b,last].join(",");if(memo.has(key))return memo.get(key);const v=(a&&!last?types(a-1,b,true):0)+(b?types(a,b-1,false):0);memo.set(key,v);return v;}numeric(q,types(m,n,false)*factorial(m)*factorial(n));});
  check(43,q=>{const [a,b,n,max]=nums(q,/有 (\d+) 枚紅色及 (\d+) 枚藍色.+抽出 (\d+) 枚.+至多 (\d+) 枚紅色/);let good=0;for(let red=0;red<=max;red++)good+=choose(a,red)*choose(b,n-red);numeric(q,good/choose(a+b,n));});
  check(44,q=>{const [difference,z]=nums(q,/相差 ([\d.]+) 分.+標準分相差 ([\d.]+)/);numeric(q,difference/z," 分");});
  check(45,q=>{const [list]=match(q,/六個數為 (.+?)，其中/),terms=list.split("、");assert.equal(terms.length,6);expressions(q,[-10,-1,0,.5,2,7].map(a=>({a})),v=>{const xs=terms.map(s=>value(s,v)),mu=mean(xs);return mean(xs.map(x=>(x-mu)**2));});});
  assert.equal(done.size,45);assert.equal(diagramDone.size,14);
  if(!quiet)console.log("2020 Paper 2: 45/45 condition-derived checks; 180 options distinct with one answer per item; 14 diagram contracts; sections 30+15; polar Q24 retained. No MC method marks.");
  return {questions:45,diagrams:14};
}

if(require.main===module){const w=read();verify(w);if(process.argv.includes("--self-test")){
  let rejected=0;
  for(const q of w.PILOT_2020.questions){const answer=q.answer;q.answer="ABCD"[("ABCD".indexOf(answer)+1)%4];assert.throws(()=>verify(w,{quiet:true}),`Q${q.n} altered key accepted`);q.answer=answer;rejected++;
    const options=[...q.options];q.options[0]=q.options[1];assert.throws(()=>verify(w,{quiet:true}),`Q${q.n} duplicate accepted`);q.options=options;rejected++;}
  for(const kind of Object.keys(w.pilotDiagram2020Geometry)){const trial=read(),m=trial.pilotDiagram2020Geometry[kind];if(m.points){const name=Object.keys(m.points)[0];m.points[name][kind==="reflex2020"?1:0]+=.7;}else if(m.frequencies)m.frequencies[0]++;else if(m.counts)m.counts[0]++;else if(m.intercepts)m.intercepts[0]++;else if(kind==="lines2020")m.a=Math.abs(m.a);else m.a+=.3;assert.throws(()=>verify(trial,{quiet:true}),`${kind} altered geometry accepted`);rejected++;}
  const changes=[
    ["8x²","10x²"],["5(y-x)","7(y-x)"],["7/(3x+2)","8/(3x+2)"],["(5x-2y)","(6x-2y)"],["4x²","5x²"],
    ["-72","-90"],["x+9","x+10"],["ac>2b","ac<2b"],["60%","50%"],["1.28","1.8"],
    ["z=54","z=60"],["有 4 粒","有 6 粒"],["(3x-2)/5>2","(3x-2)/5>5"],["最接近的 cm","最接近的 mm"],["75%","50%"],
    ["864","960"],["2:1:2","2:2:2"],["117","118"],["β-γ<180°","β-γ>180°"],["86°","88°"],
    ["7 cm","8 cm"],["46°","48°"],["36 km","40 km"],["6 單位","7 單位"],["PA=6","PA=0"],
    ["8y-6k","8y-8k"],["-40=0","-190=0"],["大於 22","大於 30"],["28 名","30 名"],["x=6","x=8"],
    ["D00000000000050","C00000000000050"],["²-8log","²-9log"],["I a>1","I a<1"],["x=3","x=2"],["log(a⁸)","log(a⁹)"],
    ["最小值為 30","最小值為 32"],["3+ki","5+ki"],["JQ=8","JQ=9"],["104°","106°"],["坐標為 26","坐標為 31"],
    ["-15=0","-16=0"],["7 名導賞員","8 名導賞員"],["至多 3 枚","至多 2 枚"],["42 分","49 分"],["12a+17","12a+19"]
  ];
  changes.forEach(([before,after],i)=>{const trial=read(),q=trial.PILOT_2020.questions[i];assert.ok(q.prompt.includes(before));q.prompt=q.prompt.replace(before,after);assert.throws(()=>verify(trial,{quiet:true}),`Q${i+1} changed condition accepted`);rejected++;});
  console.log(`Mutation self-test: ${rejected} cases rejected (45 keys, 45 duplicate options, 14 diagram contracts, 45 question conditions).`);
}}
module.exports={verify,read,value,condition};
