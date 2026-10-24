(() => {
  const rad=Math.PI/180,polar=(a,r=1)=>[r*Math.cos(a*rad),r*Math.sin(a*rad)];
  const mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
  const intersection=(a,b,c,d)=>{const u=b.map((v,i)=>v-a[i]),v=d.map((x,i)=>x-c[i]),w=c.map((x,i)=>x-a[i]);return mix(a,b,(w[0]*v[1]-w[1]*v[0])/(u[0]*v[1]-u[1]*v[0]));};
  const geometry={
    lines2018:{a:-2.5,b:-10,c:-0.5,d:2},
    octagon2018:{outer:[8,5],notch:[3,2],points:{J:[0,5],K:[0,0],L:[8,0],M:[8,5],N:[5.5,5],P:[5.5,3],Q:[2.5,3],R:[2.5,5]}},
    prism2018:{length:10,height:7,hypotenuse:25,points:{J:[0,0,0],K:[24,0,0],L:[24,0,7],M:[0,10,0],N:[24,10,0],P:[24,10,7]}},
    parallelogram2018:{points:{J:[3,8],K:[0,0],L:[10,0],M:[13,8],N:[6,0]}},
    sector2018:{centre:[0,0],radius:40,points:{O:[0,0],J:[32,24],K:[20,20*Math.sqrt(3)],L:[0,40],M:[-32,24],N:[0,24],P:[20,24]}},
    rhombus2018:{points:{J:[0,0],K:[1,0],M:polar(104)}},
    pentagon2018:{radius:8/(2*Math.sin(36*rad)),points:{}},
    square2018:{points:{J:[24,0],K:[0,0],L:[0,24],M:[24,24],N:[-8,0],P:[0,6]}},
    trapezium2018:{points:{J:[0,0],K:[4,0],L:[4,3],M:[0,2],N:[1,0],P:[3,0]}},
    circle2018:{centre:[0,0],radius:1,points:{J:polar(130),K:polar(250),L:polar(26),M:polar(86)}},
    rotation2018:{cells:[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]},
    stem2018:{rows:[[3,[1,3,4,7]],[4,["a","a"]],[5,[0,1,3,5,6,7,9]],[6,[4]],[7,["b","b",9,9]],[8,[1,6]]]},
    parabolas2018:{roots:[[2,6],[7,11]]},
    logs2018:{c:2,d:4,x:9},
    logline2018:{base:9,points:[[2,3],[8,6]]},
    tangent2018:{centre:[0,0],radius:1,points:{J:polar(270),K:polar(330),L:polar(130),M:polar(190),T:[1.25,-1]}},
    block2018:{points:{J:[0,0,0],K:[9,0,0],L:[9,20,0],M:[0,20,0],N:[0,20,18],P:[0,0,18],Q:[9,0,18],R:[9,20,18],X:[0,20,12]}}
  };
  const g=geometry;
  g.parallelogram2018.points.P=intersection(g.parallelogram2018.points.J,g.parallelogram2018.points.N,g.parallelogram2018.points.K,g.parallelogram2018.points.M);
  const r=g.rhombus2018.points;r.L=[r.K[0]+r.M[0],r.K[1]+r.M[1]];r.N=intersection(r.J,r.K,r.L,[r.L[0]+Math.cos(250*rad),r.L[1]+Math.sin(250*rad)]);r.P=mix(r.J,r.M,r.N[0]);
  const p=g.pentagon2018.points;["J","K","L","M","N"].forEach((k,i)=>p[k]=polar(306-72*i,g.pentagon2018.radius));p.P=intersection(p.J,p.M,p.L,p.N);
  for(const name of ["circle2018","tangent2018"]){const p=g[name].points;p.N=name==="circle2018"?intersection(p.J,p.M,p.K,p.L):intersection(p.J,p.T,p.L,p.M);}
  for(const key of Object.keys(g.circle2018.points)){const [x,y]=g.circle2018.points[key],a=-40*rad;g.circle2018.points[key]=[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}
  for(let i=0;i<4;i++)for(const x of [1.5,2.5]){const a=i*Math.PI/2;g.rotation2018.cells.push([x*Math.cos(a)-.5*Math.sin(a),x*Math.sin(a)+.5*Math.cos(a)]);}
  const stroke='fill="none" stroke="#17212b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dash=false)=>`<path d="${d}" ${stroke}${dash?' stroke-dasharray="5 4"':""}/>`;
  const poly=(p,dash=false)=>path("M"+p.map(v=>v.join(" ")).join("L"),dash);
  const text=(x,y,v,upright=false)=>`<text x="${x}" y="${y}"${upright?' style="font-style:normal"':""}>${v}</text>`;
  const labels=(p,offsets={})=>Object.entries(p).map(([n,v])=>{const o=offsets[n]||[7,-7];return text(v[0]+o[0],v[1]+o[1],n);}).join("");
  const map=(p,fn)=>Object.fromEntries(Object.entries(p).map(([n,v])=>[n,fn(v)]));
  const fit=(p,w=400,h=300)=>{const a=Object.values(p),xs=a.map(v=>v[0]),ys=a.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),s=Math.min((w-90)/(xmax-xmin),(h-80)/(ymax-ymin));return map(p,v=>[(w-s*(xmax-xmin))/2+s*(v[0]-xmin),h-40-s*(v[1]-ymin)]);};
  const unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return[(b[0]-a[0])/d,(b[1]-a[1])/d];};
  const right=(a,b,c,size=8)=>{const u=unit(b,a),v=unit(b,c);return poly([[b[0]+size*u[0],b[1]+size*u[1]],[b[0]+size*(u[0]+v[0]),b[1]+size*(u[1]+v[1])],[b[0]+size*v[0],b[1]+size*v[1]]]);};
  const arc=(a,b,c,r=22)=>{const u=unit(b,a),v=unit(b,c),s=u[0]*v[1]-u[1]*v[0]>0?1:0;return path(`M${b[0]+r*u[0]} ${b[1]+r*u[1]}A${r} ${r} 0 0 ${s} ${b[0]+r*v[0]} ${b[1]+r*v[1]}`);};
  const axes=(x=60,y=240,w=350,h=25)=>path(`M25 ${y}H${w}m-7 -4l7 4l-7 4M${x} 275V${h}m-4 7l4 -7l4 7`)+text(x-19,y+22,"O")+text(w-4,y+23,"x")+text(x-20,h+5,"y");
  const drawing={
    lines2018:()=>({body:axes(245,220)+path("M125 280L300 60M65 260L330 127.5")+text(100,275,"R₁")+text(65,247,"R₂")}),
    octagon2018:()=>{const p=fit(g.octagon2018.points,420,280);return{box:"-14 0 434 280",body:poly([p.J,p.K,p.L,p.M,p.N,p.P,p.Q,p.R,p.J])+labels(p,{J:[-19,-8],K:[-19,17],L:[8,17],M:[8,-8],N:[5,-9],P:[9,18],Q:[-18,18],R:[-18,-9]})+text(188,267,"8 cm",true)+text(2,151,"5 cm",true)+text(190,155,"3 cm",true)+text(277,80,"2 cm",true)+right(p.K,p.J,p.R)+right(p.J,p.K,p.L)+right(p.K,p.L,p.M)+right(p.L,p.M,p.N)+right(p.M,p.N,p.P)+right(p.N,p.P,p.Q)+right(p.P,p.Q,p.R)+right(p.Q,p.R,p.J)};},
    prism2018:()=>{const p=map(g.prism2018.points,([x,y,z])=>[45+9*x+5*y,200+3*x-7*y-12*z]);return{body:poly([p.J,p.K,p.L,p.J,p.M,p.P,p.L])+poly([p.M,p.N,p.K],true)+poly([p.N,p.P],true)+right(p.J,p.K,p.L)+text(205,235,"7 cm",true)+text(120,159,"25 cm",true)+text(45,145,"10 cm",true)};},
    parallelogram2018:()=>{const p=fit(g.parallelogram2018.points);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.J,p.N])+poly([p.K,p.M])+labels(p,{J:[-17,-8],K:[-19,17],L:[8,17],M:[8,-5],N:[-4,24],P:[-18,-4]})};},
    sector2018:()=>{const p=map(g.sector2018.points,([x,y])=>[200+4*x,260-4*y]);return{body:path(`M${p.M.join(" ")}A160 160 0 0 1 ${p.J.join(" ")}`)+poly([p.M,p.O,p.J,p.M])+poly([p.O,p.L],true)+poly([p.O,p.K,p.P],true)+right(p.O,p.N,p.P)+right(p.K,p.P,p.J)+labels(p,{O:[-6,23],J:[8,5],K:[7,-10],L:[-6,-11],M:[-21,6],N:[-21,18],P:[3,22]})};},
    rhombus2018:()=>{const p=fit(g.rhombus2018.points);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.N,p.L,p.P])+labels(p,{J:[-15,23],K:[8,23],L:[8,-6],M:[-20,-5],N:[-5,23],P:[-22,-1]})};},
    pentagon2018:()=>{const p=fit(g.pentagon2018.points);return{body:poly([p.J,p.K,p.L,p.M,p.N,p.J])+poly([p.J,p.M])+poly([p.L,p.N])+poly([p.K,p.P])+labels(p,{J:[8,17],K:[-18,17],L:[-20,1],M:[-5,-12],N:[9,1],P:[9,-8]})};},
    square2018:()=>{const p=fit(g.square2018.points);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.K,p.N,p.M])+labels(p,{J:[9,17],K:[-5,24],L:[-19,-5],M:[8,-5],N:[-19,17],P:[-19,-3]})};},
    trapezium2018:()=>{const p=fit(g.trapezium2018.points);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.N,p.L])+poly([p.P,p.M])+right(p.M,p.J,p.K)+right(p.J,p.K,p.L)+arc(p.K,p.N,p.L)+arc(p.M,p.P,p.J)+text(p.N[0]+30,p.N[1]-10,"α")+text(p.P[0]-53,p.P[1]-9,"β")+labels(p,{J:[-18,19],K:[9,19],L:[9,-4],M:[-20,-4],N:[-5,24],P:[-5,24]})};},
    circle2018:()=>{const p=map(g.circle2018.points,([x,y])=>[135+85*x,150-85*y]);return{body:`<circle cx="135" cy="150" r="85" ${stroke}/>`+poly([p.J,p.K,p.N,p.J,p.L])+poly([p.K,p.M])+arc(p.L,p.N,p.M,30)+labels(p,{J:[-16,-9],K:[-17,16],L:[5,19],M:[7,-4],N:[8,8]})};},
    rotation2018:()=>({body:g.rotation2018.cells.map(([x,y])=>`<rect x="${200+35*(x-.5)}" y="${150-35*(y+.5)}" width="35" height="35" ${stroke}/>`).join("")}),
    stem2018:()=>({body:path("M105 47V260M40 48H360")+text(44,35,"幹（十位）",true)+text(145,35,"葉（個位）",true)+g.stem2018.rows.map(([s,leaves],i)=>text(74,77+i*34,s,true)+leaves.map((v,j)=>text(130+j*31,77+i*34,v,typeof v==="number")).join("")).join(""),caption:""}),
    parabolas2018:()=>{const to=(x,y)=>[45+27*x,165-14*y],curve=(a,b,sign)=>poly(Array.from({length:91},(_,i)=>{const x=a-1+i*(b-a+2)/90;return to(x,sign*.45*(x-a)*(x-b));}));return{body:axes(45,165,380)+curve(2,6,-1)+curve(7,11,1)+[2,6,7,11].map(x=>path(`M${45+27*x} 160v10`)+text(x===7?235:40+27*x,x===7?219:190,x,true)).join("")};},
    logs2018:()=>{const to=(x,y)=>[45+24*x,245-45*y],curve=b=>poly(Array.from({length:101},(_,i)=>{const x=.8+i*11.2/100;return to(x,Math.log(x)/Math.log(b));}));const p={J:to(9,Math.log2(9)),K:to(9,Math.log(9)/Math.log(4)),L:to(9,0)};return{body:axes(45,245,380)+curve(2)+curve(4)+poly([to(9,-.35),to(9,4)])+labels(p,{J:[12,-14],K:[7,17],L:[7,22]})+text(312,68,'log<tspan baseline-shift="sub" font-size="12">c</tspan>x')+text(312,151,'log<tspan baseline-shift="sub" font-size="12">d</tspan>x')+text(254,273,"9",true)};},
    logline2018:()=>{const to=(x,y)=>[55+30*x,245-29*y];return{body:path("M25 245H375m-7 -4l7 4l-7 4M55 270V20m-4 7l4 -7l4 7")+poly([to(-.5,1.75),to(9,6.5)])+text(36,266,"O")+text(330,272,'log<tspan baseline-shift="sub" font-size="12">9</tspan>x')+text(12,21,'log<tspan baseline-shift="sub" font-size="12">9</tspan>y')+g.logline2018.points.map(([x,y])=>`<circle cx="${to(x,y)[0]}" cy="${to(x,y)[1]}" r="2.5" fill="#17212b"/>`+text(to(x,y)[0]-20,to(x,y)[1]-12,`(${x},${y})`,true)).join("")};},
    tangent2018:()=>{const p=map(g.tangent2018.points,([x,y])=>[200+105*x,140-105*y]);return{body:`<circle cx="200" cy="140" r="105" ${stroke}/>`+poly([p.J,p.K,p.L,p.N,p.T])+arc(p.J,p.K,p.L)+labels(p,{J:[-5,24],K:[10,8],L:[-16,-9],M:[-22,1],N:[-19,19],T:[8,6]})};},
    block2018:()=>{const p=map(g.block2018.points,([x,y,z])=>[75+18*x+3*y,263-2*y-10*z]);return{body:poly([p.J,p.K,p.Q,p.P,p.J])+poly([p.P,p.N,p.R,p.Q])+poly([p.K,p.L,p.R])+poly([p.J,p.M,p.L],true)+poly([p.M,p.N],true)+poly([p.K,p.X],true)+labels(p,{J:[-19,17],K:[8,17],L:[8,10],M:[-24,-12],N:[-12,-12],P:[-20,-2],Q:[8,8],R:[8,-5],X:[-24,3]})+text(145,290,"9 cm",true)+text(286,256,"20 cm",true)};}
  };
  window.pilotDiagram2018Geometry=g;
  window.pilotDiagram2018=kind=>{const d=drawing[kind]?.();return d?`<figure class="diagram"><svg viewBox="${d.box||"0 0 400 300"}" role="img" aria-label="${kind==="stem2018"?"服務人次幹葉圖":"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";};
})();
