(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=d=>`<path d="${d}" ${stroke}/>`;
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const polar=a=>[140+70*Math.cos(a*Math.PI/180),110-70*Math.sin(a*Math.PI/180)];
  const poly=points=>path("M"+points.map(p=>p.join(" ")).join("L"));
  const drawings={
    diameter2023:()=>{
      const [j,k,l,m]=[180,108,0,274].map(polar);
      const n=[k[0]+(m[0]-k[0])*(110-k[1])/(m[1]-k[1]),110];
      return {box:"0 0 280 220",body:`<circle cx="140" cy="110" r="70" ${stroke}/>`+
        poly([j,k,l,m,j])+poly([j,l])+poly([k,m])+
        labels([[50,116,"J"],[109,31,"K"],[220,116,"L"],[143,201,"M"],[n[0]+7,n[1]+18,"N"]])};
    },
    crossed2023:()=>({box:"0 0 290 240",body:path("M105 100L150 40L150 200L225 100Z")+
      labels([[86,103,"J"],[234,105,"K"],[144,29,"L"],[144,220,"M"],[156,119,"N"]])}),
    pyramid2023:()=>({box:"0 0 300 225",body:path("M50 165L150 25L255 165L50 165L165 105L150 25 M165 105L255 165")+
      labels([[30,184,"J"],[263,183,"K"],[169,100,"L"],[143,17,"M"]])})
  };
  window.pilotDiagram2023=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="本題附圖，不按比例繪製">${d.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
