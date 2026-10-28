(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18)=>`<text x="${x}" y="${y}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2016]||window.PILOT_2016).questions[n-1].diagram;
  const drawings={
    frequencyParcels2016:()=>{
      const d=spec(9),left=25,right=385,mid=235,row=29;
      function table(top,head1,head2,values,frequencies){
        let body=path(`M${left} ${top}H${right}V${top+7*row}H${left}ZM${mid} ${top}V${top+7*row}`);
        for(let i=1;i<7;i++)body+=path(`M${left} ${top+i*row}H${right}`);
        body+=label(left+41,top+21,head1,true,17)+label(mid+28,top+21,head2,true,17);
        values.forEach((v,i)=>{body+=label(left+63,top+(i+1)*row+21,v,true,18)+label(mid+61,top+(i+1)*row+21,frequencies[i],typeof frequencies[i]==="number",18);});
        return body;
      }
      return {box:"0 0 410 465",body:table(12,"質量（kg）","頻數",d.intervals,d.frequencies)+table(245,"質量少於（kg）","累積頻數",d.bounds,d.cumulative),caption:"",label:"包裹質量頻數表及累積頻數表；六組質量為 0.2 至 0.4、0.5 至 0.7、0.8 至 1.0、1.1 至 1.3、1.4 至 1.6、1.7 至 1.9 kg；頻數為 a、5、b、c、12、4；相應累積頻數為 3、x、17、y、41、z"};
    },
    lengthBars2016:()=>{
      const d=spec(12),heights=[9,11,9,7.5,3],x=i=>78+i*58,base=190;
      let body=path("M52 34V190H378")+label(9,28,"件數",true,16)+label(179,247,"長度（cm）",true,16);
      d.values.forEach((value,i)=>{
        const h=heights[i]*12;
        body+=`<rect x="${x(i)}" y="${base-h}" width="28" height="${h}" fill="#e8e8e8" stroke="#111" stroke-width="1.15"/>`;
        body+=label(x(i)+8,base-h-9,d.frequencies[i],typeof d.frequencies[i]==="number",18)+label(x(i)+5,base+27,value,true,18);
      });
      return {box:"0 0 410 265",body,caption:"零件的長度分佈",label:"8、9、10、11、12 cm 的零件數目分別為 9、a、9、b、3；a 及 b 的柱高僅示意"};
    },
    congruentTriangles2016:()=>{
      const d=spec(13),half=d.uv/2,h=Math.sqrt(d.ju*d.ju-half*half),s=320/(2*d.ku+d.uv);
      const point=(x,y)=>[35+s*x,185-s*y],K=point(0,0),U=point(d.ku,0),M=point(d.ku+half,0),V=point(d.ku+d.uv,0),L=point(2*d.ku+d.uv,0),J=point(d.ku+half,h);
      return {box:"0 0 390 225",body:poly([J,K,L,J])+poly([U,J,V])+poly([J,M])+label(J[0]-6,J[1]-13,"J")+[[K,"K"],[U,"U"],[M,"M"],[V,"V"],[L,"L"]].map(([p,t])=>label(p[0]-6,p[1]+24,t)).join(""),label:"三角形 JKL；K、U、M、V、L 依次共線，連接 JU、JM、JV；KU=LV，UM=VM，角 JUL 等於角 JVK"};
    },
    tetrahedron2016:()=>{
      const d=spec(19),r=Math.PI/180,angleM=Math.asin(d.jk*Math.sin(d.atJ*r)/d.km),angleK=Math.PI-d.atJ*r-angleM;
      const mx=d.km*Math.cos(d.atK*r),my=d.km*Math.sin(d.atK*r);
      const jx=(d.jk*d.jk+d.kl*d.kl-d.jl*d.jl)/(2*d.kl),jy=(d.jk*d.km*Math.cos(angleK)-jx*mx)/my,jz=Math.sqrt(d.jl*d.jl-(jx-d.kl)**2-jy*jy);
      const project=([x,y,z])=>[40+13*x+7*y,205-5*x+4*y-27*z];
      const K=project([0,0,0]),L=project([d.kl,0,0]),M=project([mx,my,0]),J=project([jx,jy,jz]);
      return {box:"0 0 360 255",body:poly([J,K,M,J])+poly([K,L,M],true)+poly([J,L],true)+label(J[0]-5,J[1]-13,"J")+label(K[0]-20,K[1]+8,"K")+label(L[0]+7,L[1]-5,"L")+label(M[0]+8,M[1]+12,"M"),label:"四面體 JKLM，JL、KL、LM 為虛線；JK=13 cm，JL=5 cm，KL=12 cm，KM=20 cm，角 KJM 為 82 度，角 LKM 為 40 度"};
    }
  };
  window.pilotDiagram2016=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2016]=window.pilotDiagram2016;
})();
