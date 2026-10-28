const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sourcePages=[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,20,22];
const sourcePdfPages=[2,2,3,3,4,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
const schemePages=[3,3,3,4,4,5,5,6,6,7,7,8,9,9,10,10,11,12,13];
const sourceMarks=[3,3,3,4,4,4,4,5,5,6,7,7,7,8,4,4,6,8,13];
const sourceGroups=[null,null,{a:1,b:2},null,{a:3,b:1},{a:2,b:2},{a:2,b:2},{a:3,b:2},{a:2,b:3},{a:2,b:4},{a:5,b:2},{a:3,b:4},{a:2,b:2,c:3},{a:3,b:5},null,{a:2,b:2},{a:2,b:2,c:2},{a:3,b:5},{a:2,b:11}];
const sum=a=>a.reduce((s,v)=>s+v,0),rad=Math.PI/180;
const near=(a,b,msg='numeric equality',eps=1e-8)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${msg}: ${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(a,b)=>{const g=gcd(a,b);return b/g===1?`${a/g}`:`${a/g}/${b/g}`;};
const choose=(n,r)=>{if(r<0||r>n)return 0;let t=1;for(let i=1;i<=r;i++)t=t*(n-i+1)/i;return Math.round(t);};
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c;};
const unsup=s=>Number(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>c==='⁻'?'-':String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))));
const sup=n=>String(n).replace(/[0-9-]/g,c=>c==='-'?'⁻':'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),dist=(a,b)=>Math.hypot(...sub(a,b));
const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
const clean=s=>s.replace(/\s/g,'');
function read(){
  const c={window:{}};
  for(const f of ['paper1/data-2017.js','paper1/diagrams-2017.js','paper1/math.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,f),'utf8'),c,{filename:f});
  return {data:JSON.parse(JSON.stringify(c.window.PILOT_2017)),window:c.window};
}
function verify(data,window){
  const qs=data.questions,q=n=>qs[n-1],report=[];
  const match=(n,re)=>{const m=q(n).prompt.match(re);assert(m,`Q${n} missing condition ${re}`);return m.slice(1).map(Number);};
  const answer=(n,s)=>assert.equal(clean(q(n).answer),clean(s),`Q${n} independently derived answer`);
  const work=n=>q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join('\n');
  const contains=(n,...ss)=>ss.forEach(s=>assert(work(n).includes(s),`Q${n} missing derivation ${s}`));
  assert.equal(data.year,2017);assert.equal(data.paper,1);assert.equal(data.minutes,135);assert.equal(qs.length,19);
  for(let i=0;i<19;i++){
    const item=qs[i];assert.equal(item.n,i+1);assert.equal(item.sourceNo,i+1);assert.equal(item.marks,sourceMarks[i]);
    assert.equal(item.section,i<9?'甲一':i<14?'甲二':'乙部');assert.deepEqual(item.markGroups||null,sourceGroups[i]);
    assert.equal(sum(item.solution.flatMap(p=>p.steps.map(s=>{assert.match(s.marks,/^\d+(?:M|A)?$/);assert(s.text.length&&s.text.every(t=>typeof t==='string'&&t.length));return parseInt(s.marks,10);}))),item.marks);
    if(item.markGroups)for(const [key,marks] of Object.entries(item.markGroups))assert.equal(sum(item.solution.filter(p=>p.part.startsWith(`(${key})`)).flatMap(p=>p.steps.map(s=>parseInt(s.marks,10)))),marks);
    assert(item.hints.length>0);assert(!item.cancelled);assert(!item.prompt.includes('寫出'));
    report.push({n:i+1,sourcePage:sourcePages[i],sourcePdfPage:sourcePdfPages[i],schemePage:schemePages[i],marks:item.marks,answer:item.answer});
  }
  const sectionMarks=['甲一','甲二','乙部'].map(s=>sum(qs.filter(q=>q.section===s).map(q=>q.marks)));assert.deepEqual(sectionMarks,[35,35,35]);

  const [a1,b1]=match(1,/k=\((\d+)x-(\d+)y\)\/y/);answer(1,`y=${a1}x/(k+${b1})`);
  for(const x of [-3,2,7])for(const k of [-4,0,8])if(k!==-b1){const y=a1*x/(k+b1);near((a1*x-b1*y)/y,k);}
  contains(1,`y(k+${b1})=${a1}x`,'提取');

  const powers=q(2).prompt.match(/\(x([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)y([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\/\[\(x([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\]/);assert(powers);
  const [px,py,pout,pden,pdenout]=powers.slice(1).map(unsup),ex=px*pout-pden*pdenout,ey=py*pout;assert(ex>0&&ey<0);answer(2,`x${sup(ex)}/y${sup(-ey)}`);
  for(const x of [2,-2,3])for(const y of [1,2,-3])near((x**px*y**py)**pout/(x**pden)**pdenout,x**ex/y**(-ey));contains(2,'指數相減','y⁻⁸=1/y⁸');

  const [b3,c3,l3,m3]=match(3,/\(b\) x²-(\d+)xy\+(\d+)y²\+(\d+)x-(\d+)y/);
  const factors=[];for(let u=1;u<=c3;u++)if(c3%u===0&&u+c3/u===b3)factors.push(u);assert.equal(factors.length,2);
  const u=m3/l3,v=b3-u;assert(factors.includes(u));answer(3,`(x-${u}y)(x-${v}y)；(x-${u}y)(x-${v}y+${l3})`);
  for(const x of [-5,0,2,9])for(const y of [-2,1,3])near(x*x-b3*x*y+c3*y*y+l3*x-m3*y,(x-u*y)*(x-v*y+l3));contains(3,'利用前項','再提取');

  const [p4,c4,r4,total4]=match(4,/分別為 \$(\d+) 及 \$(\d+).*?為計時器數目的 (\d+) 倍.*?\$(\d+)/),count4=total4/(p4*r4+c4);assert(Number.isInteger(count4)&&count4>0);answer(4,`${count4*(r4+1)}件`);contains(4,`${p4}(${r4}x)+${c4}x=${total4}`,`x=${count4}`);

  const [c5,s5,n5,t5,den5,l5,r5]=match(5,/(\d+)\(x-(\d+)\)≤\((\d+)x\+(\d+)\)\/(\d+) 及 (\d+)-x<(\d+)/);
  assert(c5*den5-n5>0);const hi5=(t5+c5*s5*den5)/(c5*den5-n5),lo5=l5-r5;
  const ints=[];for(let x=Math.floor(lo5)-2;x<=Math.ceil(hi5)+2;x++)if(c5*(x-s5)<=(n5*x+t5)/den5&&l5-x<r5)ints.push(x);
  answer(5,`${lo5}<x≤${hi5}；${ints.length}個`);assert(!ints.includes(lo5)&&ints.includes(hi5));contains(5,'不等號反向','交集');

  const [jx,jy,kx,ky]=match(6,/分別為 \((-?\d+),(-?\d+)\) 及 \((-?\d+),(-?\d+)\)/),J=[jx,jy],K=[kx,ky],Jp=[-jy,jx],Kp=[kx,-ky];
  near(dot(sub(K,J),sub(Kp,Jp)),0,'Q6 perpendicular transformed lines');answer(6,`J′=(${Jp})，K′=(${Kp})；JK⊥J′K′`);contains(6,'(-y,x)','(x,-y)','兩斜率之積');

  const [probDen,cycleCount]=match(7,/概率為 1\/(\d+).*?有 (\d+) 名/s),angle7=360/probDen,angles=q(7).diagram.angles;
  near(sum(angles),360);near(angles[1],angle7);near(angles[3],90);const total7=cycleCount*360/(360-angles[0]-angle7-90);assert(Number.isInteger(total7));answer(7,`x=${angle7}°；${total7}人`);contains(7,`${360-angles[0]-angle7-90}°`);

  const [x8,y8,x8again,x8new]=match(8,/x=(\d+) 時，y=(\d+).*?由 (\d+) 增加至 (\d+)/s);assert.equal(x8,x8again);
  const k8=y8*Math.sqrt(x8),new8=k8/Math.sqrt(x8new);assert(new8<y8);answer(8,`y=${k8}/√x；減少${y8-new8}`);contains(8,`k=${y8}×${Math.sqrt(x8)}=${k8}`,`=${new8}`);

  const [measured,precision,ropes,claim]=match(9,/為 (\d+) cm.*?最接近的 (\d+) cm.*?其中 (\d+) 條.*?為 ([\d.]+) 米/s),low=measured-precision/2,minimum=ropes*low/100;
  assert(minimum>claim+.5);answer(9,`${low} cm；不可能`);contains(9,`${minimum} 米`,'兩範圍沒有交集');

  const [radius10,angle10]=match(10,/OK=(\d+) cm 及 ∠JLK=(\d+)°/);assert.equal(q(10).diagram.radius,radius10);assert.equal(q(10).diagram.angle,angle10);
  const sectorAngle=4*angle10;assert(sectorAngle>0&&sectorAngle<180);const O=[0,0],circle=a=>[radius10*Math.cos(a*rad),radius10*Math.sin(a*rad)],JJ=circle(sectorAngle),KK=circle(2*angle10),LL=circle(0),TT=JJ.map((v,i)=>(v+LL[i])/2);
  near(dist(O,JJ),dist(O,LL));near(dist(JJ,TT),dist(LL,TT));near(dot(sub(JJ,LL),TT),0);near(TT[0]*KK[1]-TT[1]*KK[0],0);assert(dist(O,TT)<radius10);
  const sectorFrac=frac(sectorAngle*radius10**2,360),sectorText=sectorFrac.includes('/')?sectorFrac.replace('/','π/'):`${sectorFrac}π`;answer(10,`△OJT≅△OLT；${sectorText} cm²`);contains(10,'SSS','∠JOT=∠TOL',`∠JOL=${2*angle10}°+${2*angle10}°=${sectorAngle}°`);

  const [mean11,range11,threshold11]=match(11,/平均值為 ([\d.]+) 秒，分佈域為 (\d+) 秒.*?超過 (\d+) 秒/s),dg=q(11).diagram,solutions=[];
  for(let a=0;a<=9;a++)for(let b=0;b<=9;b++){
    const vals=dg.leaves.flatMap((row,i)=>row.map(v=>10*dg.stems[i]+(v==='a'?a:v==='b'?b:v)));
    if(vals.every((v,i)=>i===0||v>=vals[i-1])&&Math.abs(sum(vals)/vals.length-mean11)<1e-10&&vals.at(-1)-vals[0]===range11)solutions.push({a,b,vals});
  }
  assert.equal(solutions.length,1,'Q11 unique legal digits');const st=solutions[0],sd=Math.sqrt(sum(st.vals.map(v=>(v-mean11)**2))/st.vals.length),over=st.vals.filter(v=>v>threshold11).length;
  answer(11,`中位數${median(st.vals)}秒，標準差${sd.toPrecision(3)}秒；${frac(over,st.vals.length)}`);contains(11,`b=${st.b}`,`a=${st.a}`,`=${sum(st.vals.map(v=>v*v))}`,'總體標準差');

  const [base12,height12,ratioA,ratioB,h12]=match(12,/底面積為 (\d+) cm²、高為 (\d+) cm.*?之比為 (\d+):(\d+).*?高為 (\d+) cm/s),ratio12=Math.sqrt(ratioA/ratioB),volume12=base12*height12/(1+ratio12**3),side12=Math.sqrt(3*volume12/h12),slant12=Math.hypot(h12,side12/2),surface12=(side12**2+2*side12*slant12)*ratio12**2;
  answer(12,`${volume12} cm³；${surface12} cm²`);near((side12*ratio12)**2*(h12*ratio12)/3+volume12,base12*height12);contains(12,`=√${slant12**2}=${slant12}`,`=${surface12} cm²`);

  const [px13,py13,qx13,qy13,rx13,ry13]=match(13,/分別為 \((-?\d+),(-?\d+)\)、\((-?\d+),(-?\d+)\)、\((-?\d+),(-?\d+)\)/),P=[px13,py13],Q=[qx13,qy13],R=[rx13,ry13],rr=dist(P,R),qr=dist(Q,R);assert(qr>rr);
  const S=R.map((v,i)=>v+(v-Q[i])*rr/qr);near(dist(S,R),rr);near(dist(Q,S),qr+rr);
  const la=qy13-ry13,lb=rx13-qx13,lc=-(la*qx13+lb*qy13);near(la*S[0]+lb*S[1]+lc,0);
  assert.equal(ry13,0);answer(13,`(x-${rx13})²+y²=${rr**2}；Q在圓外；Q、R、S共線；${la}x+${lb}y${lc}=0`);contains(13,'三角不等式','R 位於 Q 與 S 之間',`=${qr}>${rr}`);

  const [p3,p2,p1,p0,d2,d0,quot1,quot0]=match(14,/p\(x\)≡(\d+)x³-(\d+)x²-(\d+)x\+(\d+).*?除以 (\d+)x²\+ax\+(\d+).*?分別為 (\d+)x\+(\d+) 及/s);
  near(d2*quot1,p3);const a14=(-p2-d2*quot0)/quot1,b14=-p1-(d0*quot1+a14*quot0),c14=p0-d0*quot0;
  const product14=mul([d0,a14,d2],[quot0,quot1]);product14[0]+=c14;product14[1]+=b14;assert.deepEqual(product14,[p0,-p1,-p2,p3]);
  const disc14=a14*a14-4*d2*d0;assert(disc14>0);const root14=(-a14-Math.sqrt(disc14))/(2*d2);assert(!Number.isInteger(root14));
  for(const t of [-7,-1,2,5.5]){const evaluate=x=>p3*x**3-p2*x*x-p1*x+p0-(t*(d2*x*x+a14*x+d0)+b14*x+c14);near(evaluate(root14),0);for(const x of [-2,0,3])near(evaluate(x),(d2*x*x+a14*x+d0)*(quot1*x+quot0-t));}
  answer(14,`a=${a14}；可整除；並非所有根均為整數`);contains(14,`a=${a14}`,'非零常數 t','p(x)-q(x)≡','x=2/3','不受 t');

  const [intercept15,pointX15,pointY15]=match(15,/x 截距為 (\d+).*?\((\d+),(\d+)\)/s),base15=(pointX15/intercept15)**(1/pointY15),a15=-Math.log(intercept15)/Math.log(base15);near(base15,Math.round(base15));near(a15,Math.round(a15));
  answer(15,`x=${Math.round(base15)}^(y+${-Math.round(a15)})`);for(const x of [intercept15,pointX15,7]){const y=a15+Math.log(x)/Math.log(base15);near(base15**(y-a15),x);}contains(15,'對數定義',`b=${Math.round(base15)}`,`a=-log₄16=${Math.round(a15)}`);

  const [mantissa16,percent16,years16,limitMantissa16]=match(16,/首年購入 ([\d.]+)×10⁷ kg.*?少 (\d+)%.*?首 (\d+) 年.*?超過 ([\d.]+)×10⁸ kg/s),first16=mantissa16*1e7,r16=1-percent16/100,total16=sum(Array.from({length:years16},(_,i)=>first16*r16**i)),limit16=first16/(1-r16);
  near(total16,first16*(1-r16**years16)/(1-r16));assert(r16>0&&r16<1&&limit16<limitMantissa16*1e8);answer(16,`${(total16/1e8).toFixed(2)}×10⁸ kg；是`);contains(16,`公比 r=1-${percent16}%=`,`${(limit16/1e8).toFixed(1)}×10⁸`,'任何有限年數');

  contains(3,'x²-7xy+10y²≡','原式≡');contains(14,'3x²-11x+6≡');
  for(const n of [9,11])assert.doesNotMatch(JSON.stringify(q(n)),/\d m\b/);
  assert.match(q(17).prompt,/品質檢查員/);assert.doesNotMatch(JSON.stringify(q(17)),/籌碼|紅色|藍色|白色|袋/);
  const [batchA,batchB,batchC,draw,exactA,exactB,atMost]=match(17,/分別有 (\d+) 件、(\d+) 件及 (\d+) 件.*?抽取 (\d+) 件.*?恰好 (\d+) 件.*?恰好 (\d+) 件.*?不多於 (\d+) 件/s),n17=batchA+batchB+batchC,den17=choose(n17,draw),counts17=[];
  // Enumerate every subset as a second calculation independent of the combination formula.
  const enumerate=(start,left,nr)=>{if(!left){counts17[nr]=(counts17[nr]||0)+1;return;}for(let i=start;i<=n17-left;i++)enumerate(i+1,left-1,nr+(i<batchA?1:0));};enumerate(0,draw,0);
  assert.equal(sum(counts17),den17);for(let i=0;i<=batchA;i++)assert.equal(counts17[i]||0,choose(batchA,i)*choose(n17-batchA,draw-i));
  const pa=counts17[exactA],pb=counts17[exactB],pc=sum(counts17.slice(0,atMost+1));assert.equal(pa+pb+pc,den17);answer(17,`${frac(pa,den17)}；${frac(pb,den17)}；${frac(pc,den17)}`);contains(17,'互斥','餘事件',`=${den17}`,`=${pa}`,`=${pb}`);

  const [A,B,C,D,E,L,targetA,targetB,targetC,threshold18]=match(18,/y=(\d+)x²-(\d+)kx\+(\d+)x-(\d+)k\+(\d+).*?y=(\d+).*?\(a-b\)²=(\d+)k²\+(\d+)k\+(\d+).*?小於 (\d+)/s);
  const discriminant=[C*C-4*A*(E-L),-2*B*C+4*A*D,B*B],minimumK=-discriminant[1]/(2*discriminant[2]),minDisc=discriminant[0]-discriminant[1]**2/(4*discriminant[2]);assert(minDisc>0);
  near(discriminant[2]/A**2,targetA);near(discriminant[1]/A**2,targetB);near(discriminant[0]/A**2,targetC);
  const minDistance=Math.sqrt(minDisc)/A;assert(minDistance>threshold18);
  for(const k of [-100,-2,minimumK,0,3,100]){const qb=C-B*k,qc=E-L-D*k,disc=qb*qb-4*A*qc,roots=[(-qb+Math.sqrt(disc))/(2*A),(-qb-Math.sqrt(disc))/(2*A)];for(const x of roots)near(A*x*x+qb*x+qc,0,'Q18 root substitution',1e-6);near((roots[0]-roots[1])**2,targetA*k*k+targetB*k+targetC);}
  answer(18,`兩相異交點；(a-b)²=${targetA}k²+${targetB}k+${targetC}；不可能`);contains(18,'=36(k+1)²+324','a+b=','ab=','(a+b)²-4ab','JK=|a-b|',`JK≥√${minDistance**2}=${minDistance}>${threshold18}`,`k=${minimumK}`);

  const [kl,atJ,atL,jm,ln,areaBound]=match(19,/KL=(\d+) cm、∠KJL=(\d+)° 及 ∠JLK=(\d+)°.*?JM=(\d+) cm 及 LN=(\d+) cm.*?大於 (\d+) cm²/s),diagram19=q(19).diagram;
  for(const [key,val] of Object.entries({kl,atJ,atL,jm,ln}))assert.equal(diagram19[key],val);
  assert(atJ>0&&atL>0&&atJ+atL<180&&jm>ln&&ln>0);const atK=180-atJ-atL,jl=kl*Math.sin(atK*rad)/Math.sin(atJ*rad),jk=kl*Math.sin(atL*rad)/Math.sin(atJ*rad),lt=jl*ln/(jm-ln),jt=jl+lt,area=jt*kl*Math.sin(atL*rad)/2,kt=Math.sqrt(kl**2+lt**2-2*kl*lt*Math.cos((180-atL)*rad)),ju=2*area/kt;
  assert(jm<ju);const theta=Math.asin(jm/ju)/rad,projected=area*Math.cos(theta*rad);
  // Construct actual 3-D coordinates with KT on the ground x-axis, checking existence.
  const jx19=(jt*jt+kt*kt-jk*jk)/(2*kt),jy19=Math.sqrt(ju*ju-jm*jm),J19=[jx19,jy19,jm],K19=[kt,0,0],T19=[0,0,0],L19=J19.map(v=>v*ln/jm),M19=[jx19,jy19,0];
  near(dist(J19,L19),jl);near(dist(K19,L19),kl);near(dist(J19,K19),jk);near(dist(J19,T19),jt);near(L19[2],ln);near(kt*M19[1]/2,projected);assert(projected<area&&area<areaBound);
  answer(19,`${jl.toPrecision(3)} cm；${lt.toPrecision(3)} cm；${area.toPrecision(3)} cm²；${theta.toPrecision(3)}°；否`);
  contains(19,'∠JMT=∠LNT=90°','∠JTM=∠LTN','AA','餘弦公式','JU=2A/KT','JM⊥KT','JU⊥KT','MU⊥KT','sinθ=JM/JU','正投影',`${areaBound}`);

  let notationStrings=0;
  for(const item of qs){assert.doesNotMatch(JSON.stringify(item),/[橫縱横纵]|恆等於|角邊角|邊角邊/);for(const text of [item.prompt,item.answer,...item.hints,...item.solution.flatMap(p=>p.steps.flatMap(s=>s.text))]){const visible=window.mathText(text).replace(/<[^>]+>/g,'');assert.doesNotMatch(visible,/[\/÷√]/,`Q${item.n} unrendered notation: ${text}`);notationStrings++;}}
  const figures=qs.filter(q=>q.diagram);assert.deepEqual(figures.map(q=>q.n),[7,10,11,19]);
  for(const item of figures){const svg=window.pilotDiagram2017(item.diagram.type);assert(svg.includes('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));}
  return {questionCount:19,totalMarks:sum(sourceMarks),sectionMarks,polarQuestionIds:[],figureIds:figures.map(q=>q.n),notationStrings,questions:report};
}
function selfTest(data,window){
  const changes=[
    [0,'5x-2y','6x-2y'],[1,'x³y⁻²','x⁴y⁻²'],[2,'+9x-45y','+9x-44y'],[3,'$41040','$41041'],[4,'9-x<6','9-x<5'],[5,'(8,-8)','(8,-7)'],[6,'1/6','1/5'],[7,'400','625'],[8,'231 米','233 米'],[9,'15°','20°'],[10,'80.4 秒','80.5 秒'],[11,'9:16','4:9'],[12,'(0,12)','(0,9)'],[13,'-7x²','-8x²'],[14,'(1024,3)','(1024,4)'],[15,'20%','25%'],[16,'10 件','11 件'],[17,'+8k+40','+8k+41'],[18,'JM=12','JM=35']
  ].map(([i,a,b])=>d=>{assert(d.questions[i].prompt.includes(a));d.questions[i].prompt=d.questions[i].prompt.replace(a,b);});
  changes.push(d=>d.questions[6].diagram.angles[0]++,d=>d.questions[10].diagram.leaves[0][0]=1,d=>d.questions[18].diagram.jm++,d=>d.questions[18].solution[3].steps[2].text=['θ 是傾角。'],d=>d.questions[9].solution[0].steps[1].text=['全等。'],d=>d.questions[17].solution[2].steps[0].text=['利用公式。']);
  for(let i=0;i<19;i++)changes.push(d=>d.questions[i].answer+='錯');
  changes.forEach((change,i)=>{const copy=JSON.parse(JSON.stringify(data));change(copy);assert.throws(()=>verify(copy,window),`mutation ${i} must be rejected`);});
  return changes.length;
}
if(require.main===module){const {data,window}=read(),report=verify(data,window);if(process.argv.includes('--self-test'))report.rejectedMutations=selfTest(data,window);if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else{console.log('2017 Paper 1: all 19 questions independently derived; 35+35+35=105 marks; four figures; no polar items.');for(const q of report.questions)console.log(`Q${q.n} [paper p${q.sourcePage}, scheme p${q.schemePage}]: ${q.answer}`);console.log(`Notation strings: ${report.notationStrings}; rejected mutations: ${report.rejectedMutations||0}.`);}}
module.exports={read,verify,selfTest,sourcePages,sourcePdfPages,schemePages,sourceMarks,sourceGroups};
