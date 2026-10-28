(() => {
  const rad=Math.PI/180,polar=(a,r=1)=>[r*Math.cos(a*rad),r*Math.sin(a*rad)];
  const mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
  const intersection=(a,b,c,d)=>{const u=b.map((v,i)=>v-a[i]),v=d.map((x,i)=>x-c[i]),w=c.map((x,i)=>x-a[i]);return mix(a,b,(w[0]*v[1]-w[1]*v[0])/(u[0]*v[1]-u[1]*v[0]));};
  const g={
    parabolas2016:{curves:[{name:"甲",a:-1,h:2,k:1},{name:"乙",a:1,h:2,k:-6},{name:"丙",a:-1,h:2,k:6},{name:"丁",a:1,h:2,k:-1}]},
    dots2016:{counts:[11,17,23],rows:6},
    angles2016:{alpha:70,gamma:140,points:{J:[-3,4.279],K:[-.7856,4.279],L:[1,2.747],M:[0,0],N:[3,0]}},
    pythagoras2016:{points:{J:[-15,0],K:[0,0],L:[48,0],M:[0,-20]}},
    parallelogram2016:{angle:122,points:{J:[0,0],K:[3,0]}},
    prism2016:{top:5,height:7,slant:25,length:8,points:{J:[0,0,0],K:[29,0,0],L:[5,0,7],M:[0,0,7],N:[0,8,0],P:[29,8,0],Q:[5,8,7],R:[0,8,7]}},
    sectors2016:{inner:20,outer:28,angle:60,points:{O:[0,0],J:polar(-30,20),K:polar(30,20),L:polar(-30,28),M:polar(30,28)}},
    squares2016:{side:6,points:{J:[0,6],K:[0,0],L:[6,0],M:[6,6],N:[12,6],P:[12,0],Q:[18,0],R:[18,6],S:[6,4],T:[12,2]}},
    projection2016:{points:{J:[0,6],K:[5,3],L:[7,0],M:[0,0]}},
    rhombus2016:{angle:126,centre:[0,0],radius:1,points:{L:[0,0],M:[1,0]}},
    hexagons2016:{centres:[[0,0],[0,1],[1,0],[1,1],[2,-2],[2,-1],[3,-2],[3,-1]].map(([q,r])=>[1.5*q,Math.sqrt(3)*(r+q/2)]),radius:1},
    expectation2016:{categories:["甲","乙","丙"],times:[60,30,6]},
    logline2016:{base:16,points:[[0,-3],[6,0]]},
    linear2016:{points:{J:[10,10],K:[20,10],L:[10,20],M:[5,20]},intercepts:[15,30],levels:[10,20]},
    cosine2016:{amplitude:-3,frequency:3,firstMaximum:60},
    block2016:{points:{J:[0,0,0],K:[18,0,0],L:[18,24,0],M:[0,24,0],N:[0,24,30],P:[0,0,30],Q:[18,0,30],R:[18,24,30],S:[9,12,0],T:[18,24,12]}},
    tangents2016:{centre:[0,0],radius:1,points:{J:polar(160),K:polar(270),L:polar(340),M:polar(16)}},
    stem2016:{rows:[[4,[8,9]],[5,[0,1,8,8,9]],[6,[1,6,8,8,9]],[7,[2,2,3,3,4]],[8,[3,5,8]]]}
  };
  const ap=g.angles2016.points;ap.L=polar(70,3);ap.K=[ap.L[0]+2.4*Math.cos(140*rad),ap.L[1]+2.4*Math.sin(140*rad)];ap.J=[ap.K[0]-2,ap.K[1]];
  const pg=g.parallelogram2016.points,u=polar(58,1.6);pg.M=u;pg.L=[3+u[0],u[1]];pg.N=[pg.L[0]-1.6/(2*Math.cos(58*rad)),pg.L[1]];
  const rp=g.rhombus2016.points;rp.K=polar(-54);rp.J=[1+rp.K[0],rp.K[1]];rp.N=[1-2*rp.K[0]**2,-2*rp.K[0]*rp.K[1]];rp.P=intersection(rp.K,rp.N,rp.L,rp.M);
  const tp=g.tangents2016.points;tp.P=intersection(tp.K,[tp.K[0]-tp.K[1],tp.K[1]+tp.K[0]],tp.M,[tp.M[0]-tp.M[1],tp.M[1]+tp.M[0]]);tp.Q=intersection(tp.J,tp.M,tp.K,tp.L);
  // Rotate the original eight-cell arrangement; preserve all incidences and symmetries.
  g.hexagons2016.centres=g.hexagons2016.centres.map(([x,y])=>[x*Math.cos(60*rad)-y*Math.sin(60*rad),x*Math.sin(60*rad)+y*Math.cos(60*rad)]);
  const stroke='fill="none" stroke="#17212b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dash=false)=>`<path d="${d}" ${stroke}${dash?' stroke-dasharray="5 4"':""}/>`;
  const poly=(p,dash=false)=>path("M"+p.map(v=>v.join(" ")).join("L"),dash);
  const text=(x,y,v,upright=false)=>`<text x="${x}" y="${y}"${upright?' style="font-style:normal"':""}>${v}</text>`;
  const labels=(p,offsets={})=>Object.entries(p).map(([n,v])=>{const o=offsets[n]||[7,-7];return text(v[0]+o[0],v[1]+o[1],n);}).join("");
  const map=(p,fn)=>Object.fromEntries(Object.entries(p).map(([n,v])=>[n,fn(v)]));
  const transform=(p,w=400,h=300)=>{const a=Object.values(p),xs=a.map(v=>v[0]),ys=a.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),s=Math.min((w-90)/(xmax-xmin),(h-80)/(ymax-ymin));return v=>[(w-s*(xmax-xmin))/2+s*(v[0]-xmin),h-40-s*(v[1]-ymin)];};
  const fit=(p,w=400,h=300)=>map(p,transform(p,w,h));
  const unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return[(b[0]-a[0])/d,(b[1]-a[1])/d];};
  const right=(a,b,c,size=8)=>{const u=unit(b,a),v=unit(b,c);return poly([[b[0]+size*u[0],b[1]+size*u[1]],[b[0]+size*(u[0]+v[0]),b[1]+size*(u[1]+v[1])],[b[0]+size*v[0],b[1]+size*v[1]]]);};
  const arc=(a,b,c,r=22,reflex=false)=>{const u=unit(b,a),v=unit(b,c),s=(u[0]*v[1]-u[1]*v[0]>0?1:0)^(reflex?1:0);return path(`M${b[0]+r*u[0]} ${b[1]+r*u[1]}A${r} ${r} 0 ${reflex?1:0} ${s} ${b[0]+r*v[0]} ${b[1]+r*v[1]}`);};
  const axes=(x,y,w=370,h=25)=>path(`M25 ${y}H${w}m-7 -4l7 4l-7 4M${x} 275V${h}m-4 7l4 -7l4 7`)+text(x-19,y+22,"O")+text(w-4,y+23,"x")+text(x-20,h+5,"y");
  const drawing={
    parabolas2016:()=>({box:"0 0 440 400",body:g.parabolas2016.curves.map((c,i)=>{const left=15+(i%2)*220,top=10+Math.floor(i/2)*195,to=(x,y)=>[left+55+25*x,top+100-9*y];return text(left,top+18,"圖"+c.name,true)+path(`M${left+20} ${top+100}H${left+200}m-6 -4l6 4l-6 4M${left+55} ${top+174}V${top+22}m-4 6l4 -6l4 6`)+text(left+30,top+119,"O")+text(left+190,top+119,"x")+text(left+38,top+28,"y")+poly(Array.from({length:81},(_,j)=>{const x=-.6+j*5.2/80;return to(x,c.a*(x-c.h)**2+c.k);}));}).join("")}),
    dots2016:()=>({box:"0 0 440 180",caption:"",body:g.dots2016.counts.map((n,i)=>{let s="";for(let j=0;j<n;j++){const col=Math.floor((j+1)/6),row=(j+1)%6;s+=`<circle cx="${35+135*i+15*col}" cy="${34+18*row}" r="2.8" fill="#17212b"/>`;}return s+text(35+135*i,160,`第 ${i+1} 個`,true)+(i<2?path(`M${115+135*i} 80h25m-7 -5l7 5l-7 5`):"");}).join("")}),
    angles2016:()=>{const p=fit(ap);return{body:poly([p.J,p.K,p.L,p.M,p.N])+path(`M${(p.J[0]+p.K[0])/2-5} ${p.J[1]-5}l8 5l-8 5M${(p.M[0]+p.N[0])/2-5} ${p.M[1]-5}l8 5l-8 5`)+arc(p.L,p.M,p.N)+arc(p.J,p.K,p.L)+arc(p.K,p.L,p.M,25,true)+text(p.M[0]+24,p.M[1]-18,"α")+text(p.K[0]-8,p.K[1]+35,"γ")+text(p.L[0]+33,p.L[1]+4,"β")};},
    pythagoras2016:()=>{const p=fit(g.pythagoras2016.points);return{body:poly([p.J,p.L,p.M,p.J])+poly([p.K,p.M])+labels(p,{J:[-18,-8],K:[-4,-12],L:[8,-5],M:[-8,24]})};},
    parallelogram2016:()=>{const p=fit(pg);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.K,p.N])+arc(p.J,p.K,p.N)+labels(p,{J:[-18,19],K:[5,23],L:[8,-4],M:[-19,-7],N:[-5,-12]})};},
    prism2016:()=>{const p=map(g.prism2016.points,([x,y,z])=>[40+9*x+5*y,245-4*y-17*z]);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.M,p.R,p.Q,p.L])+poly([p.K,p.P,p.Q])+right(p.K,p.J,p.M)+right(p.J,p.M,p.L)+text(50,151,"5 cm",true)+text(5,189,"7 cm",true)+text(174,174,"25 cm",true)+text(12,85,"8 cm",true)};},
    sectors2016:()=>{const to=([x,y])=>[65+9*x,150-9*y],p=map(g.sectors2016.points,to),ri=180,ro=252;return{body:`<path d="M${p.K.join(" ")}L${p.M.join(" ")}A${ro} ${ro} 0 0 1 ${p.L.join(" ")}L${p.J.join(" ")}A${ri} ${ri} 0 0 0 ${p.K.join(" ")}Z" fill="#e2e6eb" stroke="#17212b" stroke-width="1.6"/>`+poly([p.K,p.O,p.J])+labels(p,{O:[-20,5],J:[-17,21],K:[-17,-9],L:[8,16],M:[8,-5]})};},
    squares2016:()=>{const p=map(g.squares2016.points,([x,y])=>[35+18*x,220-18*y]);return{body:poly([p.J,p.K,p.Q,p.R,p.J])+poly([p.M,p.L])+poly([p.N,p.P])+poly([p.J,p.Q])+labels(p,{J:[-19,-8],K:[-19,20],L:[-6,23],M:[-6,-12],N:[-6,-12],P:[-6,23],Q:[8,20],R:[8,-8],S:[-20,22],T:[8,-3]})};},
    projection2016:()=>{const p=fit(g.projection2016.points);return{body:poly([p.J,p.K,p.L,p.M,p.J])+right(p.J,p.M,p.L)+arc(p.M,p.J,p.K,27)+arc(p.K,p.L,p.M,28)+text(p.J[0]+12,p.J[1]+43,"α")+text(p.L[0]-45,p.L[1]-15,"β")+labels(p,{J:[-18,-7],K:[8,-6],L:[8,18],M:[-19,18]})};},
    rhombus2016:()=>{const to=([x,y])=>[165+105*x,153-105*y],p=map(rp,to);return{body:`<circle cx="165" cy="153" r="105" ${stroke}/>`+poly([p.J,p.K,p.L,p.M,p.J,p.N])+poly([p.K,p.N])+arc(p.M,p.P,p.N)+labels(p,{J:[7,16],K:[-6,23],L:[-21,-5],M:[9,4],N:[7,-9],P:[-19,-9]})};},
    hexagons2016:()=>{const cells=g.hexagons2016.centres,vertices=c=>Array.from({length:7},(_,j)=>[c[0]+Math.cos(j*Math.PI/3),c[1]+Math.sin(j*Math.PI/3)]),all=Object.fromEntries(cells.flatMap(vertices).map((p,i)=>[i,p])),to=transform(all);return{body:cells.map(c=>poly(vertices(c).map(to))).join("")};},
    expectation2016:()=>({box:"0 0 440 120",caption:"",body:path("M10 10H430V110H10ZM10 60H430M190 10V110M270 10V110M350 10V110")+text(30,42,"零件類別",true)+text(25,91,"檢查時間（分鐘）",true)+g.expectation2016.categories.map((s,i)=>text(220+80*i,42,s,true)).join("")+g.expectation2016.times.map((n,i)=>text(216+80*i,91,n,true)).join("")}),
    logline2016:()=>{const to=(x,y)=>[80+34*x,130-28*y];return{body:path("M25 130H375m-7 -4l7 4l-7 4M80 270V20m-4 7l4 -7l4 7")+poly([to(-1,-3.5),to(8,1)])+text(59,152,"O")+text(372,152,"x")+text(20,20,'log<tspan baseline-shift="sub" font-size="12">16</tspan><tspan style="font-style:italic">y</tspan>',true)+text(272,153,"6",true)+text(47,220,"-3",true)+path("M279 125v10M75 214h10")};},
    linear2016:()=>{const to=([x,y])=>[55+9.5*x,260-7*y],p=map(g.linear2016.points,to);return{body:axes(55,260,375,20)+`<polygon points="${[p.J,p.K,p.L,p.M].map(v=>v.join(",")).join(" ")}" fill="#dce3eb"/>`+poly([[0,30],[15,0]].map(to))+poly([[0,30],[30,0]].map(to))+poly([[0,10],[20,10]].map(to))+poly([[0,20],[10,20]].map(to))+labels(p,{J:[-18,20],K:[8,-10],L:[8,-7],M:[-24,20]})+[10,20,30].map(y=>text(28,264-7*y,y,true)).join("")+[15,30].map(x=>text(48+9.5*x,287,x,true)).join("")};},
    cosine2016:()=>{const to=(x,y)=>[55+2.5*x,150-32*y],p=to(60,3);return{body:axes(55,150,375,25)+poly(Array.from({length:121},(_,x)=>to(x,-3*Math.cos(3*x*rad))))+poly([[55,p[1]],p,[p[0],150]],true)+text(33,59,"3",true)+text(p[0]-5,174,"b")};},
    block2016:()=>{const p=map(g.block2016.points,([x,y,z])=>[55+10*x+3.5*y,265-2*y-6*z]);return{body:poly([p.J,p.K,p.Q,p.P,p.J])+poly([p.P,p.N,p.R,p.Q])+poly([p.K,p.L,p.R])+poly([p.J,p.M,p.L],true)+poly([p.M,p.N],true)+poly([p.J,p.L],true)+poly([p.K,p.M],true)+poly([p.P,p.S,p.T,p.P],true)+labels(p,{J:[-19,18],K:[6,22],L:[9,16],M:[-21,-8],N:[-10,-11],P:[-22,1],Q:[-8,-16],R:[8,-5],S:[-6,22],T:[8,4]})+text(121,293,"18 cm",true)+text(272,266,"24 cm",true)+text(335,191,"12 cm",true)+text(335,99,"18 cm",true)};},
    tangents2016:()=>{const all={...tp,lo:[-1,-1],hi:[1,1]},to=transform(all),p=map(tp,to),o=to([0,0]),r=Math.abs(to([1,0])[0]-o[0]);return{body:`<circle cx="${o[0]}" cy="${o[1]}" r="${r}" ${stroke}/>`+poly([p.J,p.K,p.P,p.M,p.J,p.L,p.Q,p.J])+poly([p.K,p.L])+arc(p.J,p.Q,p.K,25)+labels(p,{J:[-20,-3],K:[-7,23],L:[8,18],M:[3,-12],P:[9,14],Q:[9,-3]})};},
    stem2016:()=>({caption:"",body:path("M110 48V255M35 48H370")+text(38,34,"幹（十位）",true)+text(150,34,"葉（個位）",true)+g.stem2016.rows.map(([s,a],i)=>text(80,80+38*i,s,true)+a.map((v,j)=>text(140+36*j,80+38*i,v,true)).join("")).join("")})
  };
  window.pilotDiagram2016Geometry=g;
  window.pilotDiagram2016=kind=>{const d=drawing[kind]?.();return d?`<figure class="diagram"><svg viewBox="${d.box||"0 0 400 300"}" role="img" aria-label="${kind==="stem2016"?"加工時間幹葉圖":kind==="expectation2016"?"各類零件檢查時間表":"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";};
})();
