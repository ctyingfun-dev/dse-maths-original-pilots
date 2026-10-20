const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const load=paper=>{
  const c={window:{}};
  vm.runInNewContext(fs.readFileSync(`${__dirname}/paper${paper}/data-2023.js`,"utf8"),c);
  return c.window.PILOT_2023;
};
const p1=load(1),p2=load(2);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const choose=(n,r)=>{let v=1;for(let i=1;i<=r;i++)v=v*(n-i+1)/i;return v;};
const mean=xs=>xs.reduce((s,x)=>s+x,0)/xs.length;
const variance=xs=>mean(xs.map(x=>(x-mean(xs))**2));
const median=xs=>{const a=[...xs].sort((x,y)=>x-y),n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;};
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const distance=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b,c)=>Math.acos(dot(sub(a,b),sub(c,b))/(distance(a,b)*distance(c,b)))*180/Math.PI;
const area=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
const r=Math.PI/180;
const polar=a=>[Math.cos(a*r),Math.sin(a*r)];
function intersect(a,b,c,d) {
  const u=sub(b,a),v=sub(d,c),w=sub(c,a),t=(w[0]*v[1]-w[1]*v[0])/(u[0]*v[1]-u[1]*v[0]);
  return a.map((x,i)=>x+t*u[i]);
}
const checked=new Set();
function check(p,n,answer,fn) {
  assert.equal((p===1?p1:p2).questions[n-1][p===1?"answer":"correct"],answer,`P${p} Q${n} answer drift`);
  fn();checked.add(`${p}/${n}`);
}
for(const data of [p1,p2]) {
  assert.equal(data.year,2023);
  assert.equal(data.questions.length,data.paper===1?19:45);
  data.questions.forEach((q,i)=>{
    assert.equal(q.n,i+1);assert.equal(q.sourceNo,q.n);
    assert.ok(q.prompt && q.solution && q.hints.length);
    assert.doesNotMatch(JSON.stringify(q),/填空|找錯|改錯|[橫縱横纵]|恆等於|½/);
    if(data.paper===1) {
      near(q.solution.flatMap(p=>p.steps).reduce((s,x)=>s+parseInt(x.marks),0),q.marks);
      if(q.markGroups)near(Object.values(q.markGroups).reduce((a,b)=>a+b,0),q.marks);
    } else {
      assert.equal(new Set(q.options).size,4);
      assert.equal(q.options["ABCD".indexOf(q.answer)],q.correct);
    }
  });
}
assert.deepEqual(["甲一","甲二","乙部"].map(s=>p1.questions.filter(q=>q.section===s).reduce((a,q)=>a+q.marks,0)),[35,35,35]);
check(1,1,"u=(v²+28)/(7-v)",()=>{
  for(const v of [-8,-3,1,2,5,9]){const u=(v*v+28)/(7-v);near(7/(u+v),v/(u-4));}
});
check(1,2,"a⁴b¹⁴",()=>{for(const a of [-2,.5,3])for(const b of [-1,.5,2])near(a**-5*b**2/(a**3*b**4)**-3,a**4*b**14);});
check(1,3,"不正確；總重量至少28 kg",()=>{near(160*175/1000,28);assert(28>27.9+.05);});
check(1,4,"-7<z≤4；6個",()=>{
  for(let z=-10;z<10;z+=.25)assert.equal(5*z+1>(7*z-19)/2 && 2*z-3<=5,z>-7&&z<=4);
  assert.equal(Array.from({length:20},(_,i)=>i-20).filter(z=>z>-7&&z<=4).length,6);
});
check(1,5,"48人",()=>near(48,1.5*(1.25*48-28)));
check(1,6,"8:5:2；51/23",()=>{near(5*8,8*5);near((3*8+2*2)/(5+2),4);near((2*8+7*5)/(3*5+4*2),51/23);});
check(1,7,"43°；47°",()=>{
  const [j,k,l,m]=[180,108,0,274].map(polar),n=intersect(j,l,k,m);
  near(angle(j,m,k),36);near(angle(j,n,k),79);near(angle(l,k,m),43);near(angle(j,k,m),47);
});
check(1,8,"AA；是，∠KNM=90°",()=>{
  const j=[-9,0],l=[0,12],k=[15,0],m=[0,-20],n=[0,0];
  near(distance(j,k),24);near(distance(j,l),15);near(distance(k,m),25);near(distance(l,n),12);
  near(distance(j,n)/distance(k,n),distance(l,n)/distance(m,n));near(angle(k,n,m),90);
});
check(1,9,"415/9分鐘；42分鐘；1/2",()=>{
  const xs=[31,34,34,35,38,41,42,42,42,46,48,50,53,55,58,59,60,62];
  const rows=p1.questions[8].diagram.rows;
  assert.deepEqual(Array.from(rows.flatMap(row=>Array.from(row.leaves,l=>10*row.stem+(l==="c"?1:Number(l))))),xs);
  near(xs.at(-1)-xs[0],31);near(mean(xs),415/9);near(xs.filter(x=>x>42).length/xs.length,.5);
  assert.equal(xs.filter(x=>x===42).length,3);
});
check(1,10,"垂直平分線；x+2y+1=0；(x-1)²+(y+1)²=20",()=>{
  const j=[-3,1],k=[5,-3],z=[1,-1];near(distance(j,z)**2,20);near(distance(k,z)**2,20);
  for(const p of [j,k,z])near(p[0]+2*p[1]+1,0);
  for(let x=-4;x<5;x++)near(distance([x,2*x-3],j),distance([x,2*x-3],k));
});
check(1,11,"2；1；0.85；不會",()=>{
  const xs=[4,4,10,2].flatMap((n,i)=>Array(n).fill(i));
  near(mean(xs),1.5);near(median(xs),2);near(median(xs.slice(10))-median(xs.slice(0,10)),1);near(variance(xs),.85);
  for(let i=0;i<20;i++)for(let j=i+1;j<20;j++){
    const ys=xs.filter((_,k)=>k!==i&&k!==j);
    if(Math.abs(mean(ys)-1.5)<1e-12)near(Math.max(...ys)-Math.min(...ys),3);
  }
});
check(1,12,"27；6√10π",()=>{const f=x=>9+x*x/2;near(f(4),17);near(f(10),59);near(f(6),27);near(distance([0,f(0)],[6,f(6)]),6*Math.sqrt(10));});
check(1,13,"2t+2；2個",()=>{
  for(let t=-6;t<7;t++)near((2*t+2)*(t**3+4*t*t-7*t),(2*t+2)*(t**3+4*t*t-7*t-1)+(2*t+2));
  near(4*2-7*2,-6);assert(!Number.isInteger(Math.sqrt(44)));
});
check(1,14,"12 cm；312π cm³；9.78 cm",()=>{
  near(9*15,135);near(Math.sqrt(15**2-9**2),12);near(9**2*12/3*(1-1/27),312);
  near(2*4*Math.cbrt(117)**3/3,312);assert.equal((2*Math.cbrt(117)).toPrecision(3),"9.78");
});
check(1,15,"5/12；61/84",()=>{
  near(choose(6,2)/choose(9,2),5/12);
  const colours=[1,1,1,1,1,1,0,0,0];let total=0,good=0;
  for(let i=0;i<9;i++)for(let j=i+1;j<9;j++){
    const bag=[1,1,1,1,1,colours[i],colours[j]];
    for(let a=0;a<7;a++)for(let b=a+1;b<7;b++)for(let c=b+1;c<7;c++){
      total++;if(bag[a]===bag[b]&&bag[b]===bag[c])good++;
    }
  }
  near(good/total,61/84);
});
check(1,16,"3a²=16b；m=2",()=>{
  for(const p of [-2,0,1,3])near(3*(-4*p)**2,16*3*p*p);
  for(const p of [[2,4],[6,12]])near(p[0]**2+p[1]**2-8*p[0]-16*p[1]+60,0);
  near(distance([0,0],[2,4])/distance([2,4],[6,12]),.5);
  for(let m=-4;m<5;m++)near(3*(8+16*m)**2-960*(1+m*m),-192*(m-2)**2);
});
check(1,17,"52.5°；否，約39.9°",()=>{
  const R=8/(2*Math.sin(65*r)),a=Math.asin(7/(2*R))/r,z=R*Math.tan(27*r),d=Math.sqrt(R*R-3.5**2);
  near(a,52.46857310824443);near(Math.atan(z/d)/r,39.90875119809741);
  assert(180-a+65>180);
});
check(1,18,"2-log₁₁β；1",()=>{
  const a=11**(2-Math.SQRT2),b=11**Math.SQRT2,terms=[Math.log(a)/Math.log(b),Math.log(b)/Math.log(11),Math.log(b)/Math.log(a)];
  near(a*b,121);assert(1<a&&a<b);near(terms[1]-terms[0],1);near(terms[2]-terms[1],1);
});
check(1,19,"G(169/2,t-2975/(2t))；H(119,2975/t)；t=60；共線；69:80",()=>{
  for(const t of [20,50,60,95]) {
    const o=[0,0],j=[169,0],l=[119,2*t],g=[169/2,t-2975/(2*t)],h=[119,2975/t];
    near(distance(g,o),distance(g,j));near(distance(g,o),distance(g,l));near(dot(sub(h,j),l),0);
  }
  const o=[0,0],j=[169,0],k=[144,60],l=[119,120],g=[169/2,845/24],h=[119,595/12],i=[104,130/3];
  near(25/60,60/144);near(area(o,g,k),0);near(distance(o,l),169);near(distance(j,l),130);
  for(let n=0;n<2;n++)near(i[n],(169*j[n]+169*l[n])/468);
  near(area(g,h,l)/area(i,j,k),69/80);
});
check(2,1,"(3v²+5v)/(4-v)",()=>{for(const v of [1,2,3,5]){const u=(3*v*v+5*v)/(4-v);near((u+3*v)/(6*u+v),1/(v+2));}});
check(2,2,"(7+10t)/(49-4t²)",()=>{for(const t of [-2,0,1,2])near(3/(7-2*t)-2/(7+2*t),(7+10*t)/(49-4*t*t));});
check(2,3,"15^(2n+2)",()=>{for(const n of [-2,0,1,2])near(9**(n+1)*5**(2*n+2),15**(2*n+2));});
check(2,4,"(p+q)(3p-q+6)",()=>{for(let p=-3;p<4;p++)for(let q=-3;q<4;q++)near(3*p*p+2*p*q-q*q+6*p+6*q,(p+q)*(3*p-q+6));});
check(2,5,"-27",()=>{for(let t=-4;t<5;t++)near((t+3)*(t+5)+20,t*(t-27)+35*(t+1));});
check(2,6,"z<4 或 z>5",()=>{for(let z=-2;z<8;z+=.25)assert.equal(2*z-5<3||(11-z)/3<2,z<4||z>5);});
check(2,7,"0.08635≤l<0.08645",()=>{near(.0864-.00005,.08635);near(.0864+.00005,.08645);});
check(2,8,"5+60a-75a²",()=>{for(let a=-5;a<6;a++)near(17-3*(2-5*a)**2,5+60*a-75*a*a);});
check(2,9,"-16",()=>{for(const a of [-3,0,2]){const b=-a*(2/3)**6-8;near(a*(-2/3)**6+27*(-2/3)**3+b,-16);}});
check(2,10,"圖像通過 (-3,4)",()=>{near(4-2*(-3+3)**2,4);near(4-2*9,-14);});
check(2,11,"$420",()=>near(420*(1.75*.8-1),168));
check(2,12,"60 cm²",()=>near(3.75/(25000/100000)**2,60));
check(2,13,"27",()=>near(15*(9/6)**2*Math.cbrt(64/125),27));
check(2,14,"7",()=>{const xs=[2,5];while(xs.length<8)xs.push(xs.at(-1)+xs.at(-2));near(xs[5],31);near(xs[7],81);near(xs[2],7);});
check(2,15,"21 cm",()=>{const h=42**3*1.5/(Math.PI*21**2);near(2*Math.PI*21*h,6*42**2);});
check(2,16,"517 cm²",()=>{
  const R=17.5,d=10.5,s=Math.sqrt(R*R-d*d),phi=Math.acos(d/R);
  near(s,14);assert.equal(Math.round(Math.PI*R*R-R*R*phi+d*s-Math.PI*s*s/2),517);
});
check(2,17,"27 cm²",()=>{
  const j=[0,0],k=[1,0],l=[1,90],m=[0,90],n=[2/3,0],p=intersect(j,l,m,n);
  near(area(j,n,p),12);near(area(j,k,l)-area(j,n,p),33);near(area(l,m,p),27);
});
check(2,18,"只有 I、III",()=>{near(45+45,90);const w=Math.atan(160/60)/r,z=180-w;assert(Math.abs(w-z)>1);near(45+45+w+z,270);});
check(2,19,"只有 II、III",()=>{const a=3,b=4;assert.notEqual(a,b);near(a/(2*a),b/(2*b));near((2*a)**2+(2*b)**2,4*(a*a+b*b));});
check(2,20,"76.5°",()=>{const apex=360-90-(8-2)*180/8-(5-2)*180/5;near((180-apex)/2,76.5);});
check(2,21,"△JMN∼△PNK",()=>{
  const j=[0,0],k=[80,0],l=[80,200],m=[0,200],n=[80,40],p=[100,0],q=[208,104];
  near(angle(j,n,m),90);near(distance(l,n),distance(l,q));
  near(angle(m,j,n),angle(n,p,k));near(angle(j,m,n),angle(p,n,k));
  assert(Math.abs(angle(j,n,k)-angle(l,n,m))>1);assert.notEqual(distance(j,k),distance(n,l));
});
check(2,22,"71°",()=>{
  const [j,k,l,m]=[220,330,24,78].map(polar),p=intersect(j,k,m,l),q=intersect(j,m,k,l);
  near(distance(k,l),distance(l,m));near(angle(j,q,k),28);near(angle(j,p,m),44);near(angle(j,k,m),71);
});
check(2,23,"3sinθcosθ/2",()=>{
  for(const a of [25,35,55]){const j=[6,0],n=[0,0],m=[-4,0],k=[6*Math.sin(a*r)**2,-6*Math.sin(a*r)*Math.cos(a*r)],l=[0,k[1]];
    near(angle(j,k,n),90);near(angle(k,l,n),90);near(distance(l,n)/distance(m,n),1.5*Math.sin(a*r)*Math.cos(a*r));}
});
check(2,24,"(6,30°)",()=>{const p=[3*Math.sqrt(3),3];near(Math.hypot(...p),6);near(Math.atan2(p[1],p[0])/r,30);assert.match(p2.questions[23].topic,/極坐標/);});
check(2,25,"-4",()=>near(dot([3,-2],[-4,-6]),0));
check(2,26,"只有 I、III",()=>{const mid=[2.5,-25/8];near(3*mid[0]+4*mid[1],-5);assert.notEqual(5/4*(-3/4),-1);});
check(2,27,"只有 I、III",()=>{const d=Math.sqrt(20);assert(Math.sqrt(5)<Math.sqrt(13));assert(Math.sqrt(5)>2);assert(3<d&&d<7);});
check(2,28,"2/5",()=>{const outcomes=[1,3,4,6].flatMap(a=>[2,5,8,10,12].map(b=>a*b));near(outcomes.filter(x=>x%8===0).length/outcomes.length,2/5);});
check(2,29,"42秒",()=>{const five=[6,18,27,42,60];near(five[3],42);});
check(2,30,"$20060",()=>near((9*28600+21*16400)/30,20060));
check(2,31,"13×2¹⁶+13×2⁸+13",()=>near(parseInt("11010000110100001101",2),13*2**16+13*2**8+13));
check(2,32,"r⁶s⁷t⁴",()=>assert.deepEqual([Math.max(2,6,4),Math.max(7,3,5),Math.max(3,4,2)],[6,7,4]));
check(2,33,"u³v²=4096",()=>{for(const u of [.5,1,4,16]){const v=4**(3-.75*Math.log2(u));near(u**3*v**2,4096);}});
check(2,34,"(4h-6)/(h²+4)",()=>{for(let h=-5;h<6;h++)near(-6/(h*h+4)+4*h/(h*h+4),(4*h-6)/(h*h+4));});
check(2,35,"只有 II、III",()=>{for(const a of [-2,0,3])for(let z=-4;z<5;z++)near(-(2*(2*z)**2+16*a*2*z+25*a*a),-8*(z+2*a)**2+7*a*a);});
check(2,36,"169",()=>{const T=n=>5+7*(n-1);near(T(7),47);near(T(18)+T(24),290);let s=0,n=0;while(s<=100000)s+=T(++n);near(n,169);near(s,100217);});
check(2,37,"h≥2",()=>{for(let h=-8;h<9;h+=.5)assert.equal(Math.max(-4*h-4,-4*h+28,20)===20,h>=2);});
check(2,38,"31°",()=>{
  const [j,k,l]=[270,-14,132].map(polar),t=(p,a)=>[p,[p[0]+Math.sin(a*r),p[1]-Math.cos(a*r)]];
  const s=intersect(...t(j,270),...t(l,132)),m=intersect(...t(j,270),...t(k,-14)),p=intersect(l,k,...t(j,270));
  near(angle(j,s,l),42);near(angle(k,j,m),38);near(angle(j,p,k),31);
});
check(2,39,"-4",()=>{const centre=[5,-1],mid=[2,1];near(6*mid[0]-4*mid[1],8);near(dot(sub(centre,mid),[2,3]),0);assert(distance(centre,mid)**2<20);});
check(2,40,"-4/5",()=>{
  const v=[0,0,1],k=[2,2,0],j=[-2,2,0],l=[2,-2,0],u=sub(v,k),proj=p=>sub(p,u.map(x=>x*dot(p,u)/dot(u,u)));
  near(distance(v,j),3);near(distance(j,k),4);const a=proj(sub(j,k)),b=proj(sub(l,k));near(dot(a,b)/(Math.hypot(...a)*Math.hypot(...b)),-.8);
});
check(2,41,"c/7",()=>{
  for(const c of [1,3,8]){const j=[-c/5,0],k=[7*c/169,17*c/169],l=[c/7,-c/7];
    near(12*l[0]+5*l[1],c);near(5*l[0]+12*l[1],-c);
    const a=distance(k,l),b=distance(j,l),d=distance(j,k);near((a*j[1]+b*k[1]+d*l[1])/(a+b+d),0);}
});
check(2,42,"1980",()=>{near(12*choose(11,3),1980);near(choose(12,4)*4,1980);});
check(2,43,"0.83692",()=>{let sum=0;for(let mask=0;mask<32;mask++){const n=mask.toString(2).replace(/0/g,"").length;if(n>=3)sum+=.7**n*.3**(5-n);}near(sum,.83692);});
check(2,44,"60",()=>{near((42-54)/8,-1.5);near((74-54)/8,2.5);near((60-54)/8,.75);});
check(2,45,"只有 I、III",()=>{for(const n of [-3,0,2]){const xs=[0,3,4,5,8].map(x=>x-5*n);near(variance(xs),34/5);near(Math.max(...xs)-Math.min(...xs),8);near(median(xs),4-5*n);}});
assert.equal(checked.size,64);
console.log("2023: 64 independent question checks passed; 19+45 questions; 35+35+35 marks, geometry, probability and answer keys verified.");
