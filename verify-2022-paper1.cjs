const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const load=file=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),"utf8"),context,{filename:file});
  return context.window;
};
const data=JSON.parse(JSON.stringify(load("paper1/data-2022.js").PILOT_2022));
const math=load("paper1/math.js");
let notationStrings=0;
const assertRenderedNotation=(html,label)=>{
  const visible=html.replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,"").replace(/<[^>]+>/g,"");
  assert.doesNotMatch(visible,/[\/÷√]/,`${label}: unrendered division or square root`);
};
function scanNotation(value,label) {
  if(typeof value==="string") {
    const html=math.mathText(value);
    assertRenderedNotation(html,label);
    assert.equal((html.match(/<msqrt>/g)||[]).length,(value.match(/√/g)||[]).length,`${label}: missing root overbar`);
    notationStrings++;
  } else if(value&&typeof value==="object") {
    for(const [key,item] of Object.entries(value))scanNotation(item,`${label}.${key}`);
  }
}
scanNotation(data,"2022 P1");
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const mean=xs=>sum(xs)/xs.length;
const variance=xs=>mean(xs.map(x=>(x-mean(xs))**2));
const median=xs=>{
  const sorted=[...xs].sort((a,b)=>a-b),n=sorted.length;
  return n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;
};
const modes=xs=>{
  const counts=new Map();
  for(const x of xs)counts.set(x,(counts.get(x)||0)+1);
  const largest=Math.max(...counts.values());
  return [...counts].filter(([,count])=>count===largest).map(([x])=>x).sort((a,b)=>a-b);
};
const range=xs=>Math.max(...xs)-Math.min(...xs);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const distance=(a,b)=>Math.hypot(...sub(a,b));
const radians=Math.PI/180;
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(distance(a,b)*distance(c,b)))))/radians;
const area=(a,b,c)=>Math.abs(cross(sub(b,a),sub(c,a)))/2;
const lineDistance=(p,a,b)=>Math.abs(cross(sub(b,a),sub(p,a)))/distance(a,b);
const choose=(n,r)=>{
  let result=1;
  for(let i=1;i<=r;i++)result=result*(n-i+1)/i;
  return result;
};
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const fraction=(n,d)=>{const g=gcd(n,d);return `${n/g}/${d/g}`;};
const solution=n=>data.questions[n-1].solution.flatMap(part=>part.steps.flatMap(step=>step.text)).join("\n");
const includes=(text,fragments,label)=>{
  for(const fragment of fragments)assert.ok(text.includes(fragment),`${label}: missing ${fragment}`);
};
const prompt=(n,...fragments)=>includes(data.questions[n-1].prompt,fragments,`Q${n} input drift`);
const worked=(n,...fragments)=>includes(solution(n),fragments,`Q${n} worked result drift`);
const checked=new Set();
function check(n,calculate) {
  assert.ok(!checked.has(n),`Q${n} checked twice`);
  assert.equal(data.questions[n-1].answer,calculate(),`Q${n} answer disagrees with independent calculation`);
  checked.add(n);
}

