(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=(d,dashed=false)=>`<path d="${d}" ${stroke}${dashed?' stroke-dasharray="5 4"':""}/>`;
  const poly=(points,dashed=false)=>path("M"+points.map(p=>p.join(" ")).join("L"),dashed);
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const upright=(x,y,text,extra="")=>`<text x="${x}" y="${y}" style="font-style:normal" ${extra}>${text}</text>`;
  const circle=(x,y,radius)=>`<circle cx="${x}" cy="${y}" r="${radius}" ${stroke}/>`;
  const r=Math.PI/180;
  const polar=(angle,cx,cy,radius)=>[cx+radius*Math.cos(angle*r),cy-radius*Math.sin(angle*r)];
  const unit=(a,b)=>{const length=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/length,(b[1]-a[1])/length];};
  const tick=(a,b,t=.5)=>{
    const [x,y]=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],[u,v]=unit(a,b);
    return poly([[x-4*v,y+4*u],[x+4*v,y-4*u]]);
  };
  const parallel=(a,b,t=.65)=>{
    const [x,y]=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],[u,v]=unit(a,b);
    return poly([[x-4*u-3*v,y-4*v+3*u],[x,y],[x-4*u+3*v,y-4*v-3*u]]);
  };
  const right=(a,b,c,size=10)=>{
    const u=unit(b,a),v=unit(b,c);
    return poly([[b[0]+size*u[0],b[1]+size*u[1]],[b[0]+size*(u[0]+v[0]),b[1]+size*(u[1]+v[1])],[b[0]+size*v[0],b[1]+size*v[1]]]);
  };
  const arc=(a,b,c,radius)=>{
    const u=unit(b,a),v=unit(b,c),cross=u[0]*v[1]-u[1]*v[0];
    return path(`M${b[0]+radius*u[0]} ${b[1]+radius*u[1]}A${radius} ${radius} 0 0 ${cross>0?1:0} ${b[0]+radius*v[0]} ${b[1]+radius*v[1]}`);
  };
  const drawings={
    dots2021:()=>{
      let body="";
      for(let n=1;n<=3;n++) {
        const centre=49+(n-1)*117;
        for(let row=1;row<=n;row++)for(let col=0;col<3*row+1;col++)body+=`<circle cx="${centre+7*(col-1.5*row)}" cy="${32+18*(row-1)}" r="2.2" fill="#111"/>`;
        body+=upright(centre,99,n,'text-anchor="middle"');
        if(n<3)body+=path(`M${centre+44} 49H${centre+67} M${centre+61} 44L${centre+67} 49L${centre+61} 54`);
      }
      return {box:"0 0 350 120",body};
    },
    angles2021:()=>{
      const slope=Math.tan(67*r),diagonal=Math.tan(35*r),mx=slope/(slope-diagonal),ex=slope/(slope+diagonal);
      const map=([x,y])=>[25+190*x,265-190*y];
      const [J,K,L,M,N]=[[0,0],[.5,slope/2],[1,0],[mx,mx*diagonal],[ex,ex*diagonal]].map(map);
      return {box:"0 0 335 300",body:poly([J,K,L,M,J,L])+tick(J,K)+tick(K,L)+parallel(J,K,.76)+parallel(L,M)+arc(L,J,M,25)+
        labels([[J[0]-18,J[1]+17,"J"],[K[0]-5,K[1]-13,"K"],[L[0]+4,L[1]+21,"L"],[M[0]+7,M[1]-8,"M"],[N[0]+14,N[1]+10,"N"]])};
    },
    rectangle2021:()=>{
      const map=([x,y])=>[35+12*x,260-12*y];
      // N is the orthogonal projection of K onto JL; P is K reflected in N.
      const [J,K,L,M,N,P,Q]=[[0,0],[20,0],[20,12],[0,12],[250/17,150/17],[160/17,300/17],[12.8,12]].map(map);
      return {box:"0 0 320 300",body:poly([J,K,L,M,J])+poly([J,L])+poly([K,P,L])+right(K,N,L)+
        labels([[J[0]-17,J[1]+18,"J"],[K[0]+6,K[1]+18,"K"],[L[0]+9,L[1]+3,"L"],[M[0]-20,M[1]+3,"M"],[N[0]-22,N[1]+25,"N"],[P[0]-5,P[1]-12,"P"],[Q[0]-20,Q[1]+17,"Q"]])};
    },
    square2021:()=>{
      const map=([x,y])=>[30+76*x,270-76*y];
      const [J,K,L,M,N,P]=[[0,0],[3,0],[3,3],[0,3],[2,0],[3,2/3]].map(map);
      return {box:"0 0 310 305",body:poly([J,K,L,M,J])+poly([M,N,P,M])+right(M,N,P)+
        labels([[J[0]-17,J[1]+20,"J"],[K[0]+8,K[1]+20,"K"],[L[0]+8,L[1]-8,"L"],[M[0]-17,M[1]-10,"M"],[N[0]-5,N[1]+23,"N"],[P[0]+10,P[1]+4,"P"]])};
    },
    circle2021:()=>{
      const angles=[0,86,122,208,280],points=angles.map(a=>polar(a,160,155,112)),[J,K,L,M,N]=points;
      return {box:"0 0 330 305",body:circle(160,155,112)+poly([J,L,M,J,N,M])+poly([K,M])+tick(J,L,.55)+tick(K,M,.6)+arc(L,J,M,24)+
        labels(angles.map((a,i)=>{const p=polar(a,160,155,130);return [p[0]-5,p[1]+5,["J","K","L","M","N"][i]];}))};
    },
    trig2021:()=>{
      const map=([x,y])=>[135+.68*x,195-.68*y];
      const [J,K,L,M]=[[200,150],[200,0],[0,0],[-90,120]].map(map);
      return {box:"0 0 315 245",body:poly([M,J,K,L,M])+poly([L,J])+right(M,L,J)+right(J,K,L)+arc(J,M,L,23)+arc(J,L,K,26)+
        labels([[J[0]+7,J[1]-9,"J"],[K[0]+8,K[1]+20,"K"],[L[0]-15,L[1]+22,"L"],[M[0]-21,M[1]+2,"M"],[M[0]+34,M[1]+17,"α"],[L[0]+37,L[1]-10,"β"]])};
    },
    box2021:()=>{
      const x=value=>30+8*(value-12);
      let body="";
      for(let value=12;value<=48;value+=3) {
        body+=`<path d="M${x(value)} 45V150" fill="none" stroke="#aaa" stroke-width=".6" stroke-dasharray="2 3"/>`;
        body+=path(`M${x(value)} 150V155`);
        if(value%6===0)body+=upright(x(value),178,value,'text-anchor="middle"');
      }
      body+=path(`M${x(12)-12} 150H${x(48)+12}`)+
        path(`M${x(15)} 88H${x(21)} M${x(39)} 88H${x(45)} M${x(15)} 78V98 M${x(45)} 78V98 M${x(21)} 70H${x(39)}V106H${x(21)}Z M${x(33)} 70V106`)+
        upright(180,206,"時間（分鐘）",'text-anchor="middle"');
      return {box:"0 0 350 225",body,caption:"圖",label:"交通時間分布的框線圖"};
    },
    log2021:()=>{
      const map=([x,y])=>[270+35*x,190-60*y];
      const a=map([-6.7,-6.7/3+2]),b=map([.8,.8/3+2]);
      const log=variable=>`log<tspan dy="4" style="font-size:11px">3</tspan><tspan dy="-4"> </tspan><tspan style="font-style:italic">${variable}</tspan>`;
      return {box:"0 0 350 245",body:path("M20 190H318 M311 186L318 190L311 194 M270 224V27 M266 34L270 27L274 34")+
        poly([a,b])+path("M60 185V195 M265 70H275")+
        upright(60,212,"−6",'text-anchor="middle"')+upright(249,67,"2")+labels([[249,212,"O"]])+
        upright(280,219,log("x"))+upright(244,19,log("y")),caption:"圖",label:"log3 x 與 log3 y 的線性關係圖"};
    },
    intersection2021:()=>{
      const t=180/639,map=([x,y])=>[35+.28*x,221.32-.28*y];
      const [J,K,L,M,N,P,Q,R]=[[0,594],[864,594],[864,0],[0,0],[576,594],[864,324],[432,0],[576-144*t,594-594*t]].map(map);
      return {box:"0 0 320 260",body:poly([J,K,L,M,J])+poly([J,P])+poly([N,Q])+poly([M,R])+
        labels([[J[0]-14,J[1]-10,"J"],[K[0]+6,K[1]-10,"K"],[L[0]+7,L[1]+20,"L"],[M[0]-18,M[1]+20,"M"],[N[0]-4,N[1]-12,"N"],[P[0]+10,P[1]+4,"P"],[Q[0]-5,Q[1]+24,"Q"],[R[0]+12,R[1]-4,"R"]])};
    },
    tangent2021:()=>{
      const cx=145,cy=180,radius=90,[J,K,L,M]=[0,204,180,76].map(a=>polar(a,cx,cy,radius));
      const c=Math.cos(76*r),s=Math.sin(76*r),slope=Math.tan(12*r),ex=(1-s*slope)/(c+s*slope);
      const N=[cx+radius*ex,cy-radius*slope*(ex+1)],P=[M[0]-70*s,M[1]-70*c];
      return {box:"0 0 340 295",body:circle(cx,cy,radius)+poly([J,L,K,J])+poly([L,M])+poly([L,N,P])+parallel(J,K)+parallel(N,L)+arc(J,L,K,22)+
        labels([[J[0]+10,J[1]+4,"J"],[K[0]-17,K[1]+20,"K"],[L[0]-20,L[1]+4,"L"],[M[0]-5,M[1]-12,"M"],[N[0]+9,N[1]+5,"N"],[P[0]-22,P[1]+2,"P"]])};
    }
  };
  window.pilotDiagram2021=kind=>{
    const d=drawings[kind]?.();
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="${d.label||"本題附圖，不按比例繪製"}">${d.body}</svg><figcaption>${d.caption||"圖（不按比例）"}</figcaption></figure>`:"";
  };
})();
