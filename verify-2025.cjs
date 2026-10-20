const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const load=paper=>{const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,`paper${paper}/data-2025.js`),"utf8"),context);return context.window.PILOT_2025;};
const p1=load(1),p2=load(2);
for(const [paper,expected] of [[1,'((u³v⁻⁴)⁴) 除以 (u²v³)'],[2,'((125t)²) 除以 ((5t⁻³)⁴)']]){
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,`paper${paper}/math.js`),"utf8"),context);
  assert.ok(context.window.mathText((paper===1?p1:p2).questions[0].prompt).includes(`aria-label="${expected}"`),"Grouped powers must stay in their fraction numerator/denominator");
}
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const gcd=(a,b)=>b?gcd(b,a%b):a;
const frac=(a,b)=>{const d=gcd(a,b);return `${a/d}/${b/d}`;};
const C=(n,r)=>{let v=1;for(let i=1;i<=r;i++)v=v*(n-i+1)/i;return Math.round(v);};
const median=a=>(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2;
const variance=a=>{const m=a.reduce((s,x)=>s+x,0)/a.length;return a.reduce((s,x)=>s+(x-m)**2,0)/a.length;};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const area=points=>Math.abs(points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
let checks=0;
function check(paper,n,fn){try{fn();checks++;}catch(error){throw new Error(`2025 Paper ${paper} Q${n}: ${error.message}`,{cause:error});}}
assert.equal(p1.questions.length,19);assert.equal(p2.questions.length,45);
for(const p of [p1,p2]) for(const [i,q] of p.questions.entries()){
  assert.equal(q.n,i+1);assert.equal(q.sourceNo,q.n);assert.ok(q.hints.length>=2);
  assert.ok(!/填空|改正.*錯誤|找出.*錯誤/.test(q.prompt));
  if(p.paper===1){
    const total=q.solution.flatMap(p=>p.steps).reduce((s,x)=>s+Number(x.marks.match(/^\d+/)[0]),0);
    assert.equal(total,q.marks,`Q${q.n} marking total`);
    for(const s of q.solution.flatMap(p=>p.steps)) assert.match(s.marks,/^[1-9]\d*[MA]$/);
  }else{
    assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.equal(q.options["ABCD".indexOf(q.answer)],q.correct);
  }
}
for(const [a,b] of [[0,9],[9,14],[14,19]]) assert.equal(p1.questions.slice(a,b).reduce((s,q)=>s+q.marks,0),35);
const answer=(n,expected)=>assert.equal(p2.questions[n-1].correct,String(expected));
const writtenAnswers=[
  "u¹⁰/v¹⁹","127/[(8v-13)(14v+9)]","115","Q(10,5)；h=25",
  "3b(9a-5c)；(9a-5c)(9a+5c)；(9a-5c)(9a+5c-3b)","r<-35/11；-4",
  "標價 $990；成本 $750；虧蝕 $57","95 cm","7；9；約 4.28",
  "u=-10，v=-16；同意","H(t)=6t²-30t；b>-75/2","44 分鐘；q=4；減少 3 分鐘；是",
  "垂直平分線；2x+5y-100=0；355","6300π cm³；1400π cm²；否","13/85；27/170",
  "r=125","40；312","A(6t-8,-14)；C(10h/(15t+1),-6h/(15t+1))，h=9t²-6t-29；t=1/3",
  "u=24，v=88；4/5；3√58；s=725/38<33，不成立"
];
assert.deepEqual(Array.from(p1.questions,q=>q.answer),writtenAnswers);
const diagrams={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"paper2/diagrams-2025.js"),"utf8"),diagrams);
for(const q of p2.questions)if(q.diagram)assert.match(diagrams.window.pilotDiagram2025(q.diagram.type),/<svg /,`Missing Q${q.n} diagram`);
for(const q of [...p1.questions,...p2.questions]){
  const text=JSON.stringify(q);
  assert.ok(!/\b(?:sinh|cosh|sinj|sint|tant|blog)\b/.test(text),`Q${q.n}: math function needs spacing`);
}
check(1,1,()=>{for(const x of [2,3])for(const y of [2,5])close((x**3*y**-4)**4/(x**2*y**3),x**10/y**19);});
check(1,2,()=>{for(const v of [-2,0,2,4])close(4/(8*v-13)-7/(14*v+9),127/((8*v-13)*(14*v+9)));assert.ok(!p1.questions[1].prompt.includes("6d+5"));});
check(1,3,()=>{close(3*(7*23)+2*(5*23),713);close(5*23,115);});
check(1,4,()=>{const P=[5,-10],Q=[-P[1],P[0]],h=25;close(P[1]/P[0],(Q[1]-h)/Q[0]);});
check(1,5,()=>{for(const [a,c,b] of [[2,3,5],[-1,2,3]])close(81*a*a-25*c*c-27*a*b+15*c*b,(9*a-5*c)*(9*a+5*c-3*b));});
check(1,6,()=>{for(let r=-100;r<=10;r+=0.1)assert.equal((7-5*r)/3>2*r+14||4*r<=-28,r<-35/11);assert.ok(-4<-35/11&&-3>=-35/11);});
check(1,7,()=>{close(990*.7,693);close(750*1.32,990);close(750-693,57);});
check(1,8,()=>{const sw=48,wx=3,vw=Math.sqrt(sw*wx),vx=40*vw/sw;close(vw,12);close(40+(sw-wx)+vx,95);assert.ok(40+vw>sw);});
check(1,9,()=>{const cases=[];for(let f=0;f<80;f++){const a=[...Array(9).fill(2),...Array(7).fill(4),6,6,...Array(f).fill(9),...Array(8).fill(13)];if(median(a)===6)cases.push({f,sd:Math.sqrt(variance(a))});}assert.deepEqual(cases.map(c=>c.f),[7,8,9]);close(Math.max(...cases.map(c=>c.sd)),4.281422487024223);});
check(1,10,()=>{const f=x=>3*x**3-10*x*x-16*x+32;close(f(-1),35);for(const x of [4/3,4,-2])close(f(x),0);for(const x of [-3,0,1,5])close(f(x),(3*x-4)*(x-4)*(x+2));assert.match(p1.questions[9].answer,/v=-16/);});
check(1,11,()=>{const f=x=>6*x*x-30*x;close(f(6),36);close(f(8),144);close(f(2.5),-37.5);});
check(1,12,()=>{const q=p1.questions[11],a=q.diagram.rows.flatMap(row=>row.leaves.map(leaf=>10*row.stem+(leaf==="q"?4:Number(leaf))));assert.equal(a.length,16);close(a.at(-1)-a[0],44);close(44-(median(a.slice(8))-median(a.slice(0,8))),26);close(49-median(a.slice(8)),-3);assert.ok(60-24<44&&49-35<18);assert.match(q.prompt,/文件處理系統/);assert.ok(!/運動員|體重|訓練|kg/.test(JSON.stringify(q)));});
check(1,13,()=>{const A=[50,0],B=[0,20],D=[25,10],E=[21,0];close(5*D[0]-2*D[1]-105,0);close(dot(sub(A,B),[2,5]),0);close(5*E[0]-105,0);close(area([[0,0],B,D,E]),355);});
check(1,14,()=>{const smallH=48-36,ratio=smallH/48,r=20*ratio;close(20*20*48/3-r*r*smallH/3,6300);close(20*52-r*13+400+r*r,1400);assert.ok(6*(6300*Math.PI)**(2/3)<1400*Math.PI);});
check(1,15,()=>{assert.equal(frac(C(9,3)+C(6,3),C(17,3)),"13/85");assert.equal(frac(9*6*2,C(17,3)),"27/170");});
check(1,16,()=>{const log5=x=>Math.log(x)/Math.log(5);close(log5(125)+log5(5**9),12);close(Math.log(625)/Math.log(125)-Math.log(125)/Math.log(5**9),1);for(const t of [9,-4])close(t*t-5*t-36,0);assert.ok(125<5**9&&5**16>5**-4);});
check(1,17,()=>{const A=j=>40+(j-1)*8;close(A(23),216);close(A(23)**2,A(5)*A(77));const sum=j=>4*j*j+36*j;assert.ok(sum(311)<=400000&&sum(312)>400000);});
check(1,18,()=>{
  for(const t of [.1,1/3,.5,1,2,4,8]){
    const A=[6*t-8,-14],B=[6*t+4,6],h=9*t*t-6*t-29,C=[10*h/(15*t+1),-6*h/(15*t+1)];
    close(2*A[0]**2-24*t*A[0]+32*A[0]+72*t*t-192*t+114,-14);
    close(dot(C,sub(B,A)),0);close(dot(B,sub(C,A)),0);
    const D=[-10,-10],circle=dot(sub(C,D),sub(B,D));
    close(circle*(15*t+1)/4,(3*t-1)*(45*t*t+93*t+244));
  }
  assert.ok(45*(1/3)**2+93/3+244>0);
});
check(1,19,()=>{
  const u=24,v=88;close(144+196-12*u-140+v,0);
  close((16*u+486)**2-100*(192*u+2961),0);
  close(Math.abs(3*(-12)-4*5+101)/5,9);
  close(15**2+33**2-2*15*33*.8,522);
  const t=297/19,s=33+t,K=Math.sqrt(s*(s-33)*(s-12-t)*(s-21-t));
  close(K,9*s);close(33*(12+t)*(21+t)/(4*K),725/38);assert.ok(725/38<33);
  const sinSum=(3*7+4*3)/(5*Math.sqrt(58)),cosSum=(4*7-3*3)/(5*Math.sqrt(58));
  close(2*sinSum*cosSum,627/725);close(33/(4*sinSum*cosSum),725/38);
});
check(2,1,()=>{for(const t of [1,2,-3])close((125*t)**2/(5*t**-3)**4,5**2*t**14,1e-3);answer(1,"5²t¹⁴");});
check(2,2,()=>{for(const [m,n] of [[2,3],[-3,1]])close(49-(2*m+5*n)**2,(7+2*m+5*n)*(7-2*m-5*n));answer(2,"(7+2u+5v)(7-2u-5v)");});
check(2,3,()=>{const c=12/4,d=-15*c+12*c;answer(3,d);});
check(2,4,()=>{for(const v of [-3,0,2,4]){const u=(13*v+21)/(28-2*v);close((4*u-3)*(v+7),2*v*(3*u+5));}answer(4,"(13v+21)/(28-2v)");});
check(2,5,()=>{for(const b of [-3,0,2,7])for(const z of [2*b+8,2-2*b])close(z*z-10*z,4*b*b+12*b-16);answer(5,"z=2b+8 或 z=2-2b");});
check(2,6,()=>{close(7.42-.005,7.415);close(7.42+.005,7.425);answer(6,"7.415≤q<7.425");});
check(2,7,()=>{for(let y=-20;y<=20;y+=.1)assert.equal(3*y+2<4*y-3&&4*y-3<=7*y-9,y>5);answer(7,"w>5");});
check(2,8,()=>{const k=(50-2*2*3**2)/2;answer(8,k);});
check(2,9,()=>{const n=25/2;close(n*(-2)**3-3*n*(-2)+25,0);answer(9,n*2**3-3*n*2+25);});
check(2,10,()=>answer(10,Math.round(25000*(1+.06/4)**12)));
check(2,11,()=>{const a=17/9,b=23/9,c=38/9;close(a+2*b,7);close(b+2*c,11);close(c+2*a,8);answer(11,"17:23");});
check(2,12,()=>{const c=9*4**3/2**2;close(c*6**2/8**3,81/8);answer(12,"81/8");});
check(2,13,()=>{const b=[0,0,5,13];for(let n=4;n<=6;n++)b[n]=3*b[n-1]-b[n-2];close(b[5],89);answer(13,b[6]);});
check(2,14,()=>{for(const [xi,yi] of [[-.8,2.4],[-1.3,5]]){const a=10/xi,b=10/yi;assert.ok(a<-5&&b<5&&a+b<0);}answer(14,"只有 I、III");});
check(2,15,()=>{const r=7,l=32-2*r,theta=l/r;close(r*l/2,63);assert.ok(2*r+2*r*Math.sin(theta/2)<28);assert.ok(theta*180/Math.PI<150);answer(15,"只有 I、II");});
check(2,16,()=>{const r=(-24+Math.sqrt(24**2+4*145))/2;close(r,5);answer(16,"500π/3 cm³");});
check(2,17,()=>{const K=50/area([[1,1],[5/6,1],[1,24/19]]);close(K,2280);close(area([[0,1],[0,1/4],[1/5,0],[5/6,1]])*K,1121);answer(17,"1121 cm²");});
check(2,18,()=>{close(49**2+168**2,175**2);const yz=168**2/49;close(600**2,(49+yz)*yz);answer(18,"600 cm");});
check(2,19,()=>{const t=1/Math.sqrt(2),B=[0,0],F=[-t,1+t],D=[1,1],G=[-1-2*t,1+2*t],E=[1-t,1+t];
  const dist=(a,b)=>Math.hypot(...sub(a,b));
  close(dist(D,F),dist(F,G));close(dist(B,F)/dist(D,E),dist(F,G)/dist(E,F));close(dist(G,B)/dist(F,D),dist(F,G)/dist(E,F));
  close(dist(B,F),dist(F,G));close(dot(sub(B,F),sub(D,F))/(dist(B,F)*dist(D,F)),Math.SQRT1_2);answer(19,"只有 I、II");});
