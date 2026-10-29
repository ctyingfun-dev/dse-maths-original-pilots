const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sourcePages=[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,20,22];
const schemePages=[1,1,1,2,2,3,3,4,4,5,5,6,7,8,10,10,11,12,13];
const sourceMarks=[3,3,3,4,4,4,4,5,5,6,6,7,7,9,4,4,5,9,13];
const sourceGroups=[null,null,null,{a:1,b:3},{a:3,b:1},{a:2,b:2},null,null,{a:2,b:3},{a:4,b:2},{a:3,b:3},{a:3,b:4},{a:2,b:3,c:2},{a:6,b:3},{a:2,b:2},{a:2,b:2},{a:2,b:3},{a:2,b:3,c:4},{a:7,b:6}];
const sourceLeafMarks=[[3],[3],[3],[1,3],[3,1],[2,2],[4],[5],[2,3],[4,2],[3,3],[3,4],[2,3,2],[3,3,3],[2,2],[2,2],[2,3],[2,3,4],[2,2,3,6]];
const sum=a=>a.reduce((s,v)=>s+v,0),rad=Math.PI/180;
const near=(a,b,label='numeric equality',eps=1e-8)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(a,b)=>{const g=gcd(a,b);return b/g===1?`${a/g}`:`${a/g}/${b/g}`;};
const sup=n=>String(n).replace(/[0-9-]/g,c=>c==='-'?'⁻':'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
const unsup=s=>Number(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>c==='⁻'?'-':String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))));
const clean=s=>s.replace(/\s/g,'');
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
const dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),sub=(a,b)=>a.map((v,i)=>v-b[i]),dist=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(dist(a,b)*dist(c,b)))))/rad;
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c;};
const combos=(a,k,start=0,prefix=[])=>k===0?[prefix]:a.flatMap((v,i)=>i<start?[]:combos(a,k-1,i+1,[...prefix,v]));
const sign=n=>n<0?`${n}`:`+${n}`;
function read(){
  const context={window:{}};
  for(const file of ['paper1/data-2015.js','paper1/diagrams-2015.js','paper1/math.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
  return {data:JSON.parse(JSON.stringify(context.window.PILOT_2015)),window:context.window};
}
function verify(data,window){
  const qs=data.questions,q=n=>qs[n-1],report=[];
  const answer=(n,s)=>assert.equal(clean(q(n).answer),clean(s),`Q${n} independently derived answer`);
  const match=(n,re)=>{const m=q(n).prompt.match(re);assert(m,`Q${n}: missing condition ${re}`);return m.slice(1).map(Number);};
  const allSteps=n=>q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join('\n');
  const contains=(n,...strings)=>{for(const s of strings)assert(allSteps(n).includes(s),`Q${n} missing checked reasoning: ${s}`);};
  assert.equal(data.year,2015);assert.equal(data.paper,1);assert.equal(data.minutes,135);assert.equal(qs.length,19);
  for(let i=0;i<19;i++){
    const item=qs[i],groups={};assert.equal(item.n,i+1);assert.equal(item.sourceNo,i+1);assert.equal(item.marks,sourceMarks[i]);
    assert.equal(item.section,i<9?'甲一':i<14?'甲二':'乙部');assert.deepEqual(item.markGroups||null,sourceGroups[i]);assert(item.hints.length);
    const leaf=[];
    for(const p of item.solution){let marks=0;for(const s of p.steps){
      assert.match(s.marks,/^[12](?:M|A)?$/);assert(Array.isArray(s.text)&&s.text.length);marks+=parseInt(s.marks,10);
      for(const text of s.text)assert(!/^[=≈]/.test(text),'no detached result');
    }leaf.push(marks);const k=p.part.match(/^\(([abc])\)/)?.[1]||'';groups[k]=(groups[k]||0)+marks;}
    assert.deepEqual(leaf,sourceLeafMarks[i]);assert.equal(sum(leaf),item.marks);if(item.markGroups)assert.deepEqual(groups,item.markGroups);
    report.push({n:i+1,sourcePage:sourcePages[i],schemePages:i===13?[8,9]:i===18?[13,14]:[schemePages[i]],marks:item.marks,leafMarks:leaf,answer:item.answer});
  }
  assert.deepEqual([sum(qs.slice(0,9).map(q=>q.marks)),sum(qs.slice(9,14).map(q=>q.marks)),sum(qs.slice(14).map(q=>q.marks))],[35,35,35]);

  const ex=q(1).prompt.match(/x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\/\(x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)y([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);assert(ex);
  const [num,dx,dy,power]=ex.slice(1).map(unsup),px=num-dx*power,py=-dy*power;assert(px<0&&py>0);
  answer(1,`y${sup(py)}/x${sup(-px)}`);
  for(const [x,y] of [[2,3],[-2,1.2],[.75,-1.5]])near(x**num/(x**dx*y**dy)**power,y**py/x**(-px));
  contains(1,`(x${sup(dx)}y${sup(dy)})${sup(power)}=x${sup(dx*power)}y${sup(dy*power)}`,`x${sup(px)}y${sup(py)}`);

  const [a2,b2,c2,d2]=match(2,/\((\d+)x\+(\d+)y-(\d+)\)\/y=(\d+)/),den2=d2-b2;
  answer(2,`y=(${a2}x-${c2})/${den2}`);
  for(const x of [-3,0,2,10]){const y=(a2*x-c2)/den2;near((a2*x+b2*y-c2)/y,d2);}
  contains(2,`7x-9=10y-4y=${den2}y`,`x≠${frac(c2,a2)}`);

  const bags=q(3).prompt.match(/四張牌分別標有 ([\d、-]+)；乙盒的五張牌分別標有 ([\d、-]+)。/);assert(bags);
  const first=bags[1].split('、').map(Number),second=bags[2].split('、').map(Number),[threshold3]=match(3,/之和小於 (\d+)/);
  assert.equal(first.length,4);assert.equal(second.length,5);
  const cases=first.map(a=>second.filter(b=>a+b<threshold3).length),total3=first.length*second.length;
  answer(3,frac(sum(cases),total3));contains(3,`(${cases.join('+')})/${total3}=${frac(sum(cases),total3)}`);
  for(const a of first){const possible=second.filter(b=>a+b<threshold3);contains(3,`甲牌為 ${a} 時`);if(possible.length)contains(3,`乙牌可為 ${possible.join('、')}，共 ${possible.length} 個結果`);}
  assert(cases.some(c=>c===0));

  const [a4,b4,c4,d4,e4]=match(4,/\(b\) x³\+(\d+)x²y-(\d+)x²-(\d+)x-(\d+)y\+(\d+)/),root4=Math.sqrt(c4);
  assert(Number.isInteger(root4));near(c4*a4,d4);near(c4*b4,e4);assert(q(4).prompt.includes(`(a) x³+${a4}x²y-${b4}x²`));
  const factor4=`x+${a4}y-${b4}`;answer(4,`x²(${factor4})；(x-${root4})(x+${root4})(${factor4})`);
  for(const [x,y] of [[2,3],[-5,2],[1.2,-.5]])near(x**3+a4*x*x*y-b4*x*x-c4*x-d4*y+e4,(x-root4)*(x+root4)*(x+a4*y-b4));
  contains(4,`(x²-${c4})(${factor4})`,`(x-${root4})(x+${root4})(${factor4})`);

  const [a5,b5,den5,c5,d5,e5,f5]=match(5,/\((\d+)-(\d+)x\)\/(\d+)≤(\d+)\(x-(\d+)\) 及 (\d+)x-(\d+)>0/);
  const lowerA=(a5+den5*c5*d5)/(b5+den5*c5),lowerB=f5/e5;assert(lowerB>lowerA);
  const min5=Math.floor(lowerB)+1;answer(5,`x>${frac(f5,e5)}；${min5}`);
  for(const x of [-100,lowerA,lowerB,lowerB+.001,100])assert.equal((a5-b5*x)/den5<=c5*(x-d5)&&e5*x-f5>0,x>lowerB);
  contains(5,`x≥${frac(a5+den5*c5*d5,b5+den5*c5)}`,`x>${frac(f5,e5)}`,`最小整數為 ${min5}`);

  const [cost6,rate6]=match(6,/成本為 \$(\d+).*成本的 (\d+)%/);assert(q(6).prompt.includes('八折'));
  const sale6=cost6*(1+rate6/100),marked6=sale6/.8;answer(6,`$${sale6}；$${marked6}`);
  contains(6,`售價=${cost6}×1.15=$${sale6}`,`x=${sale6}/0.8=${marked6}`);

  const [ratio7,transfer7]=match(7,/乙組的 (\d+) 倍；甲組把 (\d+) 枚/),small7=2*transfer7/(ratio7-1),large7=ratio7*small7;
  assert(Number.isInteger(small7));near(large7-transfer7,small7+transfer7);answer(7,`${small7+large7}枚`);
  contains(7,`${ratio7-1}x=${2*transfer7}`,`x=${small7}`,`總數=${large7}+${small7}=${large7+small7}`);

  const [atM,atK]=match(8,/∠JMK=(\d+)° 及 ∠LKM=(\d+)°/);assert.deepEqual(q(8).diagram,{type:'circleAngles2015',atM,atK});
  assert(q(8).prompt.includes('KL=LN')&&q(8).prompt.includes('JK=JM'));
  const angleM=180-2*atM-atK,base8=(180-atM)/2,angleN=atM+atK-base8;
  const polar=a=>[Math.cos(a*rad),Math.sin(a*rad)],J=polar(90),K=polar(90+2*atM),M=polar(90-2*atM),L=polar(90-2*atM-2*atK),t8=dist(K,L)/dist(J,L),N=L.map((v,i)=>v+t8*(J[i]-v));
  assert(t8>0&&t8<1);near(dist(J,K),dist(J,M));near(dist(K,L),dist(L,N));near(angle(J,M,K),atM);near(angle(L,K,M),atK);near(angle(K,M,L),angleM);near(angle(J,K,N),angleN);
  answer(8,`∠KML=${angleM}°；∠JKN=${angleN}°`);contains(8,`∠KML=${180-atM-atK}°-${atM}°=${angleM}°`,`∠LKN=(180°-${atM}°)/2=${base8}°`,`∠JKN=${angleN}°`);

  const [radius9,area9]=match(9,/半徑為 (\d+) cm，面積為 (\d+)π cm²/),theta9=360*area9/radius9**2,arc9=frac(2*area9,radius9),[arcNum,arcDen=1]=arc9.split('/').map(Number),arcText=arcDen===1?`${arcNum}π`:`${arcNum}π/${arcDen}`;
  answer(9,`${theta9}°；(${2*radius9}+${arcText}) cm`);near(theta9/360*2*Math.PI*radius9,2*area9*Math.PI/radius9);
  contains(9,`θ=${theta9}`,`弧長=(${theta9}/360)×2π×${radius9}=${arcText} cm`,`周界為 (${2*radius9}+${arcText}) cm`);

  const [n1,t1,n2,t2,targetN,targetT]=match(10,/n=(\d+) 時 T=(\d+)；n=(\d+) 時 T=(\d+).*\n\(a\).*完成 (\d+) 宗.*\n\(b\).*\$(\d+)/);
  const unit10=(t2-t1)/(n2-n1),fixed10=t1-n1*unit10,requested10=fixed10+unit10*targetN,needed10=(targetT-fixed10)/unit10;
  near(fixed10+n2*unit10,t2);assert(!Number.isInteger(needed10));answer(10,`$${requested10}；不能`);
  contains(10,`b=${unit10}`,`T=${fixed10}+${unit10}n`,`T=${fixed10}+${unit10}×${targetN}=${requested10}`,`n=(${targetT}-${fixed10})/${unit10}=${frac(targetT-fixed10,unit10)}`);

  const [s11,div11,rem11,r11]=match(11,/g\(x\)≡\(x-(\d+)\)²\(x\+c\)\+d.*除以 x-(\d+)，餘式為 (-?\d+)；而 x-(\d+)/);assert.equal(s11,div11);
  const c11=-rem11/(r11-s11)**2-r11,coeff11=mul([s11*s11,-2*s11,1],[c11,1]);coeff11[0]+=rem11;
  const qb=coeff11[2]+r11,qc=coeff11[1]+r11*qb,dis11=qb*qb-4*qc,center11=-qb/2;
  assert.equal(coeff11[0],-r11*qc);assert(dis11>0&&!Number.isInteger(Math.sqrt(dis11)));assert.equal(dis11%4,0);
  const rootText=`${center11}+√${dis11/4}、${center11}-√${dis11/4}`;
  answer(11,`c=${c11}，d=${rem11}；不正確，根為${r11}、${rootText}`);
  for(const x of [r11,(-qb+Math.sqrt(dis11))/2,(-qb-Math.sqrt(dis11))/2])near((x-s11)**2*(x+c11)+rem11,0);
  assert.deepEqual(mul([-r11,1],[qc,qb,1]),coeff11);
  contains(11,`c=${c11}`,`d=${rem11}`,`x³${sign(coeff11[2]).replace(/([+-])1$/,'$1')}x²${sign(coeff11[1])}x${sign(coeff11[0])}`,`(x-${r11})(x²+${qb}x${sign(qc).replace('-1','-1')})`,`x=(-${qb}±√${dis11})/2=${center11}±√${dis11/4}`);

  const d12=q(12).diagram,values=d12.stems.flatMap((s,i)=>d12.leaves[i].map(v=>10*s+v)).sort((a,b)=>a-b);
  const [count12,meanChange,rangeChange]=match(12,/記錄 (\d+) 個.*平均值增加 (\d+) kg，分佈域增加 (\d+) kg/s);
  assert.equal(values.length,count12);assert(values.every(Number.isInteger));
  const total12=sum(values),mean12=total12/count12,median12=(values[count12/2-1]+values[count12/2])/2,lo12=values[0],hi12=values.at(-1),range12=hi12-lo12,newRange=range12+rangeChange,newSum=(count12+2)*(mean12+meanChange)-total12;
  const candidates=[[hi12-newRange,newSum-hi12+newRange],[newSum-lo12-newRange,lo12+newRange],[(newSum-newRange)/2,(newSum+newRange)/2]];
  const feasible=candidates.filter(([a,b])=>a<=b&&Math.max(hi12,b)-Math.min(lo12,a)===newRange);
  const unique=[...new Map(feasible.map(c=>[c.join(','),c])).values()];assert.equal(unique.length,1);const [newA,newB]=unique[0];
  answer(12,`${mean12} kg；${median12} kg；${range12} kg；${newA} kg及${newB} kg`);
  contains(12,`平均值=${total12}/${count12}=${mean12} kg`,`分佈域=${hi12}-${lo12}=${range12} kg`,`a+b=${newSum}`,`b=${lo12}+${newRange}=${newB}`,`a=${newSum}-${newB}=${newA}`);

  const [lv,uw]=match(13,/LV=(\d+) cm 及 UW=(\d+) cm/);assert.deepEqual(q(13).diagram,{type:'squareCrossing2015',lv,uw});
  const kw=Math.sqrt(lv*lv-uw*uw),side13=lv*kw/uw,J13=[0,side13],K13=[0,0],L13=[side13,0],U13=[lv,0],V13=[side13,lv],W13=[side13**2*lv/(side13**2+lv**2),side13*lv**2/(side13**2+lv**2)];
  assert(side13>lv);near(dist(J13,U13),dist(K13,V13));near(dist(U13,W13),uw);near(dist(K13,W13),kw);near(angle(K13,W13,U13),90);
  near(angle(K13,J13,U13),angle(L13,K13,V13));assert(Math.abs(lv/15-uw/9)>.01);
  answer(13,`△JKU≅△KLV；是，∠KWU=90°；${kw} cm`);contains(13,'△JKU≅△KLV（RHS）','∠WKU+∠KUW=90°',`KW=√${lv*lv-uw*uw}=${kw} cm`);

  const [jx,jy,kx,ky]=match(14,/J=\((-?\d+),(-?\d+)\)，K=\((-?\d+),(-?\d+)\)/),[rx,ry]=match(14,/R 的坐標為 \((-?\d+),(-?\d+)\)/);
  let la=2*(kx-jx),lb=2*(ky-jy),lc=jx*jx+jy*jy-kx*kx-ky*ky;const dg=gcd(gcd(la,lb),lc);la/=dg;lb/=dg;lc/=dg;
  const hk=h=>-(la*h+lc)/lb,ca=2*la/lb,cb=2*lc/lb,cc=2*jx-2*jy*la/lb,cd=-2*jy*lc/lb-jx*jx-jy*jy;
  const general=`x²+y²-2hx+(${ca}h${sign(cb)})y+${cd}${sign(cc)}h=0`;
  assert(q(14).prompt.includes(general));
  for(const h of [-10,0,7,20])for(const [x,y] of [[jx,jy],[kx,ky]])near(x*x+y*y-2*h*x+(ca*h+cb)*y+cd+cc*h,0);
  const h14=-(rx*rx+ry*ry+cb*ry+cd)/(-2*rx+ca*ry+cc),k14=hk(h14),rSquared=(jx-h14)**2+(jy-k14)**2;
  for(const p of [[jx,jy],[kx,ky],[rx,ry]])near(dist(p,[h14,k14])**2,rSquared);
  answer(14,`${la}x+${lb}y${sign(lc)}=0；${general}；2√${rSquared}`);
  contains(14,`Γ：${la}x+${lb}y${sign(lc)}=0`,`h=${h14}`,`圓心為 (${h14},${k14})`,`直徑為 2√${rSquared}`);

  const [z15,score15]=match(15,/標準分為 (-?[\d.]+).*\n\(a\).*\n\(b\).*地理得分為 (\d+)/),d15=q(15).diagram,scoreA=d15.means[0]+z15*d15.sds[0],zB=(score15-d15.means[1])/d15.sds[1];
  assert(d15.sds.every(n=>n>0));assert(zB>z15);assert(q(15).prompt.includes('正態分佈'));
  answer(15,`${scoreA}分；正確，地理標準分為${zB}`);contains(15,`x=${d15.means[0]}-0.75×${d15.sds[0]}=${scoreA}`,`地理標準分=(${score15}-${d15.means[1]})/${d15.sds[1]}=${zB}`,`${zB}>${z15}`);

  const [red,blue,white,draw,exact16]=match(16,/(\d+) 枚紅色、(\d+) 枚藍色及 (\d+) 枚白色.*取出 (\d+) 枚.*\n\(a\).* (\d+) 枚紅色/),N16=red+blue+white,total16=choose(N16,draw),fav16=choose(red,exact16)*choose(blue+white,draw-exact16);
  const all16=combos(Array.from({length:N16},(_,i)=>i),draw),counts16=Array(draw+1).fill(0);for(const set of all16)counts16[set.filter(v=>v<red).length]++;
  assert.equal(total16,all16.length);assert.equal(fav16,counts16[exact16]);const atLeast=sum(counts16.slice(exact16));
  answer(16,`${frac(fav16,total16)}；${frac(atLeast,total16)}`);
  contains(16,`C(${N16},${draw})=${total16}`,`所求概率=${fav16}/${total16}=${frac(fav16,total16)}`,`${atLeast}/${total16}=${frac(atLeast,total16)}`);

  const [a17,b17,base17,limit17]=match(17,/U\(n\)=(\d+)n-(\d+) 及 V\(n\)=(\d+)\^.*≤(\d+)/s);assert.equal(base17,10);
  const linear17=a17/2-b17,quad17=a17/2,total17=n=>n*(quad17*n+linear17);let max17=0;
  for(let n=1;n<=1000;n++){const direct=sum(Array.from({length:n},(_,i)=>a17*(i+1)-b17));near(total17(n),direct);if(direct<=limit17)max17=n;}
  const otherFactor=quad17*max17+linear17;near(max17*otherFactor,limit17);assert(total17(max17+1)>limit17);
  answer(17,`n(${quad17}n${sign(linear17)})；${max17}`);contains(17,`(n-${max17})(${quad17}n+${otherFactor})≤0`,`最大值為 ${max17}`,`${max17+1}(3×${max17+1}-4)=${total17(max17+1)}>${limit17}`);

  const [A18,B18,C18,D18,reflect18]=match(18,/p\(x\)=(\d+)x²-(\d+)kx\+(\d+)k²\+(\d+).*\n\(a\).*\n\(b\).*\n\(c\).*y=(\d+)-p\(x\)/),vxCoeff=B18/(2*A18),vCoeff=C18-B18*B18/(4*A18),discCoeff=B18*B18-4*A18*C18,discConst=-4*A18*D18;
  assert.equal(vxCoeff,1);assert(discCoeff<0&&discConst<0&&D18>reflect18);assert(q(18).prompt.includes('不共線'));
  const mid18=reflect18/2;
  for(const k of [-5,-1,.5,2]){
    const hi=vCoeff*k*k+D18,low=reflect18-hi,p=x=>A18*x*x-B18*k*x+C18*k*k+D18;
    for(const x of [-4,0,k,7])near(p(x),A18*(x-k)**2+hi);
    const cy=(hi+low)/2,cx=(k*k+hi*hi-2*hi*cy)/(2*k),center=[cx,cy];
    near(cy,mid18);near(dist(center,[0,0]),dist(center,[k,hi]));near(dist(center,[0,0]),dist(center,[k,low]));
    for(const x of [-4,k,5])for(const y of [-3,k,6])assert(Math.hypot(x-y,p(x)-(reflect18-p(y)))>=hi-low-1e-9);
  }
  answer(18,`不相交；(k,${vCoeff}k²+${D18})；不是，外心的y坐標為${mid18}`);
  contains(18,`Δ=${B18*B18}k²-${4*A18*C18}k²-${4*A18*D18}=${discCoeff}k²${sign(discConst)}`,`p(x)=${A18}(x-k)²+${vCoeff}k²+${D18}`,`垂直平分線為 y=${mid18}`,'並不構成三角形');

  const [long19,short19,corner19]=match(19,/JK=JL′=(\d+) cm、KL=L′M=(\d+) cm\s+及 ∠JKL=∠JL′M=(\d+)°/),[low19,high19]=match(19,/(\d+)°≤∠KLM≤(\d+)°/),[fold19]=match(19,/現取 ∠KLM=(\d+)°/);
  assert.deepEqual(q(19).diagram,{type:'foldedCard2015',long:long19,short:short19,corner:corner19,angleLow:low19,angleHigh:high19,foldAngle:fold19});
  assert(Math.abs(long19/40-short19/24)>.01&&corner19!==80,'not a source rescaling');
  const side19=Math.sqrt(long19**2+short19**2-2*long19*short19*Math.cos(corner19*rad)),gamma19=Math.acos((short19**2+side19**2-long19**2)/(2*short19*side19))/rad,turn19=gamma19+45;
  assert(corner19+180-gamma19>180);assert(low19<turn19&&turn19<high19);
  const area19=t=>long19*short19*Math.sin(corner19*rad)+side19**2*Math.sin((180-2*(t-gamma19))*rad)/2;
  for(let i=0;i<100;i++){const t=low19+(turn19-low19)*i/100;assert(area19(t+.0001)>area19(t));const u=turn19+(high19-turn19)*(i+1)/100;assert(area19(u-.0001)>area19(u));}
  const half19=side19*Math.cos((fold19-gamma19)*rad),am19=Math.sqrt(side19**2-half19**2),bm19=Math.sqrt(short19**2-half19**2),cos19=(am19**2+bm19**2-long19**2)/(2*am19*bm19),height19=bm19*Math.sqrt(1-cos19*cos19),volume19=half19*am19*height19/3;
  assert(Number.isFinite(volume19)&&volume19>0);
  // Independently solve the tetrahedron's coordinates and use a scalar triple product.
  const L19=[-half19,0,0],M19=[half19,0,0],J19=[0,am19,0],y19=(side19**2-half19**2+short19**2-half19**2-long19**2)/(2*am19),z19=Math.sqrt(short19**2-half19**2-y19**2),K19=[0,y19,z19];
  near(dist(J19,K19),long19);near(dist(K19,L19),short19);near(dist(K19,M19),short19);near(dist(J19,L19),side19);near(angle(J19,K19,L19),corner19);
  const u=sub(J19,L19),v=sub(M19,L19),w=sub(K19,L19),cross=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]];
  near(Math.abs(dot(u,cross))/6,volume19);
  answer(19,`${Number(side19.toPrecision(3))} cm；${Number(gamma19.toPrecision(3))}°；先增加後減少，在${turn19.toFixed(7)}°時最大；${Number(volume19.toPrecision(3))} cm³`);
  const approximations=[[/JL≈([\d.]+) cm/,side19],[/∠JLK≈([\d.]+)°/,gamma19],[/LN=JLcos∠JLM≈([\d.]+) cm/,half19],[/JN=√\(JL²-LN²\)≈([\d.]+) cm/,am19],[/KN=√\(22²-LN²\)≈([\d.]+) cm/,bm19],[/cos∠JNK≈(-?[\d.]+)/,cos19],[/高=KNsin∠JNK≈([\d.]+) cm/,height19],[/底面積=LM×JN\/2≈([\d.]+) cm²/,half19*am19],[/≈([\d.]+) cm³/,volume19]];
  for(const [re,expected] of approximations){const found=allSteps(19).match(re);assert(found,`Q19 ${re}`);near(Number(found[1]),expected,'Q19 intermediate',1e-7);}
  contains(19,`JK=JL′=${long19} cm，KL=L′M=${short19} cm`, `∠JKL=∠JL′M=${corner19}°`,'故 △JKL≅△JL′M（SAS），所以 JL=JM','摺疊不改變各三角形的邊長','都垂直 LM');

  let notationStrings=0;
  for(const item of qs){
    assert(!item.prompt.includes('寫出'));assert.doesNotMatch(JSON.stringify(item),/[橫縱横纵]|角邊角|邊角邊|待補|placeholder/);
    for(const text of [item.prompt,item.answer,...item.hints,...item.solution.flatMap(p=>p.steps.flatMap(s=>s.text))]){
      const visible=window.mathText(text).replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'');
      assert.doesNotMatch(visible,/[\/÷√]/,`Q${item.n} uncovered notation: ${text}`);notationStrings++;
    }
  }
  const figures=qs.filter(q=>q.diagram);assert.deepEqual(figures.map(q=>q.n),[8,12,13,15,19]);
  for(const item of figures){const svg=window.pilotDiagram2015(item.diagram.type);assert(svg.includes('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));assert(svg.includes('viewBox='));}
  const polarQuestionIds=qs.filter(q=>/極坐標/.test(q.topic+' '+q.prompt)).map(q=>q.n);assert.deepEqual(polarQuestionIds,[]);
  return {questionCount:19,totalMarks:105,sectionCounts:[9,5,5],sectionMarks:[35,35,35],polarQuestionIds,figureIds:figures.map(q=>q.n),notationStrings,questions:report};
}
function selfTest(data,window){
  const mutations=[
    [1,'x¹¹','x¹²'],[2,'7x+4y','7x+5y'],[3,'-2、1、4、8','-2、2、4、8'],[4,'-9x','-8x'],[5,'5x-23','5x-24'],[6,'$480','$500'],[7,'18 枚','20 枚'],[8,'64°','63°'],[9,'55π','56π'],[10,'T=7720','T=7800'],[11,'-40','-44'],[12,'增加 2 kg','增加 3 kg'],[13,'17 cm','18 cm'],[14,'(16,-1)','(17,-1)'],[15,'57 分','58 分'],[16,'6 枚紅色','7 枚紅色'],[17,'5124','5125'],[18,'5k²','6k²'],[19,'35 cm','36 cm']
  ].map(([n,from,to])=>d=>{assert(d.questions[n-1].prompt.includes(from));d.questions[n-1].prompt=d.questions[n-1].prompt.replace(from,to);});
  for(let i=0;i<19;i++){
    mutations.push(d=>d.questions[i].answer+='錯');
    mutations.push(d=>d.questions[i].marks++);
  }
  for(const [n,from,to] of [[1,'x⁻⁵y¹²','x⁻⁴y¹²'],[2,'6y','5y'],[3,'9/20','8/20'],[4,'x²-9','x²-8'],[5,'x≥20/11','x≥21/11'],[6,'$552','$553'],[7,'4x=36','4x=35'],[8,'∠JKN=27°','∠JKN=28°'],[9,'θ=88','θ=89'],[10,'b=360','b=361'],[11,'x³-x²-21x+5','x³-x²-20x+5'],[12,'平均值=1240/20=62','平均值=1240/20=63'],[13,'KW=√225=15','KW=√225=16'],[14,'h=9','h=8'],[15,'-0.5>-0.75','-0.6>-0.75'],[16,'540/1365=36/91','541/1365=36/91'],[17,'最大值為 42','最大值為 43'],[18,'垂直平分線為 y=3','垂直平分線為 y=4'],[19,'2433.2696533','2533.2696533']])mutations.push(d=>{
    let changed=false;for(const p of d.questions[n-1].solution)for(const s of p.steps)s.text=s.text.map(t=>{if(t.includes(from)){changed=true;return t.replace(from,to);}return t;});assert(changed,`mutation Q${n}`);
  });
  for(const n of [8,12,13,15,19])mutations.push(d=>{const figure=d.questions[n-1].diagram;if(n===12)figure.leaves[0][0]++;else if(n===15)figure.means[0]++;else figure[Object.keys(figure)[1]]++;});
  mutations.push(d=>d.questions[13].markGroups.a=5,d=>d.questions[18].markGroups.a=8,d=>d.questions[12].solution[0].steps[1].text=['全等（SSS）。'],d=>d.questions[17].prompt=d.questions[17].prompt.replace('且 O、J、K 不共線',''));
  for(let i=0;i<mutations.length;i++){const copy=JSON.parse(JSON.stringify(data));mutations[i](copy);assert.throws(()=>verify(copy,window),undefined,`mutation ${i+1} was not rejected`);}
  return mutations.length;
}
if(require.main===module){
  const {data,window}=read(),report=verify(data,window);
  if(process.argv.includes('--self-test'))report.rejectedMutations=selfTest(data,window);
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else {console.log('2015 Paper 1: 19 independently derived questions; 35+35+35=105 marks; five diagram/table items; no polar item.');for(const q of report.questions)console.log(`Q${q.n} [paper p${q.sourcePage}, scheme p${q.schemePages.join(',')}]: ${q.answer}`);console.log(`Notation strings: ${report.notationStrings}; rejected mutations: ${report.rejectedMutations||0}.`);}
}
module.exports={read,verify,selfTest,sourcePages,schemePages,sourceMarks,sourceGroups,sourceLeafMarks};