assert.equal(data.year,2022);
assert.equal(data.paper,1);
assert.equal(data.questions.length,19);
const marks=[3,3,3,4,4,4,4,5,5,6,7,7,7,8,4,5,7,7,12];
const groups=[null,null,null,{a:2,b:2},null,{a:3,b:1},{a:2,b:2},{a:2,b:3},{a:1,b:3,c:1},{a:3,b:1,c:2},{a:3,b:4},{a:3,b:4},{a:3,b:4},{a:3,b:2,c:3},{a:2,b:2},{a:2,b:3},{a:3,b:4},{a:4,b:3},{a:2,b:3,c:4,d:3}];
for(const [i,q] of data.questions.entries()) {
  assert.equal(q.n,i+1);
  assert.equal(q.sourceNo,q.n);
  assert.equal(q.section,q.n<10?"甲一":q.n<15?"甲二":"乙部");
  assert.equal(q.marks,marks[i]);
  assert.ok(q.topic&&q.prompt&&q.answer&&q.hints.length&&q.hints.every(x=>typeof x==="string"&&x.trim()));
  assert.doesNotMatch(JSON.stringify(q),/填空|找錯|改錯|[橫縱横纵]|恆等於|½|÷|角邊角|邊角邊|角角邊|斜邊直角邊|（等角）|待補|待計算|TODO/);
  const totals={};
  for(const part of q.solution) {
    const key=part.part.match(/^\(([a-z])\)/)?.[1];
    assert.ok(part.steps.length);
    for(const step of part.steps) {
      assert.match(step.marks,/^[1-9]\d*[MA]$/);
      assert.ok(Array.isArray(step.text)&&step.text.length);
      for(const text of step.text) {
        assert.ok(typeof text==="string"&&text.trim());
        assert.doesNotMatch(text,/(?:^|[。；\n])\s*[=≈]/,`Q${q.n}: detached calculation`);
      }
      assertRenderedNotation(math.solutionHtml(step.text),`Q${q.n}: formatted solution`);
      if(key)totals[key]=(totals[key]||0)+parseInt(step.marks,10);
      for(const block of math.solutionLayout(step.text)) {
        if(block.type==="calculation")assert.ok(block.rows[0].lhs,`Q${q.n}: rendered orphan equality`);
        else assert.doesNotMatch(block.text,/^(所以|因此|故|得)[，。；]?$/);
      }
    }
  }
  assert.equal(sum(q.solution.flatMap(part=>part.steps.map(step=>parseInt(step.marks,10)))),q.marks);
  assert.deepEqual(q.markGroups||null,groups[i]);
  if(groups[i])assert.deepEqual(totals,groups[i],`Q${q.n}: subpart allocation`);
}
assert.deepEqual(["甲一","甲二","乙部"].map(section=>sum(data.questions.filter(q=>q.section===section).map(q=>q.marks))),[35,35,35]);

