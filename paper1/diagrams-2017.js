(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18)=>`<text x="${x}" y="${y}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2017]||window.PILOT_2017).questions[n-1].diagram;
  const rad=Math.PI/180;
  const drawings={
    transport2017:()=>{
      const angles=spec(7).angles,c=[190,132],r=108,p=a=>[c[0]+r*Math.cos(a*rad),c[1]+r*Math.sin(a*rad)];
      let a=-90,body=`<circle cx="190" cy="132" r="108" ${stroke}/>`;
      const names=["巴士","鐵路","單車","步行"];
      angles.forEach((v,i)=>{const mid=(a+v/2)*rad;body+=poly([c,p(a)]);body+=label(c[0]+77*Math.cos(mid)-17,c[1]+77*Math.sin(mid)+5,names[i],true,16);a+=v;});
      body+=path("M178 132V120H190")+label(205,126,"144°",true,16)+label(192,176,"x",false,17);
      return {box:"0 0 380 265",body,caption:"學生上學交通方式的分佈",label:"巴士圓心角144度，步行圓心角90度，鐵路圓心角x，餘下部分為單車"};
    },
    sector2017:()=>{
      const a=spec(10).angle,r=248,O=[43,247],p=t=>[O[0]+r*Math.cos(t*rad),O[1]-r*Math.sin(t*rad)];
      const J=p(4*a),K=p(2*a),L=p(0),T=J.map((v,i)=>(v+L[i])/2);
      const body=poly([O,J,L,O])+poly([J,K,L])+poly([O,K])+path(`M${J.join(" ")} A${r} ${r} 0 0 1 ${L.join(" ")}`)+
        label(O[0]-23,O[1]+8,"O")+label(J[0]-7,J[1]-12,"J")+label(K[0]+12,K[1]-5,"K")+
        label(L[0]+10,L[1]+9,"L")+label(T[0]-22,T[1]+2,"T");
      return {box:"0 0 350 280",body,label:"OJKL：OJ、OK、OL相等；OK與弦JL交於中點T，J、K、L依次位於圓弧上"};
    },
    stemTimes2017:()=>{
      const d=spec(11);let body=path("M15 42H365M123 16V155")+label(28,32,"幹（十位）",true,16)+label(144,32,"葉（個位）",true,16);
      d.stems.forEach((v,i)=>{const y=71+34*i;body+=label(91,y,v,true,18);d.leaves[i].forEach((leaf,j)=>{body+=label(142+j*25,y,leaf,typeof leaf==='number',18);});});
      return {box:"0 0 390 175",body,caption:"完成跑步所用時間的分佈（秒）",label:"幹7：2、2、2、3、5、6、8、9、9；幹8：a、7、7、8；幹9：1、b"};
    },
    metalSheet2017:()=>{
      const d=spec(19),jl=d.kl*Math.sin((180-d.atJ-d.atL)*rad)/Math.sin(d.atJ*rad),jk=d.kl*Math.sin(d.atL*rad)/Math.sin(d.atJ*rad);
      const lt=jl*d.ln/(d.jm-d.ln),jt=jl+lt,kt=Math.sqrt(d.kl*d.kl+lt*lt-2*d.kl*lt*Math.cos((180-d.atL)*rad));
      const jx=(jt*jt+kt*kt-jk*jk)/(2*kt),jy=Math.sqrt(jt*jt-jx*jx-d.jm*d.jm);
      const J3=[jx,jy,d.jm],L3=J3.map(v=>v*d.ln/d.jm),project=([x,y,z])=>[350-4.1*x+0.55*y,229-1.6*y-5.3*z];
      const J=project(J3),K=project([kt,0,0]),L=project(L3),M=project([jx,jy,0]),N=project([L3[0],L3[1],0]),T=project([0,0,0]);
      let body=poly([[25,169],[353,169],[386,267],[58,267],[25,169]],true)+poly([J,K,L,J])+poly([L,T],true)+poly([J,M],true)+poly([L,N],true);
      body+=label(J[0]-9,J[1]-12,"J")+label(K[0]-8,K[1]+23,"K")+label(L[0]+3,L[1]-11,"L")+label(M[0]-7,M[1]+23,"M")+label(N[0]-7,N[1]+23,"N")+label(T[0]+1,T[1]+16,"T");
      body+=label(286,291,"水平地面",true,15);
      return {box:"0 0 400 315",body,label:"金屬薄片JKL只有K在水平地面；J及L的鉛垂足分別為M及N；JL延長至地面上的T"};
    }
  };
  window.pilotDiagram2017=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2017]=window.pilotDiagram2017;
})();
