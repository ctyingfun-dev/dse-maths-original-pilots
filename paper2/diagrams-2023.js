(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=d=>`<path d="${d}" ${stroke}/>`;
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const circle=(x,y,r,fill="none")=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#111" stroke-width="1.15"/>`;
  const poly=points=>path("M"+points.map(p=>p.join(" ")).join("L"));
  const polar=(a,r=80)=>[r*Math.cos(a*Math.PI/180),-r*Math.sin(a*Math.PI/180)];
  function intersection(a,b,c,d) {
    const sub=(u,v)=>u.map((x,i)=>x-v[i]),cross=(u,v)=>u[0]*v[1]-u[1]*v[0];
    const u=sub(b,a),v=sub(d,c),t=cross(sub(c,a),v)/cross(u,v);
    return a.map((x,i)=>x+t*u[i]);
  }
  function fitted(points, width=340, height=280) {
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const minX=Math.min(...xs),minY=Math.min(...ys);
    const scale=Math.min((width-70)/(Math.max(...xs)-minX),(height-70)/(Math.max(...ys)-minY));
    return {map:p=>[35+(p[0]-minX)*scale,35+(p[1]-minY)*scale],scale,box:`0 0 ${width} ${height}`};
  }
  const drawings={
    overlap2023:()=>({box:"0 0 300 240",body:
      circle(125,120,87.5,"#ddd")+circle(177.5,120,70,"white")+circle(125,120,87.5)+
      path("M37.5 120H247.5 M177.5 50V190")+
      labels([[19,125,"J"],[175,211,"K"],[218,145,"L"],[176,41,"M"],[94,140,"E"],[254,125,"F"],[159,142,"N"]])}),
    areas2023:()=>({box:"0 0 310 225",body:
      path("M35 175H225L270 45H80Z M35 175L270 45 M80 45L161.667 175")+
      labels([[19,194,"J"],[226,194,"K"],[276,42,"L"],[64,40,"M"],[159,195,"N"],[137,112,"P"]])}),
    angles2023:()=>({box:"0 0 300 260",body:
      path("M50 125L150 25L250 125 M70 105V220L230 160V105 M142 33L150 41L158 33 M66 155l4-7 4 7 M226 136l4-7 4 7")+
      path("M70 128Q62 127 57 119 M230 128Q238 127 243 119 M70 195Q83 195 92 212 M230 138Q212 138 209 168")+
      labels([[246,146,"u"],[43,146,"v"],[81,190,"w"],[205,151,"z"]])}),
    polygons2023:()=>{
      function regular(start,next,n) {
        const points=[start,next];let [dx,dy]=next.map((v,i)=>v-start[i]);
        const a=2*Math.PI/n;
        for(let i=2;i<n;i++) {
          [dx,dy]=[dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a)];
          points.push([points.at(-1)[0]+dx,points.at(-1)[1]+dy]);
        }
        return points;
      }
      const square=regular([0,0],[1,0],4);
      const octagon=regular([0,0],[0,1],8);
      const pentagon=regular([0,0],octagon.at(-1),5);
      const raw=[...square,...octagon.slice(2),...pentagon.slice(2)].map(([x,y])=>[x,-y]);
      const f=fitted(raw,340,340),map=p=>f.map([p[0],-p[1]]);
      const names=["J","K","L","M","N","P","Q","R","S","T","U","V","W"];
      const offsets=[[6,20],[9,1],[9,-4],[8,-8],[-17,-3],[-19,4],[-18,15],[-4,21],[5,22],[-14,17],[-14,20],[9,16],[10,-2]];
      return {box:f.box,body:[square,octagon,pentagon].map(ps=>poly([...ps,ps[0]].map(map))).join("")+
        poly([map(square[1]),map(pentagon.at(-1))])+
        labels(raw.map((p,i)=>{const a=f.map(p);return [a[0]+offsets[i][0],a[1]+offsets[i][1],names[i]];}))};
    },
    rectangle2023:()=>({box:"0 0 310 275",body:
      path("M40 235H120V35H40Z M40 35L140 235H120 M40 235L248 131L120 35 M112 199l-4-8 8-4")+
      labels([[20,254,"J"],[107,256,"K"],[121,23,"L"],[24,25,"M"],[128,177,"N"],[146,253,"P"],[259,135,"Q"]])}),
    cyclic2023:()=>{
      const [j,k,l,m]=[220,330,24,78].map(a=>polar(a));
      const p=intersection(j,k,m,l),q=intersection(j,m,k,l);
      const raw=[j,k,l,m,p,q],f=fitted(raw,330,300),ps=raw.map(f.map);
      const [J,K,L,M,P,Q]=ps;
      return {box:f.box,body:poly([J,P,M,Q,K,J])+poly([M,K])+
        labels(ps.map((a,i)=>[a[0]+[-20,-7,10,-19,9,0][i],a[1]+[12,22,2,-5,14,-12][i],["J","K","L","M","P","Q"][i]]))};
    },
    trapezium2023:()=>({box:"0 0 330 215",body:
      path("M295 50H35L139 123.296H190.323Z M139 50V123.296 M139 50L190.323 123.296 M139 113.296H149V123.296 M184.587 115.104l8.192-5.736 5.736 8.192")+
      path("M267 50Q267 60 274 68")+
      labels([[300,46,"J"],[194,145,"K"],[125,145,"L"],[17,47,"M"],[134,37,"N"],[252,73,"θ"]])}),
    box2023:()=>{
      const x=n=>30+4*n;
      return {box:"0 0 310 160",body:path(`M${x(6)} 65H${x(60)} M${x(6)} 54V76 M${x(18)} 43H${x(42)}V87H${x(18)}Z M${x(27)} 43V87 M${x(60)} 54V76 M30 111H286`)+
        Array.from({length:11},(_,i)=>path(`M${x(i*6)} 107V115`)).join("")+
        labels(Array.from({length:11},(_,i)=>[x(i*6)-5,135,String(i*6)]))};
    },
    tangents2023:()=>{
      const [j,k,l]=[270,-14,132].map(a=>polar(a,65));
      const tangent=(p,a)=>[p,[p[0]+Math.sin(a*Math.PI/180),p[1]+Math.cos(a*Math.PI/180)]];
      const tj=tangent(j,270),tk=tangent(k,-14),tl=tangent(l,132);
      const s=intersection(...tj,...tl),m=intersection(...tj,...tk),n=intersection(...tk,...tl),p=intersection(l,k,...tj);
      const raw=[j,k,l,s,m,n,p,[-65,-65],[65,65]],f=fitted(raw,360,280);
      const [J,K,L,S,M,N,P]=raw.slice(0,7).map(f.map),centre=f.map([0,0]);
      return {box:f.box,body:circle(...centre,65*f.scale)+poly([S,N,M,S])+poly([L,P,S])+poly([J,K])+poly([J,L])+
        labels([J,K,L,S,M,N,P].map((a,i)=>[a[0]+[-8,9,-18,-22,-1,2,8][i],a[1]+[22,-1,-8,14,22,-12,14][i],["J","K","L","S","M","N","P"][i]]))};
    }
  };
  window.pilotDiagram2023=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="本題附圖，不按比例繪製">${d.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
