const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const sourcePages=[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,20,22];
const schemePages=[3,3,3,3,4,4,4,5,5,6,6,7,8,9,10,10,11,12,13];
const sourceMarks=[3,3,3,4,4,4,4,5,5,5,6,8,8,8,3,6,7,7,12];
const sourceGroups=[null,null,null,{a:1,b:1,c:2},{a:2,b:2},{a:2,b:2},null,{a:1,b:2,c:2},{a:2,b:3},{a:3,b:2},{a:3,b:3},{a:2,b:6},{a:3,b:5},{a:4,b:4},null,{a:2,b:4},{a:2,b:5},{a:5,b:2},{a:1,b:11}];
const sum=a=>a.reduce((x,y)=>x+y,0),rad=Math.PI/180;
const near=(a,b,message="numeric equality",eps=1e-8)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${message}: ${a} != ${b}`);
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(distance(a,b)*distance(c,b)))))/rad;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const add=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+(b[i]||0));
const scale=(a,s)=>a.map(x=>x*s);
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c;};
const coeff=(a,b)=>{while(a.length>1&&a.at(-1)===0)a.pop();while(b.length>1&&b.at(-1)===0)b.pop();assert.deepEqual(a,b);};
const trim=s=>s.replace(/\s/g,"");

function read() {
  const context={window:{}};
  for(const file of ["paper1/data-2019.js","paper1/diagrams-2019.js","paper1/math.js"])
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),"utf8"),context,{filename:file});
  return {data:JSON.parse(JSON.stringify(context.window.PILOT_2019)),window:context.window};
}

function verify(data,window) {
  const qs=data.questions,report=[];
  assert.equal(qs.length,19);assert.equal(data.year,2019);assert.equal(data.paper,1);assert.equal(data.minutes,135);
  for(let i=0;i<19;i++) {
    const q=qs[i];assert.equal(q.n,i+1);assert.equal(q.sourceNo,i+1);assert.equal(q.marks,sourceMarks[i]);
    assert.equal(q.section,i<9?"甲一":i<14?"甲二":"乙部");
    assert.deepEqual(q.markGroups||null,sourceGroups[i]);
    const grouped={};
    for(const p of q.solution) {
      const key=p.part.match(/^\(([abc])\)/)?.[1]||"";
      for(const s of p.steps){assert.match(s.marks,/^[12](?:M|A)?$/);assert(s.text.length>0);grouped[key]=(grouped[key]||0)+parseInt(s.marks,10);}
    }
    assert.equal(sum(Object.values(grouped)),q.marks);
    if(q.markGroups)assert.deepEqual(grouped,q.markGroups);
    report.push({n:q.n,sourcePage:sourcePages[i],schemePage:schemePages[i],marks:q.marks,answer:q.answer});
  }
  assert.deepEqual([sum(qs.slice(0,9).map(q=>q.marks)),sum(qs.slice(9,14).map(q=>q.marks)),sum(qs.slice(14).map(q=>q.marks))],[35,35,35]);
  const q=n=>qs[n-1],answer=(n,s)=>assert.equal(trim(q(n).answer),trim(s),`Q${n} derived answer`);
  const working=n=>q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join("\n");
  const contains=(n,...values)=>values.forEach(s=>assert(working(n).includes(s),`Q${n} working missing ${s}`));

  // Q1: compare coefficients of a in both sides after deriving the subject.
  const m1=q(1).prompt.match(/(\d+)\(x\+(\d+)a\)=(\d+)x\+(\d+)/).slice(1).map(Number);
  const [p,h,r,t]=m1,constant=t/(p-r),parameter=-p*h/(p-r);
  coeff([p*constant,p*(parameter+h)],[r*constant+t,r*parameter]);
  answer(1,`x=${constant}${parameter}a`);

  // Q2: exact polynomial numerator cross-multiplication, including domain.
  const m2=q(2).prompt.match(/(\d+)\/\((\d+)x-(\d+)\)-(\d+)\/\((\d+)x\+(\d+)\)/).slice(1).map(Number);
  const [n1,a,b,n2,c,d]=m2,top=add(scale([d,c],n1),scale([-b,a],-n2));
  assert.deepEqual(top,[37,1]);answer(2,`(x+${top[0]})/((3x-4)(2x+5))`);
  assert.notEqual(-37,b/a);assert.notEqual(-37,-d/c);contains(2,"10x+25-9x+12=x+37","x≠4/3","x≠-5/2");

  // Q3: form Pythagoras as a coefficient polynomial and test both roots/lengths.
  const m3=q(3).prompt.match(/長為 (\d+) cm，闊為 \(x\+(\d+)\) cm，對角線長為 \((\d+)-(\d+)x\)/).slice(1).map(Number);
  const [long,widthOffset,diagonalOffset,diagonalCoefficient]=m3;
  const quadratic=add(add([long*long],mul([widthOffset,1],[widthOffset,1])),scale(mul([diagonalOffset,-diagonalCoefficient],[diagonalOffset,-diagonalCoefficient]),-1));
  coeff(quadratic,[324,156,-3]);
  const roots=[(-quadratic[1]+Math.sqrt(quadratic[1]**2-4*quadratic[2]*quadratic[0]))/(2*quadratic[2]),(-quadratic[1]-Math.sqrt(quadratic[1]**2-4*quadratic[2]*quadratic[0]))/(2*quadratic[2])];
  const valid=roots.filter(x=>widthOffset+x>0&&diagonalOffset-diagonalCoefficient*x>0);
  assert.deepEqual(valid,[-2]);answer(3,`x=${valid[0]}`);near(30**2+16**2,34**2);contains(3,"x²-52x-108=0","x=54","-78 cm");

  // Q4: identities in the independent coefficients of y and x, not samples.
  coeff(mul([-4,3],[4,3]),[-16,0,9]);coeff(mul([-4,3],[4,1]),[-16,8,3]);
  coeff(mul([-4,3],[-4,-1]),[16,-8,-3]);
  assert(q(4).prompt.includes("3x²y+8xy-16y"));answer(4,"(3x-4)(3x+4)；y(3x-4)(x+4)；(3x-4)(3x+4-xy-4y)");

  // Q5: reverse discount and profit are different bases.
  const received=Number(q(5).prompt.match(/實收 \$(\d+)/)[1]),profit=Number(q(5).prompt.match(/為 (\d+)%/)[1]);
  assert(q(5).prompt.includes("八五折"));const original=received/.85,cost=received/(1+profit/100);
  near(original*.85,received);near((received-cost)/cost,profit/100);answer(5,`$${original}；$${cost}`);

  // Q6: derive the real bound, then enumerate all integers in a broad range.
  assert(q(6).prompt.includes("(5x+42)/3≤3(2x+1)"));assert(q(6).prompt.includes("56-7x≥0"));
  const bound=(42-9)/(18-5),integers=[];
  for(let x=-100;x<=100;x++)if((5*x+42)/3<=3*(2*x+1)&&56-7*x>=0)integers.push(x);
  near(bound,33/13);assert.deepEqual(integers,[3,4,5,6,7,8]);answer(6,`x≥33/13；${integers.length}個`);

  // Q7: solve the ratio equation before comparing with the authored result.
  const m7=q(7).prompt.match(/比為 (\d+):(\d+)。加入 (\d+) 件礦物標本及 (\d+) 件岩石標本後，兩類標本的數目之比變為 (\d+):(\d+)/).slice(1).map(Number);
  const [v,w,incV,incW,afterV,afterW]=m7,k=(afterV*incW-afterW*incV)/(afterW*v-afterV*w);
  assert(k>0&&Number.isInteger(k*v)&&Number.isInteger(k*w));near((v*k+incV)/(w*k+incW),afterV/afterW);answer(7,`${v*k}件`);

  // Q8: solve from the complete pie metadata, and verify the omitted sector.
  const pie=q(8).diagram;assert.equal(sum(pie.angles),360);assert(pie.angles.every(x=>x>0));
  const mode=pie.values[pie.angles.indexOf(Math.max(...pie.angles))],mean=sum(pie.values.map((v,i)=>v*pie.angles[i]))/360;
  const probability=sum(pie.angles.filter((_,i)=>pie.values[i]>4))/360;
  near(mean,4.8);near(probability,9/20);answer(8,`${mode}；${mean}；9/20`);

  // Q9: compute the actual radii independently from total volume and ratio.
  const totalVolume=Number(q(9).prompt.match(/為 (\d+)π cm³/)[1]),diameterRatio=Number(q(9).prompt.match(/半徑的 (\d+) 倍/)[1]);
  const radiusRatio=diameterRatio/2,small=Math.cbrt(totalVolume/(4/3*(1+radiusRatio**3))),large=small*radiusRatio;
  near(large,9);near(small,6);const bigVolume=4*large**3/3,totalArea=4*(large**2+small**2);
  answer(9,`${Math.round(bigVolume)}π cm³；${Math.round(totalArea)}π cm²`);

  // Q10: solve the two interpolation constraints and quadratic discriminant.
  const values=[...q(10).prompt.matchAll(/g\((-?\d+)\)=(-?\d+)/g)].slice(0,2).map(m=>m.slice(1).map(Number));
  const slope=(values[1][1]-values[0][1])/(values[1][0]-values[0][0]),intercept=values[0][1]-slope*values[0][0];
  const qa=Number(q(10).prompt.match(/g\(x\)=(\d+)x²/)[1]);
  near(slope*slope+4*qa*intercept,0);const root=slope/(2*qa);
  answer(10,`g(x)=${slope}x${intercept}；x=${root}`);

  // Q11: derive the quotient and exclude quadratic real roots, then prove rationality.
  assert(q(11).prompt.includes("3x²+4x+8"));const remainderValues=q(11).prompt.match(/分別為 (\d+) 及 (-?\d+)/).slice(1).map(Number);
  const at2=remainderValues[0]/(3*2**2+4*2+8),atMinus1=remainderValues[1]/(3-4+8);
  const qaSlope=(at2-atMinus1)/3,qaIntercept=at2-2*qaSlope;
  coeff(mul([qaIntercept,qaSlope],[8,4,3]),[-40,12,1,12]);assert(4**2-4*3*8<0);
  assert(Number.isInteger(qaSlope)&&qaSlope!==0&&Number.isInteger(qaIntercept));
  near(-qaIntercept/qaSlope,5/4);
  assert(q(11).topic.includes("有理根"));assert(q(11).prompt.includes("有多少個有理根"));
  answer(11,`${qaSlope}x${qaIntercept}；1個有理根`);
  contains(11,"Δ=4²-4×3×8=16-96=-80","沒有實根，故亦沒有有理根","x=5/4","5/4 是兩個整數的比，分母不為零，所以是有理數");

  // Q12: exhaustive leaves, quartiles and population variance, no answer-fed pair.
  const rows=q(12).diagram.rows,iqr=Number(q(12).prompt.match(/間距為 ([\d.]+) 分鐘/)[1]);
  const targetMean=Number(q(12).prompt.match(/平均值為 ([\d.]+) 分鐘/)[1]),minRange=Number(q(12).prompt.match(/分布域大於 (\d+) 分鐘/)[1]);
  const candidates=[];
  for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++) {
    const vars={a,b,c},values=rows.flatMap(({stem,leaves})=>leaves.map(x=>10*stem+(typeof x==="number"?x:vars[x])));
    if(values.some((x,i)=>i&&x<values[i-1]))continue;
    if(Math.abs(median(values.slice(10))-median(values.slice(0,10))-iqr)>1e-9)continue;
    if(values.at(-1)-values[0]<=minRange||Math.abs(sum(values)/20-targetMean)>1e-9)continue;
    const variance=sum(values.map(x=>(x-targetMean)**2))/20;
    candidates.push({a,b,c,variance,squares:sum(values.map(x=>x*x))});
  }
  assert.deepEqual(candidates.map(({a,b,c})=>[a,b,c]),[[0,9,4],[1,8,4]]);
  assert.deepEqual(candidates.map(v=>v.squares),[32150,32074]);
  const sd=Math.sqrt(Math.min(...candidates.map(v=>v.variance)));near(sd,7.694803441284253);
  answer(12,`c=4；(a,b)=(0,9)或(1,8)；${sd.toPrecision(3)}分鐘`);

  // Q13: construct all circle points to check incidence and the angle/parallel proof.
  assert(q(13).prompt.includes("P。\n已知 ∠JNM=122°。"));
  const theta=q(13).diagram.angle,radius=q(13).diagram.radius,dAngle=360-2*theta;
  const point=a=>[radius*Math.cos(a*rad),radius*Math.sin(a*rad)];
  const J=point(0),K=point(2*dAngle),L=point(180),M=point(dAngle),N=point(56),O=[0,0];
  near(angle(J,N,M),theta);near(cross(sub(K,L),sub(M,O)),0);
  const requested=angle(L,K,M),central=angle(K,O,L),perimeter=2*radius+central/360*2*Math.PI*radius;
  near(requested,32);near(central,52);assert(perimeter<62);near(perimeter,42+91*Math.PI/15);
  answer(13,"32°；是，42+91π/15≈61.1 cm");contains(13,"∠OKL=∠OKM+∠MKL=32°+32°=64°","∠KOL=180°-64°-64°=52°");

  // Q14: generic square with N=(0,t) has P=(t/(1+t),t/(1+t)).
  // T=K+L-P guarantees both parallels and ASA; similarity scale is 1/t.
  // Under the extra angle equality, KP=KL implies t=sqrt(2)-1 exactly.
  const t14=Math.SQRT2-1,side=2,SJ=[0,2],SK=[2,2],SL=[2,0],SM=[0,0],SN=[0,2*t14],SP=[2*t14/(1+t14),2*t14/(1+t14)],ST=SK.map((v,i)=>v+SL[i]-SP[i]);
  near(cross(sub(ST,SK),sub(SL,SN)),0);near(cross(sub(ST,SL),sub(SK,SM)),0);
  near(distance(SK,SL),distance(SL,SK));near(distance(SL,ST),distance(SK,SP));near(distance(ST,SK),distance(SP,SL));
  near(distance(SK,SL)/distance(SM,SN),distance(SL,SP)/distance(SN,SP));
  near(distance(SK,SP)/distance(SM,SP),distance(SK,SL)/distance(SM,SN));
  near(angle(SK,SL,SP),angle(SK,ST,SL));near(distance(SM,SP),2*(Math.SQRT2-1));
  assert(distance(SJ,SN)>distance(SM,SP));answer(14,"MP=2(√2-1)s；是");contains(14,"△KLT≅△LKP（ASA）","△KLP∼△MNP（AA）","JN-MP=2(3-2√2)s");

  // Q15: complement calculation independently agrees with all admissible compositions.
  const m15=q(15).prompt.match(/有 (\d+) 張地面拍攝照片及 (\d+) 張航拍照片。編輯從中選出 (\d+)/).slice(1).map(Number);
  const [ground,air,selected]=m15,total=choose(ground+air,selected)-choose(air,selected);
  let byCases=0;for(let i=1;i<=selected;i++)byCases+=choose(ground,i)*choose(air,selected-i);
  near(total,byCases);answer(15,`${total}種`);

  // Q16: solve the repeated root, derive logarithmic sequence then monotone boundary.
  assert(q(16).prompt.includes("y=6x-32 及 y=x²-26x+224"));
  const sx=(26+6)/2,sy=6*sx-32;near(sx*sx-26*sx+224,sy);
  const first=Math.log10(sx),difference=Math.log10(sy)-first,threshold=Number(q(16).prompt.match(/大於 (\d+)/)[1]);
  assert(first>0&&difference>0);const series=n=>n*(2*first+(n-1)*difference)/2;
  let n=1;while(series(n)<=threshold)n++;near(series(61),1175.2211030721826);near(series(62),1213.1508825258443);
  answer(16,`x=${sx}，y=${sy}；n=${n}`);assert(series(n-1)<=threshold&&series(n)>threshold);

  // Q17: barycentric incenter independently validates tangent-length construction.
  const vertices=[...q(17).prompt.matchAll(/(?:J|K)=\((\d+),(\d+)\)/g)].map(m=>m.slice(1).map(Number));
  assert.equal(vertices.length,2);const [j17,k17]=vertices,o17=[0,0],oj=distance(o17,j17),jk=distance(j17,k17),ok=distance(o17,k17),p17=oj+jk+ok,A17=Math.abs(cross(j17,k17))/2,r17=2*A17/p17;
  const i17=j17.map((v,i)=>(ok*v+oj*k17[i]+jk*o17[i])/p17);
  near(A17,210);near(p17,70);near(r17,6);near(i17[0],10);near(i17[1],6);
  const lineDistance=(p,a,b)=>Math.abs(cross(sub(p,a),sub(b,a)))/distance(a,b);
  near(lineDistance(i17,o17,j17),r17);near(lineDistance(i17,j17,k17),r17);near(lineDistance(i17,o17,k17),r17);
  near(9*j17[0]+2*j17[1]-102,0);near(9*i17[0]+2*i17[1]-102,0);
  answer(17,"pr=2A；內角平分線；9x+2y-102=0");contains(17,"A=ar/2+br/2+cr/2","(17-t)+(28-t)=25");

  // Q18: reconstruct a non-flat tetrahedron with all six intended constraints.
  const td=q(18).diagram,alpha=Math.asin(td.km*Math.sin(td.angle*rad)/td.side),delta=Math.PI-td.angle*rad-alpha;
  assert((Math.PI-alpha)+td.angle*rad>Math.PI);const jp=td.side-td.km*Math.cos(delta),rho=td.km*Math.sin(delta),cy=td.side*Math.sqrt(3)/2;
  const by=((jp-td.side/2)**2+rho*rho+cy*cy-td.kl**2)/(2*cy),bzSquared=rho*rho-by*by;
  assert(jp>0&&jp<td.side&&bzSquared>0,"nondegenerate tetrahedron and foot inside edge");
  const j18=[0,0,0],m18=[td.side,0,0],l18=[td.side/2,cy,0],k18=[jp,by,Math.sqrt(bzSquared)],p18=[jp,0,0];
  near(distance(j18,l18),td.side);near(distance(j18,m18),td.side);near(distance(l18,m18),td.side);near(distance(k18,m18),td.km);near(distance(k18,l18),td.kl);
  near(angle(j18,k18,m18),td.angle);near(dot(sub(k18,p18),sub(m18,j18)),0);
  const lp=distance(l18,p18);near(lp,13.037280386554228);assert(Math.abs(jp-td.side/2)>0.1);
  const norm1=cross3(sub(k18,j18),sub(m18,j18)),norm2=cross3(sub(l18,j18),sub(m18,j18));
  const trueDihedral=Math.acos(Math.abs(dot(norm1,norm2))/(Math.hypot(...norm1)*Math.hypot(...norm2)))/rad;
  const proposed=angle(k18,p18,l18);assert(Math.abs(trueDihedral-proposed)>0.1);
  answer(18,`${(alpha/rad).toPrecision(3)}°；${lp.toPrecision(3)} cm；不是`);contains(18,"LP²≈15²+6.395156175²-2×15×6.395156175cos60°","JP≈6.395156175 cm≠7.5 cm");

  // Q19: exact coefficient identities in k, attainable diameter bound, unique positive root.
  assert(q(19).prompt.includes("f(x)=[x²+(4k+2)x+8k+9]/(k+1)"));assert(q(19).prompt.includes("F=(1,12)"));
  coeff(add(add([1],[2,4]),[9,8]),[12,12]);
  const ux=[1,2],uy=[10,-4],constantNumerator=add([9,8],scale(mul(ux,ux),-1));
  coeff(constantNumerator,mul([1,1],[8,-4]));
  const circlePolynomial=add(add(mul(ux,ux),mul(uy,uy)),add(scale(ux,-1),scale(uy,-12)));
  coeff(circlePolynomial,[-20,-30,20]);coeff(mul([1,2],[-2,1]),[-2,-3,2]);
  const candidatesK=[(30+Math.sqrt(30**2+4*20*20))/40,(30-Math.sqrt(30**2+4*20*20))/40];
  assert.deepEqual(candidatesK.filter(v=>v>0),[2]);
  const F=[1,12],U=[5,2],G=[-1,14],center=F.map(x=>x/2),radiusSquared=145/4;
  near(distance(U,center)**2,radiusSquared);near(dot(sub(F,U),sub(O,U)),0);assert(Math.abs(cross(F,U))>0);
  near(G[0]**2+G[1]**2-G[0]-12*G[1],30);answer(19,"U=(2k+1,10-4k)；k=2；不共圓");
  contains(19,"[x-(2k+1)]²/(k+1)+10-4k","20k²-30k-20=0","G=(-1,12+2)=(-1,14)");

  let notationStrings=0;
  for(const item of qs) {
    assert.doesNotMatch(JSON.stringify(item),/[橫縱横纵]|恆等於|例如：|角邊角|邊角邊/);
    for(const text of [item.prompt,item.answer,...item.hints,...item.solution.flatMap(p=>p.steps.flatMap(s=>s.text))]) {
      const visible=window.mathText(text).replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,"").replace(/<[^>]+>/g,"");
      assert.doesNotMatch(visible,/[\/÷√]/,`Q${item.n} uncovered notation ${text}`);notationStrings++;
    }
  }
  const diagrams=qs.filter(item=>item.diagram);assert.deepEqual(diagrams.map(item=>item.n),[8,12,13,14,18]);
  for(const item of diagrams){const svg=window.pilotDiagram2019(item.diagram.type);assert(svg.includes("<svg"));assert(!/NaN|undefined|Infinity/.test(svg));}
  return {questionCount:19,totalMarks:105,polarQuestionIds:[],figureIds:diagrams.map(item=>item.n),notationStrings,questions:report};
}

function selfTest(data,window) {
  const changes=[d=>d.questions[0].prompt=d.questions[0].prompt.replace("+20","+24"),d=>d.questions[1].answer="x",d=>d.questions[2].prompt=d.questions[2].prompt.replace("30 cm","32 cm"),d=>d.questions[7].diagram.angles[0]++,d=>d.questions[11].diagram.rows[1].leaves[0]=1,d=>d.questions[17].diagram.kl=100,d=>d.questions[18].solution[2].steps[2].text=["k=3"],d=>d.questions[13].markGroups.a=5];
  for(const change of changes){const copy=JSON.parse(JSON.stringify(data));change(copy);assert.throws(()=>verify(copy,window));}
  return changes.length;
}

if(require.main===module) {
  const {data,window}=read(),report=verify(data,window);
  if(process.argv.includes("--self-test"))report.rejectedMutations=selfTest(data,window);
  if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
  else {console.log("2019 Paper 1: 19 independently checked questions; 35+35+35=105 marks; five diagrams; no polar items.");for(const item of report.questions)console.log(`Q${item.n} [source p${item.sourcePage}, scheme p${item.schemePage}]: ${item.answer}`);console.log(`Notation strings: ${report.notationStrings}; rejected mutations: ${report.rejectedMutations||0}.`);}
}
module.exports={read,verify,sourcePages,schemePages,sourceMarks,sourceGroups};
