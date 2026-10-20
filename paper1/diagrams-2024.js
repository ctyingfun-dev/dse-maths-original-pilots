(() => {
  const line='fill="none" stroke="#111" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"';
  const drawings={
    crossed2024:{box:"0 0 300 200",body:
      `<path d="M50 170H250L197.059 81.765L50 170 M50 170L102.941 81.765L250 170" ${line}/>
       <text x="35" y="191">J</text><text x="255" y="191">K</text><text x="198" y="71">L</text><text x="90" y="71">M</text><text x="144" y="99">N</text>`},
    fold2024:{box:"0 0 300 210",body:
      `<path d="M35 95L70 180L263 124L115 27L70 180 M35 95L263 124" ${line}/>
       <path d="M70 180L263 124" ${line} stroke-dasharray="5 4"/>
       <text x="17" y="93">J</text><text x="62" y="201">K</text><text x="108" y="20">L</text><text x="270" y="133">M</text>`}
  };
  window.pilotDiagram2024=kind=>{
    const d=drawings[kind];
    return d?`<figure class="diagram"><svg viewBox="${d.box}" role="img" aria-label="本題附圖，不按比例繪製">${d.body}</svg><figcaption>圖（不按比例）</figcaption></figure>`:"";
  };
})();
