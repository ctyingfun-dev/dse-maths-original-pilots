const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sourcePages=[1,1,2,2,3,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const sourcePrintedPages=[2,2,3,3,4,4,5,6,7,8,9,10,null,14,16,17,18,20,22];
const schemePages=[3,3,3,3,4,4,4,5,5,6,7,8,9,10,11,11,12,14,15];
const sourceMarks=[3,3,3,3,4,4,5,5,5,6,6,7,8,8,3,4,7,8,13];
const sourceGroups=[null,{a:1,b:2},{a:1,b:1,c:1},null,{a:2,b:2},{a:2,b:2},{a:3,b:2},{a:2,b:3},{a:2,b:3},{a:2,b:2,c:2},{a:3,b:3},{a:2,b:5},{a:4,b:4},{a:4,b:4},null,null,{a:2,b:5},{a:4,b:4},{a:3,b:10}];
const sourceLeafMarks=[[3],[1,2],[1,1,1],[3],[2,2],[2,2],[3,2],[2,3],[2,3],[2,2,2],[3,3],[2,2,1,2],[4,4],[4,4],[3],[4],[2,5],[4,4],[3,4,3,3]];
const sum=a=>a.reduce((s,v)=>s+v,0),rad=Math.PI/180;
const near=(a,b,label='numeric equality',eps=1e-8)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(a,b)=>{if(b<0){a=-a;b=-b;}const g=gcd(a,b);return b/g===1?`${a/g}`:`${a/g}/${b/g}`;};
const sup=n=>String(n).replace(/[0-9-]/g,c=>c==='-'?'⁻':'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
const unsup=s=>Number(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>c==='⁻'?'-':String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))));
const clean=s=>s.replace(/\s/g,'');
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),dist=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(dist(a,b)*dist(c,b)))))/rad;
const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c;};
function read(){
  const context={window:{}};
  for(const file of ['paper1/data-2014.js','paper1/diagrams-2014.js','paper1/math.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
  return {data:JSON.parse(JSON.stringify(context.window.PILOT_2014)),window:context.window};
}
function verify(data,window){
  const qs=data.questions,q=n=>qs[n-1],report=[];
  window.PILOT_2014=data;window.PAPER1_PILOTS[2014]=data;
  const answer=(n,s)=>assert.equal(clean(q(n).answer),clean(s),`Q${n} independently derived answer`);
  const match=(n,re)=>{const m=q(n).prompt.match(re);assert(m,`Q${n}: missing condition ${re}`);return m.slice(1).map(Number);};
  const allSteps=n=>q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join('\n');
  const contains=(n,...ss)=>{for(const s of ss)assert(allSteps(n).includes(s),`Q${n} missing checked reasoning: ${s}`);};
  const stem=(n,...ss)=>{for(const s of ss)assert(q(n).prompt.includes(s),`Q${n} missing premise: ${s}`);};
  assert.equal(data.year,2014);assert.equal(data.paper,1);assert.equal(data.minutes,135);assert.equal(qs.length,19);
  for(let i=0;i<19;i++){
    const item=qs[i],groups={};assert.equal(item.n,i+1);assert.equal(item.sourceNo,i+1);assert.equal(item.marks,sourceMarks[i]);
    assert.equal(item.section,i<9?'甲一':i<14?'甲二':'乙部');assert.deepEqual(item.markGroups||null,sourceGroups[i]);assert(item.hints.length);
    const leaf=[];
    for(const p of item.solution){let marks=0;for(const s of p.steps){
      assert.match(s.marks,/^[12](?:M|A)?$/);assert(Array.isArray(s.text)&&s.text.length);marks+=parseInt(s.marks,10);
      for(const text of s.text)assert(!/^[=≈]/.test(text),'no detached result');
    }leaf.push(marks);const k=p.part.match(/^\(([abc])\)/)?.[1]||'';groups[k]=(groups[k]||0)+marks;}
    assert.deepEqual(leaf,sourceLeafMarks[i]);assert.equal(sum(leaf),item.marks);if(item.markGroups)assert.deepEqual(groups,item.markGroups);
    report.push({n:i+1,sourcePage:sourcePages[i],sourcePrintedPage:sourcePrintedPages[i],schemePages:i===16?[12,13]:i===18?[15,16]:[schemePages[i]],marks:item.marks,leafMarks:leaf,answer:item.answer});
  }
  assert.deepEqual([sum(qs.slice(0,9).map(q=>q.marks)),sum(qs.slice(9,14).map(q=>q.marks)),sum(qs.slice(14).map(q=>q.marks))],[35,35,35]);

  const m1=q(1).prompt.match(/\(x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)y([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\/y([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);assert(m1);
  const [x1,y1,p1,d1]=m1.slice(1).map(unsup),num1=x1*p1,den1=d1-y1*p1;
  answer(1,`x${sup(num1)}/y${sup(den1)}`);stem(1,'y≠0');
  for(const [x,y] of [[0,3],[2,3],[-2,1.2],[.75,-1.5]])near((x**x1*y**y1)**p1/y**d1,x**num1/y**den1);
  contains(1,`(x${sup(x1)}y${sup(y1)})${sup(p1)}=x${sup(num1)}y${sup(y1*p1)}`,`x${sup(num1)}y${sup(-den1)}`);

  const [a2,b2,c2]=match(2,/\(b\) xy²\+(\d+)y²\+x²-(\d+)x-(\d+)/),root2=a2+b2;
  assert.equal(a2*root2,c2);stem(2,`(a) x²-${b2}x-${c2}`);
  answer(2,`(x+${a2})(x-${root2})；(x+${a2})(y²+x-${root2})`);
  for(const [x,y] of [[0,1],[2,3],[-4,2],[1.2,-.5]])near(x*y*y+a2*y*y+x*x-b2*x-c2,(x+a2)*(y*y+x-root2));
  contains(2,`y²(x+${a2})+(x+${a2})(x-${root2})`,`(x+${a2})(y²+x-${root2})`);

  const [v3]=match(3,/數值為 (\d+\.\d+)/),scale3=10**Math.floor(Math.log10(v3)),up3=Math.ceil(v3/scale3)*scale3,round3=Math.round(v3),down3=Math.floor(v3*10)/10;
  stem(3,'上捨入至一位有效數字','捨入至最接近的整數','下捨入至一位小數');
  answer(3,`${up3}；${round3}；${down3}`);contains(3,`上捨入後為 ${up3}`,`整數為 ${round3}`,`結果為 ${down3}`);

  const d4=q(4).diagram;assert.deepEqual(d4,{type:'frequency2014',values:[0,1,2,3],frequencies:[5,11,13,7]});
  const sample4=d4.values.flatMap((v,i)=>Array(d4.frequencies[i]).fill(v)),N4=sample4.length,total4=sum(sample4),squares4=sum(sample4.map(v=>v*v)),mean4=total4/N4,variance4=sum(sample4.map(v=>(v-mean4)**2))/N4;
  const mode4=d4.values[d4.frequencies.indexOf(Math.max(...d4.frequencies))],sd4=Math.sqrt(variance4);
  near(variance4,squares4/N4-mean4*mean4);near(variance4,293/324);
  answer(4,`${median(sample4)}；${mode4}；√293/18≈${sd4.toPrecision(3)}`);
  contains(4,`共有 ${d4.frequencies.join('+')}=${N4}`,`平均值=(0×5+1×11+2×13+3×7)/${N4}=${frac(total4,N4)}`,`標準差=√[${frac(squares4,N4)}-(${frac(total4,N4)})²]=√(293/324)=√293/18≈${sd4.toPrecision(3)}`);

  const [a5,b5,c5,delta5]=match(5,/(\d+)\((\d+)x\+y\)=x\+(\d+)[\s\S]*x 增加 (\d+)/),coeff5=a5*b5-1,change5=-coeff5*delta5/a5;
  answer(5,`y=(${c5}-${coeff5}x)/${a5}；減少${-change5}`);
  for(const x of [-10,0,2,11])near(a5*(b5*x+(c5-coeff5*x)/a5),x+c5);
  contains(5,`${a5}y=${c5}-${coeff5}x`,`y 的改變為 ${change5}`,`-${coeff5*delta5}/${a5}`);

  const [price6,profit6]=match(6,/標價為 \$(\d+)[\s\S]*盈利百分率為 (\d+)%/);stem(6,'七五折');
  const sale6=price6*75/100,cost6=sale6*100/(100+profit6);answer(6,`$${sale6}；$${cost6}`);
  contains(6,`售價=${price6}×0.75=$${sale6}`,`(1+${profit6}%)x=${sale6}`,`x=${sale6}/1.08=${cost6}`);

  const [a7,b7,c7,root7,rem7,test7]=match(7,/h\(x\)≡(\d+)x³-(\d+)x²-(\d+)x\+c[\s\S]*除以 x-(\d+)[\s\S]*餘式為 (-?\d+)[\s\S]*x\+(\d+) 是否/),constant7=rem7-a7*root7**3+b7*root7**2+c7*root7;
  const coefficients7=[constant7,-c7,-b7,a7];assert.deepEqual(mul(mul([test7,1],[-3,1]),[1,3]),coefficients7);
  const roots7=[-test7,3,-1/3],poly7=x=>sum(coefficients7.map((c,i)=>c*x**i));for(const x of roots7)near(poly7(x),0);near(poly7(root7),rem7);
  answer(7,`是；是，根為${-test7}、3、-1/3`);contains(7,`c=${constant7}`,`h(-${test7})=-24-8+38-6=0`,`h(x)≡(x+${test7})(x-3)(3x+1)`);

  const [jx8,jy8,kx8,ky8,turn8,shift8]=match(8,/J=\((-?\d+),(-?\d+)\)，K=\((-?\d+),(-?\d+)\)[\s\S]*逆時針旋轉 (\d+)°[\s\S]*向左平移 (\d+)/);
  const rotate8=[jx8*Math.cos(turn8*rad)-jy8*Math.sin(turn8*rad),jx8*Math.sin(turn8*rad)+jy8*Math.cos(turn8*rad)].map(v=>Math.round(v)),translate8=[kx8-shift8,ky8],slope8=(ky8-jy8)/(kx8-jx8),otherSlope8=(translate8[1]-rotate8[1])/(translate8[0]-rotate8[0]);near(slope8*otherSlope8,-1);
  answer(8,`J′=(${rotate8})，K′=(${translate8})；JK⊥J′K′`);
  contains(8,`J′=(${rotate8})`,`K′=(${kx8}-${shift8},${ky8})=(${translate8})`,`斜率=(-4-6)/(1+4)=-10/5=${slope8}`,`斜率=(-4-4)/(-10-6)=-8/(-16)=${frac(translate8[1]-rotate8[1],translate8[0]-rotate8[0])}`,'斜率之積=(-2)×(1/2)=-1');

  const [jl9,kl9,kn9]=match(9,/JL=(\d+) cm、KL=(\d+) cm 及 KN=(\d+) cm/),ln9=kl9*kl9/jl9;
  stem(9,'N 位於線段 JL 上','∠KJL=∠LKN');assert.deepEqual(q(9).diagram,{type:'similarTriangles2014',jl:jl9,kl:kl9,kn:kn9});
  const J9=[0,0],L9=[jl9,0],N9=[jl9-ln9,0],K9=[jl9-ln9,kn9];near(dist(K9,L9),kl9);near(angle(K9,J9,L9),angle(L9,K9,N9));near(angle(K9,L9,J9),angle(K9,L9,N9));near(kn9*kn9+ln9*ln9,kl9*kl9);
  assert(Math.abs(kl9/jl9-20/25)>.01,'changed the similarity ratio, not an overall rescaling');
  answer(9,'△JKL∼△KNL；是，∠KNL=90°');contains(9,'∠KLJ=∠KLN','△JKL∼△KNL（AA）',`LN/${kl9}=${kl9}/${jl9}，所以 LN=${ln9}`,`KN²+LN²=${kn9}²+${ln9}²=576+324=${kl9*kl9}`,'畢氏定理逆定理');

  const [startH10,startM10,distance10,endH10,endM10]=match(10,/上午 (\d+):(\d+) 同時[\s\S]*相距 (\d+) km[\s\S]*上午 (\d+):(\d+) 抵達/),d10=q(10).diagram,start10=startH10*60+startM10,duration10=endH10*60+endM10-start10;
  assert.deepEqual(d10,{type:'journey2014',distance:distance10,stopDistance:64,duration:duration10,stopStart:50,stopEnd:115,startMinutes:start10});stem(10,'上午 9:00 開始停留','A 全程以勻速');
  const atStop10=distance10*d10.stopStart/duration10,meet10=duration10*d10.stopDistance/distance10;
  assert(d10.stopStart<meet10&&meet10<d10.stopEnd);assert(d10.stopDistance/d10.stopStart>distance10/duration10);
  const time10=start10+meet10,speedA10=distance10*60/duration10,speedB10=(distance10-d10.stopDistance)*60/(duration10-d10.stopStart);
  answer(10,`${atStop10} km；上午${Math.floor(time10/60)}:${String(time10%60).padStart(2,'0')}；不正確，A較快`);
  contains(10,`距離為 ${atStop10} km`,`t=${d10.stopDistance}×${duration10}/${distance10}=${meet10}`,`=${speedA10} 公里每小時`,`=${speedB10} 公里每小時`);assert(speedA10>speedB10);

  const [count11,mean11]=match(11,/有 (\d+) 件雕塑，其估值的平均值為 (\d+) 千元/),removed11=q(11).prompt.match(/分別為 (\d+)、(\d+)、(\d+) 及 (\d+) 千元/);assert(removed11);
  const removedValues11=removed11.slice(1).map(Number),d11=q(11).diagram;assert.deepEqual(d11,{type:'boxPlot2014',five:[20,48,62,75,110]});
  const [lo11,lq11,med11,uq11,hi11]=d11.five,newCount11=count11-removedValues11.length,newTotal11=count11*mean11-sum(removedValues11),newMean11=newTotal11/newCount11;
  assert.equal(removedValues11.filter(v=>v<med11).length,2);assert.equal(removedValues11.filter(v=>v>med11).length,2);
  // A concrete compatible sample checks feasibility of the five-number summary and mean.
  const witness11=[20,25,33,43,45,46,48,48,51,54,56,58,60,61,62,64,66,68,70,72,74,75,75,82,90,95,100,105,110];
  assert.equal(witness11.length,count11);near(sum(witness11)/count11,mean11);assert.deepEqual([witness11[0],median(witness11.slice(0,14)),median(witness11),median(witness11.slice(15)),witness11.at(-1)],d11.five);
  for(const v of removedValues11)witness11.splice(witness11.indexOf(v),1);near(sum(witness11)/witness11.length,newMean11);assert.equal(median(witness11),med11);
  answer(11,`${hi11-lo11}千元；${uq11-lq11}千元；${newMean11}千元；${med11}千元`);
  contains(11,`分佈域=${hi11}-${lo11}=${hi11-lo11}`,`四分位數間距=${uq11}-${lq11}=${uq11-lq11}`,`新的平均值=${newTotal11}/${newCount11}=${newMean11}`,'原第 15 項成為餘下 25 項的第 13 項');

  const [hx12,hy12,jx12,jy12]=match(12,/H=\((-?\d+),(-?\d+)\)，而 J=\((-?\d+),(-?\d+)\)/),dx12=jx12-hx12,dy12=jy12-hy12,r2_12=dx12*dx12+dy12*dy12,r12=Math.sqrt(r2_12),line12=[2*dx12,2*dy12,hx12*hx12+hy12*hy12-jx12*jx12-jy12*jy12];
  stem(12,'PJ=PH','Γ 與 C 相交於 Q、R');assert.equal(hx12,0);assert(hy12<0);assert(Number.isInteger(r12));
  answer(12,`x²+(y+${-hy12})²=${r2_12}；${line12[0]}x+${line12[1]}y${line12[2]}=0；垂直平分線；${4*r12}`);
  const H12=[hx12,hy12],J12=[jx12,jy12],mid12=[(hx12+jx12)/2,(hy12+jy12)/2],offset12=Math.sqrt(3)*r12/2;
  for(const sign of [-1,1]){const P=[mid12[0]+sign*(-dy12/r12)*offset12,mid12[1]+sign*(dx12/r12)*offset12];near(dist(H12,P),r12);near(dist(J12,P),r12);near(line12[0]*P[0]+line12[1]*P[1]+line12[2],0);}
  contains(12,`半徑 HJ=√[(5-0)²+(10+2)²]=√${r2_12}=${r12}`,`Γ：${line12[0]}x+${line12[1]}y${line12[2]}=0`,'Γ 是 JH 的垂直平分線。',`周界為 ${4*r12}`);

  const [x13,y13,u13,v13,target13]=match(13,/g\((\d+)\)=(-?\d+) 及 g\((\d+)\)=(-?\d+)[\s\S]*求 g\((\d+)\)/),k13=(v13-y13)/(u13*u13-x13*x13),c13=y13-k13*x13*x13,result13=k13*target13*target13+c13,area13=target13*Math.abs(result13);
  stem(13,`J=(${target13},a) 及 K=(-${target13},b)`,'L 可在 x 軸上任意移動','一部分隨 x² 正變');
  answer(13,`${result13}；${area13}`);contains(13,`${u13*u13-x13*x13}p=${v13-y13}`,`p=${k13}`,`q=23-9(-3)=${c13}`,`g(${target13})=${c13}-3×${target13}²=50-75=${result13}`,`面積為 ${area13}`);
  for(const x of [-20,0,3,100]){const J=[target13,result13],K=[-target13,result13],L=[x,0];near(Math.abs((K[0]-J[0])*(L[1]-J[1])-(K[1]-J[1])*(L[0]-J[0]))/2,area13);}

  const [radius14,height14,vessel14,depth14,limit14]=match(14,/底半徑為 (\d+) cm、高為 (\d+) cm[\s\S]*容器高 (\d+) cm[\s\S]*水深為 (\d+) cm[\s\S]*體積超過 ([\d.]+) m³/),low14=height14-vessel14,water14=low14+depth14,rLow14=radius14*low14/height14,rWater14=radius14*water14/height14,slant14=Math.hypot(radius14,height14),sLow14=slant14*low14/height14,sWater14=slant14*water14/height14,wet14=rWater14*sWater14-rLow14*sLow14,vol14=(rWater14*rWater14*water14-rLow14*rLow14*low14)/3;
  assert.deepEqual(q(14).diagram,{type:'frustum2014',radius:radius14,height:height14,vesselHeight:vessel14,waterDepth:depth14});
  near(vol14,depth14*(rWater14*rWater14+rWater14*rLow14+rLow14*rLow14)/3);assert(vol14*Math.PI/1e6<limit14);
  answer(14,`${wet14}π cm²；不正確，體積為${vol14}π cm³≈${(vol14*Math.PI/1e6).toPrecision(3)} m³`);
  contains(14,`斜高=√(${radius14}²+${height14}²)=${slant14}`,`底半徑=${radius14}×${low14}/${height14}=${rLow14}`,`水面半徑=${radius14}×${water14}/${height14}=${rWater14}`,`面積=(2940-960)π=${wet14}`,`體積=(32928-6144)π=${vol14}`,'不包括容器底面');

  stem(15,'log₉ x','log₂₇ y');const [slopeNum15,slopeDen15,xInt15]=match(15,/斜率為 (-?\d+)\/(\d+)[\s\S]*截距為 (\d+)/),d15=q(15).diagram;
  assert.deepEqual(d15,{type:'logGraph2014',baseX:9,baseY:27,slopeNumerator:slopeNum15,slopeDenominator:slopeDen15,interceptX:xInt15});
  const exponent15=slopeNum15/slopeDen15*Math.log(27)/Math.log(9),coef15=27**(-slopeNum15/slopeDen15*xInt15);near(coef15,81);near(exponent15,-2/3);
  answer(15,'y=81x^(-2/3)');for(const x of [.1,1,9,81])near(Math.log(coef15*x**exponent15)/Math.log(27),slopeNum15/slopeDen15*(Math.log(x)/Math.log(9)-xInt15));
  contains(15,`log₂₇ y=(${slopeNum15}/${slopeDen15})(log₉ x-${xInt15})`,'log₃ y=(-2/3)log₃ x+4','A=81、k=-2/3');

  const [first16,diff16,threshold16]=match(16,/第 1 個圖案有 (\d+) 片[\s\S]*多 (\d+) 片[\s\S]*總數超過 (\d+)/),total16=n=>n*(2*first16+(n-1)*diff16)/2;
  let min16=1;while(total16(min16)<=threshold16)min16++;assert.deepEqual(q(16).diagram,{type:'dotPatterns2014',first:first16,difference:diff16,threshold:threshold16});
  answer(16,String(min16));assert.equal(total16(min16-1),threshold16);assert.equal(sum(Array.from({length:min16},(_,i)=>first16+diff16*i)),total16(min16));
  contains(16,`S=n(${diff16}n+${2*first16-diff16})/2`,`3n²+5n-${2*threshold16}>0`,`(n-${min16-1})(3n+185)>0`,`首 ${min16} 個共需 ${total16(min16)} 片`);

  const [length17,width17,edge17,angle17,limit17]=match(17,/JK=(\d+) cm、KL=(\d+) cm、TK=TL=(\d+) cm[\s\S]*∠TJK=∠TML=(\d+)°[\s\S]*面積小於 (\d+) cm²/),d17=q(17).diagram;
  assert.deepEqual(d17,{type:'pyramidSection2014',length:length17,width:width17,edge:edge17,angle:angle17,areaLimit:limit17});stem(17,'長方形 JKLM','N、R、U、V 分別是 JK、LM、TK、TL 的中點');
  const atT17=Math.asin(length17*Math.sin(angle17*rad)/edge17)/rad,atK17=180-angle17-atT17,leg17=Math.sqrt((length17/2)**2+(edge17/2)**2-length17*edge17/2*Math.cos(atK17*rad)),height17=Math.sqrt(leg17*leg17-(width17/4)**2),area17=height17*3*width17/4;
  assert(angle17>90);assert(angle17+180-atT17>180);assert(area17>limit17);
  // Reconstruct a metric pyramid independently, then take the area from 3-D vectors.
  const tj17=length17*Math.cos(angle17*rad)+Math.sqrt(edge17*edge17-length17*length17*Math.sin(angle17*rad)**2),tx17=tj17*Math.cos(angle17*rad),ty17=width17/2,tz17=Math.sqrt(tj17*tj17-tx17*tx17-ty17*ty17);
  const J17=[0,0,0],K17=[length17,0,0],L17=[length17,width17,0],M17=[0,width17,0],T17=[tx17,ty17,tz17],mid=(a,b)=>a.map((v,i)=>(v+b[i])/2),N17=mid(J17,K17),R17=mid(L17,M17),U17=mid(T17,K17),V17=mid(T17,L17);
  near(dist(T17,K17),edge17);near(dist(T17,L17),edge17);near(angle(T17,J17,K17),angle17);near(angle(T17,M17,L17),angle17);near(angle(T17,K17,J17),atK17);near(dist(N17,U17),leg17);near(dist(R17,V17),leg17);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],tri=(a,b,c)=>Math.hypot(...cross(sub(b,a),sub(c,a)))/2;
  near(tri(N17,R17,V17)+tri(N17,V17,U17),area17);near(dot(cross(sub(R17,N17),sub(U17,N17)),sub(V17,N17)),0);
  answer(17,`${atK17.toPrecision(3)}°；不正確，面積約${area17.toPrecision(3)} cm²`);
  for(const [re,val] of [[/∠JTK≈([\d.]+)°/,atT17],[/∠TKJ=180°-108°-40.9880074°≈([\d.]+)°/,atK17],[/NU≈([\d.]+) cm/,leg17],[/\)²\]≈([\d.]+)/,height17],[/梯形面積=\[\(12\+6\)h\]\/2≈([\d.]+)/,area17]]){const m=allSteps(17).match(re);assert(m,`Q17 ${re}`);near(+m[1],val,'Q17 intermediate',1e-7);}
  contains(17,'UV∥KL','UV∥NR','△KNU≅△LRV（SAS）','KN=LR、KU=LV','兩邊的夾角相等','NU=RV');

  const [a18,b18,c18,intercept18,ix18,iy18]=match(18,/L₁ 的方程為 (\d+)x\+(\d+)y=(\d+)[\s\S]*x 截距為 (\d+)[\s\S]*相交於 \((\d+),(\d+)\)/),[profitX18,profitY18,limit18]=match(18,/盈利分別為 \$(\d+)、\$(\d+)[\s\S]*超過 \$(\d+)/);
  assert.deepEqual(q(18).diagram,{type:'linearProgramming2014',line1:[a18,b18,c18],line2Intercept:intercept18,intersection:[ix18,iy18]});near(a18*ix18+b18*iy18,c18);
  const dx18=intercept18-ix18,g18=gcd(iy18,dx18),aSecond18=iy18/g18,bSecond18=dx18/g18,cSecond18=aSecond18*intercept18;
  stem(18,`每件 X 需 ${a18} 工時裝配及 ${aSecond18} 工時檢驗`,`每件 Y 需 ${b18} 工時裝配及 ${bSecond18} 工時檢驗`,`720 工時裝配及 ${cSecond18} 工時檢驗`);
  const vertices18=[[0,0],[0,cSecond18/bSecond18],[ix18,iy18],[c18/a18,0]],profits18=vertices18.map(([x,y])=>profitX18*x+profitY18*y),max18=Math.max(...profits18);
  let exhaustiveMax18=0,best18;for(let x=0;x<=c18/a18;x++)for(let y=0;y<=cSecond18/bSecond18;y++)if(a18*x+b18*y<=c18&&aSecond18*x+bSecond18*y<=cSecond18&&profitX18*x+profitY18*y>exhaustiveMax18){exhaustiveMax18=profitX18*x+profitY18*y;best18=[x,y];}
  assert.equal(exhaustiveMax18,max18);assert.deepEqual(best18,[ix18,iy18]);assert(max18>limit18);
  answer(18,`${a18}x+${b18}y≤${c18}，${aSecond18}x+${bSecond18}y≤${cSecond18}，x≥0，y≥0；正確，最大盈利$${max18}`);
  contains(18,`L₂：${aSecond18}x+${bSecond18}y=${cSecond18}`,`P=${profitX18}x+${profitY18}y`);
  for(let i=1;i<vertices18.length;i++)contains(18,`在 (${vertices18[i]})，P=${profitX18}×${vertices18[i][0]}+${profitY18}×${vertices18[i][1]}=${profits18[i]}`);

  stem(19,'五個等大扇形區域的公平轉盤','0、1、2、3、4','嘉怡先轉','首次轉得 4','六個並排的管子','每球獨立且等可能','三球恰好分佔兩個相鄰管');
  const n19=q(19).diagram.count;assert.deepEqual(q(19).diagram,{type:'tubes2014',count:6});
  const [same2_19,adj2_19,same3_19,consec3_19,adj3_19,limit19]=match(19,/兩球同管得 (\d+) 枚[\s\S]*兩個相鄰管內得 (\d+) 枚[\s\S]*三球同管得 (\d+) 枚[\s\S]*三個連續的管內得 (\d+) 枚[\s\S]*恰好分佔兩個相鄰管得 (\d+) 枚[\s\S]*概率超過 ([\d.]+)/);
  const win19=(1/5)/(1-(4/5)**2);let geometric19=0;for(let i=0;i<1000;i++)geometric19+=(1/5)*(4/5)**(2*i);near(win19,geometric19);near(win19,5/9);
  const counts2_19=[0,0,0],counts3_19=[0,0,0,0];
  for(let a=0;a<n19;a++)for(let b=0;b<n19;b++){
    counts2_19[a===b?0:Math.abs(a-b)===1?1:2]++;
    for(let c=0;c<n19;c++){
      const distinct=[...new Set([a,b,c])].sort((x,y)=>x-y);
      const category=distinct.length===1?0:distinct.length===3&&distinct[2]-distinct[0]===2?1:distinct.length===2&&distinct[1]-distinct[0]===1?2:3;
      counts3_19[category]++;
    }
  }
  assert.deepEqual(counts2_19,[n19,2*(n19-1),n19*n19-n19-2*(n19-1)]);
  assert.deepEqual(counts3_19.slice(0,3),[n19,6*(n19-2),6*(n19-1)]);
  const numerator2_19=counts2_19[0]*same2_19+counts2_19[1]*adj2_19,numerator3_19=counts3_19[0]*same3_19+counts3_19[1]*consec3_19+counts3_19[2]*adj3_19,E2_19=numerator2_19/n19**2,E3_19=numerator3_19/n19**3,pPrize19=(counts2_19[0]+counts2_19[1])/n19**2,noPrize19=1-win19*pPrize19;
  assert(E2_19>E3_19);assert(noPrize19<limit19);near(noPrize19,61/81);
  answer(19,`5/9；${frac(numerator2_19,n19*n19)}；方案1；不正確，概率為61/81`);
  contains(19,'公比 16/25','勝出的概率=5/9',`概率=${n19}/${n19*n19}=1/6`,`${n19-1} 對，每對有兩種投入次序`,`期望值=2+25/18=${frac(numerator2_19,n19*n19)}`,'每組有 3×2×1=6 種次序','每對有 2³-2=6 種結果',`期望值=40(1/36)+12(1/9)+5(5/36)=${frac(numerator3_19,n19**3)}`,'完全沒有獎牌的概率=1-20/81=61/81');

  let notationStrings=0;
  for(const item of qs){
    assert(!item.prompt.includes('寫出'));assert.doesNotMatch(JSON.stringify(item),/[橫縱横纵]|角邊角|邊角邊|待補|placeholder/);
    for(const text of [item.prompt,item.answer,...item.hints,...item.solution.flatMap(p=>p.steps.flatMap(s=>s.text))]){
      const visible=window.mathText(text).replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'');
      assert.doesNotMatch(visible,/[\/÷√]/,`Q${item.n} uncovered notation: ${text}`);notationStrings++;
    }
  }
  const figures=qs.filter(q=>q.diagram);assert.deepEqual(figures.map(q=>q.n),[4,9,10,11,14,15,16,17,18,19]);
  for(const item of figures){const svg=window.pilotDiagram2014(item.diagram.type);assert(svg.includes('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));assert(svg.includes('viewBox='));}
  assert.equal((window.pilotDiagram2014('dotPatterns2014').match(/<circle /g)||[]).length,4+7+10);
  const polarQuestionIds=qs.filter(q=>/極坐標/.test(q.topic+' '+q.prompt)).map(q=>q.n);assert.deepEqual(polarQuestionIds,[]);
  return {questionCount:19,totalMarks:105,sectionCounts:[9,5,5],sectionMarks:[35,35,35],polarQuestionIds,figureIds:figures.map(q=>q.n),notationStrings,questions:report};
}
function selfTest(data,window){
  const cases=[
    [1,'x²y⁻³','x³y⁻³'],[2,'xy²+2y²','xy²+3y²'],[3,'267.83','268.83'],[4,'工作坊','工作坊'],[5,'增加 6','增加 7'],[6,'$360','$380'],[7,'-24','-25'],[8,'平移 11','平移 12'],[9,'30 cm','31 cm'],[10,'96 km','98 km'],[11,'64 千元','65 千元'],[12,'(5,10)','(6,10)'],[13,'g(3)=23','g(3)=24'],[14,'24 cm','25 cm'],[15,'-4/9','-5/9'],[16,'5550','5551'],[17,'29 cm','30 cm'],[18,'$340','$341'],[19,'五個等大','四個等大']
  ];
  const mutations=cases.filter(([n])=>n!==4).map(([n,from,to])=>d=>{assert(d.questions[n-1].prompt.includes(from));d.questions[n-1].prompt=d.questions[n-1].prompt.replace(from,to);});
  for(let i=0;i<19;i++){mutations.push(d=>d.questions[i].answer+='錯',d=>d.questions[i].marks++);}
  const stepCases=[[1,'x⁸y⁻¹⁷','x⁸y⁻¹⁶'],[2,'(x+2)(y²+x-5)','(x+2)(y²+x-4)'],[3,'結果為 267.8','結果為 267.9'],[4,'√293/18≈0.951','√293/18≈0.952'],[5,'改變為 -10','改變為 -11'],[6,'270/1.08=250','270/1.08=251'],[7,'c=-6','c=-7'],[8,'斜率之積=(-2)×(1/2)=-1','斜率之積=(-2)×(1/2)=1'],[9,'LN=18','LN=19'],[10,'=38.4 公里每小時','=39.4 公里每小時'],[11,'1608/25=64.32','1608/25=65.32'],[12,'周界為 52','周界為 53'],[13,'面積為 125','面積為 126'],[14,'1980π','1981π'],[15,'k=-2/3','k=-3/2'],[16,'5734','5735'],[17,'7.8551099','8.8551099'],[18,'P=340x+480y','P=340x+481y'],[19,'2³-2=6','2³-2=8']];
  for(const [n,from,to] of stepCases)mutations.push(d=>{let changed=false;for(const p of d.questions[n-1].solution)for(const s of p.steps)s.text=s.text.map(t=>{if(t.includes(from)){changed=true;return t.replace(from,to);}return t;});assert(changed,`mutation Q${n}`);});
  for(const n of [4,9,10,11,14,15,16,17,18,19])mutations.push(d=>{const spec=d.questions[n-1].diagram;if(n===4)spec.frequencies[0]++;else if(n===11)spec.five[0]++;else if(n===18)spec.line1[0]++;else spec[Object.keys(spec)[1]]++;});
  for(let i=0;i<19;i++)if(data.questions[i].markGroups)mutations.push(d=>d.questions[i].markGroups.a++);
  for(const [n,from,to] of [[9,'∠KJL=∠LKN','∠KJL=∠LNK'],[12,'PJ=PH','PJ=2PH'],[17,'長方形 JKLM','平行四邊形 JKLM'],[19,'每球獨立且等可能','每球可能']])mutations.push(d=>{assert(d.questions[n-1].prompt.includes(from));d.questions[n-1].prompt=d.questions[n-1].prompt.replace(from,to);});
  for(let i=0;i<mutations.length;i++){const copy=JSON.parse(JSON.stringify(data));mutations[i](copy);assert.throws(()=>verify(copy,window),undefined,`mutation ${i+1} was not rejected`);}
  verify(data,window);
  return mutations.length;
}
if(require.main===module){
  const {data,window}=read(),report=verify(data,window);
  if(process.argv.includes('--self-test'))report.rejectedMutations=selfTest(data,window);
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else {console.log('2014 Paper 1: 19 independently derived questions; 35+35+35=105 marks; ten diagram/table items; no polar item.');for(const q of report.questions)console.log(`Q${q.n} [source PDF p${q.sourcePage}, printed p${q.sourcePrintedPage}, scheme p${q.schemePages.join(',')}]: ${q.answer}`);console.log(`Notation strings: ${report.notationStrings}; rejected mutations: ${report.rejectedMutations||0}.`);}
}
module.exports={read,verify,selfTest,sourcePages,sourcePrintedPages,schemePages,sourceMarks,sourceGroups,sourceLeafMarks};
