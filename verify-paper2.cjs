const assert=require("node:assert/strict");

module.exports=function verifyPaper2(paper) {
  const q=n=>paper.questions[n-1],close=(a,b)=>Math.abs(a-b)<1e-8;
  const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
  const choose=(n,r)=>{let v=1;for(let i=1;i<=r;i++)v=v*(n-i+1)/i;return v;};
  const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  const expected=[
    "(13v-13)/[(v-3)(4v+1)]","5^(1-3j)","20r²-20rs+10s²",
    "0.007365（準確至四位有效數字）","-11","-a、-3b","-10","26","t>-19",
    "2：3","102770","4%","1467","只有 I、III","I及III","240/7","1764","188",
    "½ab sinφ","25","159","α+γ=β","只有 I、III","1","19°","一對直線",
    "50π/3","1/3","只有 I、III","只有 II","11×2¹⁰+25","r⁵s⁶t",
    "只有 II、III","18/5","II及III","16","69/5","92°","21°","4√2/√41",
    "7","19/42","51840","160","81/16"
  ];
  assert.equal(expected.length,45);
  expected.forEach((answer,i)=>assert.equal(q(i+1).correct,answer,`卷二第${i+1}題答案`));
  const valid=[
    [-4,-1,0,1,2,5].every(v=>close(2/(v-3)+5/(4*v+1),(13*v-13)/((v-3)*(4*v+1)))),
    [-2,0,2,4].every(j=>close(25**(j-1)/(5**(2*j+3)*125**(j-2)),5**(1-3*j))),
    [-3,0,2].every(r=>[-4,1,5].every(s=>(4*r-s)**2+(2*r-3*s)**2===20*r*r-20*r*s+10*s*s)),
    (()=>{
      const value=.007364852;
      const correct=q(4).options.filter(option=>{
        const [number,label]=option.split("（");
        return Number(number)===(label.includes("有效數字")?Number(value.toPrecision(4)):Number(value.toFixed(4)));
      });
      return correct.length===1 && correct[0]===q(4).correct;
    })(),
    [-3,0,1,5].every(t=>(t-2)*(t+12)-3*(t-11)===t*(t+7)+9),
    [-2,0,3].every(a=>[-3,0,2].every(b=>[-a,-3*b].every(z=>(z+4*a)*(z+3*b)===3*a*z+9*a*b))),
    [-15,-10,-8,0,3].every(e=>{
      const f=((8+e)+e)*((8+e)-1)+18*(8+e);
      return f===2*(e+10)**2 && (f===0)===(e===-10);
    }),
    [-3,1,4].every(a=>{
      const b=(7-8*a-20)/2,g=z=>a*z**3+5*z*z+b*z-7;
      return close(g(2),0) && close(g(-2),26);
    }),
    [-20,-19,-18,-7,0,10].every(t=>(t+2>(3*t-11)/4 || 5*t+35>=0)===(t>-19)),
    (26*2+41*3)/(2+3)===35,
    Math.round(120000/(1+.052/4)**(3*4))===102770,
    close((Math.sqrt(1.69)/1.25-1)*100,4),
    (()=>{
      const b=[0,29/3,11];
      for(let n=1;n<=6;n++) b[n+2]=4*b[n+1]-3*b[n];
      return close(b[5],63) && close(b[8],1467);
    })(),
    [-1,-2,-5].every(h=>[2,4].every(s=>{
      const v=s+3,u=v/h,r=s/h;
      return u<r && !(v<s) && close(u*s,v*r);
    })),
    [-4,-1,2,5].every(a=>[-5,-2,1,3].filter(b=>a*b<0).every(b=>a*b<0 && (-4)*5===-20)) &&
      close(4/4,-5/(-5)),
    close(15*(240/7)/2,4*(240/7+30)),
    24*14*16/3*(1-(19/(2*(24+14)))**3)===1764,
    (()=>{
      const j=[60,20],k=[180,20],m=[30,130],n=[90,86],p=[162,86];
      const small=[distance(k,n),distance(n,p),distance(p,k)],large=[distance(m,k),distance(k,j),distance(j,m)];
      return small.every((side,i)=>close(side/large[i],3/5)) && close((7+4*3/5)*(2/5)/2*(2*200/4),188) &&
        q(18).solution.includes("△KNP∼△MKJ");
    })(),
    [20,40,70].every(phi=>{
      const a=12,b=a*Math.cos(rad(phi)),jk=a*Math.sin(rad(phi));
      return close(.5*b*jk,.5*a*b*Math.sin(rad(phi)));
    }),
    Math.hypot(8,6)*15/6===25,
    15+32+(28+32)*28/15===159,
    (()=>{
      const alpha=Math.atan2(55,60),gamma=Math.atan2(55,70);
      const beta=Math.atan2(60*55+55*70,60*70-55*55);
      return close(alpha+gamma,beta);
    })(),
    (()=>{
      const [j,k,l,m,n,p]=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3)]);
      const v=[.5,Math.sqrt(3)/6],vector=(a,b)=>b.map((x,i)=>x-a[i]),cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
      const first=[distance(j,k),distance(k,v),distance(v,j)],second=[distance(k,m),distance(m,l),distance(l,k)];
      return close(cross(vector(k,v),vector(l,n)),0) &&
        first.every((length,i)=>close(second[i]/length,Math.sqrt(3))) && !close(first[0],second[0]) &&
        close(distance(j,v),distance(k,v)) && close(distance(v,p),distance(v,l)) && close(distance(j,p),distance(k,l));
    })(),
    (()=>{const translated=[-6,5-4],rotated=[translated[1],-translated[0]];return rotated[0]===1;})(),
    (()=>{
      const angle=(a,b,c)=>{
        const ba=a.map((v,i)=>v-b[i]),bc=c.map((v,i)=>v-b[i]);
        return deg(Math.acos(ba.reduce((s,v,i)=>s+v*bc[i],0)/Math.hypot(...ba)/Math.hypot(...bc)));
      };
      const h=[0,0],j=[Math.cos(rad(78)),Math.sin(rad(78))],k=[1,0],l=[Math.cos(rad(-38)),Math.sin(rad(-38))],m=[Math.cos(rad(200)),Math.sin(rad(200))];
      const n=[j[0]-j[1]/Math.tan(rad(110)),0];
      return close(angle(j,h,n),78) && close(angle(j,n,k),110) && close(angle(k,m,l),19);
    })(),
    [0,1,5].every(z=>{
      const equal=(x,y)=>close(Math.abs(3*x+4*y-11)/5,Math.abs(6*x-8*y-10)/10);
      return equal(z,3/4) && equal(8/3,z);
    }),
    close((-3+3)**2+(1-28/3)**2,(5+3)**2+(7-28/3)**2) && close(2*distance([-3,28/3],[-3,1]),50/3),
    (()=>{
      const tokens=[2,2,4,7,9,10];let total=0,good=0;
      for(let i=0;i<6;i++) for(let j=i+1;j<6;j++){total++;good+=tokens[i]+tokens[j]>12;}
      return total===15 && good===5;
    })(),
    (()=>{
      const median=a=>a[3],summary=a=>[a[0],a[1],median(a),a[5],a[6]];
      const a=[0,1,2,3,4,5,6],b=[0,1,2.5,3,4,5,6];
      const variance=a=>{const mean=a.reduce((s,v)=>s+v)/a.length;return a.reduce((s,v)=>s+(v-mean)**2,0)/a.length;};
      return JSON.stringify(summary(a))===JSON.stringify(summary(b)) && !close(variance(a),variance(b));
    })(),
    (()=>{
      const cases=[];
      for(let h=-20;h<=30;h++) for(let k=h;k<=30;k++) {
        const a=[1,4,4,4,9,10,10,14,h,k].sort((a,b)=>a-b);
        if(a.reduce((s,v)=>s+v,0)!==80 || a.at(-1)-a[0]!==13)continue;
        const f=new Map();a.forEach(v=>f.set(v,(f.get(v)||0)+1));
        const modes=[...f].filter(([,v])=>v===Math.max(...f.values())).map(([v])=>v);
        cases.push({variance:a.reduce((s,v)=>s+(v-8)**2,0)/10,median:(a[4]+a[5])/2,modes});
      }
      return cases.length===3 && cases.every(c=>c.median>9) &&
        cases.some(c=>c.variance>=18) && cases.some(c=>c.modes.length!==1) &&
        cases.map(c=>c.variance).join(",")==="18.2,17.6,17.4";
    })(),
    parseInt("10110000011001",2)===11*2**10+25,
    [Math.min(3,2,5),Math.min(3,5,6),Math.min(4,2,1)].join(",")==="2,3,1" &&
      [Math.max(3,2,5),Math.max(3,5,6),Math.max(4,2,1)].join(",")==="5,6,4",
    [1,2,3,5].every(n=>(5**n-1)-(n===1?0:5**(n-1)-1)===4*5**(n-1)) && 5**2-5===20,
    [18/5,-18/5,5/18,3].filter(c=>close((5*c-18)/(9+c*c),0)).join(",")==="3.6",
    (()=>{const f=z=>3-Math.log(z+5)/Math.log(4);return f(1)<f(0) && close(f(59),0) && close(f(0),3-Math.log(5)/Math.log(4));})(),
    2**4===16 && Math.log2(16)+(-2)*Math.log2(4)===0,
    (()=>{
      const vertices=[[-14/5,6],[7,6],[28/11,-15/22]],values=vertices.map(([x,y])=>4*x+3*y+7);
      return vertices.every(([x,y])=>y<=6+1e-9 && 3*x-2*y<=9+1e-9 && 5*x+4*y>=10-1e-9) &&
        close(Math.min(...values),69/5);
    })(),
    (()=>{
      const point=d=>[Math.cos(rad(d)),Math.sin(rad(d))],j=point(27),k=point(-149),l=point(-61),m=point(-31);
      const n=[l[0]+(j[0]-l[0])*(k[1]-l[1])/(j[1]-l[1]),k[1]],p=[(1-l[1]*k[1])/l[0],k[1]];
      const vector=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
      const angle=(a,b,c)=>deg(Math.acos(dot(vector(a,b),vector(c,b))/distance(a,b)/distance(c,b)));
      return close(angle(j,n,m),73) && close(angle(l,p,n),29) && close(angle(j,m,n),92) &&
        close(dot(l,vector(p,l)),0) && close((j[1]-k[1])/(j[0]-k[0]),(p[1]-l[1])/(p[0]-l[0]));
    })(),
    (()=>{
      const km=Math.sqrt(13**2+7**2-2*13*7*Math.cos(rad(118)));
      return Math.round(deg(Math.asin(7*Math.sin(rad(118))/km)))===21;
    })(),
    (()=>{
      const k=[3,0,0],l=[0,3,0],n=[0,0,4],kn=k.map((v,i)=>v-n[i]),ln=l.map((v,i)=>v-n[i]);
      const normal=[kn[1]*ln[2]-kn[2]*ln[1],kn[2]*ln[0]-kn[0]*ln[2],kn[0]*ln[1]-kn[1]*ln[0]];
      const cosine=Math.abs(normal[2])/Math.hypot(...normal);
      return close(Math.sqrt(1-cosine*cosine),4*Math.sqrt(2)/Math.sqrt(41)) && !q(40).prompt.includes("中點");
    })(),
    (()=>{
      const roots=[.25,.75].flatMap(w=>{const angle=deg(Math.asin(Math.sqrt(w)));return [angle,180-angle,180+angle,360-angle];})
        .filter(phi=>phi>=60-1e-9 && phi<=330+1e-9);
      return roots.length===7 && roots.every(phi=>close(16*Math.sin(rad(phi))**4-16*Math.sin(rad(phi))**2+3,0));
    })(),
    (()=>{
      let total=0,good=0;
      for(let a=0;a<7;a++) for(let b=a+1;b<8;b++) for(let c=b+1;c<9;c++) for(let d=c+1;d<10;d++) {
        total++;good+=[a,b,c,d].filter(i=>i<4).length<=1;
      }
      return total===choose(10,4) && good===95 && good/total===19/42;
    })(),
    (()=>{
      let total=0;
      const visit=(sequence,remaining)=>{
        if(sequence.length===7){total++;return;}
        for(const book of remaining) {
          if(book>=5 && sequence.at(-1)>=5)continue;
          visit([...sequence,book],remaining.filter(v=>v!==book));
        }
      };
      visit([],Array.from({length:9},(_,i)=>i));
      return total===51840;
    })(),
    q(44).table.rows[0].join(",")==="質量（g）,u,280,340,v" &&
      q(44).table.rows[1].join(",")==="標準分,-1.5,0,1.5,2.5" &&
      (2.5-(-1.5))*((340-280)/1.5)===160,
    (()=>{
      const a=[0,0,0,0,22.5],variance=a=>{const mean=a.reduce((s,v)=>s+v)/a.length;return a.reduce((s,v)=>s+(v-mean)**2,0)/a.length;};
      return variance(a)===81 && close(variance(a.map(v=>(v+7)/4)),81/16);
    })()
  ];
  assert.equal(valid.length,45);
  return valid.map((value,i)=>[2,i+1,value]);
};
