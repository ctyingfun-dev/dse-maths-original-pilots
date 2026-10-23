(() => {
  const rad=Math.PI/180,polar=(a,r=1)=>[r*Math.cos(a*rad),r*Math.sin(a*rad)];
  const mix=(a,b,t)=>a.map((v,i)=>v+t*(b[i]-v));
  const intersection=(a,b,c,d)=>{const u=b.map((v,i)=>v-a[i]),v=d.map((x,i)=>x-c[i]),w=c.map((x,i)=>x-a[i]);return mix(a,b,(w[0]*v[1]-w[1]*v[0])/(u[0]*v[1]-u[1]*v[0]));};
  const geometry={
    dots2019:{counts:[7,12,17]},
    parallelogram2019:{points:{J:[16,0],K:[19,8],L:[3,8],M:[0,0],N:[16,8],P:[8,8],Q:[8,0],U:[16,128/19],V:[8,64/19]}},
    isosceles2019:{points:{J:[0,0],K:[1,0],M:polar(36,2*Math.cos(36*rad)),L:[(3+Math.sqrt(5))/2,0]}},
    parallel2019:{points:{J:[0,14],K:[0,0],L:[2*Math.sqrt(13),2],M:[0,8],N:[0,2],P:[Math.sqrt(13),8]}},
    trapezium2019:{points:{J:[0,5],K:[0,0],L:[12,-9],M:[12,0]}},
    rhombus2019:{points:{J:[0,0],K:[1,0],L:[1+Math.cos(52*rad),Math.sin(52*rad)],M:polar(52),N:[3,0],P:[1+4*Math.cos(52*rad)**2,4*Math.cos(52*rad)*Math.sin(52*rad)]}},
    semicircle2019:{centre:[0,0],radius:1,points:{O:[0,0],J:[-1,0],K:[1,0],L:polar(58),M:polar(122)}},
    rectangle2019:{points:{J:[0,0],K:[10,0],L:[10,7],N:[0,7],M:[0,2.5]}},
    line2019:{a:-3,b:-8,c:24,xBound:6,yBound:4},
    sector2019:{centre:[0,0],radius:18,points:{O:[0,0],J:[18,0],K:polar(60,18),L:[0,18]}},
    tangent2019:{centre:[0,0],radius:1,points:{J:polar(320),K:polar(216),L:polar(150),M:polar(76),N:polar(24)}},
    tetrahedron2019:{points:{J:[0,0,1],K:[0,0,0],L:[1/Math.tan(44*rad),0,0],N:[Math.cos(110*rad)/Math.tan(58*rad),Math.sin(110*rad)/Math.tan(58*rad),0]}}
  };
  geometry.isosceles2019.points.N=mix(geometry.isosceles2019.points.J,geometry.isosceles2019.points.M,1.25);
  const s=geometry.sector2019.points;s.M=intersection(s.J,s.L,s.O,s.K);
  const t=geometry.tangent2019.points;t.T=[t.J[0]+.55*Math.cos(50*rad),t.J[1]+.55*Math.sin(50*rad)];
  const stroke='fill="none" stroke="#111" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"';
  const path=(d,dash=false)=>`<path d="${d}" ${stroke}${dash?' stroke-dasharray="4 3"':""}/>`;
  const poly=(p,dash=false)=>path("M"+p.map(v=>v.join(" ")).join("L"),dash);
  const text=(x,y,v,upright=false)=>`<text x="${x}" y="${y}"${upright?' style="font-style:normal"':""}>${v}</text>`;
  const labels=(p,offsets)=>Object.entries(offsets).map(([n,o])=>text(p[n][0]+o[0],p[n][1]+o[1],n)).join("");
  const map=(p,fn)=>Object.fromEntries(Object.entries(p).map(([n,v])=>[n,fn(v)]));
  const fit=(p,w=360,h=280)=>{const vals=Object.values(p),xs=vals.map(v=>v[0]),ys=vals.map(v=>v[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),scale=Math.min((w-70)/(xmax-xmin),(h-70)/(ymax-ymin));return map(p,v=>[(w-scale*(xmax-xmin))/2+scale*(v[0]-xmin),h-35-scale*(v[1]-ymin)]);};
  const unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/d,(b[1]-a[1])/d];};
  const right=(a,b,c,size=9)=>{const u=unit(b,a),v=unit(b,c);return poly([[b[0]+size*u[0],b[1]+size*u[1]],[b[0]+size*(u[0]+v[0]),b[1]+size*(u[1]+v[1])],[b[0]+size*v[0],b[1]+size*v[1]]]);};
  const arc=(a,b,c,r)=>{const u=unit(b,a),v=unit(b,c),sweep=u[0]*v[1]-u[1]*v[0]>0?1:0;return path(`M${b[0]+r*u[0]} ${b[1]+r*u[1]}A${r} ${r} 0 0 ${sweep} ${b[0]+r*v[0]} ${b[1]+r*v[1]}`);};
  const drawings={
    dots2019:()=>{let body="";geometry.dots2019.counts.forEach((n,i)=>{for(let j=0;j<n;j++)body+=`<circle cx="${25+119*i+(j%4)*15}" cy="${25+Math.floor(j/4)*15}" r="2.6" fill="#111"/>`;body+=text(48+119*i,117,String(i+1),true);if(i<2)body+=path(`M${88+119*i} 55h21m-5 -4l5 4l-5 4`);});return{box:"0 0 365 135",body,caption:"圖案 1、2、3"};},
    parallelogram2019:()=>{const p=fit(geometry.parallelogram2019.points,400,245);return{box:"0 0 400 245",body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.J,p.N,p.P,p.Q,p.J])+poly([p.K,p.M])+labels(p,{J:[3,23],K:[9,-3],L:[-15,-9],M:[-19,8],N:[-4,-11],P:[-4,-11],Q:[-5,23],U:[7,14],V:[7,16]})};},
    isosceles2019:()=>{const p=fit(geometry.isosceles2019.points,360,230);return{box:"0 0 360 230",body:poly([p.J,p.L,p.M,p.J])+poly([p.K,p.M,p.N])+arc(p.L,p.M,p.N,20)+labels(p,{J:[-18,9],K:[-4,23],L:[8,9],M:[-17,-8],N:[4,-6]})};},
    parallel2019:()=>{const p=fit(geometry.parallel2019.points,310,320);return{box:"0 0 310 320",body:poly([p.J,p.K,p.L,p.J])+poly([p.M,p.P,p.N,p.L])+right(p.J,p.M,p.P)+labels(p,{J:[-6,-12],K:[-16,18],L:[9,9],M:[-23,4],N:[-23,4],P:[10,-3]})};},
    trapezium2019:()=>{const p=fit(geometry.trapezium2019.points,330,270);return{box:"0 0 330 270",body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.K,p.M])+right(p.J,p.K,p.M)+labels(p,{J:[-18,-7],K:[-20,7],L:[8,16],M:[9,-3]})};},
    rhombus2019:()=>{const p=fit(geometry.rhombus2019.points,360,255);return{box:"0 0 360 255",body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.K,p.M])+poly([p.K,p.N,p.P,p.K])+arc(p.K,p.M,p.L,19)+labels(p,{J:[-17,15],K:[-3,24],L:[13,12],M:[-18,-9],N:[9,14],P:[-4,-11]})};},
    semicircle2019:()=>{const p=map(geometry.semicircle2019.points,([x,y])=>[180+140*x,204-140*y]);return{box:"0 0 360 240",body:path("M40 204A140 140 0 0 1 320 204")+poly([p.J,p.K])+poly([p.J,p.L,p.O,p.M,p.K])+arc(p.J,p.K,p.M,26)+labels(p,{O:[-5,23],J:[-17,10],K:[8,10],L:[8,-7],M:[-18,-6]})};},
    rectangle2019:()=>{const p=fit(geometry.rectangle2019.points,360,280);return{box:"0 0 360 280",body:poly([p.J,p.K,p.L,p.N,p.J])+poly([p.J,p.L,p.M])+arc(p.K,p.J,p.L,35)+arc(p.N,p.L,p.M,43)+text(p.J[0]+40,p.J[1]-9,"θ")+text(p.L[0]-80,p.L[1]+16,"φ")+labels(p,{J:[-17,16],K:[8,16],L:[8,-8],N:[-18,-8],M:[-20,5]})};},
    line2019:()=>{const to=([x,y])=>[55+30*x,210-36*y];const a=to([-1,27/8]),b=to([9,-3/8]);return{box:"0 0 365 270",body:path("M22 210H345m-7 -4l7 4l-7 4M55 250V22m-4 7l4 -7l4 7")+poly([a,b])+path("M235 205V215M50 66H60")+text(230,236,"6",true)+text(33,71,"4",true)+text(35,231,"O")+text(344,231,"x")+text(36,25,"y")+text(326,239,"R")};},
    sector2019:()=>{const p=map(geometry.sector2019.points,([x,y])=>[40+14*x,294-14*y]);return{box:"0 0 330 330",body:`<defs><pattern id="hatch-sector-2019" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="#777" stroke-width=".7"/></pattern></defs><path d="M${p.K.join(" ")}A252 252 0 0 0 ${p.L.join(" ")}L${p.M.join(" ")}Z" fill="url(#hatch-sector-2019)"/>`+path("M40 42A252 252 0 0 1 292 294")+poly([p.L,p.O,p.J,p.L])+poly([p.O,p.K,p.J])+right(p.J,p.O,p.L)+labels(p,{O:[-18,16],J:[9,12],K:[8,-8],L:[-17,-7],M:[-23,4]})};},
    tangent2019:()=>{const p=map(geometry.tangent2019.points,([x,y])=>[170+112*x,150-112*y]);return{box:"0 0 350 300",body:`<circle cx="170" cy="150" r="112" ${stroke}/>`+poly([p.J,p.K,p.M,p.J,p.N,p.L,p.M])+poly([p.J,p.T])+arc(p.J,p.M,p.K,29)+labels(p,{J:[7,15],K:[-17,18],L:[-20,4],M:[-6,-11],N:[8,-6],T:[8,4]})};},
    tetrahedron2019:()=>{const p=map(geometry.tetrahedron2019.points,([x,y,z])=>[150-100*x+140*y,180+70*x+65*y-140*z]);return{box:"0 0 320 295",body:poly([p.J,p.L,p.N,p.J])+poly([p.J,p.K,p.L],true)+poly([p.K,p.N],true)+labels(p,{J:[-5,-12],K:[-17,-2],L:[-18,15],N:[9,10]})};}
  };
  window.pilotDiagram2019Geometry=geometry;
  window.pilotDiagram2019=kind=>{const d=drawings[kind]?.();return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label||"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption||"圖（不按比例）"}</figcaption></figure>`:"";};
})();
