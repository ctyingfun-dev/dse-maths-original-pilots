const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Source pages were visually audited locally; no private scan is needed at runtime.
const sourcePages = [2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 17, 18, 20, 22];
const sourceMarks = [3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 7, 7, 7, 8, 4, 5, 7, 7, 12];
// null means the source prints only a question total, not official subpart marks.
const sourceGroups = [null, null, null, null, null, null, null, null, null,
  {a:3,b:3}, {a:2,b:2,c:3}, {a:3,b:1,c:3}, {a:2,b:1,c:4}, {a:2,b:3,c:3},
  {a:1,b:3}, {a:3,b:2}, {a:2,b:5}, {a:2,b:5}, {a:2,b:1,c:9}];
const sum = xs => xs.reduce((a,b) => a+b, 0);
const near = (a,b,label="numeric equality") => assert.ok(Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a-b) < 1e-9*Math.max(1,Math.abs(a),Math.abs(b)), `${label}: ${a} != ${b}`);
const gcd = (a,b) => b ? gcd(b,a%b) : Math.abs(a);
const fraction = (a,b) => { const g=gcd(a,b); return `${a/g}/${b/g}`; };
const superscript = n => String(n).replace(/\d/g, d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
const factorial = n => { let result=1; for(let i=2;i<=n;i++)result*=i; return result; };
const choose = (n,r) => factorial(n)/(factorial(r)*factorial(n-r));
const mean = xs => sum(xs)/xs.length;
const variance = xs => mean(xs.map(x => (x-mean(xs))**2));
const median = xs => {
  const sorted=[...xs].sort((a,b)=>a-b), n=sorted.length;
  return n%2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2;
};
const modes = xs => {
  const counts=new Map();
  for(const x of xs)counts.set(x,(counts.get(x)||0)+1);
  const highest=Math.max(...counts.values());
  return [...counts].filter(([,n])=>n===highest).map(([x])=>x).sort((a,b)=>a-b);
};
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const dot = (a,b) => sum(a.map((x,i)=>x*b[i]));
const cross = (a,b) => a[0]*b[1]-a[1]*b[0];
const cross3 = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const distance = (a,b) => Math.hypot(...sub(a,b));
const radians = Math.PI/180;
const angle = (a,b,c) => Math.acos(Math.max(-1,Math.min(1,
  dot(sub(a,b),sub(c,b))/(distance(a,b)*distance(c,b)))))/radians;
const area = (a,b,c) => Math.abs(cross(sub(b,a),sub(c,a)))/2;
const lineDistance = (p,a,b) => Math.abs(cross(sub(b,a),sub(p,a)))/distance(a,b);

// Exact integer coefficient identities in two formal variables, not sampled values.
const constant = c => ({"0,0":c});
const X = {"1,0":1}, K = {"0,1":1};
const padd = (...ps) => {
  const result={};
  for(const p of ps)for(const [key,c] of Object.entries(p))result[key]=(result[key]||0)+c;
  return Object.fromEntries(Object.entries(result).filter(([,c])=>c!==0));
};
const pscale = (p,c) => padd(Object.fromEntries(Object.entries(p).map(([key,a])=>[key,a*c])));
const pmul = (p,q) => {
  const result={};
  for(const [a,ca] of Object.entries(p))for(const [b,cb] of Object.entries(q)) {
    const aa=a.split(",").map(Number), bb=b.split(",").map(Number), key=aa.map((e,i)=>e+bb[i]).join(",");
    result[key]=(result[key]||0)+ca*cb;
  }
  return padd(result);
};
const psquare = p => pmul(p,p);
const pequal = (p,q,label) => assert.deepEqual(padd(p,pscale(q,-1)),{},label);
const peval = (p,x,k=0) => sum(Object.entries(p).map(([key,c])=>{
  const [a,b]=key.split(",").map(Number); return c*x**a*k**b;
}));
const psub = (a,b) => a.map((p,i)=>padd(p,pscale(b[i],-1)));
const pdot = (a,b) => padd(...a.map((p,i)=>pmul(p,b[i])));

const records = new Map();
const given = new Map(), steps = new Map(), answers = new Map();
const input = (n,...fragments) => given.set(n,[...(given.get(n)||[]),...fragments]);
const worked = (n,...fragments) => steps.set(n,[...(steps.get(n)||[]),...fragments]);
const answer = (n,text) => answers.set(n,text);
const check = (n,calculate) => {
  assert(!records.has(n),`Q${n} checked twice`);
  records.set(n,calculate());
};

check(1,()=>{
  input(1,"(p²q³)(p⁻³q²)⁴","正指數","p、q 均不為零");
  const p=2+(-3)*4, q=3+2*4;
  assert(p<0 && q>0);
  for(const a of [-3,-.5,.5,2])for(const b of [-2,-.5,0,.5,3]) {
    near(a**2*b**3*(a**-3*b**2)**4,a**p*b**q);
  }
  answer(1,`q${superscript(q)}/p${superscript(-p)}`);
  worked(1,`p${superscript(-p)}`,`q${superscript(q)}`);
  return {exponents:{p,q},domain:"p,q != 0 as stated; identity also extends to q=0"};
});

check(2,()=>{
  input(2,"(7-5x)/y=8","主項","y≠0");
  const uNumerator=padd(constant(7),pscale(K,-8));
  pequal(padd(constant(7),pscale(uNumerator,-1)),pscale(K,8),"Q2: clearing denominator identity");
  for(const v of [-10,-1,-.1,.1,1,7])near((7-5*((7-8*v)/5))/v,8);
  answer(2,"x=(7-8y)/5");
  worked(2,"7-5x=8y","7-8y");
  return {subjectNumerator:[7,-8],denominator:5,domain:"y != 0"};
});

check(3,()=>{
  input(3,"8x²+2xy-3y²","10x-5y-8x²-2xy+3y²");
  const first=padd(pscale(psquare(X),8),pscale(pmul(X,K),2),pscale(psquare(K),-3));
  const common=padd(pscale(X,2),pscale(K,-1)), other=padd(pscale(X,4),pscale(K,3));
  pequal(first,pmul(common,other),"Q3a: exact bivariate expansion");
  const second=padd(pscale(X,10),pscale(K,-5),pscale(first,-1));
  pequal(second,pmul(common,padd(constant(5),pscale(other,-1))),"Q3b: grouping identity");
  answer(3,"(4x+3y)(2x-y)；(2x-y)(5-4x-3y)");
  worked(3,"(4x+3y)(2x-y)","(2x-y)(5-4x-3y)");
  return {quadraticCoefficients:[8,2,-3],commonFactor:"2x-y",domain:"all real x,y"};
});

check(4,()=>{
  input(4,"5(2x-3)/4+9>4(x-2)","x+6≥0","正整數");
  const lower=-6, upper=(4*9-5*3+4*8)/(4*4-5*2);
  const original=x=>5*(2*x-3)/4+9>4*(x-2) && x+6>=0;
  // The difference is (53-6x)/4; its slope fixes the inequality direction.
  pequal(padd(pscale(padd(pscale(X,2),constant(-3)),5),constant(36),
    pscale(padd(pscale(X,4),constant(-8)),-4)),padd(constant(53),pscale(X,-6)),"Q4: exact linear inequality");
  for(const x of [lower-1e-6,lower,lower+1e-6,upper-1e-6,upper,upper+1e-6]) {
    assert.equal(original(x),x>=lower && x<upper);
  }
  const integers=Array.from({length:30},(_,i)=>i+1).filter(original);
  assert.deepEqual(integers,Array.from({length:Math.ceil(upper)-1},(_,i)=>i+1));
  answer(4,`-6≤x<${fraction(53,6)}；${integers.length}個`);
  worked(4,"53",`-6≤x<${fraction(53,6)}`,String(integers.length));
  return {lower,upper,upperExact:fraction(53,6),positiveIntegers:integers};
});

check(5,()=>{
  input(5,"4 倍","33","3 倍");
  const transfer=33,initialRatio=4,finalRatio=3;
  const b=(finalRatio+1)*transfer/(finalRatio*initialRatio-1),a=initialRatio*b;
  assert(a>transfer && b>0 && Number.isInteger(a) && Number.isInteger(b));
  near(b+transfer,finalRatio*(a-transfer));
  const total=a+b;
  near(total,(a-transfer)+(b+transfer));
  answer(5,`${total}個`);
  worked(5,String(b),String(a),String(total));
  return {initialA:a,initialB:b,afterA:a-transfer,afterB:b+transfer,total};
});

check(6,()=>{
  input(6,"96","八五折","25%");
  // Work in integer percentages so all price calculations remain exact.
  const cost=85*96/(125-85),marked=cost+96,selling=marked*85/100;
  near(marked-cost,96); near(selling-cost,cost*.25);
  assert(cost>0 && marked>selling && selling>cost);
  answer(6,`$${marked}`);
  worked(6,String(cost),String(marked));
  return {cost,marked,selling,profit:selling-cost,profitPercent:100*(selling-cost)/cost};
});

check(7,()=>{
  input(7,"(r,35°)","(r,95°)","26","正");
  const theta=95-35,r=26/(2*Math.sin(theta*radians/2));
  const p=[r*Math.cos(35*radians),r*Math.sin(35*radians)],q=[r*Math.cos(95*radians),r*Math.sin(95*radians)];
  near(angle(p,[0,0],q),theta);near(distance(p,q),26);near(r,26);
  const perimeter=Math.round(2*r+26);
  answer(7,`${theta}°；${Math.round(r)}；${perimeter}`);
  worked(7,`${theta}°`,"r=26",String(perimeter));
  return {angle:theta,radius:r,perimeter,curriculumStatus:"cancelled; retained"};
});

check(8,()=>{
  input(8,"∠LJN=∠KMN","JL=28 cm","JN=96 cm","LN=100 cm","KM=21 cm");
  const jl=28,jn=96,ln=100,km=21;
  const jx=(jl**2+ln**2-jn**2)/(2*ln),jy=Math.sqrt(jl**2-jx**2);
  const j=[jx,jy],l=[0,0],n=[ln,0],scale=km/jl;
  const mn=jn*scale,m=[ln-mn,0],k=[m[0],km];
  near(cross(sub(k,j),sub(n,j)),0);near(cross(sub(m,l),sub(n,l)),0);
  assert(dot(sub(k,j),sub(k,n))<0 && dot(sub(m,l),sub(m,n))<0,"Q8: points lie on the stated extensions");
  near(distance(j,l),jl);near(distance(j,n),jn);near(distance(l,n),ln);near(distance(k,m),km);
  near(angle(l,j,n),angle(k,m,n));near(angle(j,n,l),angle(m,n,k));
  near(jl**2+jn**2,ln**2);near(dot(sub(l,j),sub(n,j)),0);
  for(const [large,small] of [[distance(j,l),distance(m,k)],[distance(j,n),distance(m,n)],[distance(l,n),distance(k,n)]])near(small/large,scale);
  const target=jl*jn/2*scale**2;
  near(area(k,m,n),target);near(target,km*mn/2);
  answer(8,`AA；是；${target} cm²`);
  worked(8,"∠LJN=∠KMN","∠JNL=∠MNK","△JLN∼△MKN（AA）",`JL²+JN²=28²+96²=${jl**2}+${jn**2}=${ln**2}`,
    `LN²=100²=${ln**2}`,"畢氏定理的逆定理",`${target} cm²`);
  return {scale,outerArea:jl*jn/2,smallSides:[km,mn,distance(k,n)],smallArea:target,units:"cm, cm²"};
});

check(9,()=>{
  input(9,"少於 34","2/3");
  const values=[31,32,33,34,35,36],known=[10,0,18,8,11,5],pNum=2,pDen=3;
  const knownBelow=known[0]+known[2],knownTotal=sum(known);
  const k=(pNum*knownTotal-pDen*knownBelow)/(pDen-pNum);
  assert(Number.isInteger(k) && k>=0);
  const frequencies=known.map((f,i)=>i===1?k:f),xs=values.flatMap((x,i)=>Array(frequencies[i]).fill(x));
  const total=xs.length,totalX=sum(xs),totalSquared=sum(xs.map(x=>x*x));
  near(xs.filter(x=>x<34).length/total,pNum/pDen);
  const q1=median(xs.slice(0,total/2)),q3=median(xs.slice(total/2)),range=xs.at(-1)-xs[0];
  const varianceNumerator=totalSquared*total-totalX**2,sd=Math.sqrt(variance(xs));
  near(sd,Math.sqrt(varianceNumerator)/total);
  assert.notEqual(sd,Math.sqrt(sum(xs.map(x=>(x-mean(xs))**2))/(total-1)),"Q9: use population, not sample, SD");
  answer(9,`k=${k}；${range}篇；${q3-q1}篇；${sd.toPrecision(3)}篇`);
  worked(9,`k=${k}`,String(totalX),String(totalSquared),String(total),`${q1}`,`${q3}`,sd.toPrecision(3));
  return {values,frequencies,k,total,totalX,totalSquared,mean:mean(xs),quartiles:[q1,q3],range,iqr:q3-q1,
    varianceNumerator,sd,sdDefinition:"sqrt(sum((x-mean)^2)/N)",units:"articles"};
});

check(10,()=>{
  input(10,"(x-3)²","h(2)=0","h(7)=60","h(x)+4");
  const coefficient=(60-0)/((7-3)**2-(2-3)**2),constantTerm=-coefficient*(2-3)**2;
  const polynomial=padd(pscale(psquare(padd(X,constant(-3))),coefficient),constant(constantTerm));
  const expanded=padd(pscale(psquare(X),4),pscale(X,-24),constant(32));
  pequal(polynomial,expanded,"Q10: variation polynomial");
  near(peval(polynomial,2),0);near(peval(polynomial,7),60);
  const f0=peval(polynomial,0),yIntercept=f0+4;
  pequal(padd(polynomial,constant(4)),pscale(psquare(padd(X,constant(-3))),4),"Q10: unique double root after vertical shift");
  answer(10,`${f0}；${yIntercept}；3`);
  worked(10,"4(x-3)²-4",`h(0)=4(0-3)²-4=36-4=${f0}`,String(yIntercept),"x=3");
  return {constant:constantTerm,coefficient,f0,yIntercept,xIntercept:3,multiplicity:2,domain:"all real x"};
});

check(11,()=>{
  input(11,"6","平均值增加 1","中位數增加 2","眾數維持不變");
  const values=[2,3,4,5,6,7,8],frequencies=[13,9,3,5,4,2,4];
  const xs=values.flatMap((x,i)=>Array(frequencies[i]).fill(x)),total=xs.length,totalX=sum(xs);
  const average=mean(xs),med=median(xs),mode=modes(xs);
  assert.notEqual(med,mode[0]);
  const newValue=6,meanN=((average+1)*total-totalX)/(newValue-average-1);
  assert(Number.isInteger(meanN) && meanN>0);
  const augmented=n=>[...xs,...Array(n).fill(newValue)];
  near(mean(augmented(meanN)),average+1);
  const medCandidates=[],modeCandidates=[];
  for(let n=0;n<=200;n++) {
    if(median(augmented(n))===med+2)medCandidates.push(n);
    if(JSON.stringify(modes(augmented(n)))===JSON.stringify(mode))modeCandidates.push(n);
  }
  const minMedian=Math.min(...medCandidates),maxMode=Math.max(...modeCandidates);
  assert.deepEqual(medCandidates,Array.from({length:9},(_,i)=>i+11));
  assert(minMedian>0 && median(augmented(minMedian-1))<med+2);
  assert.deepEqual(modes(augmented(maxMode+1)),[mode[0],newValue],"Q11: tied second mode is a changed mode set");
  // Once the added frequency reaches 13, it can never return to the old unique mode.
  assert.equal(frequencies[4]+maxMode+1,frequencies[0]);
  assert.equal(xs.filter(x=>x<med+2).length,25);
  assert.equal((total+minMedian+1)/2,26);
  answer(11,`${average}；不相等；${meanN}；${minMedian}；${maxMode}`);
  worked(11,String(totalX),String(total),`中位數`,String(med),"眾數",String(mode[0]),String(meanN),String(minMedian),String(maxMode));
  return {values,frequencies,total,totalX,mean:average,median:med,modes:mode,meanAddition:meanN,
    minimumMedianAddition:minMedian,medianBefore:median(augmented(minMedian-1)),medianAfter:median(augmented(minMedian)),
    maximumModeAddition:maxMode,modesAtNext:modes(augmented(maxMode+1))};
});

check(12,()=>{
  input(12,"x²+2x+2","2x²-24","cx+c-8","x-4","x+2","實數");
  const divisor=padd(psquare(X),pscale(X,2),constant(2)),quotient=padd(pscale(psquare(X),2),constant(-24));
  const c=(8-peval(divisor,4)*peval(quotient,4))/(4+1);
  const p=padd(pmul(divisor,quotient),pscale(X,c),constant(c-8));
  assert.equal(peval(p,4),0);assert.equal(peval(p,-2),0);
  const residual=padd(pscale(psquare(X),2),pscale(X,8),constant(12));
  pequal(p,pmul(pmul(padd(X,constant(-4)),padd(X,constant(2))),residual),"Q12: exact quartic factorization");
  const discriminant=8**2-4*2*12;
  assert(discriminant<0);
  pequal(residual,padd(pscale(psquare(padd(X,constant(2))),2),constant(4)),"Q12: residual is positive for every real x");
  answer(12,`c=${c}；x+2為因式；不全為實數`);
  worked(12,`c=${c}`,"g(-2)=", "(x-4)(x+2)(2x²+8x+12)",String(discriminant));
  return {c,quarticCoefficients:[0,1,2,3,4].map(i=>p[`${i},0`]||0),realRoots:[-2,4],
    residualCoefficients:[12,8,2],residualDiscriminant:discriminant,nonrealRootCount:2};
});

check(13,()=>{
  input(13,"x²+y²-24x-32y-225=0","OP=GP","OMGN");
  const o=[0,0],g=[24/2,32/2],rSquared=dot(g,g)+225,r=Math.sqrt(rSquared),og=distance(o,g);
  assert(og<r);
  const midpoint=g.map(v=>v/2),normal=[-g[1]/og,g[0]/og],halfChord=Math.sqrt(rSquared-(og/2)**2);
  const [m,n]=[-1,1].map(sign=>midpoint.map((v,i)=>v+sign*halfChord*normal[i]));
  for(const p of [m,n]) {
    near(distance(p,o),distance(p,g));near(distance(p,g),r);
    near(p[0]**2+p[1]**2-24*p[0]-32*p[1]-225,0);
    near(3*p[0]+4*p[1],50);
  }
  const x=X,y=K;
  pequal(padd(psquare(x),psquare(y),pscale(psquare(padd(x,constant(-12))),-1),pscale(psquare(padd(y,constant(-16))),-1)),
    padd(pscale(x,24),pscale(y,32),constant(-400)),"Q13: equidistant locus identity");
  near(dot(sub(m,n),sub(g,o)),0);
  const kiteArea=area(o,m,g)+area(o,n,g),radicand=21,areaCoefficient=100;
  near(kiteArea,og*distance(m,n)/2);near(kiteArea,areaCoefficient*Math.sqrt(radicand));
  answer(13,`${og}；是；${areaCoefficient}√${radicand}平方單位`);
  worked(13,"(x-12)²+(y-16)²=625",String(og),"垂直平分線",`${areaCoefficient}√${radicand}`);
  return {center:g,radius:r,og,locus:"3x+4y=50",midpoint,halfChord,kiteArea,exactArea:`${areaCoefficient}sqrt(${radicand})`};
});

check(14,()=>{
  input(14,"11 cm","15 cm","320π cm³","底直徑","曲面面積");
  const cylinderHeight=11,coneHeight=15,coneVolume=320;
  const r=Math.sqrt(3*coneVolume/coneHeight),largeR=2*r,cylinderVolume=r*r*cylinderHeight;
  const largeVolume=cylinderVolume+coneVolume,largeHeight=3*largeVolume/largeR**2;
  const coneSlant=Math.hypot(r,coneHeight),largeSlant=Math.hypot(largeR,largeHeight);
  const cylinderArea=2*r*cylinderHeight,coneArea=r*coneSlant,largeArea=largeR*largeSlant;
  assert.notEqual(r/largeR,coneHeight/largeHeight);
  near(largeR**2*largeHeight/3,largeVolume);
  assert(cylinderArea+coneArea<largeArea);
  answer(14,`${r} cm；不相似；不同意`);
  worked(14,`r=${r}`,`${cylinderVolume}π`,`${largeVolume}π`,String(largeHeight),`${coneSlant}`,`${largeSlant}`,
    `${cylinderArea+coneArea}π`,`${largeArea}π`);
  return {radius:r,cylinderVolumePi:cylinderVolume,coneVolumePi:coneVolume,largeVolumePi:largeVolume,
    largeRadius:largeR,largeHeight,slants:[coneSlant,largeSlant],curvedAreasPi:[cylinderArea,coneArea,largeArea],
    combinedCurvedAreaPi:cylinderArea+coneArea,similar:false,claim:false,units:"cm, cm², cm³"};
});

check(15,()=>{
  input(15,"6","4","相鄰");
  const guides=6,trainees=4,total=factorial(guides+trainees),favourable=factorial(guides)*choose(guides+1,trainees)*factorial(trainees);
  let patterns=0,valid=0;
  for(let mask=0;mask<2**(guides+trainees);mask++) {
    if(mask.toString(2).replace(/0/g,"").length!==trainees)continue;
    patterns++;
    if((mask & (mask<<1))===0)valid++;
  }
  assert.equal(patterns,choose(guides+trainees,trainees));assert.equal(valid,choose(guides+1,trainees));
  near(favourable/total,valid/patterns);
  answer(15,`${total}；${fraction(favourable,total)}`);
  worked(15,"10!",String(total),"7",fraction(favourable,total));
  return {total,favourable,allPatterns:patterns,nonadjacentPatterns:valid,probability:fraction(favourable,total)};
});

check(16,()=>{
  input(16,"y 截距為 4","(3,10)","互相垂直","7x-4y","包括邊界");
  const intersection=[3,10],yIntercept=4,m1=(intersection[1]-yIntercept)/intersection[0],m2=-1/m1;
  const b2=intersection[1]-m2*intersection[0];
  near(m1*m2,-1);
  const vertices=[[-yIntercept/m1,0],[-b2/m2,0],intersection],objective=([x,y])=>7*x-4*y;
  const values=vertices.map(objective),minimum=Math.min(...values);
  for(let a=0;a<=20;a++)for(let b=0;b<=20-a;b++) {
    const weights=[a/20,b/20,1-(a+b)/20],p=[0,1].map(i=>sum(vertices.map((v,j)=>v[i]*weights[j])));
    assert(p[1]>=-1e-9 && p[1]<=m1*p[0]+yIntercept+1e-9 && p[0]+2*p[1]<=23+1e-9);
    near(objective(p),sum(values.map((v,i)=>v*weights[i])));assert(objective(p)>=minimum-1e-9);
  }
  // Nonnegative constraint slacks certify the global lower bound exactly.
  pequal(pscale(padd(pscale(X,7),pscale(K,-4),constant(19)),5),
    padd(pscale(padd(pscale(X,2),constant(4),pscale(K,-1)),18),
      padd(constant(23),pscale(X,-1),pscale(K,-2))),"Q16: global linear bound certificate");
  answer(16,`y≥0，y≤2x+4，x+2y≤23；${minimum}`);
  worked(16,"y=2x+4","x+2y=23",String(minimum),"(3,10)");
  return {slopes:[m1,m2],vertices,vertexObjectiveValues:values,minimum,minimizer:intersection};
});

check(17,()=>{
  input(17,"B(4)=29","B(11)=71","log₃H(n)=B(n)","log₂₇","1200");
  const difference=(71-29)/(11-4),first=29-3*difference,term=n=>first+(n-1)*difference;
  near(term(4),29);near(term(11),71);
  const partial=k=>k*(2*first+(k-1)*difference)/2;
  pequal(pmul(K,padd(constant(2*first-difference),pscale(K,difference))),
    pscale(padd(pscale(psquare(K),3),pscale(K,8)),2),"Q17: exact AP sum polynomial");
  const baseChange=3,threshold=1200*baseChange;
  pequal(padd(pscale(psquare(K),3),pscale(K,8),constant(-threshold)),
    pmul(padd(pscale(K,3),constant(-100)),padd(K,constant(36))),"Q17: strict-bound factorization");
  assert(first>0 && difference>0,"Q17: partial sums strictly increase for positive integers");
  let maximum=0,accumulated=0;
  while(accumulated+term(maximum+1)<threshold) { maximum++;accumulated+=term(maximum); }
  near(accumulated,partial(maximum));
  assert(partial(maximum)<threshold && partial(maximum+1)>=threshold);
  for(let n=1;n<=10;n++) {
    const h=3**term(n);assert(h>0);near(Math.log(h)/Math.log(3),term(n));
  }
  let product=1;
  for(let k=1;k<=5;k++) { product*=3**term(k);near(Math.log(product)/Math.log(27),partial(k)/baseChange); }
  answer(17,`${first}；${maximum}`);
  worked(17,`6`,String(first),"3k²+8k",String(partial(maximum)),String(partial(maximum+1)),String(maximum));
  return {first,difference,maximum,partialAtMaximum:partial(maximum),partialAtNext:partial(maximum+1),
    log27AtMaximum:partial(maximum)/3,log27AtNext:partial(maximum+1)/3,threshold,domain:"positive integers; H(n)>0; bases 3,27>1"};
});

check(18,()=>{
  input(18,"JK=52 cm","∠KJM=55°","∠JML=65°","KL=46 cm","25°","平面 JLM","平面 KLMN");
  const h=52*Math.sin(55*radians),v=52*Math.cos(55*radians),d=46+h/Math.tan(65*radians);
  const flatJ=[-v,0],flatK=[0,-h],flatL=[46,-h],flatM=[d,0];
  near(distance(flatJ,flatK),52);near(angle(flatK,flatJ,flatM),55);near(angle(flatJ,flatM,flatL),65);
  near(cross(sub(flatJ,flatM),sub(flatK,flatL)),0);
  const j=[0,0,v],k=[0,-h,0],l=[46,-h,0],m=[d,0,0],n=[0,0,0];
  near(distance(j,k),52);near(distance(l,m),distance(flatL,flatM));
  near(dot(sub(j,n),sub(k,n)),0);near(dot(sub(j,n),sub(m,n)),0);
  assert(Math.hypot(...cross3(sub(k,n),sub(m,n)))>0,"Q18: perpendicular directions span base plane");
  const lm=distance(l,m),jl=distance(j,l),jm=distance(j,m),theta=angle(l,j,m);
  near(lm,h/Math.sin(65*radians));near(jl,Math.hypot(52,46));near(jm,Math.hypot(v,d));
  near(Math.cos(theta*radians),(jl*jl+jm*jm-lm*lm)/(2*jl*jm));
  const ml=sub(l,m),projection=dot(sub(n,m),ml)/dot(ml,ml),foot=m.map((value,i)=>value+projection*ml[i]);
  assert(projection>0 && projection<1,"Q18: H lies within segment LM");
  near(dot(sub(n,foot),ml),0);near(dot(sub(j,foot),ml),0);
  const nh=distance(n,foot),dihedral=angle(j,foot,n),normal=cross3(sub(l,j),sub(m,j));
  near(nh,d*Math.sin(65*radians));near(dihedral,Math.atan(v/nh)/radians);
  near(dihedral,Math.acos(Math.abs(normal[2])/Math.hypot(...normal))/radians);
  assert(dihedral>25 && dihedral<90);
  answer(18,`LM≈${lm.toPrecision(3)} cm；∠LJM≈${theta.toPrecision(3)}°；是，約${dihedral.toPrecision(3)}°`);
  worked(18,lm.toPrecision(3),theta.toPrecision(3),"NH",dihedral.toPrecision(3),"25°");
  return {h,v,d,lm,jl,jm,angleLJM:theta,foot,projection,nh,dihedral,exceeds25:true,units:"cm, degrees"};
});

check(19,()=>{
  input(19,"x²-24kx-10x+144k²+127k+31","正","q(10-x)","(5,6-2k)","(-19,18)","長方形");
  const qx=padd(constant(5),pscale(K,12)),qy=padd(constant(6),pscale(K,7));
  const f=padd(psquare(X),pscale(pmul(X,K),-24),pscale(X,-10),pscale(psquare(K),144),pscale(K,127),constant(31));
  pequal(f,padd(psquare(padd(X,pscale(qx,-1))),qy),"Q19a: exact completing-square identity for all real x,k");
  const q=[qx,qy],r=[padd(constant(10),pscale(qx,-1)),qy],s=[constant(5),padd(constant(6),pscale(K,-2))];
  const reflectedX=padd(constant(10),pscale(X,-1));
  const reflectedF=padd(psquare(reflectedX),pscale(pmul(reflectedX,K),-24),pscale(reflectedX,-10),
    pscale(psquare(K),144),pscale(K,127),constant(31));
  pequal(reflectedF,padd(psquare(padd(X,pscale(r[0],-1))),r[1]),"Q19b: exact transformed vertex identity");
  const u=[constant(5),padd(constant(6),pscale(K,3))];
  const line=p=>padd(pscale(p[0],3),pscale(p[1],-4),pscale(K,-8),constant(9));
  pequal(line(q),{},"Q19c(i): J on JL for all k");pequal(line(s),{},"Q19c(i): L on JL for all k");
  pequal(pdot(psub(q,s),psub(q,s)),pscale(psquare(K),225),"Q19: JL=15k since k>0");
  pequal(pdot(psub(r,s),psub(r,s)),pscale(psquare(K),225),"Q19: KL=15k since k>0");
  pequal(pdot(psub(q,r),psub(q,r)),pscale(psquare(K),576),"Q19: JK=24k since k>0");
  pequal(line(u),pscale(K,-20),"Q19: distance to JL =20k/5=4k");
  pequal(padd(qy,pscale(u[1],-1)),pscale(K,4),"Q19: distance to JK=4k");
  // Scale rational coordinates by five to keep every symbolic check integral.
  const fiveT=[padd(constant(25),pscale(K,12)),padd(constant(30),pscale(K,-1))];
  const fiveS=s.map(p=>pscale(p,5)),fiveU=u.map(p=>pscale(p,5));
  const fiveST=psub(fiveT,fiveS),fiveTU=psub(fiveU,fiveT);
  pequal(pdot(fiveST,fiveTU),{},"Q19: tangent and radius perpendicular for all k");
  pequal(pdot(fiveTU,fiveTU),pscale(psquare(K),400),"Q19: NM=4k");
  pequal(pdot(fiveST,fiveST),pscale(psquare(K),225),"Q19: LM=3k");
  const fiveV=fiveS.map((p,i)=>padd(p,fiveU[i],pscale(fiveT[i],-1)));
  pequal(fiveV[0],padd(constant(25),pscale(K,-12)),"Q19: rectangle fourth vertex x");
  pequal(fiveV[1],padd(constant(30),pscale(K,6)),"Q19: rectangle fourth vertex y");
  const kFromX=(25-5*(-19))/12,kFromY=(5*18-30)/6;
  assert(kFromX>0);near(kFromX,kFromY);
  for(const parameter of [.01,.25,1,2,10,31]) {
    const at=p=>p.map(component=>peval(component,0,parameter));
    const Q=at(q),R=at(r),S=at(s),U=at(u),T=at(fiveT).map(x=>x/5),V=at(fiveV).map(x=>x/5);
    const sides=[distance(Q,R),distance(R,S),distance(S,Q)],semiperimeter=sum(sides)/2;
    const inradius=area(Q,R,S)/semiperimeter;
    near(inradius,4*parameter);near(semiperimeter,27*parameter);
    const independentlyWeighted=[0,1].map(i=>(sides[0]*S[i]+sides[1]*Q[i]+sides[2]*R[i])/sum(sides));
    independentlyWeighted.forEach((v,i)=>near(v,U[i]));
    for(const [a,b] of [[Q,R],[R,S],[S,Q]])near(lineDistance(U,a,b),inradius);
    near(distance(U,T),inradius);near(dot(sub(T,S),sub(U,T)),0);
    near(cross(sub(T,S),sub(Q,S)),0);
    assert(dot(sub(T,S),sub(T,Q))<0,"Q19: tangency point is on segment JL");
    near(distance(S,T),3*parameter);near(area(S,T,U)+area(S,U,V),12*parameter**2);
    near(cross(sub(T,S),sub(U,V)),0);near(cross(sub(U,T),sub(V,S)),0);
    near(peval(f,Q[0],parameter),Q[1]);near(peval(f,10-R[0],parameter),R[1]);
  }
  answer(19,`J(5+12k,6+7k)；K(5-12k,6+7k)；3x-4y-8k+9=0；(x-5)²+[y-(6+3k)]²=16k²；有，k=${kFromX}`);
  worked(19,"(x-12k-5)²+7k+6","(5+12k,6+7k)","(5-12k,6+7k)","3x-4y-8k+9=0",
    "15k","108k²","27k","4k","(5,6+3k)","(x-5)²+[y-(6+3k)]²=16k²",`k=${kFromX}`);
  return {vertexQ:"(5+12k,6+7k)",vertexR:"(5-12k,6+7k)",lineQS:"3x-4y-8k+9=0",sides:"15k,15k,24k",
    triangleArea:"108k²",semiperimeter:"27k",incenter:"(5,6+3k)",inradius:"4k",tangentPoint:"(5+12k/5,6-k/5)",
    fourthVertex:"(5-12k/5,6+6k/5)",rectangleParameter:kFromX,rectangleAreaAtParameter:12*kFromX**2,domain:"k>0; k=0 degenerate excluded"};
});

assert.equal(records.size,19);
assert.equal(sum(sourceMarks),105);
assert.deepEqual([sum(sourceMarks.slice(0,9)),sum(sourceMarks.slice(9,14)),sum(sourceMarks.slice(14))],[35,35,35]);

// Link independently computed quantities to the derivations, not only answer keys.
worked(1,"(p⁻³q²)⁴=p⁻¹²q⁸","p^(2-12)q^(3+8)=p⁻¹⁰q¹¹");
worked(2,"-5x=8y-7");
worked(3,"8x²+2xy-3y²=4x(2x-y)+3y(2x-y)","5(2x-y)-(4x+3y)(2x-y)");
worked(4,"5(2x-3)+36>16(x-2)","53>6x","x≥-6","共有 8 個");
const r5=records.get(5),r6=records.get(6),r8=records.get(8),r9=records.get(9),r11=records.get(11),r14=records.get(14),r18=records.get(18);
worked(5,"x+33=3(4x-33)",`11x=${11*r5.initialB}`,`總數=${r5.initialB}+${r5.initialA}=${r5.total} 個`);
worked(6,"0.85(c+96)=1.25c",`c=${r6.cost}`,`標價=${r6.cost}+96=${r6.marked} 元`);
worked(7,"OU=OV=r","(180°-60°)/2=60°","等邊三角形");
worked(8,`28×96/2=${r8.outerArea} cm²`,"KM:JL=21:28=3:4",`${r8.outerArea}×9/16=${r8.smallArea} cm²`);
worked(9,"(k+28)/(k+52)=2/3",`Q₁=${r9.quartiles[0]}`,`Q₃=${r9.quartiles[1]}`,
  "第 18、19 項","第 54、55 項",`σ=√[${r9.totalSquared}/${r9.total}-(${r9.totalX}/${r9.total})²]`,
  `分布域=36-31=${r9.range} 篇`,`四分位數間距=34-32=${r9.iqr} 篇`,`${r9.sd.toPrecision(3)} 篇`);
worked(10,"a+b=0","a+16b=60","b=4，a=-4","y 截距=h(0)+4=32+4=36","4(x-3)²=0");
worked(11,`平均值=${r11.totalX}/${r11.total}=${r11.mean} 個`,"第 20、21 項","中位數為 3 個","眾數為 2 個",
  `(${r11.totalX}+6n)/(${r11.total}+n)=5`,`n=${r11.meanAddition}`,"小於 5 的數據共 25 項","第 26 至 30 項",
  `(4+5)/2=${r11.medianBefore}`,`當 n=${r11.minimumMedianAddition}`,`4+n<13`,"n=9 會出現兩個眾數 2 及 6");
worked(12,"g(x)≡(x²+2x+2)(2x²-24)+cx+c-8","26×8+5c-8=0","g(-2)=2×(-16)+32=0",
  "因式定理","g(x)≡2x⁴+4x³-20x²-88x-96","Δ=8²-4×2×12=64-96=-32<0","實根只有 4 及 -2");
worked(13,"OG=20<25","OH=GH=10","OG⊥MN","HM=HN","HM=√(GM²-GH²)","√(25²-10²)=√525","HM=5√21","MN=2HM=10√21",
  "面積=10√21×20/2=100√21 平方單位");
worked(14,`πr²×15/3=${r14.coneVolumePi}π`,`π×16²×h/3=${r14.largeVolumePi}π`,
  "半徑為正","8:16=1:2","15:12=5:4",`√(8²+15²)=${r14.slants[0]} cm`,`√(16²+12²)=${r14.slants[1]} cm`,
  `${r14.combinedCurvedAreaPi}π cm²`,`${r14.curvedAreasPi[2]}π cm²`,`${r14.combinedCurvedAreaPi}π<${r14.curvedAreasPi[2]}π`);
worked(15,`C(7,4)=${records.get(15).nonadjacentPatterns}`,`6!×35×4!=${records.get(15).favourable}`);
worked(16,"(10-4)/(3-0)=2","斜率=-1/2","(-2,0)、(23,0)、(3,10)","-14、161、21-40=-19");
worked(17,"log₃27=3","[B(1)+⋯+B(k)]/3<1200","k[2×11+(k-1)×6]/2=3k²+8k",
  "3k²+8k-3600=(3k-100)(k+36)","k+36>0","k<100/3","各項 B(n)=11+6(n-1) 均為正");
worked(18,"h=JKsin55°=LMsin65°",`LM=52sin55°/sin65°≈${r18.lm.toFixed(6)} cm`,
  `KN=52sin55°≈${r18.h.toFixed(6)} cm`,`JN=52cos55°≈${r18.v.toFixed(6)} cm`,
  `NM=KL+KN/tan65°≈${r18.d.toFixed(6)} cm`,"JM²=JN²+NM²",`JM≈${r18.jm.toFixed(6)} cm`,
  "JL²=JN²+NL²=JN²+NK²+KL²=JK²+KL²",`√4820≈${r18.jl.toFixed(6)} cm`,
  "(JL²+JM²-LM²)/(2×JL×JM)",`∠LJM≈${r18.angleLJM.toFixed(6)}°`,"NH⊥LM","LM⊥平面 JNH","JH⊥LM",
  "所求二面角為 ∠JHN",`NH=NMsin65°≈${r18.nh.toFixed(6)} cm`,`tanθ=JN/NH`,
  `θ=tan⁻¹[(52cos55°)/(NMsin65°)]≈${r18.dihedral.toFixed(6)}°`,`${r18.dihedral.toFixed(6)}°>25°`);
worked(19,"k>0","10-(5+12k)=5-12k","9k/(12k)=3/4","JK=24k","垂直距離為 9k",
  "JL=KL=√[(12k)²+(9k)²]=15k","24k×9k/2=108k²","(24k+15k+15k)/2=27k",
  "r=108k²/(27k)=4k","6+7k-4k=6+3k","半徑 NM 垂直切線 JL",
  "y-(6+3k)=-4(x-5)/3","M(5+12k/5,6-k/5)","5-12k/5=-19","6+6k/5=18",
  "L(5,-14)、M(29,4)、N(5,36)、P(-19,18)","中點均為 (5,11)","LM⊥NM","k=10>0");

const load = file => {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),"utf8"),context,{filename:file,timeout:1000});
  return context.window;
};

