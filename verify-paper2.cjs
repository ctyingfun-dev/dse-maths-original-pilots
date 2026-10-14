const assert = require("node:assert/strict");

module.exports = function verifyPaper2(paper) {
  const q = n => paper.questions[n-1];
  const close = (a,b) => Math.abs(a-b)<1e-9;
  const rad = degrees => degrees*Math.PI/180;
  const choose = (n,r) => {
    let value=1;
    for(let i=1;i<=r;i++) value=value*(n-i+1)/i;
    return value;
  };
  const expected = [
    "5k/[(k + 1)(3k - 2)]","2^(8-n)","10a² - 12ab + 10b²",
    "470.1（準確至四位有效數字）","-17","-s、-t","-3","28","x > -5",
    "5：3","44424","60%","324","I、II及III","I及II","12","1248","260",
    "½pq sinθ","15","259","p+r=q","I、II及III","7","31°","一對直線",
    "25π/2","1/5","只有 II、III","只有 II","9×2¹²+21","x³y⁴z",
    "I、II及III","2","I及II","1000","17","74°","20°","3/√11",
    "6","91/132","2016","40","4"
  ];
  assert.equal(expected.length,45);
  expected.forEach((answer,i)=>assert.equal(q(i+1).correct,answer,`卷二第${i+1}題答案`));
  const valid = [
    [-3,0,1,2,5].every(k=>close(1/(k+1)+2/(3*k-2),5*k/((k+1)*(3*k-2)))),
    [-3,0,2,5].every(n=>close(16**(n+1)/(4**(n-2)*2**(3*n)),2**(8-n))),
    [-2,0,3].every(a=>[-3,1,4].every(b=>(3*a-b)**2+(a-3*b)**2===10*a*a-12*a*b+10*b*b)),
    (() => {
      const value=470.056789;
      const correct=q(4).options.filter(option=>{
        const [number,label]=option.split("（");
        const rounded=label.includes("有效數字")?Number(value.toPrecision(4)):Number(value.toFixed(4));
        return Number(number)===rounded;
      });
      return correct.length===1 && correct[0]===q(4).correct;
    })(),
    [-3,-1,0,2,5].every(x=>(x-3)*(x+10)-2*(x-17)===x*(x+5)+4),
    [-2,0,3].every(s=>[-3,0,2].every(t=>[-s,-t].every(x=>(x+3*s)*(x+t)===2*s*x+2*s*t))),
    [-3].every(d=>close(((2+d)+d)*((2+d)-1)+8*(2+d),0)) &&
      [-4,-2,0,2].every(d=>((2+d)+d)*((2+d)-1)+8*(2+d)>0),
    [-3,0,1,4].every(h=>{
      const k=(4-27*h-18)/3;
      const g=x=>h*x**3+2*x*x+k*x-4;
      return close(g(3),0) && close(g(-3),28);
    }),
    [-10,-5.01,-5,-4.99,-2,0,10].every(x=>((x-1>(2*x-8)/3 || 3*x+6>=0)===(x>-5))),
    (14*5+22*3)/(5+3)===17,
    Math.round(50000/1.03**4)===44424,
    close((Math.sqrt(1.44)/.75-1)*100,60),
    (() => {
      const a=[0,6.5,9];
      for(let n=1;n<=6;n++) a[n+2]=3*a[n+1]-2*a[n];
      return a[5]===44 && a[8]===324;
    })(),
    [1,2,4].every(t=>[1,3].every(c=>{
      const a=c+2,b=a*t,d=c*t;
      return b>d && a>c && a*d===b*c;
    })) && !q(14).prompt.includes("x=3") && q(14).diagram==="lines",
    [-3,-1,2,5].every(p=>[-5,-2,1,4].filter(v=>p*v<0).every(v=>
      p*v<0 && (-3/p)*(-2/v)<0 && 3*2!==0)),
    6*12===2*(12+24),
    18*12*18/3*(1-(20/(2*(18+12)))**3)===1248,
    close((4+6/5)*(3/5)/2*(250*2/3),260),
    [20,40,70].every(theta=>{
      const p=10,side=p*Math.cos(rad(theta));
      return close(.5*side*p*Math.sin(rad(theta)),.5*(p*Math.sin(rad(theta)))*side);
    }),
    Math.hypot(6,8)*12/8===15,
    12+37+(35+37)*35/12===259,
    (() => {
      const p=Math.atan2(55,60),r=Math.atan2(55,70);
      const angle=Math.atan2(60*55+55*70,60*70-55*55);
      return close(p+r,angle);
    })(),
    (() => {
      const [p,qq,r,s,t,u]=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
      const v=[.5,Math.sqrt(3)/6],d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
      const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
      const vector=(a,b)=>[b[0]-a[0],b[1]-a[1]];
      const first=[d(p,qq),d(qq,v),d(v,p)],second=[d(qq,s),d(s,r),d(r,qq)];
      return close(cross(vector(qq,v),vector(r,t)),0) &&
        first.every((length,i)=>close(second[i]/length,Math.sqrt(3))) &&
        close(d(p,v),d(qq,v)) && close(d(v,u),d(v,r)) && close(d(p,u),d(qq,r));
    })(),
    (()=>{const translated=[4+3,-2],rotated=[-translated[1],translated[0]];return rotated[1]===7;})(),
    (180-2*(180-86-(180-102))-86)/2===31,
    [0,1,5].every(z=>{
      const distance=(x,y)=>close(Math.abs(2*x+3*y-6)/Math.sqrt(13),Math.abs(4*x-6*y-18)/Math.sqrt(52));
      return distance(z,-.5) && distance(15/4,z);
    }),
    close((2-2)**2+(0-25/4)**2,(8-2)**2+(8-25/4)**2),
    (() => {
      const cards=[1,1,3,5,7];
      let total=0,good=0;
      for(let i=0;i<5;i++) for(let j=i+1;j<5;j++) {total++;good+=cards[i]+cards[j]>8;}
      return good/total===1/5;
    })(),
    (() => {
      const median=a=>(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2;
      const summaries=a=>[a[0],median(a.slice(0,3)),median(a),median(a.slice(4)),a.at(-1)];
      const a=[0,1,2,3,4,5,6],b=[0,1,2.5,3,4,5,6];
      return JSON.stringify(summaries(a))===JSON.stringify(summaries(b)) &&
        a.reduce((s,v)=>s+v,0)!==b.reduce((s,v)=>s+v,0);
    })(),
    (() => {
      const cases=[];
      for(let x=-20;x<=30;x++) for(let y=x;y<=30;y++) {
        const values=[2,5,5,5,6,9,9,11,x,y].sort((a,b)=>a-b);
        if(values.reduce((s,v)=>s+v,0)!==70 || values.at(-1)-values[0]!==9) continue;
        const frequencies=new Map();
        values.forEach(v=>frequencies.set(v,(frequencies.get(v)||0)+1));
        const maximum=Math.max(...frequencies.values());
        const modes=[...frequencies].filter(([,f])=>f===maximum).map(([v])=>v);
        cases.push({x,y,variance:values.reduce((s,v)=>s+(v-7)**2,0)/10,median:(values[4]+values[5])/2,modes});
      }
      return cases.length===3 && cases.every(c=>c.variance>=7 && c.median>5 && c.modes.length===1) &&
        cases.some(c=>c.modes[0]!==5);
    })(),
    parseInt("1001000000010101",2)===9*2**12+21,
    [Math.min(2,1,3),Math.min(1,3,4),Math.min(3,2,1)].join(",")==="1,1,1" &&
      [Math.max(2,1,3),Math.max(1,3,4),Math.max(3,2,1)].join(",")==="3,4,3",
    [1,2,3,5].every(n=>{
      const term=(4**n-1)-(n===1?0:4**(n-1)-1);
      return term===3*4**(n-1) && term%3===0;
    }) && 4**2-4===12,
    [-2,-1,1,2].filter(b=>close((4*b-8)/(4+b*b),0)).join(",")==="2",
    (()=>{const f=x=>1-Math.log2(x+3);return f(1)<f(0) && f(-1)===0 && f(0)!==1;})(),
    10**3===1000 && close(Math.log10(1000)+2*(-1.5),0),
    (() => {
      const vertices=[[-13,8],[14,8],[3.2,.8]];
      const values=vertices.map(([x,y])=>3*x+5*y+16);
      return vertices.every(([x,y])=>y<=8+1e-9 && 2*x-3*y<=4+1e-9 && 4*x+9*y>=20-1e-9) &&
        Math.min(...values)===17;
    })(),
    180-2*(80-27)===74,
    (()=>{const tv=Math.sqrt(10**2+6**2-120*Math.cos(rad(125)));return Math.round(Math.asin(6*Math.sin(rad(125))/tv)*180/Math.PI)===20;})(),
    (() => {
      const b=[2,0,0],c=[0,2,0],e=[0,0,3];
      const be=b.map((v,i)=>v-e[i]),ce=c.map((v,i)=>v-e[i]);
      const normal=[be[1]*ce[2]-be[2]*ce[1],be[2]*ce[0]-be[0]*ce[2],be[0]*ce[1]-be[1]*ce[0]];
      const cosine=Math.abs(normal[2])/Math.hypot(...normal);
      return close(Math.sqrt(1-cosine*cosine),3/Math.sqrt(11)) &&
        !q(40).prompt.includes("M") && q(40).prompt.includes("AB:AC:AE=2:2:3");
    })(),
    (() => {
      const roots=[1/3,1/4].flatMap(t=>{
        const angle=Math.asin(Math.sqrt(t))*180/Math.PI;
        return [angle,180-angle,180+angle,360-angle];
      }).filter(theta=>theta>=90 && theta<=360);
      return roots.length===6 && roots.every(theta=>close(12*Math.sin(rad(theta))**4-7*Math.sin(rad(theta))**2+1,0));
    })(),
    (() => {
      let total=0,eligible=0;
      for(let a=0;a<8;a++) for(let b=a+1;b<9;b++) for(let c=b+1;c<10;c++)
        for(let d=c+1;d<11;d++) for(let e=d+1;e<12;e++) {
          total++;
          eligible+=[a,b,c,d,e].filter(i=>i<5).length<=2;
        }
      return total===choose(12,5) && eligible===546 && eligible/total===91/132 &&
        q(42).prompt.includes("至多2名") && !q(42).prompt.includes("甲");
    })(),
    (() => {
      let total=0;
      const visit=(sequence,remaining)=>{
        if(sequence.length===6) {total++;return;}
        for(const person of remaining) {
          if(person>=4 && sequence.at(-1)>=4) continue;
          visit([...sequence,person],remaining.filter(v=>v!==person));
        }
      };
      visit([],Array.from({length:7},(_,i)=>i));
      return total===2016;
    })(),
    q(44).table.rows[0].join(",")==="得分（分）,α,34,50,β" &&
      q(44).table.rows[1].join(",")==="標準分,-2,0,2,3" &&
      (3-(-2))*((50-34)/2)===40,
    (() => {
      const values=[0,0,0,0,15],variance=a=>{
        const mean=a.reduce((s,v)=>s+v,0)/a.length;
        return a.reduce((s,v)=>s+(v-mean)**2,0)/a.length;
      };
      return variance(values)===36 && close(variance(values.map(v=>(v-4)/3)),4);
    })()
  ];
  assert.equal(valid.length,45);
  return valid.map((value,i)=>[2,i+1,value]);
};