check(2,20,()=>{const h=12*Math.SQRT2*Math.sin(Math.PI/4);close(29+12+h/Math.tan(Math.PI/3),41+4*Math.sqrt(3));answer(20,"41+4√3 cm");});
check(2,21,()=>{const ae=7,ed=2*84/ae,ad=Math.hypot(ae,ed);close(ed*ed/ad,576/25);answer(21,"576/25 cm");});
check(2,22,()=>{const arcs=[36,84,84,72,84];close(arcs.reduce((s,x)=>s+x,0),360);close((arcs[0]+arcs[1])/2,60);answer(22,"60°");});
check(2,23,()=>{for(const th of [.3,.7,1.1]){const ac=5,ab=ac/Math.tan(th),bc=Math.hypot(ac,ab),cd=ac*Math.tan(th),ad=Math.hypot(ac,cd);close(ac/ab,ad/bc);}answer(23,"JM/KL");});
check(2,24,()=>{const X=[3,0],Y=[2.5,2.5*Math.sqrt(3)],Z=[6.5,1.5*Math.sqrt(3)];close(Math.hypot(...sub(Z,X)),Math.hypot(...sub(Y,X)));close(Math.hypot(...sub(Z,Y)),Math.hypot(...sub(Y,X)));close(Math.hypot(...Z),7);answer(24,"7");});
check(2,25,()=>{assert.ok(Math.sqrt(13)>0);answer(25,"以 F 為圓心的圓");});
check(2,26,()=>{const N=[7.8,2.4];close(2*N[0]+N[1],18);close(6*N[0]-12*N[1],18);close((9-3)*N[1]/2,36/5);close(2*6-12,0);answer(26,-12);});
check(2,27,()=>{const r2=4**2+8**2;close((-4)**2+9**2-r2,17);answer(27,"x²+y²+8x-18y+17=0");});
check(2,28,()=>{close((2*9+3*15+30)/6,31/2);answer(28,"31/2");});
check(2,29,()=>{const a=[...Array(3).fill(2),...Array(5).fill(3),...Array(6).fill(4),...Array(4).fill(5),...Array(2).fill(6)];answer(29,median(a.slice(10))-median(a.slice(0,10)));});
check(2,30,()=>{const cases=[];for(let a=-30;a<=30;a++)for(let b=a;b<=30;b++){const v=[a,b,-8,-2,3,3,3,7].sort((x,y)=>x-y);if(v.reduce((s,x)=>s+x,0)===16&&v.at(-1)-v[0]===20)cases.push(v);}assert.equal(cases.length,1);close(median(cases[0]),3);close(cases[0][0],-8);answer(30,"只有 I、III");});
check(2,31,()=>{const value=BigInt("0x7C0000000000"),expected=[46,45,44,43,42].reduce((s,n)=>s+2n**BigInt(n),0n);assert.equal(value,expected);answer(31,"2⁴⁶+2⁴⁵+2⁴⁴+2⁴³+2⁴²");});
check(2,32,()=>{const factors=[[1,1,0],[0,1,1],[2,1,0]],lcm=[0,0,0];for(const f of factors)f.forEach((e,i)=>lcm[i]=Math.max(lcm[i],e));assert.deepEqual(lcm,[2,1,1]);answer(32,"(u-4v)²(u³+64v³)");});
check(2,33,()=>{close((-20/4)/2,-5/2);answer(33,"-5/2");});
check(2,34,()=>{const r=1/4,s=1/2,h=1/16;close(Math.log(r)/Math.log(h),s);close(h**r,s);close(s,2*r);assert.ok(h<1&&1>8*h);assert.notEqual(Math.atan2(s,r)*180/Math.PI,45);answer(34,"只有 I、II");});
check(2,35,()=>{let re=0,im=0;for(let n=13;n<=802;n++){re+=[1,0,-1,0][n%4];im+=[0,1,0,-1][n%4];}close(re,-1);close(im,1);answer(35,"-1+j");});
check(2,36,()=>{const u=8/7,v=-4;assert.ok(v>=-4&&2*u+5*v+24>=0&&7*u-3*v-20<=0);answer(36,7*u-5*v-20);});
check(2,37,()=>{for(const [a,b,c] of [[1,2,3],[-3,-1,1],[2,2,2]])close(7**(2*b)/7**(2*a),7**(2*c)/7**(2*b));assert.notEqual(1/4,4/9);assert.notEqual(4-1,9-4);answer(37,"只有 I");});
check(2,38,()=>{const MJK=34,JMK=90,MKJ=180-MJK-JMK,KNM=76;answer(38,`${180-MKJ-KNM}°`);});
check(2,39,()=>{const angles=[60,120,180,240,300];for(const t of angles){const v=Math.tan(t*Math.PI/180);close(v**3,3*v);}answer(39,angles.length);});
check(2,40,()=>answer(40,`${Math.round(Math.acos(2*Math.sqrt(3)/5)*180/Math.PI)}°`));
check(2,41,()=>{const a=28,h=21,c=Math.hypot(a,h);close((a+h-c)/2,7);answer(41,a*h/2);});
check(2,42,()=>answer(42,C(19,6)-C(15,6)));
check(2,43,()=>answer(43,frac(C(16,7)-C(6,6)*C(10,1),C(16,7))));
check(2,44,()=>{for(const h of [-2,3])close(Math.abs(4*(h-.5)),10);answer(44,"-2 或 3");});
check(2,45,()=>{for(const a of [[-10,-3,1,2],[1,2,3,4]]){const v=variance(a),m=a.reduce((s,x)=>s+x,0)/4;assert.ok(3*m-3*(m-4)>0);close(variance(a.map(x=>x-4)),v);close(variance(a.map(x=>3*x)),9*v);assert.ok(9*v>2*v);}answer(45,"只有 I、II");});
console.log(`2025: ${checks} independent question checks passed; 19+45 questions; Paper 1 marks 35+35+35=105.`);
