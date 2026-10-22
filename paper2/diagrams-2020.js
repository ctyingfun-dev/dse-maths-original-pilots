(() => {
  const r=Math.PI/180;
  const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const polar=(angle,radius=1)=>[radius*Math.cos(angle*r),radius*Math.sin(angle*r)];
  const intersect=(a,b,c,d)=>{
    const u=[b[0]-a[0],b[1]-a[1]],v=[d[0]-c[0],d[1]-c[1]],w=[c[0]-a[0],c[1]-a[1]];
    return lerp(a,b,(w[0]*v[1]-w[1]*v[0])/(u[0]*v[1]-u[1]*v[0]));
  };
  const geometry={
    lines2020:{a:-4,b:6,c:-12},
    dots2020:{first:4,increment:[3,2],counts:[4,9,17]},
    bounds2020:{points:{J:[0,8],K:[0,0],L:[13,0],M:[13,4],N:[7,8]}},
    trapezia2020:{points:{O:[4,8],R:[0,0],S:[10,0]}},
    parallelogram2020:{points:{J:[50,41.6],K:[40,0],L:[0,0],M:[10,41.6],N:[35,41.6],P:[65,0]}},
    reflex2020:{points:{A:[0,4],B:[6,3],C:[3,0],U:[5,4],V:[-1,0]}},
    triangles2020:{points:{J:polar(150),K:polar(210),L:[0,0],M:polar(46),N:polar(-40)}},
    rectangle2020:{points:{J:[0,168/25],K:[0,0],L:[25,0],M:[25,168/25],N:[49/25,168/25]}},
    circle2020:{centre:[0,0],radius:7.5,points:{J:polar(180,7.5),K:polar(2*Math.acos(.6)/r,7.5),L:polar(0,7.5),M:polar(-92,7.5),N:polar(-145,7.5)}},
    bars2020:{values:[2,3,4,5,6],frequencies:[4,6,8,6,4]},
    exponential2020:{a:2,b:.5,coefficient:2},
    transform2020:{intercepts:[-6,2]},
    prism2020:{points:{J:[0,0,0],K:[15,0,0],L:[7.5,15*Math.sqrt(3)/2,0],N:[0,0,28],P:[15,0,28],M:[7.5,15*Math.sqrt(3)/2,28],Q:[0,0,8]}},
    tangents2020:{centre:[0,1],radius:1,points:{L:[0,0],P:[-1.2,0],T:[1.2,0]}}
  };
  const trap=geometry.trapezia2020.points;
  trap.J=lerp(trap.O,trap.R,.4);trap.K=lerp(trap.O,trap.R,.6);
  trap.M=lerp(trap.O,trap.S,.4);trap.N=lerp(trap.O,trap.S,.6);
  const para=geometry.parallelogram2020.points;
  para.Q=intersect(para.J,para.K,para.N,para.P);para.R=intersect(para.K,para.M,para.L,para.Q);
  const tang=geometry.tangents2020,pts=tang.points;
  pts.J=polar(120,2*Math.sin(120*r));pts.K=polar(32,2*Math.sin(32*r));
  const normal=[-Math.sin(-28*r),Math.cos(-28*r)],d=normal[0]*pts.J[0]+normal[1]*pts.J[1];
  tang.innerRadius=d/(1+normal[1]);tang.innerCentre=[0,tang.innerRadius];
  pts.M=pts.J.map(v=>v*tang.innerRadius);
  pts.N=[tang.innerRadius*normal[0],tang.innerRadius*(1+normal[1])];

  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="4 3"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const circle=(p,radius)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${radius}" ${stroke}/>`;
  const text=(x,y,value,upright=false,extra="")=>`<text x="${x}" y="${y}"${upright?' style="font-style:normal"':""} ${extra}>${value}</text>`;
  const labels=(points,offsets)=>Object.entries(offsets).map(([name,[x,y]])=>text(points[name][0]+x,points[name][1]+y,name)).join("");
  const mapPoints=(points,fn)=>Object.fromEntries(Object.entries(points).map(([name,p])=>[name,fn(p)]));
  const unit=(a,b)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/d,(b[1]-a[1])/d];};
  const right=(a,b,c,size=9)=>{
    const u=unit(b,a),v=unit(b,c);
    return poly([[b[0]+size*u[0],b[1]+size*u[1]],[b[0]+size*(u[0]+v[0]),b[1]+size*(u[1]+v[1])],[b[0]+size*v[0],b[1]+size*v[1]]]);
  };
  const arc=(a,b,c,radius,reflex=false)=>{
    const u=unit(b,a),v=unit(b,c),sweep=(u[0]*v[1]-u[1]*v[0]>0)!==reflex?1:0;
    return path(`M${b[0]+radius*u[0]} ${b[1]+radius*u[1]}A${radius} ${radius} 0 ${reflex?1:0} ${sweep} ${b[0]+radius*v[0]} ${b[1]+radius*v[1]}`);
  };
  const parallel=(a,b,t=.6)=>{
    const p=lerp(a,b,t),u=unit(a,b);
    return poly([[p[0]-5*u[0]-3*u[1],p[1]-5*u[1]+3*u[0]],p,[p[0]-5*u[0]+3*u[1],p[1]-5*u[1]-3*u[0]]]);
  };
  const axes=(x,y,left,rightX,top,bottom)=>path(`M${left} ${y}H${rightX} M${rightX-7} ${y-4}L${rightX} ${y}L${rightX-7} ${y+4} M${x} ${bottom}V${top} M${x-4} ${top+7}L${x} ${top}L${x+4} ${top+7}`);
  const drawings={
    lines2020:()=>{
      const {a,b,c}=geometry.lines2020,map=([x,y])=>[100+41*x,245-32*y];
      return {box:"0 0 350 295",body:axes(100,245,25,326,22,277)+
        poly([map([-1.5,(-2*(-1.5)-b)/a]),map([5,(-10-b)/a])])+
        poly([map([-.3,(-b*(-.3)-c)/2]),map([2.4,(-b*2.4-c)/2])])+
        text(310,115,'L<tspan dy="4" style="font-size:11px">1</tspan>')+text(58,24,'L<tspan dy="4" style="font-size:11px">2</tspan>')+
        text(327,265,"x")+text(80,20,"y")+text(80,266,"O")};
    },
    dots2020:()=>{
      let body="";
      geometry.dots2020.counts.forEach((count,index)=>{
        const centre=48+index*117,rows=Math.ceil(count/5),cols=Math.min(5,count);
        for(let i=0;i<count;i++)body+=`<circle cx="${centre+10*((i%5)-(cols-1)/2)}" cy="${29+12*Math.floor(i/5)}" r="2.4" fill="#111"/>`;
        body+=text(centre,98,index+1,true,'text-anchor="middle"');
        if(index<2)body+=path(`M${centre+38} 50H${centre+71} M${centre+64} 46L${centre+71} 50L${centre+64} 54`);
      });
      return {box:"0 0 350 118",body};
    },
    bounds2020:()=>{
      const p=mapPoints(geometry.bounds2020.points,([x,y])=>[45+20*x,222-20*y]);
      return {box:"0 0 350 265",body:poly([p.J,p.K,p.L,p.M,p.N,p.J])+right(p.N,p.J,p.K)+right(p.J,p.K,p.L)+right(p.K,p.L,p.M)+
        labels(p,{J:[-18,-10],K:[-18,20],L:[6,20],M:[9,4],N:[0,-13]})+
        text(12,148,"8 cm",true)+text(157,251,"13 cm",true)+text(309,185,"4 cm",true)+text(99,48,"7 cm",true)};
    },
    trapezia2020:()=>{
      const p=mapPoints(geometry.trapezia2020.points,([x,y])=>[30+28*x,265-28*y]);
      return {box:"0 0 350 305",body:poly([p.O,p.R,p.S,p.O])+poly([p.J,p.M])+poly([p.K,p.N])+parallel(p.J,p.M)+parallel(p.K,p.N)+parallel(p.R,p.S)+
        labels(p,{O:[-6,-14],J:[-19,-3],K:[-20,0],R:[-18,17],S:[8,17],M:[10,0],N:[10,4]})};
    },
    parallelogram2020:()=>{
      const p=mapPoints(geometry.parallelogram2020.points,([x,y])=>[30+4.3*x,252-4.3*y]);
      return {box:"0 0 345 290",body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.K,p.P,p.N])+poly([p.K,p.M])+poly([p.L,p.Q])+
        labels(p,{J:[4,-12],K:[-4,23],L:[-17,17],M:[-10,-12],N:[-4,-12],P:[6,16],Q:[10,2],R:[-28,-2]})};
    },
    reflex2020:()=>{
      const p=mapPoints(geometry.reflex2020.points,([x,y])=>[70+34*x,220-34*y]);
      return {box:"0 0 335 255",body:poly([p.U,p.A,p.B,p.C,p.V])+parallel(p.A,p.U)+parallel(p.V,p.C)+
        arc(p.U,p.A,p.B,29)+arc(p.A,p.B,p.C,19,true)+arc(p.V,p.C,p.B,25)+
        text(p.A[0]+144,p.A[1]+17,"α")+text(p.B[0]+24,p.B[1]+7,"β")+text(p.C[0]-18,p.C[1]-31,"γ")};
    },
    triangles2020:()=>{
      const p=mapPoints(geometry.triangles2020.points,([x,y])=>[174+132*x,150-132*y]);
      return {box:"0 0 340 275",body:poly([p.J,p.K,p.L,p.J,p.M,p.L,p.N,p.M])+poly([p.K,p.N])+arc(p.L,p.K,p.N,28)+
        labels(p,{J:[-17,-8],K:[-17,19],L:[-8,24],M:[5,-12],N:[8,19]})};
    },
    rectangle2020:()=>{
      const p=mapPoints(geometry.rectangle2020.points,([x,y])=>[35+11*x,175-11*y]);
      return {box:"0 0 350 215",body:poly([p.J,p.K,p.L,p.M,p.J])+poly([p.K,p.N,p.L])+
        labels(p,{J:[-18,-10],K:[-18,20],L:[7,20],M:[8,-8],N:[-4,-14]})};
    },
    circle2020:()=>{
      const p=mapPoints(geometry.circle2020.points,([x,y])=>[170+15*x,150-15*y]);
      return {box:"0 0 340 300",body:circle([170,150],112.5)+poly([p.J,p.K,p.L,p.M,p.N,p.L])+
        labels(p,{J:[-19,7],K:[-7,-13],L:[9,7],M:[-6,22],N:[-19,16]})};
    },
    bars2020:()=>{
      const g=geometry.bars2020;let body="";
      for(let f=0;f<=8;f+=2)body+=path(`M50 ${190-18*f}H325`,true)+text(39,195-18*f,f,true,'text-anchor="end"');
      body+=path("M50 31V190H325");
      g.values.forEach((value,i)=>{
        body+=`<rect x="${69+51*i}" y="${190-18*g.frequencies[i]}" width="25" height="${18*g.frequencies[i]}" fill="#e4e4e4" stroke="#111" stroke-width="1.15"/>`;
        body+=text(81.5+51*i,212,value,true,'text-anchor="middle"');
      });
      body+=text(184,243,"參加活動的次數",true,'text-anchor="middle"')+text(17,114,"學生人數",true,'text-anchor="middle" transform="rotate(-90 17 114)"');
      return {box:"0 0 350 265",body,caption:"圖",label:"每週活動次數的棒形圖"};
    },
    exponential2020:()=>{
      const g=geometry.exponential2020,map=([x,y])=>[175+57*x,242-24*y];let body=axes(175,242,25,325,20,269);
      for(const base of [g.a,g.b])body+=poly(Array.from({length:85},(_,i)=>{const x=-2.1+i*.05;return map([x,g.coefficient*base**x]);}));
      body+=text(29,28,"h(x)")+text(287,28,"g(x)")+text(156,262,"O")+text(328,261,"x")+text(156,18,"y")+text(154,199,"2",true);
      return {box:"0 0 350 285",body};
    },
    transform2020:()=>{
      const [a,b]=geometry.transform2020.intercepts,map=([x,y])=>[150+12*x,225-30*y];
      return {box:"0 0 350 270",body:axes(150,225,28,329,22,254)+poly([map([a,0]),map([13,b*(1-13/a)])])+
        path(`M${150+12*a} 221V229 M146 ${225-30*b}H154`)+text(150+12*a,247,"−6",true,'text-anchor="middle"')+text(133,230-30*b,"2",true)+
        text(132,246,"O")+text(322,247,'x<tspan dy="-6" style="font-size:11px">3</tspan>')+
        path("M132 10L135 8L138 16L142 3H154")+text(145,16,"y")};
    },
    prism2020:()=>{
      const p=mapPoints(geometry.prism2020.points,([x,y,z])=>[40+8*x+8*y,330+3*x-3*y-8*z]);
      return {box:"0 0 270 405",body:poly([p.J,p.K,p.L,p.M,p.N,p.J])+poly([p.N,p.P,p.M])+poly([p.K,p.P])+poly([p.J,p.L],true)+poly([p.K,p.Q,p.M,p.K],true)+
        labels(p,{J:[-18,4],K:[-3,22],L:[9,9],M:[8,-6],N:[-17,-5],P:[8,4],Q:[-18,3]})};
    },
    tangents2020:()=>{
      const g=geometry.tangents2020,map=([x,y])=>[172+112*x,275-112*y],p=mapPoints(g.points,map);
      return {box:"0 0 350 315",body:circle(map(g.centre),112*g.radius)+circle(map(g.innerCentre),112*g.innerRadius)+
        poly([p.J,p.K,p.L,p.J])+poly([p.M,p.N])+poly([p.P,p.T])+arc(p.J,p.K,p.L,21)+
        labels(p,{J:[-18,-7],K:[10,0],L:[-5,23],M:[-28,14],N:[3,-10],P:[-12,23],T:[4,23]})};
    }
  };
  window.pilotDiagram2020Geometry=geometry;
  window.pilotDiagram2020=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label||"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption||"圖（不按比例）"}</figcaption></figure>`:"";
  };
})();
