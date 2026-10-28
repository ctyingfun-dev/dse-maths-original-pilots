const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sourcePages=[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,19,20,22];
const schemePages=[3,3,3,4,4,5,5,5,6,7,8,9,10,11,12,12,13,13,14,15];
const sourceMarks=[3,3,3,4,4,4,4,5,5,5,6,7,7,10,3,3,5,6,6,12];
const sourceGroups=[null,null,null,{a:1,b:1,c:2},null,{a:3,b:1},{a:1,b:2,c:1},{a:3,b:2},{a:3,b:2},{a:2,b:3},{a:3,b:3},{a:3,b:4},{a:2,b:5},{a:5,b:5},null,null,{a:2,b:3},{a:2,b:2,c:2},{a:4,b:2},{a:3,b:9}];
const sum=a=>a.reduce((s,x)=>s+x,0),rad=Math.PI/180;
const near=(a,b,label='numeric equality',eps=1e-8)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(a,b)=>{const g=gcd(a,b);return b/g===1?`${a/g}`:`${a/g}/${b/g}`;};
const sup=n=>String(n).replace(/[0-9-]/g,c=>c==='-'?'⁻':'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
const unsup=s=>Number(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>c==='⁻'?'-':String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))));
const clean=s=>s.replace(/\s/g,'');
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2;};
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c;};
const dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),sub=(a,b)=>a.map((v,i)=>v-b[i]),dist=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b,c)=>Math.acos(dot(sub(a,b),sub(c,b))/(dist(a,b)*dist(c,b)))/rad;
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
const combos=(a,k,start=0,prefix=[])=>k===0?[prefix]:a.flatMap((v,i)=>i<start?[]:combos(a,k-1,i+1,[...prefix,v]));
function read(){
  const context={window:{}};
  for(const file of ['paper1/data-2016.js','paper1/diagrams-2016.js','paper1/math.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
  return {data:JSON.parse(JSON.stringify(context.window.PILOT_2016)),window:context.window};
}
function verify(data,window){
  const qs=data.questions,q=n=>qs[n-1];
  const answer=(n,s)=>assert.equal(clean(q(n).answer),clean(s),`Q${n} independently derived answer`);
  const match=(n,re)=>{const m=q(n).prompt.match(re);assert(m,`Q${n}: missing condition ${re}`);return m.slice(1).map(Number);};
  const contains=(n,...ss)=>{const text=q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join('\n');for(const s of ss)assert(text.includes(s),`Q${n} missing reasoning ${s}`);};
  assert.equal(data.year,2016);assert.equal(data.paper,1);assert.equal(data.minutes,135);assert.equal(qs.length,20);
  const report=[];
  for(let i=0;i<20;i++){
    const item=qs[i],groups={};assert.equal(item.n,i+1);assert.equal(item.sourceNo,i+1);assert.equal(item.marks,sourceMarks[i]);
    assert.equal(item.section,i<9?'甲一':i<14?'甲二':'乙部');assert.deepEqual(item.markGroups||null,sourceGroups[i]);assert(item.hints.length);
    for(const p of item.solution)for(const s of p.steps){assert.match(s.marks,/^[12](?:M|A)?$/);assert(Array.isArray(s.text)&&s.text.length);const k=p.part.match(/^\(([abc])\)/)?.[1]||'';groups[k]=(groups[k]||0)+parseInt(s.marks,10);}
    assert.equal(sum(Object.values(groups)),item.marks);if(item.markGroups)assert.deepEqual(groups,item.markGroups);
    report.push({n:i+1,sourcePage:sourcePages[i],schemePage:schemePages[i],marks:item.marks,answer:item.answer});
  }
  assert.deepEqual([sum(qs.slice(0,9).map(q=>q.marks)),sum(qs.slice(9,14).map(q=>q.marks)),sum(qs.slice(14).map(q=>q.marks))],[35,35,35]);

  // Powers are derived from the actual expression, including the negative denominator power.
  const powers=q(1).prompt.match(/\(x([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)y([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\/\(x([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)y([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\)/);assert(powers);
  const [px,py,k,dx,dy]=powers.slice(1).map(unsup),ax=px*k-dx,ay=py*k-dy;
  assert(ax>0&&ay>0);answer(1,`x${sup(ax)}y${sup(ay)}`);
  for(const [x,y] of [[2,3],[-2,1.5],[.75,-1.25]])near((x**px*y**py)**k/(x**dx*y**dy),x**ax*y**ay);

  const [coefficient]=match(2,/Ax=\((\d+)x\+B\)C/);assert(q(2).prompt.includes(`A≠${coefficient}C`));answer(2,`x=BC/(A-${coefficient}C)`);
  for(const [A,B,C] of [[9,2,1],[1,-3,2],[7,0,0]]){const x=B*C/(A-coefficient*C);near(A*x,(coefficient*x+B)*C);}

  const [u,a,b,v,c,d]=match(3,/(\d+)\/\((\d+)x-(\d+)\)\+(\d+)\/\((\d+)-(\d+)x\)/);
  assert.equal(-u*d+v*a,0);const numerator=v*b-u*c;
  answer(3,`${numerator}/[(${a}x-${b})(${d}x-${c})]`);
  for(const x of [-2,0,2,3.7])near(u/(a*x-b)+v/(c-d*x),numerator/((a*x-b)*(d*x-c)));
  contains(3,`x≠${frac(b,a)}`,`x≠${frac(c,d)}`);

  const [f,g,lin,quad]=match(4,/\(a\) (\d+)x-(\d+)y，\n\(b\) x²\+(\d+)xy-(\d+)y²/);
  const r=g/f,s=lin+r;near(r*s,quad);assert(q(4).prompt.includes(`x²+${lin}xy-${quad}y²-${f}x+${g}y`));
  answer(4,`${f}(x-${r}y)；(x+${s}y)(x-${r}y)；(x-${r}y)(x+${s}y-${f})`);
  for(const [x,y] of [[2,3],[-5,2],[1.2,-.5]])near(x*x+lin*x*y-quad*y*y-f*x+g*y,(x-r*y)*(x+s*y-f));

  const [total,percent]=match(5,/共有 (\d+) 箱.*多 (\d+)%/),colour=total/(2+percent/100),white=total-colour;
  assert(Number.isInteger(colour)&&Number.isInteger(white));near(white,colour*(1+percent/100));answer(5,`${white-colour}箱`);

  const [c6,m6,d6,end6]=match(6,/x\+(\d+)<(\d+)\(x\+(\d+)\) 或 x≤(-?\d+)/),lower=(c6-m6*d6)/(m6-1);
  assert(m6>1&&lower<end6);for(const x of [lower-100,lower,lower+0.1,end6,end6+100,-1])assert(x+c6<m6*(x+d6)||x<=end6);
  answer(6,'所有實數；-1');contains(6,'聯集','反轉不等號');

  const [r7,t7,r8,t8]=match(7,/\((\d+),(\d+)°\) 及 \((\d+),(\d+)°\)/);assert.equal(r7,r8);
  const phi=Math.min(Math.abs(t8-t7),360-Math.abs(t8-t7)),side=Math.sqrt(2*r7*r7*(1-Math.cos(phi*rad)));near(side,r7);assert.equal(phi,60);
  answer(7,`${phi}°；${2*r7+Math.round(side)}；3`);assert(q(7).topic.includes('極坐標'));

  const [x1,y1,x2,y2,target]=match(8,/g\((\d+)\)=(\d+) 及 g\((\d+)\)=(\d+).*\n\(a\).*\n\(b\) 解方程 g\(x\)=(\d+)/);
  const b8=(y2/x2-y1/x1)/(x2-x1),a8=y1/x1-b8*x1,dis8=a8*a8+4*b8*target,root1=(-a8+Math.sqrt(dis8))/(2*b8),root2=(-a8-Math.sqrt(dis8))/(2*b8);
  near(b8*x1*x1+a8*x1,y1);near(b8*x2*x2+a8*x2,y2);for(const x of [root1,root2])near(b8*x*x+a8*x,target);
  answer(8,`g(x)=${b8}x²+${a8}x；x=${root1} 或 x=${frac(-a8-Math.sqrt(dis8),2*b8)}`);

  const d9=q(9).diagram,f9=d9.frequencies,c9=d9.cumulative;assert.equal(f9.length,6);assert.equal(c9.length,6);
  assert.deepEqual([f9[0],f9[2],f9[3]],['a','b','c']);assert.deepEqual([c9[1],c9[3],c9[5]],['x','y','z']);
  const xx=c9[0]+f9[1],yy=c9[4]-f9[4],zz=c9[4]+f9[5],derivedFreq=[c9[0],f9[1],c9[2]-xx,yy-c9[2],f9[4],f9[5]];
  assert(derivedFreq.every(v=>Number.isInteger(v)&&v>0));assert.equal(sum(derivedFreq),zz);
  const [upper9,lower9]=match(9,/少於 ([\d.]+) kg 但不少於 ([\d.]+) kg/);assert.equal(upper9,d9.bounds[3]);assert.equal(lower9,d9.bounds[1]);
  d9.intervals.forEach((v,i)=>{const ends=v.split('–').map(Number);near(ends[1]+.05,d9.bounds[i]);if(i)near(ends[0]-.05,d9.bounds[i-1]);});
  answer(9,`x=${xx}，y=${yy}，z=${zz}；${frac(yy-xx,zz)}`);

  const [jx,jy,kx,ky,threshold10]=match(10,/\((\d+),(\d+)\) 及 \((\d+),(\d+)\).*\n\(a\).*\n\(b\).*超過 (\d+)/);
  let la=2*(kx-jx),lb=2*(ky-jy),lc=jx*jx+jy*jy-kx*kx-ky*ky;const divisor=gcd(gcd(la,lb),lc);la/=divisor;lb/=divisor;lc/=divisor;
  const hx=-lc/la,ny=-lc/lb,diam=Math.hypot(hx,ny);assert(Math.PI*diam>threshold10);
  near((la*(jx+kx)/2+lb*(jy+ky)/2+lc),0);near(la*(ky-jy)-lb*(kx-jx),0);
  answer(10,`${la}x${lb}y${lc}=0；是，圓周為 ${Math.round(diam*4)}π/4`);

  const [hi,added,hf,threshold11]=match(11,/為 (\d+) cm 的蠟液。\s*再倒入 (\d+)π cm³.*變為 (\d+) cm.*\n\(a\).*\n\(b\).*為 (\d+) cm²/);
  const volume=added/(1-(hi/hf)**3),r11=Math.sqrt(3*volume/hf),slant=Math.hypot(r11,hf),areaCoeff=r11*slant;
  near(volume*(hi/hf)**3+added,volume);assert(areaCoeff*Math.PI<threshold11);answer(11,`${Math.round(volume)}π cm³；否，曲面面積為 ${Math.round(areaCoeff)}π cm²`);

  // Enumerate every legal frequency pair and all five possible sets of four new lengths.
  const [lowerA,lowerB,upperB,med12]=match(12,/a>(\d+) 及 (\d+)<b<(\d+).*中位數為 ([\d.]+)/),d12=q(12).diagram;
  const cases=[];for(let b=lowerB+1;b<upperB;b++)for(let a=lowerA+1;a<100;a++){
    const counts=d12.frequencies.map(v=>v==='a'?a:v==='b'?b:v),values=counts.flatMap((n,i)=>Array(n).fill(d12.values[i]));
    if(median(values)===med12)cases.push({a,b,values});
  }
  assert.equal(cases.length,2);let maxMedian=-Infinity,minMean=Infinity,minSum,minN;
  for(const c of cases)for(const added of combos(d12.values,4)){
    const all=[...c.values,...added];maxMedian=Math.max(maxMedian,median(all));
    if(sum(all)/all.length<minMean){minMean=sum(all)/all.length;minSum=sum(all);minN=all.length;}
  }
  answer(12,`${cases.map(c=>`a=${c.a}、b=${c.b}`).join(' 或 ')}；${maxMedian} cm；${frac(minSum,minN)} cm`);
  contains(12,'中央的 9 及 10','其他選法不會使任何排序位置的長度更大');

  const [ju,ku,uv]=match(13,/JU=(\d+) cm、KU=(\d+) cm 及 UV=(\d+) cm/);assert.deepEqual([q(13).diagram.ju,q(13).diagram.ku,q(13).diagram.uv],[ju,ku,uv]);
  assert(q(13).prompt.includes('KU=LV、∠JUL=∠JVK 及 UM=VM'));
  const h13=Math.sqrt(ju*ju-(uv/2)**2),J13=[ku+uv/2,h13],K13=[0,0],U13=[ku,0],V13=[ku+uv,0],L13=[2*ku+uv,0];
  near(dist(J13,L13),dist(J13,K13));near(dist(J13,U13),dist(J13,V13));near(angle(J13,U13,L13),angle(J13,V13,K13));near(angle(K13,J13,V13),90);
  const km13=ku+uv/2,jkSquared13=h13*h13+km13*km13,kv13=ku+uv;
  near(jkSquared13+ju*ju,kv13*kv13);assert(Math.abs(ju/15-ku/7)>1e-6&&Math.abs(ju/15-uv/18)>1e-6,'Q13 must not be a uniform source scaling');
  contains(13,`UM=${uv}/2=${uv/2} cm`,`KM=KU+UM=${ku}+${uv/2}=${km13} cm`,`JK²=JM²+KM²=${h13}²+${km13}²=${jkSquared13}`,`JK²+JV²=${jkSquared13}+${ju}²=${kv13*kv13}=${kv13}²=KV²`);
  answer(13,`${h13} cm；是，∠KJV=90°`);contains(13,'SAS','等角的對邊相等','畢氏定理的逆定理');

  const [lead,cubic,rem1,rem2,p14,c14,q14]=match(14,/h\(x\)≡(\d+)x⁴\+(\d+)x³.*除以 x\+(\d+) 及除以 x-(\d+).*≡\(lx²\+(\d+)x\+(\d+)\)\((\d+)x²\+mx\+n\)/);assert.equal(rem1,rem2);
  const b14=-cubic*rem1**2,l14=lead/q14,m14=(cubic-p14*q14)/l14,n14=(b14-c14*m14)/p14;
  const product=mul([c14,p14,l14],[n14,m14,q14]);near(product[4],lead);near(product[3],cubic);near(product[1],b14);
  const poly=x=>sum(product.map((c,i)=>c*x**i));near(poly(rem1),poly(-rem1));
  const dis1=p14*p14-4*l14*c14,dis2=m14*m14-4*q14*n14;assert(dis1<0&&dis2>0);
  for(const sign of [-1,1])near(poly((-m14+sign*Math.sqrt(dis2))/(2*q14)),0);
  answer(14,`l=${l14}，m=${m14}，n=${n14}；2個實根`);
  contains(14,`Δ₁=${p14*p14}-${4*l14*c14}=${dis1}<0`,`Δ₂=${m14*m14}+${-4*q14*n14}=${dis2}>0`);

  const [dictionaries,novels]=match(15,/(\d+) 本不同的字典及 (\d+) 本不同的小說/);const positions=combos(Array.from({length:dictionaries+novels},(_,i)=>i),dictionaries);
  const favourable=positions.filter(a=>a.every((v,i)=>!i||v-a[i-1]>1)).length;assert.equal(favourable,choose(novels+1,dictionaries));answer(15,frac(favourable,positions.length));

  const [mean,zLow,zHigh,low,threshold16]=match(16,/平均值為 (\d+) cm.*分別為 (-?[\d.]+) 及 ([\d.]+).*行駛了 (\d+) cm.*至多為 (\d+) cm/);
  const sigma=(low-mean)/zLow,high=mean+zHigh*sigma,gap=high-low;assert(sigma>0&&gap>threshold16);answer(16,`不可能，分佈域至少為${gap} cm`);
  // An explicit population proves the two stated scores/standard scores are jointly feasible.
  const zz1=(-1+Math.sqrt(85))/4,zz2=(-1-Math.sqrt(85))/4,zs=[zLow,zHigh,1,zz1,zz2,...Array(13).fill(0)];
  near(sum(zs),0);near(sum(zs.map(z=>z*z))/zs.length,1);assert(zs.every(z=>mean+sigma*z>=0&&mean+sigma*z<=100));

  const [index,a17,t17]=match(17,/第 1 項及第 (\d+) 項分別為 (\d+) 及 (\d+)/),diff=(t17-a17)/(index-1),bound=1-2*a17/diff,maxN=Math.ceil(bound)-1;
  const total17=n=>n*(2*a17+(n-1)*diff)/2;assert(diff<0);assert(total17(maxN)>0&&total17(maxN+1)<=0);answer(17,`${diff}；${maxN}`);

  const [den,b18,c18]=match(18,/p\(x\)=-x²\/(\d+)\+(\d+)x-(\d+)/),vx=b18*den/2,vy=vx*vx/den-c18;
  const p18=x=>-x*x/den+b18*x-c18;for(const x of [-3,0,7,25]){near(p18(x),-((x-vx)**2)/den+vy);near(p18(-x),p18(x+2*vx));}
  assert(q(18).prompt.includes(`-x²/${den}-${b18}x-${c18}`));answer(18,`(${vx},${vy})；q(x)=-(x-${vx})²/${den}；關於y軸反射`);contains(18,'配方','向左平移 40 個單位');

  const [atJ,atK,jk,jl,kl,km]=match(19,/∠KJM=(\d+)°、∠LKM=(\d+)°。\s*已知 JK=(\d+) cm、JL=(\d+) cm、KL=(\d+) cm 及 KM=(\d+) cm/);
  const d19=q(19).diagram;assert.deepEqual([d19.atJ,d19.atK,d19.jk,d19.jl,d19.kl,d19.km],[atJ,atK,jk,jl,kl,km]);
  const atM=Math.asin(jk*Math.sin(atJ*rad)/km)/rad,angleK=180-atJ-atM,lm=Math.sqrt(kl*kl+km*km-2*kl*km*Math.cos(atK*rad)),jm2=jk*jk+km*km-2*jk*km*Math.cos(angleK*rad);
  assert(180-atM+atJ>180);near(jl*jl+kl*kl,jk*jk);assert(Math.abs(jm2-jl*jl-lm*lm)>1);
  // Construct all four points in R^3 and check every metric constraint, not just face triangles.
  const K19=[0,0,0],L19=[kl,0,0],M19=[km*Math.cos(atK*rad),km*Math.sin(atK*rad),0],jx19=(jk*jk+kl*kl-jl*jl)/(2*kl),jy19=(jk*km*Math.cos(angleK*rad)-jx19*M19[0])/M19[1],jz2=jl*jl-(jx19-kl)**2-jy19*jy19;
  assert(jz2>0);const J19=[jx19,jy19,Math.sqrt(jz2)];near(dist(J19,K19),jk);near(dist(J19,L19),jl);near(angle(K19,J19,M19),atJ);near(angle(L19,K19,M19),atK);near(dist(L19,M19),lm);
  const linePlane=Math.asin(J19[2]/jk)/rad;assert(linePlane<angle(J19,K19,L19));
  answer(19,`${Number(angleK.toPrecision(3))}°；${Number(lm.toPrecision(3))} cm；不是`);contains(19,'另一候選角','JL 不垂直 LM','正射影');

  const [rx,ry,py20,mNum,mDen,threshold20]=match(20,/R=\((\d+),(\d+)\).*y 坐標為 (\d+).*\n\(i\).*\n\(ii\).*斜率均為 (\d+)\/(\d+).*超過 (\d+)/);
  const px20=(rx*rx+ry*ry-2*ry*py20)/(2*rx),P=[px20,py20],R=[rx,ry],O=[0,0],rhsP=-dot(P,P),rhsR=-dot(R,R),det=px20*ry-rx*py20;
  assert(det!==0);near(dist(O,P),dist(P,R));assert(dot(sub(O,P),sub(R,P))<0);
  const D=(rhsP*ry-rhsR*py20)/det,E=(px20*rhsR-rx*rhsP)/det,center=[-D/2,-E/2],radius=Math.hypot(...center);
  for(const point of [O,P,R])near(dist(point,center),radius);
  const sideO=dist(P,R),sideP=dist(O,R),sideR=dist(O,P),perimeter=sideO+sideP+sideR,incenter=[(sideP*px20+sideR*rx)/perimeter,(sideP*py20+sideR*ry)/perimeter];
  near((incenter[0]-px20)*(center[1]-py20)-(incenter[1]-py20)*(center[0]-px20),0);
  near(angle(O,P,center),angle(center,P,R));near(angle(center,O,P),angle(center,R,P));
  const slope=mNum/mDen,cMid=center[1]-slope*center[0],offset=radius*Math.hypot(1,slope),cPlus=cMid+offset,cMinus=cMid-offset;
  assert(cPlus>0&&cMinus<0);for(const intercept of [cPlus,cMinus])near(Math.abs(slope*center[0]-center[1]+intercept)/Math.hypot(1,slope),radius);
  const vertices=[[-cPlus/slope,0],[0,cPlus],[-cMinus/slope,0],[0,cMinus]];
  const twiceArea=Math.abs(sum(vertices.map((v,i)=>v[0]*vertices[(i+1)%4][1]-v[1]*vertices[(i+1)%4][0]))),area=twiceArea/2;
  near(area,(cPlus-cMinus)**2/(2*slope));assert(area>threshold20);
  answer(20,`OP=PR；x²+y²${D}x+${E}y=0；是，面積為${frac(Math.round(area*6),6)}`);
  contains(20,'AAS','公共邊','判別式為零',`P=(${px20},${py20})`,'(4c-25)(4c+225)=0','對角線');

  let notationStrings=0;
  for(const item of qs){
    assert.doesNotMatch(JSON.stringify(item),/[橫縱横纵]|恆等於|角邊角|邊角邊|待補|placeholder/);assert(!item.prompt.includes('寫出'));
    for(const text of [item.prompt,item.answer,...item.hints,...item.solution.flatMap(p=>p.steps.flatMap(s=>s.text))]){
      const visible=window.mathText(text).replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'');
      assert.doesNotMatch(visible,/[\/÷√]/,`Q${item.n} uncovered notation: ${text}`);notationStrings++;
    }
  }
  const figures=qs.filter(q=>q.diagram);assert.deepEqual(figures.map(q=>q.n),[9,12,13,19]);
  for(const item of figures){const svg=window.pilotDiagram2016(item.diagram.type);assert(svg.includes('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));}
  return {questionCount:20,totalMarks:105,sectionMarks:[35,35,35],polarQuestionIds:[7],figureIds:figures.map(q=>q.n),notationStrings,questions:report};
}
function selfTest(data,window){
  const changes=[
    d=>d.questions[0].prompt=d.questions[0].prompt.replace('y⁻⁷','y⁻⁶'),
    d=>d.questions[1].prompt=d.questions[1].prompt.replace('6x+B','5x+B'),
    d=>d.questions[2].prompt=d.questions[2].prompt.replace('6x-7','6x-8'),
    d=>d.questions[3].prompt=d.questions[3].prompt.replace('15y²','16y²'),
    d=>d.questions[4].prompt=d.questions[4].prompt.replace('260','286'),
    d=>d.questions[5].prompt=d.questions[5].prompt.replace('x≤-3','x≤-9'),
    d=>d.questions[6].prompt=d.questions[6].prompt.replace('100°','110°'),
    d=>d.questions[7].prompt=d.questions[7].prompt.replace('g(5)=85','g(5)=90'),
    d=>d.questions[8].diagram.frequencies[1]++,
    d=>d.questions[9].prompt=d.questions[9].prompt.replace('(10,2)','(12,2)'),
    d=>d.questions[10].prompt=d.questions[10].prompt.replace('294π','295π'),
    d=>d.questions[11].diagram.frequencies[0]++,
    d=>d.questions[12].diagram.ju++,
    d=>d.questions[13].prompt=d.questions[13].prompt.replace('10x³','11x³'),
    d=>d.questions[14].prompt=d.questions[14].prompt.replace('6 本','5 本'),
    d=>d.questions[15].prompt=d.questions[15].prompt.replace('36 cm','38 cm'),
    d=>d.questions[16].prompt=d.questions[16].prompt.replace('420','424'),
    d=>d.questions[17].prompt=d.questions[17].prompt.replace('109','110'),
    d=>d.questions[18].diagram.atK=35,
    d=>d.questions[19].prompt=d.questions[19].prompt.replace('(24,18)','(26,18)'),
    d=>d.questions[12].solution[0].steps[1].text=['所以全等。'],
    d=>d.questions[18].solution[1].steps[1].text=['所以不是。'],
    d=>d.questions[19].solution[0].steps[2].text=['OP=PR。'],
    d=>d.questions[19].markGroups.b=8
  ];
  for(let i=0;i<20;i++)changes.push(d=>d.questions[i].answer+='錯');
  for(const change of changes){const copy=JSON.parse(JSON.stringify(data));change(copy);assert.throws(()=>verify(copy,window));}
  return changes.length;
}
if(require.main===module){
  const {data,window}=read(),report=verify(data,window);
  if(process.argv.includes('--self-test'))report.rejectedMutations=selfTest(data,window);
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else {console.log('2016 Paper 1: 20 independently derived questions; 35+35+35=105 marks; four figures; polar Q7.');for(const q of report.questions)console.log(`Q${q.n} [paper p${q.sourcePage}, scheme p${q.schemePage}]: ${q.answer}`);console.log(`Notation strings: ${report.notationStrings}; rejected mutations: ${report.rejectedMutations||0}.`);}
}
module.exports={read,verify,selfTest,sourcePages,schemePages,sourceMarks,sourceGroups};