const namingRules = [
  {n:2, expected:"(7-5x)/y=8", stale:/[uv]/},
  {n:3, expected:"8x²+2xy-3y²", stale:/[uv]/},
  {n:7, expected:"∠UOV", stale:/AOB|OAB|OA|OB|AB/},
  {n:10, expected:"h(x)", stale:/F\(|G/},
  {n:12, expected:"g(x)", stale:/p\(|宣稱/},
  {n:19, expected:"q(x)", stale:/f\(|[QRSTUV]/}
];
const textLeaves = value => typeof value === "string" ? [value] :
  value && typeof value === "object" ? Object.values(value).flatMap(textLeaves) : [];

function verifyData(data,render=true) {
  assert.equal(data.year,2021);assert.equal(data.paper,1);assert.equal(data.questions.length,19);
  for(const {n,expected,stale} of namingRules) {
    const q=data.questions[n-1];
    assert(q.prompt.includes(expected),`Q${n}: revised mathematical name in prompt`);
    assert.doesNotMatch(textLeaves(q).join("\n"),stale,`Q${n}: stale name or old question wording`);
  }
  const allSteps=q=>q.solution.flatMap(part=>part.steps.flatMap(step=>step.text));
  const contains=(text,fragments,label)=>{
    for(const fragment of fragments)assert(text.includes(fragment),`${label}: missing ${JSON.stringify(fragment)}`);
  };
  for(const [i,q] of data.questions.entries()) {
    const n=i+1;
    assert.equal(q.n,n);assert.equal(q.sourceNo,n);assert.equal(q.marks,sourceMarks[i]);
    assert.equal(q.section,n<=9?"甲一":n<=14?"甲二":"乙部");
    assert(q.topic && q.prompt && q.answer && q.hints?.length && q.hints.every(h=>typeof h==="string" && h.trim()));
    assert.doesNotMatch(JSON.stringify(q),/填空|找錯|改錯|[橫縱横纵]|恆等於|½|÷|角邊角|邊角邊|角角邊|斜邊直角邊|（等角）|待補|待計算|TODO/);
    contains(q.prompt,given.get(n),`Q${n} independent inputs`);
    assert.equal(q.answer,answers.get(n),`Q${n} independently calculated answer`);
    contains(allSteps(q).join("\n"),steps.get(n),`Q${n} independently calculated solution steps`);
    const groups={},allocation=[];
    for(const part of q.solution) {
      const key=part.part.match(/^\(([a-z])\)/)?.[1];
      assert(part.steps.length,`Q${n}: missing worked steps`);
      for(const step of part.steps) {
        assert.match(step.marks,/^[1-9]\d*[MA]$/);
        const marks=parseInt(step.marks,10);allocation.push(marks);
        if(key)groups[key]=(groups[key]||0)+marks;
        assert(Array.isArray(step.text) && step.text.length);
        for(const line of step.text) {
          assert(typeof line==="string" && line.trim());
          assert.doesNotMatch(line,/(?:^|[。；\n])\s*[=≈]/,`Q${n}: orphan equality`);
        }
      }
    }
    assert.equal(sum(allocation),q.marks,`Q${n}: method/accuracy marks total`);
    if(Object.keys(groups).length) {
      assert.deepEqual(q.markGroups,groups,`Q${n}: nonofficial subpart allocations`);
      assert.equal(sum(Object.values(groups)),q.marks);
    } else assert.equal(q.markGroups,undefined);
    if(sourceGroups[i])assert.deepEqual(groups,sourceGroups[i],`Q${n}: source printed subpart marks`);
  }
  assert.deepEqual(["甲一","甲二","乙部"].map(section=>sum(data.questions.filter(q=>q.section===section).map(q=>q.marks))),[35,35,35]);
  const q11=data.questions[10],r11=records.get(11);
  assert.deepEqual(q11.diagram.rows[0].slice(1).map(Number),r11.values);
  assert.deepEqual(q11.diagram.rows[1].slice(1).map(Number),r11.frequencies);
  assert.equal(data.questions[7].diagram.type,"similarTriangles2021");
  assert.equal(data.questions[8].diagram.type,"readingBar2021");
  assert.equal(data.questions[17].partDiagrams.b.type,"foldedTrapezium2021");
  assert.equal(data.questions[17].partDiagrams.a,undefined,"Q18: source has a folded figure only in (b)");
  assert.equal(data.questions[17].diagram,undefined,"Q18: no whole-question duplicate diagram");
  if(!render)return;

  // Rendering is deliberately after all independent calculations and data checks.
  const math=load("paper1/math.js");
  let notationStrings=0,solutionSteps=0;
  const notation=(html,label)=>{
    const visible=html.replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,"").replace(/<[^>]+>/g,"");
    assert.doesNotMatch(visible,/[\/÷√]/,`${label}: bare division or square root`);
    assert.doesNotMatch(html,/<var>(?:cm|kg|mm|mL)<\/var>|<var>c<\/var>\s*<var>m<\/var>/,`${label}: italic measurement unit`);
  };
  const scan=(value,label)=>{
    if(typeof value==="string") {
      const html=math.mathText(value);notation(html,label);
      assert.equal((html.match(/<msqrt>/g)||[]).length,(value.match(/√/g)||[]).length,`${label}: root overbar count`);
      notationStrings++;
    } else if(value && typeof value==="object")for(const [key,item] of Object.entries(value))scan(item,`${label}.${key}`);
  };
  scan(data,"2021 P1");
  for(const q of data.questions)for(const part of q.solution)for(const step of part.steps) {
    notation(math.solutionHtml(step.text),`Q${q.n} solution`);solutionSteps++;
    for(const block of math.solutionLayout(step.text)) {
      if(block.type==="calculation")assert(block.rows[0].lhs,`Q${q.n}: rendered orphan equality`);
      else assert.doesNotMatch(block.text,/^(所以|因此|故|得)[，。；]?$/);
    }
  }
  return {notationStrings,solutionSteps};
}

function verifyFrequencyDiagram(svg) {
  const labels=[...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(m=>m[1]);
  const expected=records.get(9).values.flatMap((v,i)=>[String(v),i===1?"k":String(records.get(9).frequencies[i])]);
  assert.deepEqual(labels.filter(s=>/^(?:\d+|k)$/.test(s)),expected,"Q9: displayed frequency labels/values (unknown must remain k)");
  const rects=[...svg.matchAll(/<rect\b([^>]*)>/g)].map(m=>Object.fromEntries(
    [...m[1].matchAll(/(\w+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
  assert.equal(rects.length,6);
  const scale=Number(rects[0].height)/records.get(9).frequencies[0],baseline=Number(rects[0].y)+Number(rects[0].height);
  assert(scale>0);
  rects.forEach((rect,i)=>{
    near(Number(rect.height)/scale,records.get(9).frequencies[i],`Q9 bar ${i+1} proportional height`);
    near(Number(rect.y)+Number(rect.height),baseline,"Q9 common bar baseline");
    if(i)assert(Number(rect.x)>Number(rects[i-1].x)+Number(rects[i-1].width),"Q9 separated bars");
  });
}

function verifyCurriculumNotice(data) {
  const context={window:{PILOT:data,PILOT_2021:data},URLSearchParams,location:{search:"?year=2021"},document:{documentElement:{dataset:{}}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,"year.js"),"utf8"),context,{filename:"year.js",timeout:1000});
  assert.match(context.window.pilotCurriculumNotice(data.questions[6]),/>已取消</);
  data.questions.forEach((q,i)=>{if(i!==6)assert.equal(context.window.pilotCurriculumNotice(q),"");});
}

function mutationTests(data,svg) {
  let rejected=0;
  const reject=(label,mutate)=>{
    const changed=structuredClone(data);mutate(changed);
    assert.throws(()=>verifyData(changed,false),{name:"AssertionError"},`mutation survived: ${label}`);rejected++;
  };
  for(let n=1;n<=19;n++) {
    reject(`Q${n} input`,d=>{d.questions[n-1].prompt=d.questions[n-1].prompt.replace(given.get(n)[0],"[changed input]");});
    reject(`Q${n} answer`,d=>{d.questions[n-1].answer+="[changed answer]";});
    reject(`Q${n} linked solution`,d=>{
      const fragment=steps.get(n).at(-1);
      for(const part of d.questions[n-1].solution)for(const step of part.steps)step.text=step.text.map(t=>t.replaceAll(fragment,"[changed step]"));
    });
    reject(`Q${n} source marks`,d=>{d.questions[n-1].marks++;});
  }
  reject("Q9 sample denominator",d=>{
    for(const part of d.questions[8].solution)for(const step of part.steps)step.text=step.text.map(t=>t.replace("78895/72","78895/71"));
  });
  reject("Q11 changed frequency table",d=>{d.questions[10].diagram.rows[1][1]="14";});
  for(const [n,oldHint] of [[2,"u"],[3,"v"],[7,"∠AOB"],[10,"F(0)"],[12,"p(4)"],[19,"UT"]]) {
    reject(`Q${n} stale hint name`,d=>{d.questions[n-1].hints.push(oldHint);});
  }
  reject("Q18 mistaken dihedral",d=>{
    for(const part of d.questions[17].solution)for(const step of part.steps)step.text=step.text.map(t=>t.replaceAll(r18.dihedral.toFixed(6),"24.000000"));
  });
  assert.throws(()=>verifyFrequencyDiagram(svg.replace(">k</text>",">20</text>")),{name:"AssertionError"});rejected++;
  assert.throws(()=>verifyFrequencyDiagram(svg.replace(">10</text>",">12</text>")),{name:"AssertionError"});rejected++;
  return rejected;
}

const mathOnly=process.argv.includes("--math-only");
const data=mathOnly?null:JSON.parse(JSON.stringify(load("paper1/data-2021.js").PILOT_2021));
const rendering=mathOnly?null:verifyData(data);
let rejectedMutations=0;
if(!mathOnly) {
  const svg=load("paper1/diagrams-2021.js").pilotDiagram2021("readingBar2021");
  verifyFrequencyDiagram(svg);verifyCurriculumNotice(data);
  if(process.argv.includes("--self-test"))rejectedMutations=mutationTests(data,svg);
}
const report={year:2021,paper:1,sourcePageCount:new Set(sourcePages).size,questionCount:records.size,
  sections:[35,35,35],marks:105,dataVerified:!mathOnly,rendering,rejectedMutations,
  questions:[...records].map(([n,results])=>({n,sourcePage:sourcePages[n-1],marks:sourceMarks[n-1],answer:answers.get(n),results}))};
if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
else {
  console.log(`2021 Paper 1: ${records.size} independent calculations; 16 source pages; 35+35+35=105 marks audited.`);
  for(const q of report.questions)console.log(`Q${q.n} [p${q.sourcePage}, ${q.marks} marks]: ${q.answer}`);
  console.log(mathOnly?"Preparatory mathematics only: data, solution and rendering validation NOT run.":
    `Data, answers, linked solution steps, source subparts, domains, units and proof conditions passed; ${rendering.notationStrings} notation strings and ${rendering.solutionSteps} marked steps rendered.`);
  if(rejectedMutations)console.log(`Verifier self-test: ${rejectedMutations} deliberate mutations rejected without changing any data files.`);
}
