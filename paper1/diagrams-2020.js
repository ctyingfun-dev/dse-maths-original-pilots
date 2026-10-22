(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18)=>`<text x="${x}" y="${y}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2020]||window.PILOT_2020).questions[n-1].diagram;
  const r=Math.PI/180;
  const drawings={
    angleNetwork2020:()=>{
      const {alpha,beta}=spec(8),a=Math.tan(alpha*r),b=Math.tan(beta*r);
      const J=[10,0],N=[0,0],K=[5,5*a],L=[10*a/(a+b),10*a*b/(a+b)],M=[5-5*a/b,0];
      const slope=L[1]/(L[0]-M[0]),px=slope*M[0]/(slope-a),P=[px,a*px];
      const map=([x,y])=>[35+32*x,235-42*y];
      const [j,k,l,m,n,p]=[J,K,L,M,N,P].map(map);
      return {box:"0 0 390 275",body:poly([n,l,j,n])+poly([k,m,l])+poly([n,k])+
        label(j[0]+10,j[1]+6,"J")+label(k[0]+7,k[1]-10,"K")+label(l[0]-3,l[1]-14,"L")+
        label(m[0]-5,m[1]+23,"M")+label(n[0]-20,n[1]+8,"N")+label(p[0]-18,p[1]-5,"P"),
        label:"J、K、L 共線，J、M、N 共線，KM 平行 LN，KN 與 LM 交於 P 的幾何圖"};
    },
    stemLeaf2020:()=>{
      const {rows}=spec(11);
      let body=label(36,29,"幹（十位）",true,15)+label(160,29,"葉（個位）",true,15)+path("M28 40H360M138 14V204");
      rows.forEach(({stem,leaves},i)=>{
        body+=label(100,68+30*i,stem,true,16);
        leaves.forEach((leaf,j)=>{body+=label(163+29*j,68+30*i,leaf,typeof leaf==="number",16);});
      });
      return {box:"0 0 385 220",body,caption:"任務完成時間的分布（單位：分鐘）",label:"任務完成時間幹葉圖，單位為分鐘，幹為十位，葉為個位"};
    },
    tangentSecant2020:()=>{
      const {tangent:t,near:v}=spec(18),far=t*t/v,diameter=far-v,radius=diameter/2;
      const O=[0,radius],J=[0,0],T=[t,0],ot=Math.hypot(t,radius);
      const toward=[-t/ot,radius/ot],K=T.map((x,i)=>x+v*toward[i]),L=T.map((x,i)=>x+far*toward[i]);
      const scale=230/diameter,map=([x,y])=>[150+scale*x,260-scale*y];
      const [o,j,k,l,end]=[O,J,K,L,T].map(map);
      return {box:`0 0 ${Math.ceil(end[0]+36)} 294`,body:`<circle cx="${o[0]}" cy="${o[1]}" r="${radius*scale}" ${stroke}/>`+
        poly([j,l,end,j])+poly([j,k])+label(j[0]-5,j[1]+27,"J",false,26)+label(k[0]+10,k[1]-4,"K",false,26)+
        label(l[0]-27,l[1]-4,"L",false,26)+label(end[0]+10,end[1]+6,"T",false,26),
        label:"圓 C 在 J 點的切線 TJ，割線依次通過 T、K、L"};
    },
    inclinedCard2020:()=>{
      const {ab,ad,angleB:b,angleC:c,angleA:a,tilt}=spec(19);
      const bc=ab*Math.sin((180-b-c)*r)/Math.sin(c*r);
      const A=[ab*Math.cos(b*r),ab*Math.sin(b*r)],B=[0,0],C=[bc,0];
      const direction=(180+b+a)*r,D=[A[0]+ad*Math.cos(direction),A[1]+ad*Math.sin(direction)];
      const map=([x,y,z])=>[50+2.6*x+.9*y,270+.25*x-.6*y-5*z];
      const lift=([x,y])=>map([x,y*Math.cos(tilt*r),y*Math.sin(tilt*r)]);
      const [p,q,s,t]=[A,B,C,D].map(lift);
      const ground=[[-8,-20,0],[110,-20,0],[110,38,0],[-8,38,0],[-8,-20,0]].map(map);
      const outline=[p,q,s,t,p];
      return {box:"0 110 390 240",body:poly(ground,true)+
        `<polygon points="${outline.slice(0,4).map(x=>x.join(",")).join(" ")}" fill="#fff"/>`+poly(outline)+
        label(p[0]-4,p[1]-14,"A")+label(q[0]-22,q[1]-21,"B")+label(s[0]-3,s[1]+39,"C")+label(t[0]+10,t[1]+3,"D"),
        label:"斜坡上的共面測站 A、B、C、D 界定區域 ABCD，B、C 位於水平基準面上，A、D 位於該基準面上方"};
    }
  };
  window.pilotDiagram2020=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption||"圖（不按比例）"}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2020]=window.pilotDiagram2020;
})();
