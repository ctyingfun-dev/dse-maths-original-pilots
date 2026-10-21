(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const r=Math.PI/180;
  const drawings={
    congruent2022:()=>{
      const t=-Math.sin(82*r)/Math.sin(42*r),c=Math.cos(56*r),s=Math.sin(56*r);
      const map=([x,y])=>[155+105*x,145-105*y];
      const [J,K,L,M,N]=[[0,0],[1+t*c,t*s],[1,0],[c,s],[c+t,s]].map(map);
      return {box:"0 0 310 305",body:poly([K,L,M,N,K])+poly([K,J,L])+poly([M,J,N])+
        labels([[J[0]-19,J[1]+15,"J"],[K[0]+8,K[1]+22,"K"],[L[0]+11,L[1]+8,"L"],[M[0]+5,M[1]-12,"M"],[N[0]-20,N[1]-5,"N"]])};
    },
    board2022:()=>{
      const x=21*Math.cos(100*r),z=21*Math.sin(60*r),y=Math.sqrt(21**2-x*x-z*z);
      const map=([x,y,z])=>[110+6*x+4*y,215-2*y-6*z];
      const J=map([0,0,0]),K=map([28,0,0]),L=map([x,y,z]),M=map([(28+x)/2,y/2,z/2]),H=map([x,y,0]);
      const ground=[[-12,-7,0],[32,-7,0],[32,13,0],[-12,13,0]].map(map);
      // The board hides the rear ground edge; keep its projection distinct from JL.
      const crossing=[K[0]+(L[0]-K[0])*(ground[2][1]-K[1])/(L[1]-K[1]),ground[2][1]];
      const leftCrossing=[J[0]+(L[0]-J[0])*(ground[2][1]-J[1])/(L[1]-J[1]),ground[2][1]];
      return {box:"0 0 370 265",body:poly([leftCrossing,ground[3],ground[0],ground[1],ground[2],crossing])+
        poly([J,K,L,J])+poly([J,M])+poly([L,H,J],true)+
        labels([[J[0]-18,J[1]+4,"J"],[K[0]+9,K[1]-8,"K"],[L[0]-6,L[1]-12,"L"],[M[0]+12,M[1],"M"]])};
    }
  };
  window.pilotDiagram2022=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="本題附圖，不按比例繪製">${d.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
