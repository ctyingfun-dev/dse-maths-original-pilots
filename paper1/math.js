(() => {
  const escape = text => text.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const upright = new Set(["cm", "mm", "km", "mL", "kg", "sin", "cos", "tan", "log", "min", "max", "MODE", "SD", "SHIFT", "EXE", "FMLA", "DSE", "DEG", "P1", "P2", "P3", "P4", "I", "II", "III"]);
  const matching = {"(":")", "[":"]"};
  const atom = /[0-9.A-Za-zα-ω√⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀-₉ₙ₊₋]/;

  function closeAt(text, start) {
    const stack = [];
    for (let i=start; i<text.length; i++) {
      if (matching[text[i]]) stack.push(matching[text[i]]);
      else if (text[i] === stack.at(-1)) {
        stack.pop();
        if (!stack.length) return i+1;
      }
    }
    return start+1;
  }
  function leftAt(text, slash) {
    let i=slash-1;
    while (i>=0 && text[i]===" ") i--;
    if (text[i]===")" || text[i]==="]") {
      const close=text[i], open=close===")"?"(": "[";
      let depth=1;
      while (depth && --i>=0) {
        if (text[i]===close) depth++;
        if (text[i]===open) depth--;
      }
      if (i>0 && text[i-1]==="^") {
        i-=2;
        while (i>=0 && atom.test(text[i])) i--;
        return i+1;
      }
      return i;
    }
    while (i>=0 && atom.test(text[i])) i--;
    return i+1;
  }
  function rightAt(text, slash) {
    let i=slash+1;
    while (text[i]===" ") i++;
    if (matching[text[i]]) return closeAt(text,i);
    if (text[i]==="-") i++;
    while (i<text.length && atom.test(text[i])) i++;
    if (text[i]==="^") {
      i++;
      if (matching[text[i]]) i=closeAt(text,i);
      else while (i<text.length && atom.test(text[i])) i++;
    }
    return i;
  }
  function inline(text) {
    let result="";
    for(let i=0;i<text.length;) {
      if(text[i]==="½") {
        result+=fraction("1","2");
        i++;
        continue;
      }
      const parallel=text.slice(i).match(/^([A-Za-z]+)∥([A-Za-z]+)/);
      if(parallel) {
        result+=`<span class="math-relation"><var>${escape(parallel[1])}</var><span class="math-parallel" role="img" aria-label="平行">//</span><var>${escape(parallel[2])}</var></span>`;
        i+=parallel[0].length;
        continue;
      }
      if(text[i]==="∥") {
        result+='<span class="math-parallel" role="img" aria-label="平行">//</span>';
        i++;
        continue;
      }
      if(text[i]==="^" && i+1<text.length) {
        const start=i+1;
        if(text[start]==="(") {
          const end=closeAt(text,start);
          if(end>start+1) {result+=`<sup>${inline(text.slice(start+1,end-1))}</sup>`;i=end;continue;}
        } else {
          let end=start;
          while(end<text.length && atom.test(text[end])) end++;
          if(end>start) {result+=`<sup>${inline(text.slice(start,end))}</sup>`;i=end;continue;}
        }
      }
      if(/[A-Za-zα-ω]/.test(text[i])) {
        if(text.slice(i,i+3)==="log" && /[₀-₉(]/.test(text[i+3] || "")) {
          result+="log";
          i+=3;
          continue;
        }
        let end=i+1;
        while(end<text.length && /[A-Za-z₀-₉ₙ₊₋]/.test(text[end])) end++;
        const word=text.slice(i,end);
        result+=upright.has(word) ? escape(word) : `<var>${escape(word)}</var>`;
        i=end;
        continue;
      }
      if("+-−=≡<>≤≥≠≈×÷≅∼".includes(text[i])) {
        const symbol=text[i]==="-"?"−":text[i];
        const before=text.slice(0,i).trimEnd().at(-1);
        const unary=symbol==="−" && (!before || "=≡([{,:+−×÷<>≤≥≠≈".includes(before));
        result+=`<span class="${unary?"math-unary":"math-op"}">${escape(symbol)}</span>`;
        i++;
        continue;
      }
      result+=escape(text[i++]);
    }
    return result;
  }
  const ungroup = text => matching[text[0]] && closeAt(text,0)===text.length ? text.slice(1,-1) : text;
  function fraction(top,bottom) {
    return `<span class="math-frac" role="math" aria-label="${escape(top)} 除以 ${escape(bottom)}"><span aria-hidden="true">${inline(ungroup(top))}</span><span aria-hidden="true">${inline(ungroup(bottom))}</span></span>`;
  }
  function render(value) {
    const text=String(value ?? "").replace(/([A-Za-z]+)\/\/(?=[A-Za-z])/g,"$1∥");
    let result="", cursor=0;
    for(let slash=text.indexOf("/");slash>=0;slash=text.indexOf("/",cursor)) {
      const left=leftAt(text,slash), right=rightAt(text,slash);
      if(left<cursor || left===slash || right===slash+1) {
        result+=inline(text.slice(cursor,slash+1));
        cursor=slash+1;
        continue;
      }
      result+=inline(text.slice(cursor,left));
      const top=text.slice(left,slash).trim(), bottom=text.slice(slash+1,right).trim();
      result+=fraction(top,bottom);
      cursor=right;
    }
    return result+inline(text.slice(cursor));
  }
  window.mathText=render;
})();
