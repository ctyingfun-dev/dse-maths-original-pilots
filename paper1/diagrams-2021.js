(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const upright=(x,y,text,extra="")=>`<text x="${x}" y="${y}" style="font-style:normal" ${extra}>${text}</text>`;
  const r=Math.PI/180;
  const drawings={
    similarTriangles2021:()=>{
      const map=([x,y])=>[30+2.9*x,135-2.9*y];
      // J is the intersection of circles (L,28) and (N,96); KM is 3/4 of JL.
      const jx=(28**2+100**2-96**2)/200,jy=Math.sqrt(28**2-jx**2);
      const [J,K,L,M,N]=[[jx,jy],[100-72,21],[0,0],[100-72,0],[100,0]].map(map);
      return {box:"0 0 350 175",body:poly([J,L,N,J])+poly([K,M])+
        labels([[J[0]-5,J[1]-12,"J"],[K[0]+5,K[1]-11,"K"],[L[0]-19,L[1]+20,"L"],[M[0]-5,M[1]+23,"M"],[N[0]+9,N[1]+12,"N"]])};
    },
    readingBar2021:()=>{
      const values=[31,32,33,34,35,36],heights=[10,20,18,8,11,5],frequencies=[10,"k",18,8,11,5];
      let body=poly([[48,45],[48,208],[342,208]])+
        upright(195,23,"學生全年閱讀科普文章數目的分布",'text-anchor="middle"')+
        upright(195,259,"閱讀篇數",'text-anchor="middle"')+
        upright(18,130,"學生人數",'text-anchor="middle" transform="rotate(-90 18 130)"');
      values.forEach((value,i)=>{
        const x=64+46*i,height=heights[i]*7,y=208-height;
        body+=`<rect x="${x}" y="${y}" width="25" height="${height}" fill="#e6e6e6" stroke="#111" stroke-width="1.15"/>`;
        body+=upright(x+12.5,230,value,'text-anchor="middle"');
        body+=i===1?`<text x="${x+12.5}" y="${y-8}" text-anchor="middle">k</text>`:upright(x+12.5,y-8,frequencies[i],'text-anchor="middle"');
      });
      return {box:"0 0 370 280",body,caption:"圖",label:"學生全年閱讀科普文章數目的分布棒形圖"};
    },
    foldedTrapezium2021:()=>{
      const h=52*Math.sin(55*r),v=52*Math.cos(55*r),d=46+h/Math.tan(65*r);
      const map=([x,y,z])=>[100+3*x+1.35*y,155-.95*y-3.45*z];
      const [J,K,L,M,N]=[[0,0,v],[0,-h,0],[46,-h,0],[d,0,0],[0,0,0]].map(map);
      return {box:"0 0 335 235",body:poly([J,K,L,M,J])+poly([J,L])+poly([J,N,K],true)+poly([N,M],true)+
        labels([[J[0]-5,J[1]-13,"J"],[K[0]-20,K[1]+16,"K"],[L[0]-4,L[1]+23,"L"],[M[0]+10,M[1]+5,"M"],[N[0]+5,N[1]-10,"N"]])};
    }
  };
  window.pilotDiagram2021=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label||"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption||"圖（不按比例）"}</figcaption></figure>`:"";
  };
})();
