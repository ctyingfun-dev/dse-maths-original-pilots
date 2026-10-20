(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=d=>`<path d="${d}" ${stroke}/>`;
  const labels=items=>items.map(([x,y,text])=>`<text x="${x}" y="${y}">${text}</text>`).join("");
  const circle=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" ${stroke}/>`;
  const drawings={
    lines:()=>({box:"0 0 280 170",body:
      path("M15 116H260 M150 150V12 M260 116l-7-4 M260 116l-7 4 M150 12l-4 7 M150 12l4 7 M40 126L211 12 M40 121.43L233 51.77")+
      labels([[217,20,"D₁"],[239,50,"D₂"],[132,138,"O"],[263,138,"z"],[162,20,"y"]])}),
    trapezoid:()=>({box:"0 0 270 160",body:
      path("M60 20H180L240 130H30Z M180 20L30 130 M180 20L162 86H90 M162 86L240 130")+
      labels([[45,16,"J"],[184,16,"K"],[244,148,"L"],[11,148,"M"],[72,82,"N"],[181,91,"P"]])}),
    rectangleExtension:()=>({box:"0 0 270 170",body:
      path("M30 136H230V100H30Z M30 136L230 46V100")+
      labels([[236,154,"J"],[236,108,"K"],[12,106,"L"],[12,154,"M"],[113,86,"N"],[236,44,"P"]])}),
    concave:()=>({box:"0 0 270 155",body:
      path("M25 20H210L150 75L220 130H25Z M25 31H36V20 M25 119H36V130 M190 20A20 20 0 0 0 195 34 M166 60A22 22 0 0 1 167 89 M200 130A20 20 0 0 1 204 118")+
      labels([[161,42,"α"],[180,120,"γ"],[180,82,"β"]])}),
    radiusChord:()=>({box:"0 0 270 210",body:
      circle(130,110,80)+path("M146.63 31.75L193.04 159.25 M130 110L146.63 31.75 M130 110H210 M54.82 137.36L210 110 M54.82 137.36L193.04 159.25")+
      `<circle cx="130" cy="110" r="2.5" fill="#111"/>`+
      labels([[147,22,"J"],[218,115,"K"],[197,179,"L"],[34,148,"M"],[110,104,"H"],[183,101,"N"]])}),
    tangentCircle:()=>({box:"0 0 280 225",body:
      circle(130,110,90)+path("M52.85 156.35H232.02 M52.85 156.35L210.19 69.14L207.15 156.35 M210.19 69.14L173.63 188.72 M173.63 188.72L232.02 156.35")+
      labels([[220,66,"J"],[33,164,"K"],[171,212,"L"],[225,140,"M"],[166,146,"N"],[244,166,"P"]])}),
    rightCyclic:()=>({box:"0 0 280 215",body:
      path("M115 180H245L115 31.58L82.14 118.19Z M115 180V31.58 M82.14 118.19L245 180 M115 168H127V180 M91.49 121.74L95.04 112.39L85.69 108.84")+
      labels([[111,202,"J"],[250,198,"K"],[111,22,"L"],[63,122,"M"]])}),
    prism:()=>({box:"0 0 270 180",body:
      path("M30 42L165 85L225 30L30 42 M30 42V112L165 155L225 100V30 M165 85V155 M30 42L165 155 M225 30L165 155")+
      `<path d="M30 112L225 100" fill="none" stroke="#111" stroke-width=".9" stroke-dasharray="5 4"/>`+
      labels([[176,96,"J"],[228,28,"K"],[15,43,"L"],[12,130,"M"],[173,174,"N"],[236,111,"P"]])})
  };
  window.pilotDiagram2026=kind=>{
    const drawing=drawings[kind]?.();
    return drawing?`<figure class="diagram"><svg viewBox="${drawing.box}" role="img" aria-label="本題附圖，不按比例繪製">${drawing.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
