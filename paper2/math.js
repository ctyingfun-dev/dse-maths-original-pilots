(() => {
  const escape = text => text.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const upright = new Set(["cm", "mm", "km", "mL", "kg", "sin", "cos", "tan", "log", "min", "max", "MODE", "SD", "SHIFT", "EXE", "FMLA", "DSE", "DEG", "P1", "P2", "P3", "P4", "I", "II", "III"]);
  const matching = {"(":")", "[":"]"};
  const superscripts = Object.fromEntries([..."⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱᵗ"].map((c,i)=>[c,"0123456789+-=()nit"[i]]));
  const subscripts = Object.fromEntries([..."₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₙᵣₛₕ"].map((c,i)=>[c,"0123456789+-=()nrsh"[i]]));
  const atom = /[0-9.A-Za-zα-ωℓ√∠°%⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿᵗ₀-₉ₙ₊₋ᵣₛₕ]/;

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
    while(i>=0) {
      if(text[i]===")" || text[i]==="]") {
        const close=text[i],open=close===")"?"(":"[";
        let depth=1;
        while(depth && --i>=0) {
          if(text[i]===close) depth++;
          if(text[i]===open) depth--;
        }
        i--;
        if(text[i]==="^") i--;
      } else if(atom.test(text[i])) i--;
      else break;
    }
    const start=i+1;
    const functionPrefix=text.slice(0,start).match(/(?:sin|cos|tan|log)\s+$/);
    if(functionPrefix) return start-functionPrefix[0].length;
    if(text[i]==="/") {
      const previous=leftAt(text,i);
      if(previous<i) return previous;
    }
    return start;
  }
  function rightAt(text, slash) {
    let i=slash+1;
    while (text[i]===" ") i++;
    if(text[i]==="-" || text[i]==="+") i++;
    if(matching[text[i]]) i=closeAt(text,i);
    else {
      while(i<text.length && atom.test(text[i])) i++;
      if(matching[text[i]]) i=closeAt(text,i);
    }
    if(text[i]==="^") {
      i++;
      if(matching[text[i]]) i=closeAt(text,i);
      else while(i<text.length && atom.test(text[i])) i++;
    } else {
      while(i<text.length && superscripts[text[i]]) i++;
    }
    return i;
  }
  function topLevelSlash(text) {
    const stack=[];
    let slash=-1;
    for(let i=0;i<text.length;i++) {
      if(matching[text[i]]) stack.push(matching[text[i]]);
      else if(text[i]===stack.at(-1)) stack.pop();
      else if(text[i]==="/" && !stack.length) {
        if(leftAt(text,i)<i && rightAt(text,i)>i+1) slash=i;
      }
    }
    return slash;
  }
  function inline(text) {
    let result="";
    for(let i=0;i<text.length;) {
      const script = superscripts[text[i]] ? [superscripts,"sup"] : subscripts[text[i]] ? [subscripts,"sub"] : null;
      if(script) {
        let value="";
        while(i<text.length && script[0][text[i]]) value+=script[0][text[i++]];
        result+=`<${script[1]}>${inline(value)}</${script[1]}>`;
        continue;
      }
      const logarithm=text.slice(i).match(/^log_\(([^()]+)\)/);
      if(logarithm) {
        result+=`log<sub>${inline(logarithm[1])}</sub>`;
        i+=logarithm[0].length;
        continue;
      }
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
          if(end>start+1) {result+=`<sup>${render(text.slice(start+1,end-1))}</sup>`;i=end;continue;}
        } else {
          let end=start;
          while(end<text.length && atom.test(text[end])) end++;
          if(end>start) {result+=`<sup>${inline(text.slice(start,end))}</sup>`;i=end;continue;}
        }
      }
      if(matching[text[i]]) {
        const end=closeAt(text,i);
        if(end>i+1) {
          result+=escape(text[i])+render(text.slice(i+1,end-1))+escape(text[end-1]);
          i=end;continue;
        }
      }
      if(/[A-Za-zα-ω]/.test(text[i])) {
        if(text.slice(i,i+3)==="log" && /[₀-₉(]/.test(text[i+3] || "")) {
          result+="log";
          i+=3;
          continue;
        }
        let end=i+1;
        while(end<text.length && /[A-Za-z]/.test(text[end])) end++;
        const word=text.slice(i,end);
        result+=upright.has(word) ? escape(word) : `<var>${escape(word)}</var>`;
        i=end;
        continue;
      }
      if("+-−=≡<>≤≥×÷".includes(text[i])) {
        const symbol=text[i]==="-"?"−":text[i];
        const before=text.slice(0,i).trimEnd().at(-1);
        const unary=symbol==="−" && (!before || "=≡([{,:+−×÷<>≤≥".includes(before));
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
    return `<span class="math-frac" role="math" aria-label="${escape(top)} 除以 ${escape(bottom)}"><span aria-hidden="true">${render(ungroup(top))}</span><span aria-hidden="true">${render(ungroup(bottom))}</span></span>`;
  }
  function render(value) {
    const text=String(value ?? "").replace(/([A-Za-zα-ωΓℓ]+)\/\/(?=[A-Za-zα-ωΓℓ])/g,"$1∥").replace(/÷/g,"/");
    const slash=topLevelSlash(text);
    if(slash<0) return inline(text);
    const left=leftAt(text,slash),right=rightAt(text,slash);
    return render(text.slice(0,left))+fraction(text.slice(left,slash).trim(),text.slice(slash+1,right).trim())+render(text.slice(right));
  }
  window.mathText=render;
  window.solutionLines=value=>{
    const lines=[],stack=[];
    let start=0,previousRelation=-1;
    const text=String(value),brackets={"(":")","[":"]","{":"}","（":"）"};
    const push=end=>{
      const line=text.slice(start,end).trim();
      if(line) lines.push(line);
      start=end;previousRelation=-1;
    };
    // Break only between mathematical statements, never inside grouped expressions.
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(brackets[c]) stack.push(brackets[c]);
      else if(c===stack.at(-1)) stack.pop();
      if(stack.length) continue;
      if("\n，。；".includes(c)) push(i+1);
      else if(c==="、" && previousRelation>=0 && /^[^，。；、=]*=/.test(text.slice(i+1))) push(i+1);
      else if("=≡≈".includes(c)) {
        if(previousRelation>=0 && !/[\p{Script=Han}、]/u.test(text.slice(previousRelation+1,i))) push(i);
        previousRelation=i;
      }
    }
    push(text.length);
    return lines;
  };
})();
