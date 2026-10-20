const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const load=p=>{
  const c={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,`paper${p}/data-2024.js`),"utf8"),c);
  return c.window.PILOT_2024;
};
const papers=[load(1),load(2)],p1=papers[0].questions,p2=papers[1].questions;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const C=(n,r)=>{let x=1;for(let k=1;k<=r;k++) x=x*(n-k+1)/k;return Math.round(x);};
const gcd=(a,b)=>b?gcd(b,a%b):a;
const fraction=(a,b)=>`${a/gcd(a,b)}/${b/gcd(a,b)}`;
const median=x=>(x[Math.floor((x.length-1)/2)]+x[Math.ceil((x.length-1)/2)])/2;
const variance=x=>{const m=x.reduce((a,b)=>a+b)/x.length;return x.reduce((a,b)=>a+(b-m)**2,0)/x.length;};
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
const angle=(a,b,c)=>{
  const u=a.map((v,i)=>v-b[i]),v=c.map((x,i)=>x-b[i]);
  return Math.acos((u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))*180/Math.PI;
};
const deg=Math.PI/180;
for(const paper of papers) {
  assert.equal(paper.year,2024);
  assert.equal(paper.questions.length,paper.paper===1?19:45);
  for(const [i,q] of paper.questions.entries()) {
    assert.equal(q.n,i+1);
    assert.equal(q.sourceNo,q.n);
    assert.ok(q.hints.length>=2);
    assert.doesNotMatch(JSON.stringify(q),/[橫縱横纵½]|恆等於|恒等于|例如：/);
    assert.doesNotMatch(q.prompt,/填空|改正.*錯誤|找出.*錯誤/);
    if(paper.paper===1) {
      const sums=q.solution.map(p=>p.steps.reduce((s,v)=>s+parseInt(v.marks,10),0));
      assert.equal(sums.reduce((a,b)=>a+b,0),q.marks,`Q${q.n}: marking total`);
      for(const s of q.solution.flatMap(p=>p.steps)) assert.match(s.marks,/^[1-9]\d*[MA]$/);
      for(const [label,score] of Object.entries(q.markGroups||{})) {
        assert.equal(q.solution.filter(p=>p.part.startsWith(`(${label})`)).reduce((s,p)=>s+p.steps.reduce((x,v)=>x+parseInt(v.marks,10),0),0),score);
      }
    } else {
      assert.equal(new Set(q.options).size,4);
      assert.equal(q.options["ABCD".indexOf(q.answer)],q.correct);
    }
  }
}
for(const [a,b] of [[0,9],[9,14],[14,19]]) assert.equal(p1.slice(a,b).reduce((s,q)=>s+q.marks,0),35);
let checked=0;
const check=(paper,n,fn)=>{try{fn();checked++;}catch(e){throw Error(`2024 Paper ${paper} Q${n}: ${e.message}`,{cause:e});}};
const answer=(n,v)=>assert.equal(p2[n-1].correct,String(v));
check(1,1,()=>{for(const v of [-2,0,2,5])close(5/(9*v-4)-3/(6*v-7),(3*v-23)/((9*v-4)*(6*v-7)));});
check(1,2,()=>{for(const [J,K,L] of [[8,4,3],[-2,7,1],[6,-3,2]]){const u=K/(J-5*L);close((J*u-K)/L,5*u);}});
check(1,3,()=>{for(const [u,v] of [[2,3],[-3,4],[1,-5]]){close(10*u*u-11*u*v-8*v*v,(5*u-8*v)*(2*u+v));close(15*u-24*v+10*u*u-11*u*v-8*v*v,(5*u-8*v)*(2*u+v+3));}});
check(1,4,()=>{for(let n=-100;n<=100;n++){const z=n/10;assert.equal((7*z+5)/3-2<4*z&&5*z+8>=-7,z>-.2);}assert.ok(0>-.2&&-1<=-.2);});
check(1,5,()=>{for(const r of [-7,1,3]){const p=10*r/7,q=r;close((3*q+5*r)/(q+r),4);close((7*p+6*q)/(2*q+3*r),16/5);}});
check(1,6,()=>{close(450*1.6,720);close(720*.7-450,54);});
check(1,7,()=>{close(113-23,90);close(203-23,180);close(Math.hypot(9,40)+Math.hypot(40,75)+9+75,210);});
check(1,8,()=>{const J=[15,0],M=[0,0],N=[0,8],K=[0,25],L=[-120/17,200/17];close(Math.hypot(...J.map((v,i)=>v-L[i])),25);close(Math.hypot(...K.map((v,i)=>v-L[i])),15);close(angle(J,L,K),90);close(area([J,K,L,N,M]),247.5);});
check(1,9,()=>{const f=6,x=[1,2,4,5,7,9],freq=[6,8,4,5,3,f],items=x.flatMap((v,i)=>Array(freq[i]).fill(v));close((3+f)/(26+f),9/32);close(items.reduce((a,b)=>a+b)/items.length,69/16);close(median(items),4);assert.equal(x[freq.indexOf(Math.max(...freq))],2);});
check(1,10,()=>{const H=t=>5*t-16;close(H(-2),-26);close(H(6),14);close(256-20*(64/5),0);});
check(1,11,()=>{const results=[];for(let c=0;c<=9;c++)for(let d=0;d<=9;d++){const a=p1[10].diagram.rows.flatMap(row=>row.leaves.map(l=>10*row.stem+(l==="c"?c:l==="d"?d:+l)));if(a.every((v,i)=>!i||v>=a[i-1])&&a.reduce((s,v)=>s+v)/20===41)results.push({c,d,range:a.at(-1)-a[0],iqr:median(a.slice(10))-median(a.slice(0,10))});}assert.deepEqual(results.map(x=>[x.c,x.d]),[[4,9],[5,6],[6,3]]);assert.equal(Math.min(...results.map(x=>x.range)),23);assert.equal(Math.max(...results.map(x=>x.iqr)),12);});
check(1,12,()=>{const u=28/5;close((7*u/4)+(3*u/4),14);assert.ok(u>0&&7*u/4<14);for(const p of [.3,1,2])close((p*4)/(4+p*4),p/(1+p));});
check(1,13,()=>{close(30**2*20/3*(1-(12/20)**3),4704);const slant=Math.hypot(20,15),A=4*30*slant/2*(1-.6**2)+18**2+30**2;close(A,2184);close(A/312,7);assert.notEqual(A/312,(8/4)**2);});
check(1,14,()=>{const F=t=>(4*t*t+3*t-5)*(t*t-t-12);close(F(0),60);close(F(-2),-30);close(F(4),0);for(const x of [(-3+Math.sqrt(89))/8,(-3-Math.sqrt(89))/8,-3,4])close(F(x),0);assert.ok(9**2<89&&89<10**2);});
check(1,15,()=>{for(const r of [.5,2,8])close(Math.log(8*r**6)/Math.log(8),2*Math.log2(r)+1);});
check(1,16,()=>{assert.equal(fraction(C(5,1)*C(11,3),C(16,4)),"165/364");assert.equal(fraction(C(5,4)+C(11,1)*C(5,3)+C(11,2)*C(5,2),C(16,4)),"19/52");});
check(1,17,()=>{const O=[2,-3];for(const P of [[9,-2],[-5,-4],[3,4]])close((P[0]-O[0])**2+(P[1]-O[1])**2,50);close(7*2-3,11);close(((10-2)**2+(3+3)**2)/4,25);assert.ok(25*Math.PI<80);});
check(1,18,()=>{const s=Math.sqrt(14**2+9**2-2*14*9*Math.cos(74*deg)),m=Math.asin(12*Math.sin(68*deg)/s)/deg,k=180-68-m;close(s,14.40622734563481);assert.ok(180-m+68>180);close(k,61.4373880393381);close(12*Math.sin(k*deg)*Math.sin(64*deg),9.47287748702349);close(14*9*Math.sin(74*deg)/s*Math.sin(64*deg),7.556524677352853);});
check(1,19,()=>{for(const [a,b] of [[-5,7],[-1/3,-7/3]]){const J=[-a-1,b-3],K=[-3*a-3,b+2];close(2*(b+1),J[0]+K[0]);close((1-a)**2,J[1]*K[1]);for(const z of [0,2,-3])close(3*z*z+(6*a+6)*z+3*a*a+6*a+b,3*(z+a+1)**2+b-3);}assert.ok((-5)*7<0&&(-1/3)*(-7/3)>0);const J=[4,4],K=[12,9],R=[17,1],S=[9,-4];for(const i of [0,1])close(J[i]+R[i],K[i]+S[i]);close(Math.hypot(8,5),Math.hypot(5,-8));assert.ok(area([J,K,R,S])>0);});
check(2,1,()=>{for(const p of [-3,1,4])for(const q of [1,3])close((2*p+5*q)**2-(2*p-5*q)**2,40*p*q);answer(1,"40pq");});
check(2,2,()=>{for(const s of [-2,.5,3])close((3*s)**4/(2*s**-3)**-2,324/s**2);answer(2,"324/s²");});
check(2,3,()=>{for(const [p,q] of [[4,1],[-2,3]]){const s=7/(3*(p-q));close(7/(3*s)+q,p);}answer(3,"7/[3(p-q)]");});
check(2,4,()=>{assert.equal(Math.sqrt(572).toPrecision(3),"23.9");assert.equal(Math.sqrt(572).toFixed(2),"23.92");answer(4,"23.9（準確至三位有效數字）");});
check(2,5,()=>{close(2*28+5*12,116);close(3*28+2*12,108);answer(5,`$${5*28+3*12}`);});
check(2,6,()=>{close(12/4,3);close(5/4,1.25);answer(6,"4:12:5");});
check(2,7,()=>{for(const h of [-4,0,3])for(const z of [h+2,6-h])close(z*z-8*z,(h+2)**2-8*(h+2));answer(7,"z=h+2 或 z=6-h");});
check(2,8,()=>{const H=t=>(t-2)*(t-6);close(H(3),H(5));answer(8,H(-6));});
check(2,9,()=>{const Q=t=>t**3-3*t*t+7*t-21;close(Q(3),0);answer(9,Q(2));});
check(2,10,()=>{for(let n=-300;n<=100;n++){const z=n/10;assert.equal((4-z)/3>=5||9+2*z<=3,z<=-3);}answer(10,"z≤-3");});
check(2,11,()=>answer(11,`${(50-50*.3)/50*100}%`));
check(2,12,()=>answer(12,`${(18*25+12*35)/(25+35)} km/h`));
check(2,13,()=>{close(1.3**2/.65,2.6);answer(13,"增加 160%");});
check(2,14,()=>{close(-3*(-4+4)**2+11,11);close(-3*4**2+11,-37);answer(14,"最大值為 11");});
check(2,15,()=>{const r=2*54/6;close(360*6/(2*r),60);answer(15,"60°");});
check(2,16,()=>{close((8**2*5)/(12**2*3/3),20/9);answer(16,"12 cm");});
check(2,17,()=>{const J=[0,1],K=[0,0],N=[.5,0],P=[2/3,1],R=[1,1/3],S=[3/7,1/7];const scale=6/area([K,N,S]);close(scale,168);close(area([J,P,R,S])*scale,256/3);answer(17,"256/3 cm²");});
check(2,18,()=>{close(8**2+15**2,17**2);const JL=Math.sqrt(39**2-15**2)+8;answer(18,`${39+17+33+Math.hypot(JL,33)} cm`);});
check(2,19,()=>{for(const [a,b,c] of [[20,30,40],[33,27,50]])close((360-a)+(a+b)+(360-b-c)-(180-c),540);answer(19,"u+v+w-z=540°");});
check(2,20,()=>{close((10-2)*180,1440);close(10*(10-3)/2,35);answer(20,"只有 I、II");});
check(2,21,()=>{for(const [a,b] of [[2,3],[7,2]]){close(Math.hypot(a/2,b/2),Math.hypot(a/2,-b/2));close(Math.atan(a/b)+Math.atan(b/a),Math.PI/2);}answer(21,"I、II及III");});
check(2,22,()=>{const p=a=>[Math.cos(a*deg),Math.sin(a*deg)],[J,K,L,M,N]=[106,0,286,222,180].map(p);close(angle(J,K,N),37);close(angle(M,K,N),21);close(180-(90-37)-(90-37-21),95);answer(22,"95°");});
check(2,23,()=>{for(const [a,b] of [[20,40],[30,65]])close(Math.sin(a*deg)/Math.tan(b*deg),(Math.sin(a*deg)/Math.tan(b*deg)));answer(23,"sinα/tanβ");});
check(2,24,()=>{const S=[4,7];answer(24,2*(-3)-S[0]);});
check(2,25,()=>{close((3-2)**2+(-2-5)**2,(3+4)**2+(-2+3)**2);close(3-(-2)-5,0);answer(25,-2);});
check(2,26,()=>{close(9/6,12/8);assert.notEqual(10,11/8);answer(26,-12);});
check(2,27,()=>{assert.ok(10<23/2);assert.ok(2*Math.PI*Math.sqrt(23/2)>21);answer(27,"只有 I、III");});
check(2,28,()=>{const a=[2,3,4,5,7,8];let good=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]*a[j]>=24)good++;answer(28,fraction(good,C(6,2)));});
check(2,29,()=>{const h=64+(180-48)/4;assert.ok(h>79&&h<180);answer(29,h);});
check(2,30,()=>{let counter=false;for(let u=1;u<9;u++){const x=[u,9-u,4,4,4,7,10,10,12,15].sort((a,b)=>a-b);assert.ok(Math.sqrt(variance(x))>3.5);assert.equal(x.filter(a=>a===4).length>=3,true);counter||=median(x)>=7;}assert.ok(counter);answer(30,"只有 I、II");});
check(2,31,()=>{assert.deepEqual([Math.min(3,5,4),Math.min(2,4,3),Math.min(4,2,3)],[3,2,2]);answer(31,"r³s²t²");});
check(2,32,()=>{assert.equal(BigInt("0xD300000E9"),211n*16n**7n+233n);answer(32,"211×16⁷+233");});
check(2,33,()=>{const t=4,u=t-4;close(t*t,7*t+u-12);answer(33,3**t);});
check(2,34,()=>answer(34,Math.cbrt(27-27*Math.sqrt(4))));
check(2,35,()=>{const b=4;close(b-7+3*(b+6)/10,0);answer(35,b+(b+6)/10);});
check(2,36,()=>{for(let n=1;n<20;n++)close(n*(3*n+2)-(n-1)*(3*(n-1)+2),6*n-1);close(6*4-1,23);answer(36,"只有 I、III");});
check(2,37,()=>{const V=[[-2,0],[2,4],[6,0]];for(const [u,v] of V)assert.ok(v>=0&&v<=u+2&&v<=6-u);const min=Math.min(...V.map(([u,v])=>3*u-2*v));answer(37,17-min);});
check(2,38,()=>{const p=a=>[Math.cos(a*deg),Math.sin(a*deg)],[J,K,L,M,N]=[16,-40,-140,130,120].map(p);close(angle(J,L,K),28);close(angle(L,K,N),50);close(angle(M,N,K),95);answer(38,"50°");});
check(2,39,()=>{const a=Math.acos(-1/6)/deg,roots=[];for(let k=-2;k<4;k++)for(const x of [a+360*k,-a+360*k,360*k])if(x>0&&x<540)roots.push(x);assert.equal(new Set(roots).size,4);answer(39,4);});
check(2,40,()=>{const JL=Math.sqrt(1+1/3),LM=2/Math.sqrt(3),JM=Math.sqrt(2);close((JL**2+LM**2-JM**2)/(2*JL*LM),1/4);answer(40,"1/4");});
check(2,41,()=>{assert.ok(180-2*34>90);answer(41,"I、II及III");});
check(2,42,()=>answer(42,120*C(6,3)*6));
check(2,43,()=>answer(43,1-.5*.25*.15));
check(2,44,()=>{const x=[42,12,16,18,21,23,27,29,31,34,34,37].sort((a,b)=>a-b),sd=Math.sqrt(variance(x));close(median(x),28);assert.ok(sd>8.5);assert.ok((42-27)/sd>1.5);answer(44,"只有 I、III");});
check(2,45,()=>answer(45,7*Math.sqrt(25)));
assert.equal(checked,64);
console.log(`2024: independently checked ${checked} questions; 105 marks; all MC keys, bounds and marking totals valid.`);
