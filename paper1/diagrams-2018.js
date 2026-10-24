(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18)=>`<text x="${x}" y="${y}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2018]||window.PILOT_2018).questions[n-1].diagram;
  const rad=Math.PI/180;
  const drawings={
    circleAngles2018:()=>{
      const cx=185,cy=145,r=112,points=spec(8).angles.map(a=>[cx+r*Math.cos(a*rad),cy-r*Math.sin(a*rad)]);
      const [J,K,L,M,N]=points;
      const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>a.map((v,i)=>v-b[i]);
      const d=sub(M,J),e=sub(N,K),t=cross(sub(K,J),e)/cross(d,e),P=J.map((v,i)=>v+t*d[i]);
      return {box:"0 0 370 300",body:`<circle cx="${cx}" cy="${cy}" r="${r}" ${stroke}/>`+
        poly([J,K,L,M,N,K])+poly([J,M])+
        label(J[0]-23,J[1]-7,"J")+label(K[0]+9,K[1]-7,"K")+label(L[0]+14,L[1]+6,"L")+
        label(M[0]+5,M[1]+23,"M")+label(N[0]-20,N[1]+23,"N")+label(P[0]-5,P[1]-12,"P")+
        label(J[0]+29,J[1]+17,"x")+label(P[0]-5,P[1]+32,"y")+label(L[0]-37,L[1]+3,"2θ"),
        label:"J、K、L、M、N 共圓，JK 平行 NM，JM 與 KN 相交於 P；角 KLM 為 2θ，角 KJM 為 x，角 NPM 為 y"};
    },
    boxAges2018:()=>{
      const d=spec(10),x=v=>35+(v-20)*7.2,[lo,q1,med,q3,hi]=d.values.map(x);
      let body=path(`M${lo} 65H${q1}M${q3} 65H${hi}M${lo} 53V77M${hi} 53V77`)+path(`M${q1} 42H${q3}V88H${q1}ZM${med} 42V88`)+path("M35 110H360");
      d.values.forEach((v,i)=>{body+=path(`M${x(v)} 107V114`)+label(x(v)-7,136,d.labels[i],i<3,17);});
      body+=label(155,164,"年齡（歲）",true,15);
      return {box:"0 0 390 185",body,caption:"甲組義工年齡的框線圖",label:"甲組年齡的最小值 22、下四分位數 29、中位數 39、上四分位數 a、最大值 b"};
    },
    frequencyBooks2018:()=>{
      const d=spec(11),left=140,w=48;
      let body=path("M10 16H380V106H10ZM10 61H380M140 16V106");
      for(let i=1;i<5;i++)body+=path(`M${left+w*i} 16V106`);
      body+=label(21,44,"損壞書本數目",true,15)+label(49,89,"箱數",true,15);
      d.values.forEach((v,i)=>{body+=label(left+w*i+19,44,v,true,17)+label(left+w*i+18,89,d.frequencies[i],i!==0,17);});
      return {box:"0 0 390 125",body,caption:"",label:"損壞書本數目為 0、1、2、3、4 的箱數分別為 k、4、12、8、10"};
    },
    trapezium2018:()=>{
      const {jk,jn,ln}=spec(13),kn=Math.sqrt(jn*jn-jk*jk),lm=kn*ln/jk,s=7.4;
      const K=[48,260],J=[48,260-jk*s],N=[48+kn*s,260],L=[48+(kn+ln)*s,260],M=[L[0],260-lm*s];
      return {box:"0 0 390 300",body:poly([J,K,L,M,J])+poly([J,N,M])+path("M48 249H59V260M311 260V249H322")+
        label(J[0]-23,J[1]+2,"J")+label(K[0]-22,K[1]+15,"K")+label(N[0]-6,N[1]+25,"N")+
        label(L[0]+9,L[1]+15,"L")+label(M[0]+9,M[1]-8,"M"),
        label:"梯形 JKLM，JK 平行 ML，K、N、L 共線，角 JKL 與角 JNM 均為直角"};
    },
    flatCard2018:()=>{
      const {side,atJ,atK}=(window.PAPER1_PILOTS?.[2018]||window.PILOT_2018).questions[16].partDiagrams.a;
      const other=180-atJ-atK,diagonal=side*Math.sin(atJ*rad)/Math.sin(other*rad),p=side*Math.cos(atK*rad),h=side*Math.sin(atK*rad);
      const flat=([x,y])=>[65+3.9*x,127-3.9*y];
      const K=flat([0,0]),M=flat([diagonal,0]),J=flat([p,h]),L=flat([diagonal-p,-h]);
      return {box:"0 0 390 242",body:poly([J,K,L,M,J])+poly([K,M],true)+
        label(J[0]+2,J[1]-13,"J")+label(K[0]-24,K[1]+4,"K")+label(L[0]-4,L[1]+24,"L")+label(M[0]+12,M[1]+4,"M"),
        caption:"圖甲（不按比例）",label:"圖甲：平行四邊形 JKLM 及摺線 KM"};
    },
    foldCard2018:()=>{
      const {side,atJ,atK,jl}=(window.PAPER1_PILOTS?.[2018]||window.PILOT_2018).questions[16].partDiagrams.b,other=180-atJ-atK;
      const diagonal=side*Math.sin(atJ*rad)/Math.sin(other*rad),p=side*Math.cos(atK*rad),h=side*Math.sin(atK*rad);
      const delta=2*p-diagonal,phi=Math.acos((delta*delta+2*h*h-jl*jl)/(2*h*h));
      const project=([x,y,z])=>[65+3.9*x-1.5*z,116+.5*x-3*y-2*z];
      const K2=project([0,0,0]),M2=project([diagonal,0,0]),J2=project([p,h,0]),L2=project([diagonal-p,h*Math.cos(phi),h*Math.sin(phi)]);
      return {box:"0 0 390 190",body:poly([J2,K2,L2,M2,J2])+poly([K2,M2])+poly([J2,L2],true)+
        label(J2[0]+7,J2[1]-11,"J")+label(K2[0]-24,K2[1]+8,"K")+label(L2[0]-21,L2[1]-9,"L")+label(M2[0]+12,M2[1]+5,"M"),
        caption:"圖乙（不按比例）",
        label:"圖甲：平行四邊形 JKLM 及摺線 KM。圖乙：沿 KM 摺起後的紙卡，J 與 L 的距離為 32 cm"};
    }
  };
  window.pilotDiagram2018=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2018]=window.pilotDiagram2018;
})();
