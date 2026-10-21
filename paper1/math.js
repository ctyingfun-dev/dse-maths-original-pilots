(() => {
  const escape = text => text.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const upright = new Set(["cm", "mm", "km", "mL", "kg", "sin", "cos", "tan", "log", "min", "max", "MODE", "SD", "SHIFT", "EXE", "FMLA", "DSE", "DEG", "P1", "P2", "P3", "P4", "I", "II", "III"]);
  const matching = {"(":")", "[":"]"};
  for(const criterion of ["SAS","SSS","ASA","AAS","RHS"]) upright.add(criterion);
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
      if(text[i]==="√") {
        const start=i+1,end=rootEnd(text,start);
        if(end>start) {
          const value=text.slice(start,end);
          result+=`<math class="math-root" aria-label="${escape(value)} 的平方根"><msqrt><mtext><span class="math-radicand">${render(ungroup(value))}</span></mtext></msqrt></math>`;
          i=end;
          continue;
        }
      }
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
        const prefix=text.slice(0,i);
        const gramUnit=word==="g" && (/\d\s+$/.test(prefix) || /(?:質量|重量|單位)[（(]\s*$/.test(prefix));
        result+=upright.has(word) || gramUnit ? escape(word) : `<var>${escape(word)}</var>`;
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
  // Ungrouped roots cover one number or variable, not the following product (e.g. 6√10π).
  function rootEnd(text,start) {
    if(matching[text[start]]) return closeAt(text,start);
    if(text[start]==="√") return rootEnd(text,start+1);
    const value=text.slice(start).match(/^(?:\d+(?:\.\d+)?|[A-Za-zα-ωℓ])/);
    if(!value) return start;
    let end=start+value[0].length;
    while(superscripts[text[end]] || subscripts[text[end]]) end++;
    if(text[end]==="^" && text[end+1]==="(") end=closeAt(text,end+1);
    return end;
  }
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
    let start=0;
    const text=String(value),brackets={"(":")","[":"]","{":"}","（":"）"};
    const push=end=>{
      const line=text.slice(start,end).trim();
      if(line) lines.push(line);
      start=end;
    };
    // Break only between mathematical statements, never inside grouped expressions.
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(brackets[c]) stack.push(brackets[c]);
      else if(c===stack.at(-1)) stack.pop();
      if(stack.length) continue;
      if("\n。；".includes(c)) push(i+1);
    }
    push(text.length);
    return lines;
  };
  function relations(text) {
    const stack=[],found=[];
    for(let i=0;i<text.length;i++) {
      if(matching[text[i]]) stack.push(matching[text[i]]);
      else if(text[i]===stack.at(-1)) stack.pop();
      else if(!stack.length && "=≡≈".includes(text[i])) found.push(i);
    }
    return found;
  }
  function equation(text) {
    const at=relations(text),first=at[0];
    if(first===undefined || /[，：；]/.test(text.slice(0,first))) return null;
    const rhs=text.slice(first+1);
    // Explanatory prose stays intact; only mathematical statements form calculation blocks.
    if(/[，：；、]/.test(rhs) || /[\p{Script=Han}]/u.test(rhs.replace(/(?:平方單位|立方單位|單位|平方厘米|立方厘米|厘米|分鐘|小時|歲|元|個|倍|種|天)/g,""))) return null;
    const rows=[];
    const split=at.length>1 && (text.length>36 || (text.length>28 && (text.match(/\//g)||[]).length>1));
    let lhs=text.slice(0,first),start=first;
    for(const next of split?at.slice(1):[]) {
      // A short final value belongs to the calculation before it, not an orphan '=2'.
      if(/^[=≈][+-]?[\d.]+(?:\s*(?:cm|mm|kg|g|°|%))?[。；]?$/.test(text.slice(next))) break;
      rows.push({lhs,relation:text[start],rhs:text.slice(start+1,next)});
      lhs="";start=next;
    }
    rows.push({lhs,relation:text[start],rhs:text.slice(start+1)});
    return rows;
  }
  window.solutionLayout=values=>{
    const blocks=[];
    const append=text=>{
      const rows=equation(text);
      if(rows) {
        const previous=blocks.at(-1);
        if(!rows[0].lhs && previous?.type==="calculation") previous.rows.push(...rows);
        else blocks.push({type:"calculation",rows});
      } else blocks.push({type:"text",text});
    };
    for(const text of (Array.isArray(values)?values:[values]).flatMap(window.solutionLines)) {
      // Keep a complete reason together, then put its formula on the following line.
      const boundary=[...text.matchAll(/[，：]/g)].find(match=>
        /[\p{Script=Han}]/u.test(text.slice(0,match.index)) && equation(text.slice(match.index+1)));
      if(boundary) {
        append(text.slice(0,boundary.index+1));
        append(text.slice(boundary.index+1));
      } else append(text);
    }
    return blocks;
  };
  window.solutionHtml=values=>window.solutionLayout(values).map(block=>block.type==="text"
    ? `<p class="solution-text">${render(block.text)}</p>`
    : `<div class="solution-calculation">${block.rows.map(row=>`<p class="solution-equation">${render(row.lhs)}${render(row.relation)}${render(row.rhs)}</p>`).join("")}</div>`).join("");
})();
