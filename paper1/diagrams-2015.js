(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18)=>`<text x="${x}" y="${y}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2015]||window.PILOT_2015).questions[n-1].diagram;
  const rad=Math.PI/180;
  const drawings={
    circleAngles2015:()=>{
      const d=spec(8),r=130,c=[190,162];
      const point=a=>[c[0]+r*Math.cos(a*rad),c[1]-r*Math.sin(a*rad)];
      const J=point(90),K=point(90+2*d.atM),M=point(90-2*d.atM),L=point(90-2*d.atM-2*d.atK);
      const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),t=length(K,L)/length(J,L),N=L.map((v,i)=>v+t*(J[i]-v));
      const arc=(A,O,B,radius)=>{
        let a=Math.atan2(A[1]-O[1],A[0]-O[0]),b=Math.atan2(B[1]-O[1],B[0]-O[0]),diff=(b-a+3*Math.PI)%(2*Math.PI)-Math.PI;
        const start=[O[0]+radius*Math.cos(a),O[1]+radius*Math.sin(a)],end=[O[0]+radius*Math.cos(a+diff),O[1]+radius*Math.sin(a+diff)];
        return path(`M${start.join(" ")}A${radius} ${radius} 0 0 ${diff>0?1:0} ${end.join(" ")}`);
      };
      const body=`<circle cx="${c[0]}" cy="${c[1]}" r="${r}" ${stroke}/>`+poly([J,K,L,M,J])+poly([J,L])+poly([K,M])+poly([K,N])+arc(J,M,K,28)+arc(L,K,M,42)
        +label(J[0]-6,J[1]-11,"J")+label(K[0]-23,K[1]+7,"K")+label(L[0]+6,L[1]+23,"L")+label(M[0]+10,M[1]+8,"M")+label(N[0]+9,N[1]-4,"N")
        +label(M[0]-57,M[1]-17,`${d.atM}°`,true,17)+label(K[0]+49,K[1]+18,`${d.atK}°`,true,17);
      return {box:"0 0 390 330",body,label:"J、K、L、M 依次在圓上；N 在線段 JL 上，KL=LN，JK=JM；角 JMK 為 64 度，角 LKM 為 21 度"};
    },
    stemMasses2015:()=>{
      const d=spec(12),top=60,row=33;
      let body=path(`M125 15V${top+(d.stems.length-1)*row+13}M18 42H365`)+label(27,30,"幹（十位）",true,17)+label(153,30,"葉（個位）",true,17);
      d.stems.forEach((s,i)=>{body+=label(95,top+i*row,s,true,19);d.leaves[i].forEach((v,j)=>body+=label(149+j*31,top+i*row,v,true,19));});
      return {box:"0 0 390 220",body,caption:"",label:"貨箱質量幹葉圖，單位 kg；幹為十位，葉為個位。4：4、6、7；5：1、2、3、4、7；6：0、1、1、3、6、9；7：1、2、5、7、9；8：2"};
    },
    squareCrossing2015:()=>{
      const d=spec(13),t=d.lv,s=t*Math.sqrt(t*t-d.uw*d.uw)/d.uw,scale=230/s;
      const point=(x,y)=>[70+x*scale,270-y*scale],J=point(0,s),K=point(0,0),L=point(s,0),M=point(s,s),U=point(t,0),V=point(s,t),W=point(s*s*t/(s*s+t*t),s*t*t/(s*s+t*t));
      const body=poly([J,K,L,M,J])+poly([J,U])+poly([K,V])+label(J[0]-23,J[1]-6,"J")+label(K[0]-23,K[1]+15,"K")+label(L[0]+8,L[1]+15,"L")+label(M[0]+8,M[1]-6,"M")+label(U[0]-5,U[1]+25,"U")+label(V[0]+10,V[1]+5,"V")+label(W[0]+10,W[1]-28,"W");
      return {box:"0 0 380 315",body,label:"正方形 JKLM，U 在 KL 上，V 在 LM 上，JU 與 KV 相交於 W；JU=KV，LV=17 cm，UW=8 cm"};
    },
    scoreTable2015:()=>{
      const d=spec(15),left=12,top=12,w=366,row=39,col=122;
      let body=path(`M${left} ${top}H${left+w}V${top+3*row}H${left}ZM${left+col} ${top}V${top+3*row}M${left+2*col} ${top}V${top+3*row}M${left} ${top+row}H${left+w}M${left} ${top+2*row}H${left+w}`);
      ["考試","平均值","標準差"].forEach((v,i)=>body+=label(left+col*i+35,top+27,v,true,17));
      d.subjects.forEach((v,i)=>{body+=label(left+42,top+(i+1)*row+27,v,true,17)+label(left+col+33,top+(i+1)*row+27,`${d.means[i]} 分`,true,18)+label(left+2*col+33,top+(i+1)*row+27,`${d.sds[i]} 分`,true,18);});
      return {box:"0 0 390 143",body,caption:"",label:"歷史得分的平均值 72 分、標準差 8 分；地理得分的平均值 63 分、標準差 12 分"};
    },
    foldedCard2015:()=>{
      const d=spec(19),a=d.long,b=d.short,beta=d.corner*rad;
      const side=Math.sqrt(a*a+b*b-2*a*b*Math.cos(beta)),gamma=Math.acos((b*b+side*side-a*a)/(2*b*side)),delta=d.foldAngle*rad-gamma;
      const half=side*Math.cos(delta),height=side*Math.sin(delta),angle=gamma+delta;
      const rawJ=[0,height],rawL=[-half,0],rawM=[half,0],rawK=[-half+b*Math.cos(angle),b*Math.sin(angle)],rawPrime=[half-b*Math.cos(angle),b*Math.sin(angle)];
      const scale=4.2,flat=p=>[195+scale*p[0],188-scale*p[1]],J=flat(rawJ),K=flat(rawK),L=flat(rawL),M=flat(rawM),P=flat(rawPrime);
      let body=poly([J,K,L,M,P,J])+poly([J,L],true)+poly([J,M],true)
        +label(J[0]-6,J[1]-12,"J")+label(K[0]-25,K[1]+4,"K")+label(L[0]-13,L[1]+23,"L")+label(M[0]+5,M[1]+23,"M")+label(P[0]+9,P[1]+4,"L′")+label(171,239,"圖 (a)",true,17);
      // A metric realization of the folded tetrahedron, projected without exposing solution auxiliaries.
      const kn=Math.sqrt(b*b-half*half),ky=(height*height+kn*kn-a*a)/(2*height),kz=Math.sqrt(kn*kn-ky*ky);
      const project=([x,y,z])=>[195+4*x-3*y,435-0.7*x-1.8*y-7*z];
      const J3=project([0,height,0]),K3=project([0,ky,kz]),L3=project([-half,0,0]),M3=project([half,0,0]);
      body+=poly([J3,K3,M3,L3,J3])+poly([K3,L3])+poly([J3,M3],true)
        +label(J3[0]+6,J3[1]-12,"J")+label(K3[0]-17,K3[1]-12,"K")+label(L3[0]-20,L3[1]+12,"L")+label(M3[0]+10,M3[1]+12,"M")+label(171,489,"圖 (b)",true,17);
      return {box:"0 0 390 510",body,caption:"圖（不按比例）",label:"圖 (a)：五邊形紙板 JKLML′，虛線為摺線 JL、JM。圖 (b)：K 與 L′ 重合後的角錐體 JKLM。JK=JL′=35 cm，KL=L′M=22 cm，角 JKL 及 JL′M 均為 76 度"};
    }
  };
  window.pilotDiagram2015=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2015]=window.pilotDiagram2015;
})();
