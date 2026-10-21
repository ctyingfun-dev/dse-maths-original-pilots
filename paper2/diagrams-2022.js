(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const circle=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" ${stroke}/>`;
  const r=Math.PI/180,polar=(a,cx=160,cy=140,radius=85)=>[cx+radius*Math.cos(a*r),cy-radius*Math.sin(a*r)];
  const drawings={
    dots2022:()=>{
      let body="";
      for(let n=1;n<=3;n++) {
        const centre=55+(n-1)*110,left=centre-12*n;
        for(let row=0;row<=n;row++)for(let col=0;col<3*row+1;col++)body+=`<circle cx="${left+8*col}" cy="${30+17*row}" r="2" fill="#111"/>`;
        body+=`<text x="${centre}" y="116" text-anchor="middle" style="font-style:normal">圖案 ${n}</text>`;
      }
      return {box:"0 0 330 140",body};
    },
    area2022:()=>({box:"0 0 350 260",body:path("M30 220L210 30L310 220Z M102 144L254.444 114.444")+
      labels([[12,241,"J"],[213,21,"K"],[315,241,"L"],[81,144,"M"],[265,112,"N"]])}),
    rectangle2022:()=>({box:"0 0 325 315",body:path("M40 150L200 270L272 174L112 54Z M40 150V270H272V174 M40 260H50V270 M262 270V260H272")+
      labels([[19,151,"J"],[194,294,"K"],[281,172,"L"],[94,48,"M"],[20,287,"E"],[278,293,"F"]])}),
    equilateral2022:()=>{
      const t=Math.sin(26*r)/Math.sin(94*r),map=([x,y])=>[40+250*x,250-250*y];
      const [J,K,L,M,N]=[[0,0],[1,0],[.5,Math.sqrt(3)/2],[t/2,t*Math.sqrt(3)/2],[(1+t)/2,(1-t)*Math.sqrt(3)/2]].map(map);
      return {box:"0 0 330 285",body:poly([J,K,L,J])+poly([K,M])+poly([J,N])+
        labels([[J[0]-18,J[1]+19,"J"],[K[0]+9,K[1]+19,"K"],[L[0]-5,L[1]-12,"L"],[M[0]-22,M[1]-2,"M"],[N[0]+10,N[1],"N"]])};
    },
    parallelogram2022:()=>({box:"0 0 305 215",body:path("M70 40H265L225 155H30Z M52 155A22 22 0 1 1 37.228 134.222 M203 155A22 22 0 1 0 232.228 134.222")+
      labels([[84,65,"a"],[237,65,"b"],[13,190,"c"],[242,190,"d"]])}),
    central2022:()=>{
      const O=[160,140],[J,K,L]=[244,0,152].map(a=>polar(a));
      return {box:"0 0 310 265",body:circle(...O,85)+poly([O,J,K,O,L,J])+
        labels([[J[0]-16,J[1]+22,"J"],[K[0]+12,K[1]+5,"K"],[L[0]-23,L[1]-4,"L"],[O[0]+1,O[1]-13,"O"]])};
    },
    cyclic2022:()=>({box:"0 0 250 310",body:circle(107.6,211.2,Math.hypot(57.6,28.8))+
      path("M165.2 240H50V86.4Z M165.2 240L50 182.4L96.08 147.84 M62 240V228H50")+
      labels([[175,248,"J"],[30,257,"K"],[32,78,"L"],[106,144,"M"],[29,186,"N"]])}),
    line2022:()=>({box:"0 0 325 245",body:path("M25 190H295 M195 220V25 M30 200L270 120 M105 185V195 M190 130H200")+
      labels([[298,207,"x"],[204,31,"y"],[177,213,"O"],[96,214,"−2"],[177,135,"1"],[39,93,"mx+ny=5"]])}),
    tangent2022:()=>{
      const [J,K,L,M]=[270,-8,60,176].map(a=>polar(a)),U=[J[0]-100,J[1]],V=[K[0]+65*Math.sin(8*r),K[1]-65*Math.cos(8*r)];
      return {box:"0 0 320 270",body:circle(160,140,85)+poly([J,K,L,M,J])+poly([J,L])+poly([K,M])+poly([U,J])+poly([K,V])+
        labels([[J[0]-6,J[1]+23,"J"],[K[0]+11,K[1]+12,"K"],[L[0]+2,L[1]-10,"L"],[M[0]-24,M[1]+3,"M"],[U[0]-10,U[1]+20,"U"],[V[0]+7,V[1]-3,"V"]])};
    },
    cube2022:()=>({box:"0 0 350 315",body:
      path("M45 85L185 30L300 75L160 130Z M45 85V230L160 275L300 220V75 M160 130V275")+
      path("M185 30V175L45 230 M185 175L300 220",true)+path("M185 30L45 230L300 75L185 175",true)+
      labels([[310,76,"J"],[310,234,"K"],[154,300,"L"],[140,147,"M"],[25,88,"N"],[180,20,"P"],[166,170,"Q"],[24,245,"R"]])})
  };
  window.pilotDiagram2022=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="本題附圖，不按比例繪製">${d.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
