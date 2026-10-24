const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sourcePages=[2,2,3,3,4,4,5,6,7,8,9,10,12,14,16,17,18,20,22];
const schemePages=[1,1,1,2,2,2,3,3,4,5,5,6,7,8,9,9,10,11,12];
const sourceMarks=[3,3,3,3,4,4,5,5,5,5,6,7,8,9,3,5,7,8,12];
const sourceGroups=[null,null,{a:1,b:1,c:1},null,{a:1,b:3},{a:3,b:1},null,null,null,{a:3,b:2},{a:2,b:2,c:2},{a:3,b:4},{a:2,b:6},{a:2,b:4,c:3},{a:1,b:2},{a:2,b:3},{a:2,b:5},{a:3,b:5},{a:4,b:8}];
const sum=a=>a.reduce((s,v)=>s+v,0),rad=Math.PI/180;
const near=(a,b,message='numeric equality',eps=1e-8)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${message}: ${a} != ${b}`);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>sum(a.map((v,i)=>v*b[i])),distance=(a,b)=>Math.hypot(...sub(a,b));
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const angle=(a,b,c)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,b),sub(c,b))/(distance(a,b)*distance(c,b)))))/rad;
const mul=(a,b)=>{const c=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>c[i+j]+=x*y));return c;};
const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
const clean=s=>s.replace(/\s/g,'');
const superscript=n=>String(n).replace(/[0-9-]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]||'⁻');
const unsup=s=>Number(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>c==='⁻'?'-':String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))));
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const fraction=(a,b)=>{const g=gcd(a,b);return b/g===1?`${a/g}`:`${a/g}/${b/g}`;};

function read(){
  const context={window:{}};
  for(const file of ['paper1/data-2018.js','paper1/diagrams-2018.js','paper1/math.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
  return {data:JSON.parse(JSON.stringify(context.window.PILOT_2018)),window:context.window};
}

function verify(data,window){
  const qs=data.questions,q=n=>qs[n-1],report=[];
  const answer=(n,s)=>assert.equal(clean(q(n).answer),clean(s),`Q${n} independently derived answer`);
  const work=n=>q(n).solution.flatMap(p=>p.steps.flatMap(s=>s.text)).join('\n');
  const contains=(n,...ss)=>ss.forEach(s=>assert(work(n).includes(s),`Q${n} missing working: ${s}`));
  const match=(n,re)=>{const m=q(n).prompt.match(re);assert(m,`Q${n} condition missing: ${re}`);return m.slice(1).map(Number);};
  assert.equal(data.year,2018);assert.equal(data.paper,1);assert.equal(data.minutes,135);assert.equal(qs.length,19);
  for(let i=0;i<19;i++){
    const item=qs[i],groups={};assert.equal(item.n,i+1);assert.equal(item.sourceNo,i+1);assert.equal(item.marks,sourceMarks[i]);
    assert.equal(item.section,i<9?'甲一':i<14?'甲二':'乙部');assert.deepEqual(item.markGroups||null,sourceGroups[i]);
    assert(item.hints.length>0);
    for(const p of item.solution)for(const s of p.steps){assert.match(s.marks,/^[12](?:M|A)?$/);assert(Array.isArray(s.text)&&s.text.length>0);const k=p.part.match(/^\(([abc])\)/)?.[1]||'';groups[k]=(groups[k]||0)+parseInt(s.marks,10);}
    assert.equal(sum(Object.values(groups)),item.marks);if(item.markGroups)assert.deepEqual(groups,item.markGroups);
    report.push({n:item.n,sourcePage:sourcePages[i],schemePage:schemePages[i],marks:item.marks,answer:item.answer});
  }
  assert.deepEqual([sum(qs.slice(0,9).map(q=>q.marks)),sum(qs.slice(9,14).map(q=>q.marks)),sum(qs.slice(14).map(q=>q.marks))],[35,35,35]);

  // Q1: solve the linear identity in a, checking coefficients after substitution.
  const [shiftA,denA,shiftB,denB]=match(1,/\(a\+(\d+)\)\/(\d+)=\(b\+(\d+)\)\/(\d+)/);
  const constant=denB*shiftA-denA*shiftB;
  near(denA*(constant/denA+shiftB),denB*shiftA);near(denA*(denB/denA),denB);
  answer(1,`b=(${denB}a+${constant})/${denA}`);

  // Q2: derive powers from the actual expression, including negative indices.
  const ex=q(2).prompt.match(/x([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)y([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\/\[\(x([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)y([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)\]/);
  assert(ex);const [nx,ny,dx,dy,power]=ex.slice(1).map(unsup),px=nx-dx*power,py=ny-dy*power;
  assert(px>0&&py<0);answer(2,`x${superscript(px)}/y${superscript(-py)}`);assert(q(2).prompt.includes('均不為零'));
  for(const [x,y] of [[2,3],[-3,2],[1.3,-2.1]])near(x**nx*y**ny/(x**dx*y**dy)**power,x**px/y**(-py));

  // Q3: three separate rounding operators, not the same nearest-value rule.
  const numbers=[...q(3).prompt.matchAll(/將 ([\d.]+)/g)].map(m=>Number(m[1]));assert.equal(numbers.length,3);
  const scale=10**(Math.floor(Math.log10(numbers[2]))-1);
  answer(3,`${Math.ceil(numbers[0])}；${Math.floor(numbers[1]*10)/10}；${Math.round(numbers[2]/scale)*scale}`);

  // Q4: invert the probability and validate the positive integer population.
  const [blue,green,num,den]=match(4,/、(\d+) 枚藍色及 (\d+) 枚綠色.*概率為 (\d+)\/(\d+)/);
  const white=green*den/num-blue-green;assert(Number.isInteger(white)&&white>0);near(green/(white+blue+green),num/den);answer(4,`n=${white}`);

  // Q5: compare every coefficient of the homogeneous cubic.
  const [lead5,next5,last5]=match(5,/\(b\) (\d+)x³-(\d+)x²y-xy²\+(\d+)y³/),root5=Math.sqrt(lead5),ratio5=next5/lead5;
  assert(Number.isInteger(root5)&&Number.isInteger(ratio5));near(ratio5,last5);
  const cubic=mul(mul([-ratio5,1],[-1,root5]),[1,root5]);assert.deepEqual(cubic,[last5,-1,-next5,lead5]);
  answer(5,`${lead5}x²(x-${ratio5}y)；(x-${ratio5}y)(${root5}x-y)(${root5}x+y)`);contains(5,`${lead5}x²(x-${ratio5}y)-y²(x-${ratio5}y)`,`(x-${ratio5}y)(${lead5}x²-y²)`);

  // Q6: derive the real interval and exhaust all possible integers in it.
  const [c6,d6,a6,b6,l6]=match(6,/\((\d+)-x\)\/(\d+)>(\d+)x\+(\d+) 及 x\+(\d+)≥0/);
  const upperNumerator=c6-d6*b6,upperDenominator=1+d6*a6,upper=upperNumerator/upperDenominator,ints=[];
  for(let x=-l6;x<=Math.ceil(upper);x++)if((c6-x)/d6>a6*x+b6&&x+l6>=0)ints.push(x);
  assert(ints.length);answer(6,`-${l6}≤x<${fraction(upperNumerator,upperDenominator)}；${ints.at(-1)}`);

  // Q7: loss is measured from cost; derive cost before marked price.
  const [markup,loss]=match(7,/成本高 (\d+)%.*虧損 \$(\d+)/);assert(q(7).prompt.includes('六折'));
  const cost=loss/(1-.6*(1+markup/100)),marked=cost*(1+markup/100);near(cost-.6*marked,loss);answer(7,`$${marked}`);

  // Q8: circle incidence and parallels; numerical geometry checks the symbolic theorem.
  assert(q(8).prompt.includes('∠KLM=2θ'));assert(q(8).prompt.includes('JK∥NM'));
  const circlePoints=angles=>angles.map(a=>[Math.cos(a*rad),Math.sin(a*rad)]);
  const checkCircle=angles=>{
    const [J,K,L,M,N]=circlePoints(angles),d=sub(M,J),e=sub(N,K),t=cross(sub(K,J),e)/cross(d,e),P=J.map((v,i)=>v+t*d[i]);
    near(cross(sub(K,J),sub(N,M)),0);assert(t>0&&t<1);
    const theta=angle(K,L,M)/2;near(angle(K,J,M),180-2*theta);near(angle(N,P,M),4*theta-180);return theta;
  };
  checkCircle(q(8).diagram.angles);
  for(const a of [15,25,35])for(const b of [55,65,75])checkCircle([180-a,a,-10,-b,b-180]);
  answer(8,'x=180°-2θ；y=4θ-180°');contains(8,'同弓形內的圓周角','內錯角');

  // Q9: unit conversion and distinct segment rates yield a unique time.
  const speeds=[...q(9).prompt.matchAll(/每小時 (\d+) km/g)].map(m=>Number(m[1]));
  const [journey,totalMinutes]=match(9,/共 (\d+) km，需時 (\d+) 分鐘/);
  const firstMinutes=(journey*60-speeds[1]*totalMinutes)/(speeds[0]-speeds[1]);
  assert(firstMinutes>0&&firstMinutes<totalMinutes);near((speeds[0]*firstMinutes+speeds[1]*(totalMinutes-firstMinutes))/60,journey);answer(9,`${firstMinutes}分鐘`);

  // Q10: derive endpoints; construct a counterexample satisfying every group-Y condition.
  const [range,iqr]=match(10,/分別為 (\d+) 歲及 (\d+) 歲/),box=q(10).diagram;
  const aa=box.values[1]+iqr,bb=box.values[0]+range;near(box.values[3],aa);near(box.values[4],bb);
  const [knownAge,secondRange]=match(10,/三人均為 (\d+) 歲；乙組年齡的分布域為 (\d+) 歲/);
  const otherAges=[knownAge-secondRange,knownAge-secondRange+1,knownAge,knownAge,knownAge];
  near(Math.max(...otherAges)-Math.min(...otherAges),secondRange);assert.equal(otherAges.filter(v=>v===knownAge).length,3);
  const combinedRange=Math.max(bb,...otherAges)-Math.min(box.values[0],...otherAges);assert.notEqual(combinedRange,range);
  answer(10,`a=${aa}，b=${bb}；不一定`);contains(10,`${otherAges.join('、')} 歲`,`${bb}-${otherAges[0]}=${combinedRange}`);

  // Q11: enumerate every relevant positive k using actual table values and frequencies.
  const table=q(11).diagram,modeKs=[],medianKs=[],meanKs=[];
  assert.deepEqual(table.values,[0,1,2,3,4]);assert.equal(table.frequencies[0],'k');
  const fixedTotal=sum(table.frequencies.slice(1)),weighted=sum(table.values.slice(1).map((v,i)=>v*table.frequencies[i+1]));
  for(let k=1;k<=2*fixedTotal+2;k++){
    const freqs=[k,...table.frequencies.slice(1)],values=table.values.flatMap((v,i)=>Array(freqs[i]).fill(v));
    if(freqs[2]>Math.max(...freqs.filter((_,i)=>i!==2)))modeKs.push(k);
    if(median(values)===2)medianKs.push(k);
    if(sum(values)/values.length===2)meanKs.push(k);
  }
  assert.equal(meanKs.length,1);near(meanKs[0],weighted/2-fixedTotal);
  answer(11,`${modeKs[0]}，${modeKs.at(-1)}；${medianKs[0]}，${medianKs.at(-1)}；k=${meanKs[0]}`);
  contains(11,`k+${fixedTotal}`,`${weighted}/(k+${fixedTotal})=2`);

  // Q12: solve both source constraints, divide polynomial, then use its discriminant.
  const [lead,shift,root,atNegative,remainderFactor,remainderConstant]=match(12,/≡(\d+)x\(x\+(\d+)\)²\+ax\+b.*x-(\d+) 為.*x\+(\d+) 的餘式為 (\d+)b\+(\d+)/);
  const base=x=>lead*x*(x+shift)**2;
  const rhs1=-base(root),rhs2=remainderConstant-base(-atNegative),bCoefficient=1-remainderFactor;
  const a12=(rhs2-bCoefficient*rhs1)/(-atNegative-bCoefficient*root),b12=rhs1-root*a12;
  const polynomial=[b12,lead*shift*shift+a12,2*lead*shift,lead];
  const quotient=[-b12/root,2*lead*shift+lead*root,lead];assert.deepEqual(mul([-root,1],quotient),polynomial);
  const discriminant=quotient[1]**2-4*quotient[2]*quotient[0];assert(discriminant<0&&Number.isInteger(root));
  answer(12,`a=${a12}，b=${b12}；沒有無理根`);contains(12,`=${discriminant}`,`x=${root}`);

  // Q13: reconstruct the trapezium, independently checking AA, area and distance bound.
  const [jk,jn,ln]=match(13,/JK=(\d+) cm、JN=(\d+) cm 及 LN=(\d+) cm/),[bound]=match(13,/NT<(\d+) cm/);
  assert.deepEqual(q(13).diagram,{type:'trapezium2018',jk,jn,ln});
  const kn=Math.sqrt(jn*jn-jk*jk),lm=kn*ln/jk,J=[0,jk],K=[0,0],N=[kn,0],L=[kn+ln,0],M=[kn+ln,lm];
  near(dot(sub(J,N),sub(M,N)),0);near(angle(J,K,N),angle(N,L,M));near(angle(K,J,N),angle(L,N,M));
  const area=Math.abs(cross(sub(J,N),sub(M,N)))/2,altitude=2*area/distance(J,M);
  assert(altitude>bound);answer(13,`${lm} cm；${area} cm²；不存在`);contains(13,'△JKN∼△NLM（AA）',`=${area} cm²`);

  // Q14: derive volume and similar-cone depth, then check actual sphere immersion is possible.
  const [cr,ch,R,H]=match(14,/半徑為 (\d+) cm、高為 (\d+) cm.*半徑為 (\d+) cm、高為 (\d+) cm/),[sr]=match(14,/半徑為 (\d+) cm 的實心金屬球/);
  const water=cr*cr*ch,capacity=R*R*H/3,depth=Math.cbrt(3*water*(H/R)**2),ball=4*sr**3/3,raisedDepth=Math.cbrt(3*(water+ball)*(H/R)**2);
  assert(water+ball<capacity);const lowestSphereCenter=sr*Math.sqrt(1+(H/R)**2);
  assert(lowestSphereCenter+sr<raisedDepth&&raisedDepth<H,'sphere fits and is fully submerged');
  answer(14,`${water}π cm³；${Math.round(depth)} cm；不會溢出`);near(depth,Math.round(depth));contains(14,`=${capacity}π cm³`,`${capacity-water}π cm³`);

  // Q15: enumerate all permutations; independently test first and last parity.
  const digits=q(15).prompt.match(/由 ([\d、]+) 各用一次/)[1].split('、').map(Number);assert.equal(new Set(digits).size,8);assert(!digits.includes(0));
  let all=0,endsEven=0;
  function permutations(prefix,rest){if(!rest.length){all++;if(prefix[0]%2===0&&prefix.at(-1)%2===0)endsEven++;return;}rest.forEach((v,i)=>permutations([...prefix,v],rest.filter((_,j)=>i!==j)));}
  permutations([],digits);answer(15,`${all}組；${endsEven}組`);

  // Q16: derive the sequence and check strict threshold at both adjacent integers.
  const [term3,term4]=match(16,/第 3 項及第 4 項分別為 (\d+) 及 (\d+)/),ratio=term4/term3,first=term3/ratio**2;
  const thresholdMatch=q(16).prompt.match(/小於 ([\d.]+)×10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/),threshold=Number(thresholdMatch[1])*10**unsup(thresholdMatch[2]);
  assert(ratio>1&&first>0);const sequenceSum=n=>first*(ratio**n+ratio**(2*n));let maxN=0;while(sequenceSum(maxN+1)<threshold)maxN++;
  assert(sequenceSum(maxN)<threshold&&sequenceSum(maxN+1)>=threshold);
  const logBoundary=Math.log((-1+Math.sqrt(1+4*threshold/first))/2)/Math.log(ratio);near(Math.ceil(logBoundary)-1,maxN);
  answer(16,`${first}；n=${maxN}`);contains(16,'t²+t-10¹⁰<0','取對數');

  // Q17: build the folded card in 3D; all six lengths and true plane angle are checked.
  const [side,atK,atJ]=match(17,/JK=(\d+) cm、∠JKM=(\d+)° 及 ∠KJM=(\d+)°/),[jl]=match(17,/相距 (\d+) cm/);
  assert(!q(17).diagram);assert.deepEqual(q(17).partDiagrams,{a:{type:'flatCard2018',side,atJ,atK},b:{type:'foldCard2018',side,atJ,atK,jl}});
  const other=180-atJ-atK,sideJM=side*Math.sin(atK*rad)/Math.sin(other*rad),diagonal=side*Math.sin(atJ*rad)/Math.sin(other*rad),p=side*Math.cos(atK*rad),h=side*Math.sin(atK*rad);
  const delta=2*p-diagonal,cosPhi=(delta*delta+2*h*h-jl*jl)/(2*h*h);assert(cosPhi>0&&cosPhi<1);
  const phi=Math.acos(cosPhi),K3=[0,0,0],M3=[diagonal,0,0],J3=[p,h,0],L3=[diagonal-p,h*cosPhi,h*Math.sin(phi)];
  near(distance(J3,K3),side);near(distance(J3,M3),sideJM);near(distance(K3,L3),sideJM);near(distance(M3,L3),side);near(distance(J3,L3),jl);
  near(angle(J3,K3,M3),atK);near(angle(K3,J3,M3),atJ);assert(p>0&&p<diagonal&&Math.sin(phi)>0);
  const beta=angle(J3,K3,L3);near(angle([0,1,0],[0,0,0],[0,cosPhi,Math.sin(phi)]),phi/rad);
  answer(17,`${sideJM.toPrecision(3)} cm；${beta.toPrecision(3)}°；${(phi/rad).toPrecision(3)}°`);contains(17,'JU⊥KM，UW⊥KM','JL²=UV²+JU²+LV²-2JU×LVcosφ');

  // Q18: solve the variation equations then verify the circumcenter by three equal distances.
  const values=[...q(18).prompt.matchAll(/g\((\d+)\)=(\d+)/g)].map(m=>m.slice(1).map(Number));assert.equal(values.length,2);
  const [[x1,y1],[x2,y2]]=values,a18=(y2/x2-y1/x1)/(x2-x1),b18=y1/x1-a18*x1;
  const [reflection]=match(18,/y=(\d+)-g\(x\)/),[sx,sy]=match(18,/S=\((\d+),(\d+)\)/);
  const vx=-b18/(2*a18),vy=-b18*b18/(4*a18),Q=[vx,vy],RR=[vx,reflection-vy],S=[sx,sy],P=[vx,reflection/2];
  near(dot(sub(Q,S),sub(RR,S)),0);near(distance(P,Q),distance(P,RR));near(distance(P,Q),distance(P,S));
  answer(18,`g(x)=${a18}x²+${b18}x；Q=(${vx},${vy})；R=(${vx},${reflection-vy})；P為QR的中點`);contains(18,`2[(x+3)²-9]`,`P=(${P.join(',')})`);

  // Q19: the discriminant identity is checked coefficientwise; the incircle is reconstructed.
  const [cx,cy]=match(19,/圓心為 \((\d+),(\d+)\)/),[yCoefficient,lineConstant]=match(19,/kx-(\d+)y\+(\d+)=0/),[jx,jy]=match(19,/J\((\d+),(\d+)\)/);
  const k=(yCoefficient*jy-lineConstant)/jx,radius=Math.abs(k*cx-yCoefficient*cy+lineConstant)/Math.hypot(k,yCoefficient),intercept=lineConstant/yCoefficient;
  const lineShift=lineConstant-yCoefficient*cy;
  // Discriminant / (4*yCoefficient^2) = (k^2+yCoefficient^2)r^2 - (cx*k+shift)^2.
  const linearSquare=mul([-yCoefficient*yCoefficient*cx,lineShift],[-yCoefficient*yCoefficient*cx,lineShift]);
  const constantC=yCoefficient*yCoefficient*cx*cx+lineShift*lineShift;
  const remainder=linearSquare.map((v,i)=>v-([yCoefficient*yCoefficient,0,1][i]||0)*constantC);
  const expected=mul([lineShift,cx],[lineShift,cx]).map(v=>-yCoefficient*yCoefficient*v);assert.deepEqual(remainder,expected);
  const I=[cx,cy],JJ=[jx,jy],KK=[0,intercept],len=distance(JJ,KK),footT=dot(sub(I,KK),sub(JJ,KK))/len**2;assert(footT>0&&footT<1);
  const alpha=Math.asin(radius/distance(JJ,I)),beta19=Math.asin(radius/distance(KK,I)),angleM=180-2*(alpha+beta19)/rad;
  assert(angleM>90&&angleM<180);
  // Reflect each base ray in the corresponding internal angle bisector to obtain M.
  const reflect=(v,b)=>{const scale=2*dot(v,b)/dot(b,b);return b.map((x,i)=>scale*x-v[i]);};
  const fromJ=reflect(sub(KK,JJ),sub(I,JJ)),fromK=reflect(sub(JJ,KK),sub(I,KK)),parameter=cross(sub(KK,JJ),fromK)/cross(fromJ,fromK),MM=JJ.map((v,i)=>v+parameter*fromJ[i]);
  assert(parameter>0);near(angle(JJ,MM,KK),angleM);
  const area19=Math.abs(cross(sub(JJ,KK),sub(MM,KK)))/2,perimeter=len+distance(JJ,MM)+distance(KK,MM);near(2*area19/perimeter,radius);
  for(const [A,B] of [[JJ,KK],[JJ,MM],[KK,MM]])near(Math.abs(cross(sub(I,A),sub(B,A)))/distance(A,B),radius);
  answer(19,`(x-${cx})²+(y-${cy})²=r²；r²=(${cx}k${lineShift})²/(k²+${yCoefficient*yCoefficient})；r=${radius}；是`);
  contains(19,'判別式為零',`k=${k}`,`r=${radius}`,angleM.toFixed(7).slice(0,7));

  let notationStrings=0;
  for(const item of qs){
    assert.doesNotMatch(JSON.stringify(item),/[橫縱横纵]|恆等於|角邊角|邊角邊/);
    assert(!item.prompt.includes('寫出'));assert(!item.cancelled);
    for(const text of [item.prompt,item.answer,...item.hints,...item.solution.flatMap(p=>p.steps.flatMap(s=>s.text))]){
      const visible=window.mathText(text).replace(/<span class="math-parallel"[^>]*>.*?<\/span>/g,'').replace(/<[^>]+>/g,'');
      assert.doesNotMatch(visible,/[\/÷√]/,`Q${item.n} uncovered notation: ${text}`);notationStrings++;
    }
  }
  const figures=qs.flatMap(item=>[...(item.diagram?[{n:item.n,spec:item.diagram}]:[]),...Object.entries(item.partDiagrams||{}).map(([part,spec])=>({n:item.n,part,spec}))]);
  assert.deepEqual(figures.map(q=>q.n),[8,10,11,13,17,17]);
  for(const item of figures){const svg=window.pilotDiagram2018(item.spec.type);assert(svg.includes('<svg'));assert(!/NaN|undefined|Infinity/.test(svg));}
  return {questionCount:19,totalMarks:105,sectionMarks:[35,35,35],polarQuestionIds:[],figureIds:figures.map(q=>q.part?`${q.n}${q.part}`:q.n),notationStrings,questions:report};
}

function selfTest(data,window){
  const changes=[
    d=>d.questions[0].prompt=d.questions[0].prompt.replace('a+7','a+8'),
    d=>d.questions[1].prompt=d.questions[1].prompt.replace('x⁻³','x⁻²'),
    d=>d.questions[3].prompt=d.questions[3].prompt.replace('12 枚','15 枚'),
    d=>d.questions[5].prompt=d.questions[5].prompt.replace('x+10','x+11'),
    d=>d.questions[7].diagram.angles[0]+=3,
    d=>d.questions[9].diagram.values[3]++,
    d=>d.questions[10].diagram.frequencies[2]++,
    d=>d.questions[11].prompt=d.questions[11].prompt.replace('2b+85','2b+90'),
    d=>d.questions[12].diagram.ln++,
    d=>d.questions[13].prompt=d.questions[13].prompt.replace('10 cm 的實心','16 cm 的實心'),
    d=>d.questions[16].partDiagrams.b.jl=80,
    d=>d.questions[17].prompt=d.questions[17].prompt.replace('S=(21,0)','S=(22,0)'),
    d=>d.questions[18].prompt=d.questions[18].prompt.replace('J(30,24)','J(31,24)'),
    d=>d.questions[12].solution[0].steps[1].text=['所以相似。'],
    d=>d.questions[16].solution[2].steps[1].text=['65.7°'],
    d=>d.questions[18].markGroups.b=7
  ];
  for(let i=0;i<19;i++)changes.push(d=>d.questions[i].answer+='錯');
  for(const change of changes){const copy=JSON.parse(JSON.stringify(data));change(copy);assert.throws(()=>verify(copy,window));}
  return changes.length;
}
if(require.main===module){
  const {data,window}=read(),report=verify(data,window);
  if(process.argv.includes('--self-test'))report.rejectedMutations=selfTest(data,window);
  if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  else {console.log('2018 Paper 1: 19 independently checked questions; 35+35+35=105 marks; six figures including Q17(a)/(b); no polar items.');for(const q of report.questions)console.log(`Q${q.n} [paper p${q.sourcePage}, scheme p${q.schemePage}]: ${q.answer}`);console.log(`Notation strings: ${report.notationStrings}; rejected mutations: ${report.rejectedMutations||0}.`);}
}
module.exports={read,verify,selfTest,sourcePages,schemePages,sourceMarks,sourceGroups};
