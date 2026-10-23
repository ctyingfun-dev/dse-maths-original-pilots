(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18)=>`<text x="${x}" y="${y}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2019]||window.PILOT_2019).questions[n-1].diagram;
  const rad=Math.PI/180;
  const drawings={
    pieFiles2019:()=>{
      const {values,angles}=spec(8),cx=185,cy=145,r=112;
      const point=(a,radius=r)=>[cx+radius*Math.cos(a*rad),cy+radius*Math.sin(a*rad)];
      let body=`<circle cx="${cx}" cy="${cy}" r="${r}" ${stroke}/>`;
      let start=-90;
      for(const i of [3,2,1,0]) {
        const end=start+angles[i],mid=(start+end)/2;
        body+=poly([[cx,cy],point(start)]);
        const p=point(mid,77);
        body+=label(p[0]-5,p[1]+6,values[i],true);
        if(i===0||i===1){const p=point(mid,40);body+=label(p[0]-16,p[1]+5,`${angles[i]}°`,true,15);}
        start=end;
      }
      body+=path(`M${cx} ${cy-17}h17v17`);
      return {box:"0 0 370 280",body,caption:"資料夾內的文件數目分布",label:"文件數目圓形圖：1 份佔 126 度，4 份佔 72 度，9 份佔直角，另有 7 份文件的類別"};
    },
    stemCooling2019:()=>{
      const {rows}=spec(12);
      let body=label(47,27,"幹（十位）",true,15)+label(158,27,"葉（個位）",true,15)+path("M29 40H410M139 12V180");
      rows.forEach(({stem,leaves},i)=>{
        body+=label(103,67+31*i,stem,true,17);
        leaves.forEach((leaf,j)=>body+=label(161+28*j,67+31*i,leaf,typeof leaf==="number",17));
      });
      return {box:"0 0 430 196",body,caption:"冷卻時間（分鐘）",label:"20 件陶器冷卻時間的幹葉圖，幹為十位，葉為個位，a、b、c 是未知葉"};
    },
    circleSector2019:()=>{
      const {angle}=spec(13),cx=190,cy=145,r=110;
      const pt=a=>[cx+r*Math.cos(a*rad),cy-r*Math.sin(a*rad)];
      const d=360-2*angle,J=pt(0),K=pt(2*d),L=pt(180),M=pt(d),N=pt(56),O=[cx,cy];
      const t=(cy-K[1])/(M[1]-K[1]),P=[K[0]+t*(M[0]-K[0]),cy];
      return {box:"0 0 380 286",body:`<circle cx="${cx}" cy="${cy}" r="${r}" ${stroke}/>`+
        poly([J,K,L,M,N,J])+poly([J,L])+poly([K,M])+poly([K,O,M])+
        label(J[0]+12,J[1]+6,"J")+label(K[0]-5,K[1]+25,"K")+label(L[0]-23,L[1]+6,"L")+
        label(M[0]-15,M[1]-13,"M")+label(N[0]+4,N[1]-13,"N")+label(O[0]+4,O[1]-12,"O")+label(P[0]-22,P[1]-7,"P"),
        label:"J、K、L、M、N 共圓，JL 為直徑，KM 與 JL 交於 P，O 為圓心"};
    },
    squareSimilarity2019:()=>{
      const J=[290,40],K=[290,220],L=[110,220],M=[110,40],N=[110+180*(Math.SQRT2-1),40];
      const ratio=180/(180+N[0]-110),P=[110+(N[0]-110)*ratio,220-180*ratio],T=[K[0]+L[0]-P[0],K[1]+L[1]-P[1]];
      return {box:"0 0 390 385",body:poly([J,K,L,M,J])+poly([K,M])+poly([L,N])+poly([K,T,L])+
        label(J[0]+11,J[1]+4,"J")+label(K[0]+12,K[1]+5,"K")+label(L[0]-22,L[1]+10,"L")+label(M[0]-21,M[1]+3,"M")+
        label(N[0]-5,N[1]-12,"N")+label(P[0]-29,P[1]+10,"P")+label(T[0]+9,T[1]+15,"T"),
        label:"正方形 JKLM，N 在 JM 上，KM 與 LN 交於 P，KT 平行 NL，LT 平行 MK"};
    },
    tetrahedron2019:()=>{
      const {side,km,angle}=spec(18),a=Math.asin(km*Math.sin(angle*rad)/side),d=Math.PI-angle*rad-a,jp=side-km*Math.cos(d);
      const J=[310,238],K=[207,325],L=[47,190],M=[195,33],P=J.map((x,i)=>x+(M[i]-x)*jp/side);
      return {box:"0 0 370 366",body:poly([J,K,L,M,J])+poly([K,M])+poly([J,L],true)+poly([K,P,L],true)+
        label(J[0]+13,J[1]+6,"J")+label(K[0]-4,K[1]+26,"K")+label(L[0]-23,L[1]+6,"L")+
        label(M[0]-5,M[1]-13,"M")+label(P[0]+12,P[1]+1,"P"),
        label:"四面體 JKLM，P 在棱 JM 上，KP 垂直 JM，連接 LP"};
    }
  };
  window.pilotDiagram2019=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption||"圖（不按比例）"}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2019]=window.pilotDiagram2019;
})();
