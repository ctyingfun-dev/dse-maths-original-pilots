(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=d=>`<path d="${d}" ${stroke}/>`;
  const labels=items=>items.map(([x,y,t])=>`<text x="${x}" y="${y}">${t}</text>`).join("");
  const circle=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" ${stroke}/>`;
  const polar=(a,r=85,cx=150,cy=125)=>[cx+r*Math.cos(a*Math.PI/180),cy-r*Math.sin(a*Math.PI/180)];
  const poly=points=>path(`M${points.map(p=>p.join(" ")).join("L")}`);
  const intersect=(a,b,c,d)=>{
    const cross=(u,v)=>u[0]*v[1]-u[1]*v[0],sub=(u,v)=>u.map((x,i)=>x-v[i]);
    const r=sub(b,a),s=sub(d,c),t=cross(sub(c,a),s)/cross(r,s);
    return a.map((v,i)=>v+t*r[i]);
  };
  const drawings={
    squareAreas2024:()=>({box:"0 0 270 225",body:
      path("M35 35V195H195V35Z M35 35L115 195 M141.667 35L221.667 195H195 M35 195L195 141.667")+
      labels([[20,27,"J"],[19,214,"K"],[190,215,"L"],[199,28,"M"],[109,216,"N"],[135,26,"P"],[225,210,"Q"],[203,140,"R"],[115,164,"S"]])}),
    joinedRight2024:()=>({box:"0 0 320 225",body:
      path("M280 130L105 30L70 130L70 195Z M70 130H280 M105 30V130 M70 142H82V130")+
      labels([[286,139,"J"],[100,150,"K"],[51,139,"L"],[99,22,"M"],[52,214,"N"]])}),
    parallelReflex2024:()=>({box:"0 0 265 250",body:
      path("M20 35H150L50 100L150 150L100 210H20 M53 31l7 4-7 4 M53 206l7 4-7 4")+
      path("M130 35A23 23 0 1 1 132 47 M64 91Q80 100 65 108 M133 141A24 24 0 1 1 137 165 M109 198Q95 190 84 210")+
      labels([[205,31,"u"],[81,106,"v"],[210,158,"w"],[84,191,"z"]])}),
    rhombusRectangle2024:()=>({box:"0 0 285 195",body:
      path("M30 100L100 150L170 100L100 50Z M30 100H240V50H170V100 M100 50V150 M100 100L170 50 M100 150L240 50")+
      labels([[12,106,"J"],[92,172,"K"],[171,121,"L"],[91,38,"M"],[84,88,"N"],[165,39,"P"],[244,116,"Q"],[245,49,"R"],[137,62,"S"]])}),
    twoDiameters2024:()=>{
      const points=[106,0,286,222,180].map(a=>polar(a));
      const [j,k,l,m,n]=points,q=intersect(j,l,k,m);
      return {box:"0 0 300 255",body:circle(150,125,85)+poly([...points,j])+poly([j,l])+poly([k,n])+poly([k,m])+
        labels(points.map((p,i)=>i===3?[66,210,"M"]:[...polar([106,0,286,222,180][i],103),["J","K","L","M","N"][i]]))+
        labels([[q[0]-25,q[1]-3,"Q"]])};
    },
    nestedRight2024:()=>({box:"0 0 310 195",body:
      path("M25 155H265V25Z M145 155L265 25 M253 155V143H265 M62 155Q62 143 58 137 M175 155Q175 139 166 131")+
      labels([[12,178,"J"],[139,178,"K"],[267,176,"L"],[269,24,"M"],[72,148,"α"],[183,146,"β"]])}),
    box2024:()=>({box:"0 0 325 170",body:
      path("M25 70H295 M25 58V82 M58 43H125V97H58Z M89 43V97 M295 58V82")+
      labels([[17,121,"48"],[49,121,"64"],[80,121,"79"],[120,121,"h"],[282,121,"180"],[112,153,"時間（分鐘）"]])}),
    linearized2024:()=>({box:"0 0 290 220",body:
      path("M30 175H265 M65 205V20 M65 50L225 205 M58 50H72 M195 169V181")+
      labels([[74,24,"y³"],[259,195,"√t"],[43,195,"O"],[31,55,"27"],[191,198,"1"]])}),
    tangentExternal2024:()=>{
      const points=[16,-40,-140,130,120].map(a=>polar(a,80,200,125));
      const [j,k,l,m,n]=points,r=intersect(k,l,m,n);
      const tangent=[j[0]+58*Math.cos(106*Math.PI/180),j[1]-58*Math.sin(106*Math.PI/180)];
      return {box:"-45 0 370 245",body:circle(200,125,80)+poly([...points,j])+poly([j,m])+poly([j,k])+poly([j,l])+
        poly([r,k])+poly([r,n])+poly([j,tangent])+
        labels(points.slice(0,3).map((p,i)=>i===2?[125,204,"L"]:[...polar([16,-40,-140][i],96,200,125),["J","K","L"][i]]))+
        labels([[125,54,"M"],[159,30,"N"]])+
        labels([[r[0]-17,r[1]+12,"R"],[tangent[0]+5,tangent[1]-5,"T"]])};
    },
    tetrahedron2024:()=>({box:"0 0 310 235",body:
      path("M45 195L150 20L260 195Z M45 195L135 140L260 195")+
      `<path d="M150 20L135 140" ${stroke} stroke-dasharray="5 4"/>`+
      labels([[28,216,"J"],[117,141,"K"],[264,216,"L"],[146,14,"M"]])})
  };
  window.pilotDiagram2024=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="本題附圖，不按比例繪製">${d.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
