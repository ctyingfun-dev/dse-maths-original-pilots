(() => {
  const stroke='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const path=d=>`<path d="${d}" ${stroke}/>`;
  const label=(x,y,text)=>`<text x="${x}" y="${y}">${text}</text>`;
  const labels=points=>points.map(([x,y,t])=>label(x,y,t)).join("");
  const circle=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" ${stroke}/>`;
  const drawings={
    intercepts2025:()=>({box:"0 0 280 230",body:
      path("M25 185H260 M140 220V15 M260 185l-7-4 M260 185l-7 4 M140 15l-4 7 M140 15l4 7 M80 211L156 13 M60 180V190 M135 105H145")+
      labels([[260,209,"x"],[151,20,"y"],[123,207,"O"],[50,208,"−2"],[119,110,"2"],[165,25,"K"]])}),
    parallelogram2025:()=>({box:"0 0 310 220",body:
      path("M40 190H220L255 85H75Z M48.75 163.75L76 190L264.21 57.37L255 85")+
      labels([[24,207,"J"],[219,207,"K"],[260,93,"L"],[61,81,"M"],[72,208,"N"],[31,160,"P"],[221,76,"Q"],[271,54,"R"]])}),
    triangleSplit2025:()=>({box:"0 0 280 220",body:
      path("M20 185L80 30L250 185Z M80 30V185")+
      labels([[5,204,"J"],[74,22,"K"],[251,204,"L"],[74,204,"M"]])}),
    squareRhombus2025:()=>({box:"0 0 280 260",body:
      path("M180 220H240V160H180Z M240 220L137.57 117.57H197.57L240 160 M240 160L35.15 75.15L180 220 M137.57 117.57L180 220")+
      labels([[244,238,"J"],[166,238,"K"],[181,155,"L"],[245,159,"M"],[200,111,"N"],[126,110,"P"],[19,72,"Q"]])}),
    rectanglePoint2025:()=>({box:"0 0 280 220",body:
      path("M30 190V25H240V190Z M30 190L46.464 133.552L240 190")+
      labels([[15,207,"J"],[15,21,"K"],[245,22,"L"],[245,207,"M"],[49,124,"N"]])}),
    fiveCircle2025:()=>({box:"0 0 290 250",body:
      circle(150,120,90)+path("M240 120L222.81 172.90L105 197.94L67.78 83.39L159.41 30.49Z M240 120L105 197.94 M67.78 83.39L240 120")+
      labels([[247,122,"J"],[230,191,"K"],[93,216,"L"],[47,79,"M"],[158,20,"N"]])}),
    twoRight2025:()=>({box:"0 0 325 205",body:
      path("M170 30H290L170 170H6.67Z M170 30V170 M170 42H182V30 M158 170V158H170")+
      labels([[158,22,"J"],[295,28,"K"],[176,190,"L"],[0,190,"M"]])}),
    bars2025:()=>({box:"0 0 290 190",body:
      [0,2,4,6].map(n=>path(`M35 ${130-n*14}H265`)+label(15,135-n*14,n)).join("")+
      [3,5,6,4,2].map((n,i)=>`<rect x="${47+i*44}" y="${130-n*14}" width="23" height="${n*14}" ${stroke}/>`+label(54+i*44,151,String(i+2))).join("")+
      label(101,177,"每日退件數目")+label(5,25,"日數")}),
    diameterTangent2025:()=>({box:"0 0 290 240",body:
      circle(140,120,90)+path("M67.19 67.10L79.78 186.88L216.32 72.31L212.81 172.90Z M67.19 67.10L212.81 172.90 M216.32 72.31L249.76 125.87")+
      labels([[51,62,"J"],[63,205,"L"],[218,188,"K"],[219,62,"M"],[133,105,"N"],[254,139,"R"]])})
  };
  window.pilotDiagram2025=kind=>{
    const draw=drawings[kind]?.();
    if(!draw) return "";
    return `<figure class="diagram"><svg viewBox="${draw.box}" role="img" aria-label="本題附圖，不按比例繪製">${draw.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`;
  };
})();
