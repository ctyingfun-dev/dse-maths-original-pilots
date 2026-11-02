(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const label=(x,y,text,upright=false,size=18,anchor="start")=>`<text x="${x}" y="${y}" text-anchor="${anchor}" style="font-size:${size}px${upright?';font-style:normal':""}">${text}</text>`;
  const spec=n=>(window.PAPER1_PILOTS?.[2014]||window.PILOT_2014).questions[n-1].diagram;
  const rad=Math.PI/180;
  const arrow=(a,b)=>{
    const v=[b[0]-a[0],b[1]-a[1]],s=Math.hypot(...v),u=v.map(x=>x/s),n=[-u[1],u[0]];
    return poly([a,b])+poly([[b[0]-8*u[0]+4*n[0],b[1]-8*u[1]+4*n[1]],b,[b[0]-8*u[0]-4*n[0],b[1]-8*u[1]-4*n[1]]]);
  };
  const drawings={
    frequency2014:()=>{
      const d=spec(4),x=10,y=12,col=48,w=370,h=80;
      let body=path(`M${x} ${y}h${w}v${h}h-${w}ZM${x} ${y+40}h${w}M${x+178} ${y}v${h}`);
      for(let i=1;i<4;i++)body+=path(`M${x+178+i*col} ${y}v${h}`);
      body+=label(99,39,"參加次數",true,18,"middle")+label(99,79,"成員人數",true,18,"middle");
      d.values.forEach((v,i)=>body+=label(x+202+i*col,39,v,true,19,"middle")+label(x+202+i*col,79,d.frequencies[i],true,19,"middle"));
      return {box:"0 0 390 108",body,caption:"",label:"工作坊參加次數及頻數：0 次 5 人、1 次 11 人、2 次 13 人、3 次 7 人"};
    },
    similarTriangles2014:()=>{
      const d=spec(9),ln=d.kl*d.kl/d.jl,nx=d.jl-ln,kx=d.jl-(d.kl*d.kl-d.kn*d.kn+ln*ln)/(2*ln),ky=Math.sqrt(d.kn*d.kn-(kx-nx)**2);
      const p=(x,y)=>[45+5.8*x,212-5.8*y],J=p(0,0),K=p(kx,ky),L=p(d.jl,0),N=p(nx,0);
      const body=poly([J,K,L,J])+poly([K,N])+label(J[0]-16,J[1]+18,"J")+label(K[0]-5,K[1]-13,"K")+label(L[0]+9,L[1]+13,"L")+label(N[0]-7,N[1]+26,"N");
      return {box:"0 0 390 260",body,label:"N 在線段 JL 上，角 KJL 等於角 LKN；JL=50 cm，KL=30 cm，KN=24 cm。圖中不預先標示待證直角"};
    },
    journey2014:()=>{
      const d=spec(10),p=(t,s)=>[65+t/d.duration*295,242-s/d.distance*175],O=p(0,0),E=p(d.duration,d.distance),S=p(d.stopStart,d.stopDistance),F=p(d.stopEnd,d.stopDistance);
      const time=t=>{const m=d.startMinutes+t;return `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;};
      let body=arrow([65,250],[65,35])+arrow(O,[397,242])+poly([O,E])+poly([O,S,F,E]);
      body+=poly([[65,E[1]],E,[E[0],242]],true)+poly([[65,S[1]],S,[S[0],242]],true);
      body+=label(55,248,"0",true,16,"end")+label(55,S[1]+5,d.stopDistance,true,16,"end")+label(55,E[1]+5,d.distance,true,16,"end");
      body+=label(65,268,time(0),true,17,"middle")+label(S[0],268,time(d.stopStart),true,17,"middle")+label(E[0],268,time(d.duration),true,17,"middle");
      body+=label(372,293,"時間",true,16,"middle")+label(180,163,"A")+label(313,128,"B");
      body+='<text transform="translate(20 174) rotate(-90)" text-anchor="middle" style="font-size:16px;font-style:normal">與碼頭的距離（km）</text>';
      return {box:"0 0 430 310",body,caption:"路程時間圖",label:"兩車上午 8:10 由碼頭出發，10:40 到達 96 km 外的車站。A 勻速，B 於 9:00 到達 64 km 處並停留，稍後再前進"};
    },
    boxPlot2014:()=>{
      const d=spec(11),p=v=>25+(v-10)*3.1,[a,b,c,e,f]=d.five.map(p);
      let body=path(`M${a} 55H${b}M${e} 55H${f}M${a} 43V67M${f} 43V67M${b} 34H${e}V76H${b}ZM${c} 34V76M15 96H365`);
      d.five.forEach(v=>body+=path(`M${p(v)} 96V101`)+poly([[p(v),77],[p(v),93]],true)+label(p(v),124,v,true,17,"middle"));
      body+=label(200,154,"估值（千元）",true,17,"middle");
      return {box:"0 0 390 170",body,caption:"",label:"雕塑估值框線圖，單位千元：最小值20，下四分位數48，中位數62，上四分位數75，最大值110"};
    },
    frustum2014:()=>{
      const d=spec(14),cx=150,apex=300,s=220/d.height,r=120/d.radius,low=d.height-d.vesselHeight,water=low+d.waterDepth;
      const y=h=>apex-s*h,rx=h=>d.radius*h/d.height*r,ellipse=h=>`<ellipse cx="${cx}" cy="${y(h)}" rx="${rx(h)}" ry="${rx(h)/6}" ${stroke}/>`;
      let body=ellipse(d.height)+ellipse(water)+ellipse(low);
      body+=poly([[cx-rx(d.height),y(d.height)],[cx-rx(low),y(low)]])+poly([[cx+rx(d.height),y(d.height)],[cx+rx(low),y(low)]]);
      body+=poly([[cx-rx(low),y(low)],[cx,apex],[cx+rx(low),y(low)]],true)+poly([[cx,y(d.height)],[cx,apex]],true);
      body+=poly([[cx,y(d.height)],[cx+rx(d.height),y(d.height)]])+label(204,45,`${d.radius} cm`,true,17,"middle");
      const dimension=(x,h1,h2,text)=>path(`M${cx+rx(h1)+5} ${y(h1)}H${x+5}M${cx+rx(h2)+5} ${y(h2)}H${x+5}`,true)+path(`M${x} ${y(h1)}V${y(h2)}M${x-4} ${y(h1)}H${x+4}M${x-4} ${y(h2)}H${x+4}`)+label(x+8,(y(h1)+y(h2))/2+5,text,true,16);
      body+=dimension(267,low,water,`${d.waterDepth} cm`)+dimension(321,low,d.height,`${d.vesselHeight} cm`)+dimension(379,0,d.height,`${d.height} cm`);
      return {box:"0 0 438 324",body,label:"倒置圓錐的底半徑60 cm、高80 cm；切去下端後容器高48 cm，水深24 cm。虛線表示已切去的小圓錐"};
    },
    logGraph2014:()=>{
      const d=spec(15),p=(x,y)=>[80+65*x,215-105*y],y0=-d.slopeNumerator/d.slopeDenominator*d.interceptX;
      let body=arrow([45,215],[358,215])+arrow([80,242],[80,35])+poly([p(-.35,y0-.35*d.slopeNumerator/d.slopeDenominator),p(3.5,y0+3.5*d.slopeNumerator/d.slopeDenominator)]);
      body+=label(65,235,"O")+label(p(d.interceptX,0)[0],239,d.interceptX,true,18,"middle");
      body+=label(314,201,`log<tspan baseline-shift="sub" font-size="12">${d.baseX}</tspan> <tspan font-style="italic">x</tspan>`,true,18)+label(20,27,`log<tspan baseline-shift="sub" font-size="12">${d.baseY}</tspan> <tspan font-style="italic">y</tspan>`,true,18);
      return {box:"0 0 390 260",body,label:"以 log₉ x、log₂₇ y 為坐標變量的直線，斜率為負九分之四，在 log₉ x 軸上的截距為3"};
    },
    dotPatterns2014:()=>{
      const d=spec(16);let body="";
      for(let n=1;n<=3;n++){
        const x=25+(n-1)*124;
        body+=`<circle cx="${x}" cy="48" r="3.4" fill="#111"/>`;
        for(let c=0;c<n;c++)for(let row=0;row<d.difference;row++)body+=`<circle cx="${x+18+18*c}" cy="${30+18*row}" r="3.4" fill="#111"/>`;
        body+=label(x+23,96,`圖案 ${n}`,true,15,"middle");
        if(n<3)body+=arrow([x+68,48],[x+98,48]);
      }
      body+=label(358,55,"…",true,24);
      return {box:"0 0 390 115",body,caption:"",label:"前三個圓片圖案分別有4、7、10片，每次增加3片"};
    },
    pyramidSection2014:()=>{
      const d=spec(17),a=d.length*Math.cos(d.angle*rad)+Math.sqrt(d.edge*d.edge-d.length*d.length*Math.sin(d.angle*rad)**2),tx=a*Math.cos(d.angle*rad),ty=d.width/2,tz=Math.sqrt(a*a-tx*tx-ty*ty);
      const points={J:[0,0,0],K:[d.length,0,0],L:[d.length,d.width,0],M:[0,d.width,0],T:[tx,ty,tz]};
      const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2);
      points.N=mid(points.J,points.K);points.R=mid(points.L,points.M);points.U=mid(points.T,points.K);points.V=mid(points.T,points.L);
      const panel=(y,cut)=>{
        const project=([x,b,z])=>[67+7*x+4*b,y-2.1*b-9*z],p=Object.fromEntries(Object.entries(points).map(([k,v])=>[k,project(v)]));
        let body;
        if(cut){
          body=poly([p.T,p.J,p.N,p.R,p.V,p.T])+poly([p.T,p.U,p.N])+poly([p.U,p.V]);
          body+=poly([p.J,p.M,p.R],true)+poly([p.T,p.M],true);
          body+=poly([p.N,p.K,p.L,p.R],true)+poly([p.U,p.K],true)+poly([p.V,p.L],true);
        }else body=poly([p.T,p.J,p.K,p.L,p.T])+poly([p.T,p.K])+poly([p.J,p.M,p.L],true)+poly([p.T,p.M],true);
        for(const key of ['T','J','K','L','M']){
          const offset={T:[-12,-12],J:[-16,18],K:[6,18],L:[10,5],M:[-30,0]}[key];
          body+=label(p[key][0]+offset[0],p[key][1]+offset[1],key);
        }
        if(cut)for(const [key,dx,dy] of [['N',-5,24],['R',5,-8],['U',-24,14],['V',6,-9]])body+=label(p[key][0]+dx,p[key][1]+dy,key);
        body+=label(180,y+50,cut?"圖 (b)":"圖 (a)",true,17,"middle");
        return body;
      };
      return {box:"0 0 390 510",body:panel(195,false)+panel(440,true),label:"圖(a)為以長方形JKLM為底的角錐體TJKLM；圖(b)標示中點N、R、U、V所組成的梯形截面。JK=20 cm、KL=12 cm、TK=TL=29 cm，角TJK及TML均為108度"};
    },
    linearProgramming2014:()=>{
      const d=spec(18),[a,b,c]=d.line1,[ix,iy]=d.intersection,slope=iy/(ix-d.line2Intercept),y2=-slope*d.line2Intercept,p=(x,y)=>[48+x*1.75,272-y*1.35],polyPoints=[[0,0],[0,y2],[ix,iy],[c/a,0]].map(v=>p(...v));
      let body='<defs><pattern id="hatch-2014-p1-q18" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M-2 2L2 -2M0 7L7 0M5 9L9 5" stroke="#999" stroke-width="0.7"/></pattern></defs>';
      body+=`<polygon points="${polyPoints.map(v=>v.join(',')).join(' ')}" fill="url(#hatch-2014-p1-q18)"/>`;
      body+=arrow([32,272],[365,272])+arrow([48,291],[48,32])+poly([p(0,c/b),p(c/a+8,-8*a/b)])+poly([p(0,y2),p(d.line2Intercept+8,8*slope)]);
      body+=label(30,292,"O")+label(369,279,"x")+label(35,27,"y")+label(72,114,'L<tspan baseline-shift="sub" font-size="12" font-style="normal">1</tspan>')+label(302,242,'L<tspan baseline-shift="sub" font-size="12" font-style="normal">2</tspan>');
      return {box:"0 0 390 310",body,label:"第一象限中位於L₁及L₂下方的陰影可行區域，包含邊界；兩線相交於(60,70)，L₂的x截距為165"};
    },
    tubes2014:()=>{
      const d=spec(19),left=40,width=48,top=20,bottom=124;let body=path(`M${left} ${bottom}H${left+d.count*width}`);
      for(let i=0;i<=d.count;i++)body+=path(`M${left+i*width} ${top}V${bottom}`);
      return {box:"0 0 390 145",body,caption:"六個並排的管子",label:"六個並排、頂部開口的管子，每管最多容納三球"};
    }
  };
  window.pilotDiagram2014=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label}">${d.body}</svg><figcaption>${d.caption===undefined?"圖（不按比例）":d.caption}</figcaption></figure>`:"";
  };
  window.PAPER1_DIAGRAMS_BY_YEAR=window.PAPER1_DIAGRAMS_BY_YEAR||{};
  window.PAPER1_DIAGRAMS_BY_YEAR[2014]=window.pilotDiagram2014;
})();