check(1,()=>{
  prompt(1,"(u²v⁻³)⁵/(u⁻⁴v²)","u、v 均不為零");
  const powers=[2*5-(-4),-3*5-2];
  assert.deepEqual(powers,[14,-17]);
  for(const u of [-3,-.5,.5,2])for(const v of [-2,-.5,.5,3])near((u**2*v**-3)**5/(u**-4*v**2),u**powers[0]*v**powers[1]);
  return "u¹⁴/v¹⁷";
});
check(2,()=>{
  prompt(2,"兩數之和為 735","q 為 p 的 4 倍");
  const p=735/(1+4),q=4*p;
  near(p+q,735);near(q/p,4);
  return String(p);
});
check(3,()=>{
  prompt(3,"4/(t-6)+3/(2t+9)","t≠6 及 t≠-9/2");
  const coefficient=4*2+3,constant=4*9-3*6;
  assert.notEqual(coefficient*6+constant,0);
  assert.notEqual(coefficient*(-9/2)+constant,0);
  for(const t of [-10,-5,-4.6,-4.4,-1,0,2,5.9,6.1,11])near(4/(t-6)+3/(2*t+9),(coefficient*t+constant)/((t-6)*(2*t+9)));
  return `(${coefficient}t+${constant})/((t-6)(2t+9))`;
});
check(4,()=>{
  prompt(4,"16p²-24p+9","(6p+q)²-16p²+24p-9");
  for(let p=-5;p<=5;p+=.5)for(let q=-4;q<=4;q+=.5) {
    near(16*p*p-24*p+9,(4*p-3)**2);
    near((6*p+q)**2-16*p*p+24*p-9,(2*p+q+3)*(10*p+q-3));
  }
  return "(4p-3)²；(2p+q+3)(10p+q-3)";
});
check(5,()=>{
  prompt(5,"九折","盈利為 $126","盈利百分率為 35%");
  const cost=126/.35,marked=(cost+126)/.9;
  near(marked*.9-cost,126);near((marked*.9-cost)/cost,.35);
  return `$${marked}`;
});
check(6,()=>{
  prompt(6,"-3(2x+1)>x+18 或 3x≤-15","最大整數");
  const satisfies=x=>-3*(2*x+1)>x+18||3*x<=-15;
  for(let x=-12;x<=6;x+=.125)assert.equal(satisfies(x),x<-3);
  const largest=Math.max(...Array.from({length:41},(_,i)=>i-20).filter(satisfies));
  assert.equal(satisfies(-3),false);
  return `x<-3；${largest}`;
});
check(7,()=>{
  prompt(7,"(9,-4)、(-6,-2)","逆時針旋轉 90°","對 x 軸");
  const s=[9,-4],t=[-6,-2],sr=[-s[1],s[0]],tr=[t[0],-t[1]];
  near(dot(s,sr),0);near(distance(s,[0,0]),distance(sr,[0,0]));
  near((sr[1]-tr[1])/(sr[0]-tr[0]),7/10);
  return `(${sr})；(${tr})；${fraction(sr[1]-tr[1],sr[0]-tr[0])}`;
});
check(8,()=>{
  prompt(8,"JL//NM，JM//KL","JK=JN","∠JKL=∠JNM","∠JKL=42°","∠MJN=82°");
  const other=180-42-82,length=Math.sin(other*radians)/Math.sin(42*radians);
  const j=[0,0],m=[1,0],l=[Math.cos(other*radians),-Math.sin(other*radians)];
  const n=[length*Math.cos(82*radians),length*Math.sin(82*radians)];
  const k=[-length*Math.cos(42*radians),-length*Math.sin(42*radians)];
  near(cross(sub(l,j),sub(m,n)),0);near(cross(sub(m,j),sub(l,k)),0);
  near(distance(j,k),distance(j,n));near(angle(j,k,l),42);near(angle(j,n,m),42);near(angle(m,j,n),82);
  near(angle(j,l,k),angle(j,m,n));near(angle(l,j,m),other);
  for(const [a,b] of [[distance(j,k),distance(j,n)],[distance(k,l),distance(n,m)],[distance(l,j),distance(m,j)]])near(a,b);
  const quadrilateral=[k,l,m,n];
  for(let i=0;i<4;i++)assert(cross(sub(quadrilateral[(i+1)%4],quadrilateral[i]),sub(j,quadrilateral[i]))>0,"J must lie inside KLMN");
  const target=(180-other)/2;
  near(angle(j,l,m),target);
  worked(8,"∠LJM=∠JMN（內錯角）","∠JLK=∠LJM（內錯角）","△JKL≅△JNM（AAS）");
  return `AAS；${target}°`;
});
check(9,()=>{
  prompt(9,"20 批","少於 29.5 分鐘");
  const rows=data.questions[8].diagram.rows;
  assert.deepEqual(rows[1],["頻數","a","8","b","2"]);
  assert.deepEqual(rows[2],["累積頻數","4","c","18","20"]);
  const intervals=rows[0].slice(1).map(cell=>cell.split("–").map(Number));
  assert.deepEqual(intervals,[[19.5,24.5],[24.5,29.5],[29.5,34.5],[34.5,39.5]]);
  const frequencies=[Number(rows[2][1]),Number(rows[1][2]),0,Number(rows[1][4])];
  frequencies[2]=Number(rows[2][3])-sum(frequencies.slice(0,2));
  const total=sum(frequencies),c=sum(frequencies.slice(0,2));
  const midpoints=intervals.map(([lower,upper])=>(lower+upper)/2);
  const weightedSum=sum(midpoints.map((x,i)=>x*frequencies[i]));
  assert.equal(total,20);assert.equal(weightedSum,570);
  worked(9,`c=${frequencies[0]}+${frequencies[1]}=${c}`,`${weightedSum}/20`,`${weightedSum/total} 分鐘`);
  return `${c}；${weightedSum/total}分鐘；${fraction(c,total)}`;
});
check(10,()=>{
  prompt(10,"F(3)=54","F(-4)=-16","y=5F(x)","兩個相異實根");
  const determinant=9*(-4)-3*16,a=(54*(-4)-3*(-16))/determinant,b=(9*(-16)-54*16)/determinant;
  const f=x=>a*x*x+b*x;
  near(f(3),54);near(f(-4),-16);near(5*f(0),0);near(5*f(-b/a),0);
  const minimum=f(-b/(2*a));
  for(const h of [-50,-18.1,-18,-17.9,0,100]) {
    const discriminant=b*b+4*a*h;
    assert.equal(discriminant>0,h>minimum);
    if(discriminant>0)for(const sign of [-1,1])near(f((-b+sign*Math.sqrt(discriminant))/(2*a)),h);
  }
  return `${a}x²+${b}x；0及${-b/a}；h>${minimum}`;
});
check(11,()=>{
  prompt(11,"20 名","中位數為 32 歲","四分位數間距為 12 歲","分布域減小","最大可能標準差");
  const rows=data.questions[10].diagram.rows;
  const ages=(a,b)=>rows.flatMap(row=>row.leaves.map(leaf=>row.stem*10+(leaf==="a"?a:leaf==="b"?b:Number(leaf))));
  const candidates=[];
  for(let a=0;a<=9;a++)for(let b=0;b<=9;b++) {
    const xs=ages(a,b);
    if(xs.every((x,i)=>i===0||x>=xs[i-1])&&median(xs)===32&&median(xs.slice(10))-median(xs.slice(0,10))===12)candidates.push([a,b]);
  }
  assert.deepEqual(candidates,[[3,2]]);
  const [a,b]=candidates[0],xs=ages(a,b);
  assert.equal(xs.length,20);assert.deepEqual(modes(xs),[35]);
  const reduced=[];
  for(let i=0;i<xs.length;i++) {
    const remaining=xs.filter((_,j)=>j!==i);
    assert.deepEqual(modes(remaining),[35]);
    if(range(remaining)<range(xs))reduced.push({removed:xs[i],total:sum(remaining),squares:sum(remaining.map(x=>x*x)),sd:Math.sqrt(variance(remaining))});
  }
  assert.deepEqual(reduced.map(({removed,total,squares})=>[removed,total,squares]),[[18,587,19129],[46,559,17337]]);
  for(const item of reduced) {
    near(item.sd**2,item.squares/19-(item.total/19)**2);
    worked(11,`移除 ${item.removed}：Σx=${item.total}，Σx²=${item.squares}`,`≈${item.sd.toFixed(6)}`);
  }
  const maximum=Math.max(...reduced.map(x=>x.sd));
  assert.equal(reduced.find(x=>x.sd===maximum).removed,18);
  return `a=${a}，b=${b}；不變；${maximum.toPrecision(3)}歲`;
});
check(12,()=>{
  prompt(12,"x²+y²-40x-60y+900=0","H(11,18)","面積最大");
  const g=[40/2,60/2],h=[11,18],radius=Math.sqrt(dot(g,g)-900),gh=distance(g,h);
  const unitPerpendicular=[-(h[1]-g[1])/gh,(h[0]-g[0])/gh];
  for(const sign of [-1,1]) {
    const p=g.map((x,i)=>x+sign*radius*unitPerpendicular[i]);
    near(p[0]**2+p[1]**2-40*p[0]-60*p[1]+900,0);
    near(dot(sub(p,g),sub(h,g)),0);near(area(g,h,p),gh*radius/2);
    near(gh+distance(g,p)+distance(h,p),60);
  }
  for(let degrees=0;degrees<360;degrees++) {
    const p=[g[0]+radius*Math.cos(degrees*radians),g[1]+radius*Math.sin(degrees*radians)];
    assert(area(g,h,p)<=gh*radius/2+1e-9);
  }
  return `${gh}；垂直；${gh+radius+Math.hypot(gh,radius)}`;
});
check(13,()=>{
  prompt(13,"表面面積比為 9:25","半徑為 5 cm","底半徑為 4 cm，高為 6 cm","底半徑為 8 cm");
  const large=5,small=large*Math.sqrt(9/25),smallVolume=4*small**3/3,totalVolume=4*(small**3+large**3)/3;
  const uVolume=4**2*6/3,vVolume=totalVolume-uVolume,height=vVolume*3/8**2;
  near(small**2/large**2,9/25);near(uVolume+8**2*height/3,totalVolume);near(height,8);
  assert.notEqual(4/8,6/height);assert.notEqual(vVolume/uVolume,(8/4)**3);
  worked(13,"608π/3","512π/3","h=8","底半徑比 U:V=4:8=1:2，高之比=6:8=3:4");
  return `${smallVolume}π cm³；不正確`;
});
check(14,()=>{
  prompt(14,"p(x)=3x³+ax²+bx-8","x²-x+2","餘式為 -x+18","x-4","兩個無理根");
  const constant=(-8-18)/2,a=constant-3,b=5-constant,p=x=>3*x**3+a*x*x+b*x-8;
  for(let x=-8;x<=8;x+=.25) {
    near(p(x),(x*x-x+2)*(3*x+constant)-x+18);
    near(p(x),(x-4)*(3*x*x-4*x+2));
    near(3*x*x-4*x+2,3*(x-2/3)**2+2/3);
    assert(3*x*x-4*x+2>0);
  }
  near(p(4),0);assert((-4)**2-4*3*2<0);
  return `a=${a}，b=${b}；是；不同意`;
});
check(15,()=>{
  prompt(15,"8 名成人及 10 名青少年","選出 4 人","2 名成人及 2 名青少年");
  let total=0,equal=0;
  for(let a=0;a<18;a++)for(let b=a+1;b<18;b++)for(let c=b+1;c<18;c++)for(let d=c+1;d<18;d++) {
    total++;
    if([a,b,c,d].filter(x=>x<8).length===2)equal++;
  }
  near(total,choose(18,4));near(equal,choose(8,2)*choose(10,2));
  assert.equal(total,3060);assert.equal(equal,1260);
  return `${fraction(equal,total)}；${fraction(total-equal,total)}`;
});
check(16,()=>{
  prompt(16,"g(x)=2x²+12kx+23k²+5","k 為非零實數","y=3g(-x)","△OBM 的面積為 △OAM 面積的 4 倍");
  for(const k of [-5,-2,-.5,.25,1,4]) {
    const g=x=>2*x*x+12*k*x+23*k*k+5;
    const a=[-12*k/(2*2),g(-12*k/(2*2))],b=[-a[0],3*a[1]],m=a.map((x,i)=>(4*x+b[i])/5),o=[0,0];
    near(a[0],-3*k);near(a[1],5*k*k+5);near(m[0],-9*k/5);near(m[1],7*k*k+7);
    near(area(o,b,m)/area(o,a,m),4);near(cross(sub(m,a),sub(b,a)),0);
    for(let x=-7;x<=7;x+=.5)near(g(x),2*(x+3*k)**2+5*k*k+5);
    for(const offset of [-3,-1,1,3]) {
      assert(g(a[0]+offset)>g(a[0]));
      assert(3*g(-(b[0]+offset))>3*g(-b[0]));
    }
  }
  return "(-3k,5k²+5)；(-9k/5,7k²+7)";
});
check(17,()=>{
  prompt(17,"x²+cx-6=0","首三項依次為 c²、α²+β²、73","大於 500000");
  for(const c of [-10,-7,-1,0,1,7,10]) {
    const alpha=(-c+Math.sqrt(c*c+24))/2,beta=(-c-Math.sqrt(c*c+24))/2;
    near(alpha*alpha+c*alpha-6,0);near(beta*beta+c*beta-6,0);
    near(alpha*alpha+beta*beta,c*c+12);
  }
  const difference=12,first=73-2*difference;
  let n=0,total=0,previous=0;
  while(total<=500000) {
    previous=total;total+=first+n*difference;n++;
    near(total,n*(2*first+(n-1)*difference)/2);
    near(total,6*n*n+43*n);
  }
  assert.equal(previous,499605);assert.equal(total,503074);
  const discriminant=43**2+4*6*500000,boundary=(-43+Math.sqrt(discriminant))/(2*6);
  assert.equal(discriminant,12001849);assert(n-1<boundary&&boundary<n);
  worked(17,`√${discriminant}`,`≈${boundary.toFixed(3)}`,`S₂₈₅=6×285²+43×285=${previous}`,`S₂₈₆=6×286²+43×286=${total}`,`最小 n 為 ${n}`);
  return `c²+12；${n}`;
});
check(18,()=>{
  prompt(18,"JK=28 cm、JL=21 cm","∠KJL=100°","M 是 KL 的中點","夾角為 60°","超過 40°");
  // Construct the board in 3D to check the median and elevation independently.
  const j=[0,0,0],k=[28,0,0],lx=21*Math.cos(100*radians),lz=21*Math.sin(60*radians);
  const lySquared=21**2-lx**2-lz**2;
  assert(lySquared>0,"Board dimensions must permit this elevation");
  const l=[lx,Math.sqrt(lySquared),lz],m=k.map((x,i)=>(x+l[i])/2);
  near(distance(j,k),28);near(distance(j,l),21);near(angle(k,j,l),100);
  near(Math.asin(l[2]/distance(j,l))/radians,60);
  const kl=distance(k,l),atK=angle(j,k,l),jm=distance(j,m),elevation=Math.atan2(m[2],Math.hypot(m[0],m[1]))/radians;
  near(kl,Math.sqrt(28**2+21**2-2*28*21*Math.cos(100*radians)));
  near(Math.sin(atK*radians)/21,Math.sin(100*radians)/kl);
  near(jm**2,(2*28**2+2*21**2-kl**2)/4);
  near(jm**2,28**2+(kl/2)**2-2*28*(kl/2)*Math.cos(atK*radians));
  near(elevation,Math.asin((21*Math.sin(60*radians)/2)/jm)/radians);
  assert(atK<80);assert(elevation<40);
  worked(18,`≈${kl.toFixed(6)}`,`≈${atK.toFixed(6)}°`,`JM≈${jm.toFixed(6)} cm`,`≈${elevation.toFixed(6)}°`,`${elevation.toPrecision(3)}°<40°`);
  return `KL≈${kl.toPrecision(3)} cm；∠JKL≈${atK.toPrecision(3)}°；不正確`;
});
check(19,()=>{
  prompt(19,"G(20,30)","通過 (5,10)","A(59,-22)","AP、AQ","面積比為 1:4");
  const g=[20,30],a=[59,-22],radius=distance(g,[5,10]),ag=distance(a,g);
  const unit=sub(a,g).map(x=>x/ag),normal=[-unit[1],unit[0]],gh=radius**2/ag;
  const h=g.map((x,i)=>x+unit[i]*gh),halfChord=Math.sqrt(radius**2-gh**2);
  const p=h.map((x,i)=>x+normal[i]*halfChord),q=h.map((x,i)=>x-normal[i]*halfChord);
  near(radius,25);near(ag,65);
  for(const point of [a,g,h])near(4*point[0]+3*point[1]-170,0);
  for(const point of [p,q]) {
    near(distance(g,point),radius);near(dot(sub(g,point),sub(a,point)),0);
    near(distance(a,point),60);
  }
  near(h[0],335/13);near(h[1],290/13);near(distance(h,p),distance(h,q));
  near(angle(g,h,p),90);near(angle(g,p,a),90);near(angle(h,g,p),angle(p,g,a));
  near(distance(g,h)/distance(g,p),distance(g,p)/distance(g,a));
  worked(19,"AP=AQ","GP=GQ","∠GHP=∠GPA=90°","∠HGP=∠PGA","△GHP∼△GPA（AA）");
  const sides=[distance(p,q),distance(a,q),distance(a,p)],perimeter=sum(sides);
  const incenter=[0,1].map(i=>(sides[0]*a[i]+sides[1]*p[i]+sides[2]*q[i])/perimeter);
  near(incenter[0],35);near(incenter[1],10);
  const inradius=lineDistance(incenter,p,q),triangleArea=area(a,p,q);
  near(inradius,lineDistance(incenter,a,p));near(inradius,lineDistance(incenter,a,q));
  near(inradius,triangleArea/(perimeter/2));near(inradius,200/13);
  near(triangleArea,216000/169);near(perimeter/2,1080/13);
  const circumcenter=a.map((x,i)=>(x+g[i])/2),circumradius=distance(circumcenter,a);
  near(circumradius,distance(circumcenter,p));near(circumradius,distance(circumcenter,q));
  near(circumradius,65/2);near(inradius**2/circumradius**2,6400/28561);
  assert(Math.abs(inradius**2/circumradius**2-1/4)>1e-3);
  worked(19,"216000/169","1080/13","r=(面積)/s=200/13","(35,10)","面積比=6400:28561");
  return "4x+3y-170=0；H(335/13,290/13)；(x-35)²+(y-10)²=40000/169；不同意";
});

assert.equal(checked.size,19);
console.log("2022 Paper 1: 19 independent question checks passed; 35+35+35=105 marks; all answers, subparts, statistics, geometry, probability and solution continuity verified.");
console.log(`2022 Paper 1 notation: ${notationStrings} data strings and all formatted solution steps rendered with no bare division slashes or square roots.`);
