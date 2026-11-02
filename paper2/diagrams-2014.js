(() => {
  const R=Math.PI/180,polar=a=>[Math.cos(a*R),Math.sin(a*R)],mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
  const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  const g={
    parabola2014:{m:-0.65,n:2.8},
    notch2014:{points:{J:[12,6],K:[0,18],L:[0,0],M:[24,0],N:[24,18]}},
    square2014:{alpha:28,beta:17,points:{J:[0,1],K:[0,0],L:[1,0],M:[1,1],N:[0,1-Math.tan(28*R)],P:[1+Math.tan(28*R),0],Q:[1-Math.tan(17*R),0]}},
    areas2014:{ratio:[2,3],areas:[9,12],points:{J:[0,0],K:[6,0],L:[15,0],M:[8,2],N:[6,6]}},
    ratios2014:{points:{J:[4,3],K:[4,0],L:[36/25,-48/25],M:[0,0]}},
    circle2014:{centre:[0,0],radius:1,angle:34,points:{J:polar(65),K:polar(160),L:polar(245),M:polar(300),N:polar(357)}},
    incircle2014:{angle:52,points:{J:[0,0],K:[10,0],L:[13*Math.cos(52*R),13*Math.sin(52*R)]}},
    lines2014:{a:-.75,b:.75,c:1.5,d:.75,constant:3},
    pie2014:{labels:["材料","其他","場地","交通"],angles:[144,66,90,60]},
    stem2014:{stems:[2,3,4,5],leaves:[["h",6,8],[0,2,2,5,7,9,9],[1,1,3,3,6,8],[2,"k"]]},
    exponential2014:{b:.3,c:.6,height:.25},
    transforms2014:{constant:4,panels:[{label:"I",f:[1,1,3],h:[-1,1,3]},{label:"II",f:[1,2,3],h:[-1,1,1]},{label:"III",f:[1,1,3],h:[-1,1,1]},{label:"IV",f:[1,1,-1],h:[-1,1,-3]}]},
    planes2014:{points:{J:[0,0,8],K:[0,0,0],L:[9,0,0],M:[0,12,0]}},
    tangent2014:{centre:[0,0],radius:1,angles:[14,58],points:{J:polar(210),K:polar(326),L:polar(60)}}
  };
  // Construct a circle meeting all three sides in equal chords, not a tangent circle.
  {
    const t=g.incircle2014,p=t.points,a=length(p.K,p.L),b=length(p.J,p.L),c=length(p.J,p.K),s=(a+b+c)/2;
    p.O=p.J.map((v,i)=>(a*v+b*p.K[i]+c*p.L[i])/(2*s));
    const area=Math.abs((p.K[0]-p.J[0])*(p.L[1]-p.J[1])-(p.K[1]-p.J[1])*(p.L[0]-p.J[0]))/2;
    t.inradius=area/s;t.radius=t.inradius*1.08;t.centre=p.O;
    for(const[aName,bName,uName,vName]of[["J","K","U","V"],["K","L","W","X"],["L","J","Y","Z"]]){
      const a0=p[aName],d=p[bName].map((v,i)=>v-a0[i]),o=a0.map((v,i)=>v-p.O[i]),A=d[0]**2+d[1]**2,B=2*(d[0]*o[0]+d[1]*o[1]),C=o[0]**2+o[1]**2-t.radius**2,disc=Math.sqrt(B*B-4*A*C);
      p[uName]=mix(a0,p[bName],(-B-disc)/(2*A));p[vName]=mix(a0,p[bName],(-B+disc)/(2*A));
    }
  }
  {
    const p=g.tangent2014.points,d=p.K.map((v,i)=>v-p.J[i]),t=(1-p.L[0]*p.J[0]-p.L[1]*p.J[1])/(p.L[0]*d[0]+p.L[1]*d[1]);
    p.M=mix(p.J,p.K,t);const a=length(p.M,p.L),b=length(p.K,p.L),c=length(p.K,p.M);
    p.I=p.K.map((v,i)=>(a*v+b*p.M[i]+c*p.L[i])/(a+b+c));
  }
  const stroke='fill="none" stroke="#17212b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dash=false)=>`<path d="${d}" ${stroke}${dash?' stroke-dasharray="5 4"':""}/>`;
  const poly=(p,dash=false)=>path("M"+p.map(v=>v.join(" ")).join("L"),dash);
  const text=(x,y,v,upright=false)=>`<text x="${x}" y="${y}"${upright?' style="font-style:normal"':""}>${v}</text>`;
  const map=(p,fn)=>Object.fromEntries(Object.entries(p).map(([n,v])=>[n,fn(v)]));
  const transform=(p,w=400,h=300)=>{const a=Object.values(p),xs=a.map(v=>v[0]),ys=a.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),s=Math.min((w-110)/(xmax-xmin),(h-100)/(ymax-ymin));return v=>[(w-s*(xmax-xmin))/2+s*(v[0]-xmin),h-50-s*(v[1]-ymin)];};
  const fit=(p,w=400,h=300)=>map(p,transform(p,w,h));
  const labels=(p,offsets={})=>Object.entries(p).map(([n,v])=>{const o=offsets[n]||[7,-7];return text(v[0]+o[0],v[1]+o[1],n);}).join("");
  const unit=(a,b)=>{const d=length(a,b);return[(b[0]-a[0])/d,(b[1]-a[1])/d];};
  const right=(a,b,c,s=8)=>{const u=unit(b,a),v=unit(b,c);return poly([[b[0]+s*u[0],b[1]+s*u[1]],[b[0]+s*(u[0]+v[0]),b[1]+s*(u[1]+v[1])],[b[0]+s*v[0],b[1]+s*v[1]]]);};
  const arc=(a,b,c,r=23)=>{const u=unit(b,a),v=unit(b,c),s=u[0]*v[1]-u[1]*v[0]>0?1:0;return path(`M${b[0]+r*u[0]} ${b[1]+r*u[1]}A${r} ${r} 0 0 ${s} ${b[0]+r*v[0]} ${b[1]+r*v[1]}`);};
  const axes=(x,y,w=375,top=25,bottom=275)=>path(`M25 ${y}H${w}m-7 -4l7 4l-7 4M${x} ${bottom}V${top}m-4 7l4 -7l4 7`)+text(x-20,y+22,"O")+text(w-5,y+22,"x")+text(x-20,top+5,"y");
  const drawings={
    parabola2014:()=>{const{m,n}=g.parabola2014,to=(x,y)=>[245+40*x,140-22*y];return{body:axes(245,140)+poly(Array.from({length:100},(_,i)=>{const x=-4.9+6.5*i/99;return to(x,m*x*x-2*x+n);}))+text(35,55,"y=mx²-2x+n")};},
    notch2014:()=>{const p=fit(g.notch2014.points);return{body:poly([p.J,p.K,p.L,p.M,p.N,p.J])+poly([p.K,p.N],true)+right(p.K,p.J,p.N)+right(p.K,p.L,p.M)+right(p.L,p.M,p.N)+labels(p,{J:[-4,-13],K:[-20,-8],L:[-20,20],M:[7,20],N:[9,-8]})};},
    square2014:()=>{const p=fit(g.square2014.points);return{body:poly([p.J,p.K,p.P,p.M,p.J])+poly([p.M,p.L])+poly([p.M,p.N,p.Q,p.M])+arc(p.L,p.M,p.P,24)+arc(p.L,p.M,p.Q,45)+text(p.M[0]+15,p.M[1]+100,"28°",true)+text(p.M[0]-28,p.M[1]+100,"17°",true)+labels(p,{J:[-22,-10],K:[-22,18],L:[-6,23],M:[-5,-13],N:[-23,5],P:[8,16],Q:[-11,23]})};},
    areas2014:()=>{const p=fit(g.areas2014.points);return{body:poly([p.J,p.L,p.N,p.J])+poly([p.K,p.M,p.N])+poly([p.L,p.M])+labels(p,{J:[-20,20],K:[-6,23],L:[7,19],M:[10,-4],N:[-5,-14]})};},
    ratios2014:()=>{const p=fit(g.ratios2014.points);return{body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.M,p.K])+right(p.J,p.K,p.M)+right(p.J,p.M,p.L)+right(p.K,p.L,p.M)+arc(p.K,p.J,p.M,26)+text(p.J[0]-28,p.J[1]+42,"θ")+text((p.J[0]+p.M[0])/2-11,(p.J[1]+p.M[1])/2-13,"ℓ")+labels(p,{J:[7,-10],K:[10,7],L:[-5,24],M:[-22,4]})};},
    circle2014:()=>{const to=([x,y])=>[200+108*x,150-108*y],p=map(g.circle2014.points,to);return{body:`<circle cx="200" cy="150" r="108" ${stroke}/>`+poly([p.J,p.K,p.L,p.J,p.M,p.N,p.K])+poly([p.M,p.L])+arc(p.J,p.M,p.N,22)+text(p.M[0]+8,p.M[1]-62,"34°",true)+labels(p,{J:[2,-13],K:[-23,-2],L:[-13,23],M:[6,22],N:[10,7]})};},
    incircle2014:()=>{const t=g.incircle2014,to=transform(t.points),p=map(t.points,to),o=to(t.centre),r=length(to([t.centre[0]+t.radius,t.centre[1]]),o);return{body:`<circle cx="${o[0]}" cy="${o[1]}" r="${r}" ${stroke}/>`+poly([p.J,p.K,p.L,p.J])+poly([p.K,p.O,p.L])+arc(p.K,p.J,p.L,24)+text(p.J[0]+34,p.J[1]-11,"52°",true)+labels(p,{J:[-20,19],K:[8,17],L:[-5,-14],O:[-18,0],U:[-5,23],V:[-4,23],W:[11,5],X:[10,-3],Y:[-22,-2],Z:[-23,6]})};},
    lines2014:()=>{const t=g.lines2014,to=(x,y)=>[190+38*x,240-30*y];return{body:axes(190,240)+poly([to(-3.5,.5),to(2.3,6.3)])+poly([to(-1.3,6.6),to(2.5,-1)])+text(259,32,"ax+by=3")+text(31,29,"cx+dy=3")};},
    pie2014:()=>{const t=g.pie2014,c=[200,150],radius=110;let a=-90,body=`<circle cx="200" cy="150" r="110" ${stroke}/>`;for(let i=0;i<4;i++){const b=a+t.angles[i],mid=(a+b)/2,to=(angle,r)=>[c[0]+r*Math.cos(angle*R),c[1]+r*Math.sin(angle*R)],p=to(a,radius),q=to(b,radius),z=to(mid,75),v=to(mid,37);body+=poly([c,p])+text(z[0]-17,z[1]+5,t.labels[i],true);if(i!==3){body+=i===2?right(p,c,q,12):arc(p,c,q,24);if(i!==2)body+=i===0?text(c[0]+35,c[1]+24,`${t.angles[i]}°`,true):text(v[0]-15,v[1]+5,`${t.angles[i]}°`,true);}a=b;}return{body,caption:""};},
    stem2014:()=>{const t=g.stem2014;return{box:"0 0 440 240",caption:"",body:text(28,34,"幹（十位）",true)+text(165,34,"葉（個位）",true)+path("M24 48H420M139 18V218")+t.stems.map((s,i)=>text(83,80+40*i,s,true)+t.leaves[i].map((v,j)=>text(163+36*j,80+40*i,v,typeof v==="number")).join("")).join("")};},
    exponential2014:()=>{const{b,c,height}=g.exponential2014,to=(x,y)=>[80+85*x,250-140*y],curve=base=>poly(Array.from({length:81},(_,i)=>{const x=-.25+3.6*i/80;return to(x,base**x);})),x1=Math.log(height)/Math.log(b),x2=Math.log(height)/Math.log(c);return{body:axes(80,250,390,20,275)+curve(b)+curve(c)+poly([to(-.5,height),to(3.5,height)])+text(52,120,"1",true)+path("M75 110h10")+text(27,217,"L")+text(61,237,"J")+text(to(x1,height)[0]-5,238,"K")+text(to(x2,height)[0]-6,238,"N")+text(140,84,'y=b<tspan baseline-shift="super" font-size="11">x</tspan>')+text(269,146,'y=c<tspan baseline-shift="super" font-size="11">x</tspan>')};},
    transforms2014:()=>({box:"0 0 500 520",caption:"",body:g.transforms2014.panels.map((p,i)=>{const ox=250*(i%2),oy=260*Math.floor(i/2),to=(x,y)=>[ox+50+45*x,oy+170-22*y],graph=(coef,dash)=>{const[a,h,k]=coef;return poly(Array.from({length:71},(_,j)=>{const x=-.2+3.6*j/70,y=a*(x-h)**2+k;return to(x,Math.max(-3.7,Math.min(6,y)));}).filter((v,j,a)=>j===0||v[1]!==a[j-1][1]),dash);};let b=text(ox+15,oy+18,`圖 ${p.label}`,true)+path(`M${ox+20} ${oy+170}H${ox+235}m-7 -4l7 4l-7 4M${ox+50} ${oy+248}V${oy+35}m-4 7l4 -7l4 7`)+text(ox+226,oy+190,"x")+text(ox+31,oy+38,"y")+text(ox+5,oy+184,"O");for(const v of[-3,-1,1,2,3])b+=path(`M${ox+46} ${oy+170-22*v}h8`)+text(ox+19,oy+175-22*v,v,true);for(const v of[1,2])b+=path(`M${ox+50+45*v} ${oy+166}v8`)+text(ox+45+45*v,oy+190,v,true);b+=graph(p.f,false)+graph(p.h,true);return b;}).join("")}),
    planes2014:()=>{const to=([x,y,z])=>[200-14*x+12*y,230+4*x+3*y-20*z],p=map(g.planes2014.points,to);return{body:poly([p.L,p.J,p.M])+poly([p.J,p.K])+poly([p.K,p.L,p.M,p.K],true)+labels(p,{J:[-4,-12],K:[3,21],L:[-21,15],M:[10,15]})+text(209,152,"8 m",true)+text(111,240,"9 m",true)+text(265,241,"12 m",true)};},
    tangent2014:()=>{const t=g.tangent2014,to=transform({...t.points,left:[-1,0],bottom:[0,-1]}),p=map(t.points,to),o=to(t.centre),r=length(to([1,0]),o);return{body:`<circle cx="${o[0]}" cy="${o[1]}" r="${r}" ${stroke}/>`+poly([p.J,p.M,p.L,p.J])+poly([p.L,p.K])+poly([p.M,p.I])+arc(p.I,p.M,p.K,33)+arc(p.J,p.L,p.K,24)+text(p.M[0]-110,p.M[1]-7,"14°",true)+text(p.L[0]-28,p.L[1]+46,"58°",true)+labels(p,{J:[-21,13],K:[-5,23],L:[-3,-13],M:[9,7],I:[-11,-13]})};}
  };
  window.pilotDiagram2014Geometry=g;
  window.pilotDiagram2014=kind=>{const d=drawings[kind]?.();return d?`<figure class="diagram"><svg viewBox="${d.box||"0 0 400 300"}" role="img" aria-label="${kind==="stem2014"?"遠足參加者年齡幹葉圖":kind==="pie2014"?"活動支出圓形圖":kind==="transforms2014"?"四組函數圖像選項":"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";};
})();
