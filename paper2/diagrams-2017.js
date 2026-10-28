(() => {
  const R=Math.PI/180,polar=(a,r=1)=>[r*Math.cos(a*R),r*Math.sin(a*R)];
  const geometry={
    quadratic2017:{p:2,q:-9},
    dots2017:{counts:[2,7,14,23]},
    triangle2017:{points:{J:[0,0],K:[18,24],L:[28,0],N:[18,0]}},
    parallelograms2017:{points:{J:[1.3,1],K:[1,0],L:[0,0],M:[.3,1],N:[2/3,0],P:[.3+1/3,1],Q:[.78,.6],R:[.52,.4]}},
    equilateral2017:{points:{J:[0,0],K:[20,0],L:[10,10*Math.sqrt(3)],M:[5,0],N:[20-15/8,15*Math.sqrt(3)/8]}},
    isosceles2017:{points:{J:[0,0],L:polar(76),M:[1,0],N:[1.4,0]}},
    spiral2017:{points:{J:[0,0],K:[0,2],L:[-3,2],M:[-3,-3],N:[4,-3],O:[4,5],P:[-5,5],Q:[-5,-12]},lengths:[2,3,5,7,8,9,17]},
    diameter2017:{points:{J:polar(180),K:polar(104),L:polar(52),M:polar(0),N:polar(300)}},
    rectangle2017:{points:{J:[0,0],K:[5,0],L:[5,3],M:[0,3],N:[5-3*Math.tan(35*R),3]}},
    lines2017:{m:-2,n:4,p:-.5,q:-1},
    bar2017:{values:[4,5,6,7,8],frequencies:[8,16,24,20,12]},
    box2017:{summary:[4,12,20,32,44]},
    transform2017:{source:[-9,3,12],choices:[[-3,1,4],[-3,1,12],[-27,9,4],[-27,9,12]]},
    rootline2017:{intercepts:[3,6]},
    diagonal2017:{points:{J:[0,0],K:[36,0],L:[36,27],M:[0,27],N:[24,18]}},
    pole2017:{points:{J:[0,0,10],K:[24,0,0],L:[0,7,0],M:[0,0,0]}},
    tangent2017:{points:{O:[0,0],J:polar(270),K:polar(142),L:polar(18),M:[-1.45,-1],N:[1.45,-1]}}
  };
  const ip=geometry.isosceles2017.points;ip.K=[(2*ip.L[0]**2-1)/(2*ip.L[0]),ip.L[1]];
  const stroke='fill="none" stroke="#17212b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dash=false)=>`<path d="${d}" ${stroke}${dash?' stroke-dasharray="5 4"':""}/>`;
  const line=(a,b,dash=false)=>path(`M${a.join(" ")}L${b.join(" ")}`,dash);
  const poly=p=>path("M"+p.map(a=>a.join(" ")).join("L"));
  const text=(x,y,t,u=false)=>`<text x="${x}" y="${y}"${u?' style="font-style:normal"':""}>${t}</text>`;
  const labels=(p,offsets={})=>Object.entries(p).map(([k,a])=>{const o=offsets[k]||[7,-8];return text(a[0]+o[0],a[1]+o[1],k);}).join("");
  const map=(p,f)=>Object.fromEntries(Object.entries(p).map(([k,a])=>[k,f(a)]));
  const fit=p=>{const a=Object.values(p),xmin=Math.min(...a.map(v=>v[0])),xmax=Math.max(...a.map(v=>v[0])),ymin=Math.min(...a.map(v=>v[1])),ymax=Math.max(...a.map(v=>v[1]));const s=Math.min(300/(xmax-xmin||1),210/(ymax-ymin||1));return map(p,([x,y])=>[200+(x-(xmax+xmin)/2)*s,145-(y-(ymax+ymin)/2)*s]);};
  const chain=(p,keys)=>poly(keys.split("").map(k=>p[k]));
  const right=(a,o,b)=>{const d=(p)=>{const l=Math.hypot(p[0]-o[0],p[1]-o[1]);return[(p[0]-o[0])*9/l,(p[1]-o[1])*9/l];},u=d(a),v=d(b);return poly([[o[0]+u[0],o[1]+u[1]],[o[0]+u[0]+v[0],o[1]+u[1]+v[1]],[o[0]+v[0],o[1]+v[1]]]);};
  const midpoint=(a,b,t,offset=[0,-8])=>text((a[0]+b[0])/2+offset[0],(a[1]+b[1])/2+offset[1],t,true);
  const axes=(x,y,w=380,h=275)=>path(`M20 ${y}H${w}m-7 -4l7 4l-7 4M${x} ${h}V20m-4 7l4 -7l4 7`)+text(w-5,y+22,"x")+text(x+10,23,"y")+text(x-17,y+20,"O");
  const drawing={
    quadratic2017:()=>{const to=(x,y)=>[310+35*x,190-6*y];return{body:axes(310,190)+poly(Array.from({length:81},(_,i)=>{const x=-5.8+i*6.2/80;return to(x,(2*x+6)**2-9);}))+text(52,28,"y=(px+6)²+q",true)};},
    dots2017:()=>({box:"0 0 460 160",body:geometry.dots2017.counts.map((n,j)=>{let b="";for(let i=0;i<n;i++)b+=`<circle cx="${30+j*110+(i%5)*13}" cy="${35+Math.floor(i/5)*15}" r="3" fill="#17212b"/>`;return b+text(35+j*110,140,String(j+1),true);}).join("")}),
    triangle2017:()=>{const p=fit(geometry.triangle2017.points);return{body:chain(p,"JKLJ")+chain(p,"KN")+right(p.J,p.N,p.K)+labels(p,{J:[-18,22],L:[8,22],N:[-4,22]})+midpoint(p.J,p.L,"28 cm",[-20,43])+midpoint(p.K,p.N,"24 cm",[-50,0])};},
    parallelograms2017:()=>{const p=fit(geometry.parallelograms2017.points);return{body:chain(p,"JKLMJ")+chain(p,"KNMPK")+chain(p,"JL")+labels(p,{J:[8,-9],K:[8,22],L:[-18,20],M:[-18,-9],N:[-5,24],P:[-5,-10],Q:[10,14],R:[-23,0]})};},
    equilateral2017:()=>{const p=fit(geometry.equilateral2017.points);return{body:chain(p,"JKLJ")+chain(p,"LMN")+labels(p,{J:[-17,22],K:[8,22],M:[-5,22],N:[10,4]})+midpoint(p.J,p.M,"5 cm",[-13,43])+text(p.M[0]+25,p.M[1]-35,"60°",true)};},
    isosceles2017:()=>{const p=fit(geometry.isosceles2017.points);return{body:chain(p,"JKLMJ")+chain(p,"JL")+chain(p,"MN")+labels(p,{J:[-4,22],K:[-20,-7],L:[0,-12],M:[-4,22],N:[5,22]})+text(p.M[0]+6,p.M[1]-13,"128°",true)};},
    spiral2017:()=>{const p=map(geometry.spiral2017.points,([x,y])=>[60+(x+5)*29,40+(5-y)*12]),keys="JKLMNOPQ";let b=chain(p,keys)+labels(p,{J:[8,8],K:[8,-5],L:[-19,-6],M:[-20,14],N:[10,15],O:[10,-6],P:[-20,-6],Q:[-20,12]});for(let i=0;i<7;i++){const a=p[keys[i]],z=p[keys[i+1]],vertical=a[0]===z[0];b+=midpoint(a,z,String(geometry.spiral2017.lengths[i]),vertical?[-22,4]:[-4,-9]);if(i<6)b+=right(a,z,p[keys[i+2]]);}return{body:b};},
    diameter2017:()=>{const p=map(geometry.diameter2017.points,([x,y])=>[200+105*x,145-105*y]);return{body:`<circle cx="200" cy="145" r="105" ${stroke}/>`+chain(p,"JKLMJ")+chain(p,"KNM")+labels(p,{J:[-22,5],K:[-13,-12],L:[5,-12],M:[9,5],N:[4,22]})};},
    rectangle2017:()=>{const p=fit(geometry.rectangle2017.points);return{body:chain(p,"JKLMJ")+chain(p,"JNK")+labels(p,{J:[-18,22],K:[8,22],L:[8,-8],M:[-18,-8],N:[-4,-12]})+midpoint(p.J,p.K,"5 cm",[-12,44])+midpoint(p.K,p.L,"3 cm",[12,4])+text(p.K[0]-28,p.K[1]-70,"35°",true)};},
    lines2017:()=>{const to=(x,y)=>[220+25*x,110-31*y];return{body:axes(220,110)+line(to(-6,-5),to(6,1))+line(to(-3.9,-5.8),to(.3,2.6))+text(55,262,"R₁")+text(97,284,"R₂")+text(191,178,"-2",true)+path("M215 172h10")};},
    bar2017:()=>{let b=path("M45 25V235H375");for(let f=0;f<=24;f+=4)b+=line([45,235-7*f],[375,235-7*f],true)+text(20,240-7*f,String(f),true);geometry.bar2017.values.forEach((v,i)=>{const h=geometry.bar2017.frequencies[i]*7;b+=`<rect x="${65+60*i}" y="${235-h}" width="25" height="${h}" fill="#d8dfe5" stroke="#17212b"/>`+text(73+60*i,257,String(v),true);});return{body:b+text(11,20,"人數",true)+text(145,288,"完成單元數目",true)};},
    box2017:()=>{const x=v=>45+7*v;let b=path("M35 205H385");for(let i=0;i<=48;i+=4)b+=path(`M${x(i)} 201v8`)+text(x(i)-6,230,String(i),true);const [a,q,m,r,z]=geometry.box2017.summary;b+=line([x(a),125],[x(q),125])+line([x(r),125],[x(z),125])+path(`M${x(a)} 112v26M${x(z)} 112v26M${x(m)} 100v50`)+`<rect x="${x(q)}" y="100" width="${x(r)-x(q)}" height="50" ${stroke}/>`;return{body:b+text(150,275,"貨箱數目",true)};},
    transform2017:()=>{const graph=(x,y,w,h,vals,label)=>{const [a,b,c]=vals,ox=x+w*.7,oy=y+h*.68,sx=w*.55/Math.abs(a),sy=h*.43/c;const to=(u,v)=>[ox+u*sx,oy-v*sy],f=u=>c*(u-a)*(u-b)/(a*b);let d=line([x+8,oy],[x+w-8,oy])+line([ox,y+h-6],[ox,y+10])+text(ox+5,y+24,"y")+text(x+w-13,oy+19,"x");d+=poly(Array.from({length:51},(_,i)=>{const u=a*1.13+(b*1.25-a*1.13)*i/50;return to(u,f(u));}));d+=text(to(a,0)[0]+6,oy+24,String(a),true)+text(to(b,0)[0]-17,oy+24,String(b),true)+text(ox+8,to(0,c)[1]+3,String(c),true)+text(x+12,y+18,label,true);return d;};let body=graph(110,0,240,175,geometry.transform2017.source,"y=f(x)");geometry.transform2017.choices.forEach((v,i)=>body+=graph((i%2)*230,190+Math.floor(i/2)*190,230,175,v,["圖甲","圖乙","圖丙","圖丁"][i]));return{box:"0 0 460 570",body};},
    rootline2017:()=>({body:path("M35 245H375m-7 -4l7 4l-7 4M65 270V25m-4 7l4 -7l4 7")+line([45,49],[290,245])+text(37,268,"O")+text(365,270,"x")+path("M78 21l3 -3l4 10l5 -17h15")+text(92,27,"y")+text(43,70,"6",true)+text(284,270,"3",true)}),
    diagonal2017:()=>{const p=fit(geometry.diagonal2017.points);return{body:chain(p,"JKLMJ")+chain(p,"JL")+chain(p,"MN")+labels(p,{J:[-18,22],K:[8,22],L:[8,-8],M:[-18,-8],N:[8,18]})+midpoint(p.J,p.K,"36 cm",[-18,42])+midpoint(p.K,p.L,"27 cm",[11,3])};},
    pole2017:()=>{const p=map(geometry.pole2017.points,([x,y,z])=>[210-6*x+18*y,195+2*x+5*y-16*z]);return{body:chain(p,"JKLJ")+chain(p,"JM")+line(p.K,p.M,true)+line(p.L,p.M,true)+labels(p,{J:[-4,-12],K:[-20,18],L:[10,10],M:[0,20]})};},
    tangent2017:()=>{const p=map(geometry.tangent2017.points,([x,y])=>[200+105*x,137-105*y]);return{body:`<circle cx="200" cy="137" r="105" ${stroke}/>`+chain(p,"JKL")+chain(p,"JOL")+chain(p,"MN")+labels(p,{J:[-5,24],K:[-22,-5],L:[10,2],O:[-18,1],M:[-13,23],N:[4,23]})};}
  };
  window.pilotDiagram2017Geometry=geometry;
  window.pilotDiagram2017=kind=>{const d=drawing[kind]?.();return d?`<figure class="diagram"><svg viewBox="${d.box||"0 0 400 300"}" role="img" aria-label="本題附圖，不按比例繪製"><g style="font-family:'Times New Roman',serif;font-size:16px;font-style:italic">${d.body}</g></svg><figcaption>圖（不按比例）</figcaption></figure>`:"";};
})();
