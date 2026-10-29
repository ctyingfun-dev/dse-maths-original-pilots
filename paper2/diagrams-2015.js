(() => {
  const R=Math.PI/180,polar=(a,r=1)=>[r*Math.cos(a*R),r*Math.sin(a*R)];
  const mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
  const intersect=(a,b,c,d)=>{const u=b.map((v,i)=>v-a[i]),v=d.map((x,i)=>x-c[i]),w=c.map((x,i)=>x-a[i]);return mix(a,b,(w[0]*v[1]-w[1]*v[0])/(u[0]*v[1]-u[1]*v[0]));};
  const g={
    parabola2015:{a:-0.7,b:2},
    dots2015:{counts:[7,12,17],increment:5},
    pythagoras2015:{points:{J:[9,12],K:[9,0],L:[0,0],M:[3.2,12.6],N:[7.2,9.6],P:[4,12]}},
    frustum2015:{height:20,radius:10,remainingHeight:12,topRadius:4},
    parallelogram2015:{ratio:[3,4],area:27,points:{J:[0,7],K:[2,0],L:[9,0],M:[7,7],N:[55/7,4],P:[49/4,7],Q:[55/3,0]}},
    ratios2015:{points:{J:[0,0],K:[-5,0],L:[0,4],M:[1.6,0.8]}},
    circle2015:{centre:[0,0],radius:1,angle:46,points:{J:polar(180),K:polar(92),M:polar(46),L:polar(0),N:polar(300)}},
    lines2015:{a:0.5,b:2,c:2/3,constant:2,x1:4,x2:1,y2:3},
    bars2015:{values:[0,1,2,3,4],frequencies:[6,12,9,6,3]},
    box2015:{summary:[8,20,36,52,68]},
    logline2015:{base:2,intercepts:[4,3]},
    region2015:{right:5,slope:2,intercept:4,lower:[1,2,8],points:{J:[0,4],K:[5,14],L:[5,1.5]}},
    sine2015:{frequency:3,phase:60,zeros:[40,100]},
    tangents2015:{centre:[-4.8,0],radius:4.8,points:{J:[0,8],K:[0,0],M:[-9.6,0],N:[-15,0],L:[-120/17,72/17]}}
  };
  // Scale the construction so its actual small-triangle area matches the given area.
  for(const p of Object.values(g.parallelogram2015.points))for(let i=0;i<2;i++)p[i]*=Math.sqrt(24/7);
  const stroke='fill="none" stroke="#17212b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dash=false)=>`<path d="${d}" ${stroke}${dash?' stroke-dasharray="5 4"':""}/>`;
  const poly=(p,dash=false)=>path("M"+p.map(v=>v.join(" ")).join("L"),dash);
  const text=(x,y,v,upright=false)=>`<text x="${x}" y="${y}"${upright?' style="font-style:normal"':""}>${v}</text>`;
  const map=(p,fn)=>Object.fromEntries(Object.entries(p).map(([n,v])=>[n,fn(v)]));
  const transform=(p,w=400,h=300)=>{const a=Object.values(p),xs=a.map(v=>v[0]),ys=a.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),s=Math.min((w-100)/(xmax-xmin),(h-90)/(ymax-ymin));return v=>[(w-s*(xmax-xmin))/2+s*(v[0]-xmin),h-45-s*(v[1]-ymin)];};
  const fit=(p,w=400,h=300)=>map(p,transform(p,w,h));
  const labels=(p,offsets={})=>Object.entries(p).map(([n,v])=>{const o=offsets[n]||[7,-7];return text(v[0]+o[0],v[1]+o[1],n);}).join("");
  const unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return[(b[0]-a[0])/d,(b[1]-a[1])/d];};
  const right=(a,b,c,size=8)=>{const u=unit(b,a),v=unit(b,c);return poly([[b[0]+size*u[0],b[1]+size*u[1]],[b[0]+size*(u[0]+v[0]),b[1]+size*(u[1]+v[1])],[b[0]+size*v[0],b[1]+size*v[1]]]);};
  const arc=(a,b,c,r=23)=>{const u=unit(b,a),v=unit(b,c),s=u[0]*v[1]-u[1]*v[0]>0?1:0;return path(`M${b[0]+r*u[0]} ${b[1]+r*u[1]}A${r} ${r} 0 0 ${s} ${b[0]+r*v[0]} ${b[1]+r*v[1]}`);};
  const axes=(x,y,w=375,top=25,bottom=275)=>path(`M25 ${y}H${w}m-7 -4l7 4l-7 4M${x} ${bottom}V${top}m-4 7l4 -7l4 7`)+text(x-20,y+22,"O")+text(w-5,y+22,"x")+text(x-20,top+5,"y");
  const drawings={
    parabola2015:()=>{const{a,b}=g.parabola2015,to=(x,y)=>[100+50*x,70-24*y];return{body:axes(100,70)+poly(Array.from({length:81},(_,i)=>{const x=-1+i*6/80;return to(x,a*(x-b)**2);})),caption:"圖（不按比例）"};},
    dots2015:()=>({box:"0 0 440 170",caption:"",body:g.dots2015.counts.map((count,i)=>{const ox=28+145*i;let s="";for(let j=0;j<count-2;j++){const col=Math.floor(j/5),row=j%5;s+=`<circle cx="${ox+18+col*16}" cy="${32+row*19}" r="3" fill="#17212b"/>`;}s+=`<circle cx="${ox}" cy="61" r="3" fill="#17212b"/><circle cx="${ox}" cy="80" r="3" fill="#17212b"/>`;return s+text(ox,146,`第 ${i+1} 個`,true)+(i<2?path(`M${ox+85} 72h25m-7 -5l7 5l-7 5`):"");}).join("")}),
    pythagoras2015:()=>{const p=fit(g.pythagoras2015.points);return{body:poly([p.J,p.K,p.L,p.J])+poly([p.L,p.M,p.N])+poly([p.J,p.P])+right(p.J,p.K,p.L)+right(p.M,p.N,p.J)+labels(p,{J:[9,4],K:[8,20],L:[-20,20],M:[-16,-12],N:[8,18],P:[-4,-12]})};},
    frustum2015:()=>({body:`<ellipse cx="200" cy="65" rx="48" ry="16" ${stroke}/>`+path("M152 65L80 235A120 40 0 0 0 320 235L248 65")+path("M80 235A120 40 0 0 1 320 235",true)+path("M344 65V235M338 65H350M338 235H350")+text(350,155,"12 cm",true)}),
    parallelogram2015:()=>{const p=fit(g.parallelogram2015.points);return{body:poly([p.J,p.K,p.Q,p.J,p.P,p.K])+poly([p.M,p.L])+labels(p,{J:[-18,-9],K:[-12,23],L:[-4,23],M:[-9,-11],N:[13,28],P:[6,-9],Q:[8,19]})};},
    ratios2015:()=>{const p=fit(g.ratios2015.points);return{body:poly([p.J,p.K,p.L,p.J,p.M,p.L])+right(p.K,p.J,p.L)+right(p.J,p.M,p.L)+arc(p.J,p.L,p.M)+arc(p.J,p.K,p.L)+text(p.L[0]+9,p.L[1]+43,"α")+text(p.K[0]+37,p.K[1]-12,"β")+labels(p,{J:[-5,23],K:[-20,14],L:[-6,-13],M:[11,4]})};},
    circle2015:()=>{const to=([x,y])=>[200+110*x,150-110*y],p=map(g.circle2015.points,to);return{body:`<circle cx="200" cy="150" r="110" ${stroke}/>`+poly([p.J,p.K,p.M,p.L,p.J,p.N,p.M])+arc(p.K,p.J,p.L,30)+arc(p.J,p.N,p.M,24)+text(p.J[0]+34,p.J[1]-10,"46°",true)+labels(p,{J:[-21,5],K:[-8,-13],M:[10,-7],L:[10,5],N:[7,23]})};},
    lines2015:()=>{const to=(x,y)=>[105+44*x,210-36*y];return{body:axes(105,210)+poly([to(4,-1.2),to(4,4.6)])+poly([to(-.4,4.2),to(1.6,-1.8)])+text(287,40,'L<tspan baseline-shift="sub" font-size="12">1</tspan>')+text(69,52,'L<tspan baseline-shift="sub" font-size="12">2</tspan>')};},
    bars2015:()=>{const{values,frequencies}=g.bars2015;return{box:"0 0 440 300",caption:"",body:path("M65 25V242H417")+[0,3,6,9,12].map(n=>path(`M65 ${242-16*n}H410`,true)+text(38,248-16*n,n,true)).join("")+values.map((n,i)=>`<rect x="${84+65*i}" y="${242-16*frequencies[i]}" width="32" height="${16*frequencies[i]}" fill="#dce3eb" stroke="#17212b" stroke-width="1.5"/>`+text(95+65*i,265,n,true)).join("")+text(8,18,"學生人數",true)+text(170,292,"借閱圖書數目",true)};},
    box2015:()=>{const s=g.box2015.summary,to=x=>40+5*x;return{box:"0 0 440 190",caption:"",body:Array.from({length:17},(_,i)=>8+4*i).map(n=>path(`M${to(n)} 25V140`,true)+(n%8===0?text(to(n)-9,161,n,true):"")).join("")+path(`M${to(s[0])} 78H${to(s[1])}M${to(s[3])} 78H${to(s[4])}M${to(s[0])} 69V87M${to(s[4])} 69V87`)+`<rect x="${to(s[1])}" y="58" width="${to(s[3])-to(s[1])}" height="40" fill="white" stroke="#17212b" stroke-width="2"/>`+path(`M${to(s[2])} 58V98M65 140H415`)+text(172,186,"閱讀時間（分鐘）",true)};},
    logline2015:()=>{const to=(x,y)=>[90+57*x,235-55*y];return{body:path("M30 235H380m-7 -4l7 4l-7 4M90 275V20m-4 7l4 -7l4 7")+poly([to(-.5,3.375),to(4.4,-.3)])+text(68,258,"O")+text(350,270,'log<tspan baseline-shift="sub" font-size="12">2</tspan>x')+text(30,20,'log<tspan baseline-shift="sub" font-size="12">2</tspan>y')+text(310,263,"4",true)+text(66,76,"3",true)+path("M318 230v10M85 70h10")};},
    region2015:()=>{const to=([x,y])=>[70+45*x,270-15*y],p=map(g.region2015.points,to);return{box:"0 0 450 310",body:axes(70,270,425,25,290)+`<polygon points="${[p.J,p.K,p.L].map(v=>v.join(",")).join(" ")}" fill="#dce3eb"/>`+poly([to([-.5,3]),to([6,16])])+poly([to([-.7,4.35]),to([6,1])])+poly([to([5,-.4]),to([5,16])])+text(343,50,"y=2x+4")+text(315,230,"x+2y=8")+text(279,300,"x=5")};},
    sine2015:()=>{const{frequency,phase,zeros}=g.sine2015,to=(x,y)=>[75+2.6*x,150-92*y];return{body:axes(75,150,385,20,280)+poly(Array.from({length:181},(_,i)=>{const x=-25+i*127/180;return to(x,Math.sin((frequency*x+phase)*R));}))+zeros.map(x=>text(to(x,0)[0]-11,190,x,true)+path(`M${to(x,0)[0]} 146v8`)).join("")};},
    tangents2015:()=>{const t=g.tangents2015,to=transform({...t.points,bottom:[t.centre[0],-t.radius]}),p=map(t.points,to),o=to(t.centre),r=to([0,0])[0]-o[0];return{body:`<circle cx="${o[0]}" cy="${o[1]}" r="${r}" ${stroke}/>`+poly([p.J,p.K,p.N,p.J])+labels(p,{J:[5,-11],K:[10,5],M:[-16,20],N:[-21,8],L:[-11,-12]})};}
  };
  window.pilotDiagram2015Geometry=g;
  window.pilotDiagram2015=kind=>{const d=drawings[kind]?.();return d?`<figure class="diagram"><svg viewBox="${d.box||"0 0 400 300"}" role="img" aria-label="${kind==="bars2015"?"學生借閱圖書數目棒形圖":kind==="box2015"?"閱讀時間框線圖":"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";};
})();
