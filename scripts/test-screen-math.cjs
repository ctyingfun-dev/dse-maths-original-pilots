const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {launchBrowser} = require('./browser-runtime.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp/review-2014-p1/screen-math');
const formulas = ['\u221a2', '\u221a(293/324)', '\u221a[7/2-(29/18)\u00b2]', '\u221a(1+\u221a(5/(3/7)))', 'h=\u221a[NU\u00b2-((12-6)/2)\u00b2]', '\u221a(\u221a(3/5)/(7/11))'];
const units = ['0.09 m\u00b3', '1 m\u00b3=1000000 cm\u00b3', '12 m', '3.5 m\u00b2', '4 m^3', '4 m^(3)', '1/2 m\u00b3', '\u9577\u5ea6\u70ba10m\u3002', '\u9ad4\u7a4d\u70ba0.09m\u00b3\u3002'];
const variables = ['m', 'm\u00b2', 'm\u00b3', '2m', '2m\u00b3', 'm(x)', '2 m+1', '2 m + 1', '2 m(x)', '3 m^n', 'x=2m+3', 'm=4', 'a^m', 'm/n'];

async function frames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function geometry(page) {
  return page.locator('#samples').evaluate(host => [...host.querySelectorAll('p,.math-root,msqrt,mtext,.math-radicand,.math-frac,sup')].map(node => {
    const b = node.getBoundingClientRect(), h = host.getBoundingClientRect();
    return [node.localName, node.className?.baseVal || node.getAttribute('class'), b.x-h.x, b.y-h.y, b.width, b.height];
  }));
}
async function pixelAudit(page) {
  const boxes = await page.locator('#samples .screen-root').evaluateAll(nodes => nodes.map(node => {
    const rect = el => {const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,height:r.height};};
    return {root: rect(node), sign: rect(node.firstElementChild), radicand: rect(node.querySelector(':scope > math > msqrt > mtext > .math-radicand'))};
  }));
  const png = await page.screenshot({fullPage: true});
  return page.evaluate(async ({base64, boxes}) => {
    const img = new Image(); img.src = 'data:image/png;base64,'+base64; await img.decode();
    const canvas = document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    const {data}=ctx.getImageData(0,0,canvas.width,canvas.height), d=devicePixelRatio;
    const ink=(x,y)=>{const i=(y*canvas.width+x)*4;return data[i]<100&&data[i+1]<100&&data[i+2]<100;};
    return boxes.map(({root:r,sign:s,radicand:a})=>{
      const rows=[];
      for(let y=Math.floor(a.top*d)-2;y<=Math.ceil(a.bottom*d)+2;y++) {
        for(let x=Math.floor(r.left*d);x<Math.ceil(s.right*d);x++) if(ink(x,y)){rows.push(y);break;}
      }
      let barGaps=0,contentBottom=a.top*d;
      for(let x=Math.ceil(a.left*d);x<Math.floor(a.right*d);x++) {
        let found=false;
        for(let y=Math.floor(a.top*d)-2;y<=Math.ceil(a.top*d)+2;y++) if(ink(x,y)) found=true;
        if(!found)barGaps++;
      }
      for(let y=Math.ceil(a.top*d)+3;y<Math.ceil(a.bottom*d);y++) {
        for(let x=Math.ceil(s.right*d)+1;x<Math.floor(a.right*d);x++) if(ink(x,y)){contentBottom=y;break;}
      }
      return {height:a.height,inkHeight:rows.length?(Math.max(...rows)-Math.min(...rows)+1)/d:0,
        topError:rows.length?Math.abs(Math.min(...rows)/d-a.top):Infinity,
        uncoveredContent:rows.length?(contentBottom-Math.max(...rows))/d:Infinity,barGaps};
    });
  }, {base64:png.toString('base64'),boxes});
}

async function main() {
  fs.mkdirSync(output,{recursive:true});
  const browser=await launchBrowser(),evidence=[];
  try {
    for(const paper of [1,2]) {
      const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2,reducedMotion:'reduce'});
      await page.setContent('<!doctype html><meta charset="utf-8"><main id="main-content"><section id="samples"></section><details id="closed"><summary>Solution</summary><div id="hidden"></div></details><section id="dynamic"></section><section id="units"></section><p id="variable-probe"></p></main>');
      await page.addStyleTag({path:path.join(root,`paper${paper}/style.css`)});
      const css=await page.addStyleTag({path:path.join(root,'assets/workspace.css')});
      await css.evaluate(node=>node.media='screen');
      await page.addStyleTag({content:'body{margin:0;background:white;color:black}main{padding:16px;max-width:100%}#samples p{margin:24px 0;white-space:nowrap;overflow:visible}#samples,#closed,#dynamic{font:20px "Times New Roman",serif}#samples .math-root{color:black}@media screen and (max-width:360px){#samples{font-size:17px}}'});
      await page.addScriptTag({path:path.join(root,`paper${paper}/math.js`)});
      const before=await page.evaluate(({formulas,units,variables})=>{
        const errors=[];
        for(const source of units){const el=document.createElement('div');el.innerHTML=mathText(source);if([...el.querySelectorAll('var')].some(n=>n.textContent==='m'))errors.push('Unit italic: '+source);}
        for(const source of variables){const el=document.createElement('div');el.innerHTML=mathText(source);if(![...el.querySelectorAll('var')].some(n=>n.textContent==='m'))errors.push('Variable upright: '+source);}
        for(const source of ['log_(b)c','log_(c)t']){
          const el=document.createElement('div');el.innerHTML=mathText(source);
          if(el.querySelectorAll('sub').length!==1||el.textContent.includes('_'))errors.push('Unrendered log base: '+source);
        }
        const roman=document.createElement('div');roman.innerHTML=mathText('圖 IV');
        if(roman.querySelector('var'))errors.push('Figure numeral is italic');
        document.querySelector('#samples').innerHTML=formulas.map((s,i)=>`<p id="formula-${i}">${mathText(s)}</p>`).join('');
        document.querySelector('#hidden').innerHTML=mathText('\u221a(3/(7/11))');
        document.querySelector('#units').innerHTML=units.map((s,i)=>`<p id="unit-${i}">${mathText(s)}</p>`).join('');
        document.querySelector('#variable-probe').innerHTML=mathText('2m\u00b3');
        return {errors,text:document.querySelector('#samples').textContent,math:[...document.querySelectorAll('#samples math')].map(n=>n.outerHTML)};
      },{formulas,units,variables});
      assert.deepEqual(before.errors,[]);
      await page.emulateMedia({media:'print'});
      const printBefore=await geometry(page);
      await page.emulateMedia({media:'screen'});
      await page.addScriptTag({path:path.join(root,'assets/workspace.js')});
      await page.evaluate(async()=>{await document.fonts.ready;PilotWorkspace.enhance('practice');});
      await frames(page);
      assert.equal(await page.locator('#closed .screen-root').count(),0,'Closed content is deferred');
      for(const width of [1440,390,320]) {
        await page.setViewportSize({width,height:1100});await frames(page);
        const audit=await pixelAudit(page);
        for(const item of audit){assert.ok(item.inkHeight>=item.height*.94,JSON.stringify(item));assert.ok(item.topError<=2&&item.uncoveredContent<=1,JSON.stringify(item));assert.equal(item.barGaps,0,JSON.stringify(item));}
        const actual=await page.evaluate(()=>{
          const host=document.querySelector('#samples'),copy=host.cloneNode(true);
          for(const wrapper of [...copy.querySelectorAll('.screen-root')].reverse())wrapper.replaceWith(wrapper.querySelector(':scope > math'));
          return {text:host.textContent,math:[...copy.querySelectorAll('math')].map(n=>n.outerHTML),wrappers:host.querySelectorAll('.screen-root').length,roots:host.querySelectorAll('math').length,overflow:document.documentElement.scrollWidth>innerWidth+1};
        });
        assert.equal(actual.text,before.text);assert.deepEqual(actual.math,before.math);assert.equal(actual.wrappers,actual.roots);assert.equal(actual.overflow,false);
        const once=await geometry(page);
        await page.evaluate(()=>{PilotWorkspace.fitScreenRoots();PilotWorkspace.fitScreenRoots();});
        assert.deepEqual(await geometry(page),once,'Repeated fitting is stable');
        const screenshot=`paper${paper}-${width}.png`;
        await page.locator('#samples').screenshot({path:path.join(output,screenshot)});
        evidence.push({paper,width,audit,screenshot});
      }
      // Inspect rendered glyph fonts, including the generated radical, not CSS declarations alone.
      const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
      const {root:doc}=await cdp.send('DOM.getDocument');
      const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#formula-0 .screen-root-glyph'});
      const {node}=await cdp.send('DOM.describeNode',{nodeId,depth:2});
      const glyph=node.pseudoElements.find(n=>n.pseudoType==='before');
      const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId:glyph.nodeId});
      assert.ok(fonts.length&&fonts.every(f=>f.familyName==='Times New Roman'),JSON.stringify(fonts));
      evidence.push({paper,actualRadicalFonts:fonts});
      for(const selector of ['#unit-0','#unit-0 sup','#variable-probe var']){
        const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector});
        const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
        assert.ok(fonts.length&&fonts.every(f=>f.familyName==='Times New Roman'),JSON.stringify(fonts));
        assert.equal(await page.locator(selector).evaluate(n=>getComputedStyle(n).fontStyle),selector.includes('var')?'italic':'normal');
        evidence.push({paper,selector,fonts});
      }
      await page.locator('#units').screenshot({path:path.join(output,`paper${paper}-units.png`)});
      await page.locator('#closed summary').click();await frames(page);
      await page.waitForFunction(()=>document.querySelector('#closed .screen-root'),{},{timeout:1000});
      assert.equal(await page.locator('#closed .screen-root').count(),1,'Opening a solution triggers fitting');
      await page.evaluate(()=>{document.querySelector('#dynamic').innerHTML=solutionHtml('\u221a(5/7)=x');PilotWorkspace.enhance('practice');});await frames(page);
      assert.equal(await page.locator('#dynamic .screen-root').count(),1,'New question content is fitted by enhance');
      await page.evaluate(()=>{document.querySelector('#samples').style.fontSize='24px';document.fonts.dispatchEvent(new Event('loadingdone'));});await frames(page);
      await page.evaluate(()=>scrollTo(0,0));
      for(const item of await pixelAudit(page))assert.ok(item.inkHeight>=item.height*.94&&item.uncoveredContent<=1,JSON.stringify(item));
      await page.evaluate(()=>document.querySelector('#samples').style.removeProperty('font-size'));
      await page.setViewportSize({width:1440,height:1100});await frames(page);
      await page.emulateMedia({media:'print'});
      assert.deepEqual(await geometry(page),printBefore,'Native print geometry is unchanged after screen fitting');
      assert.equal(await page.evaluate(()=>PilotWorkspace.fitScreenRoots()),0,'No screen fitting in print');
      await page.emulateMedia({media:'screen'});await frames(page);
      for(const item of await pixelAudit(page))assert.ok(item.inkHeight>=item.height*.94&&item.uncoveredContent<=1,JSON.stringify(item));
      // Negative control: a one-line glyph must fail the tall-radical pixel test.
      await page.locator('#formula-1 .screen-root-glyph').evaluate(node=>node.style.transform='scaleY(1)');
      assert.ok((await pixelAudit(page))[1].inkHeight<30,'Pixel audit detects the original short-glyph failure');
      await page.close();

      // The PDF path captures mathText output without loading the workspace.
      // Exercise its unchanged fitting helper and DOM, without generating a PDF.
      const pdf=await browser.newPage();await pdf.setContent('<!doctype html><div id="pdf"></div>');
      await pdf.addStyleTag({path:path.join(root,'scripts/solution-pdf.css')});
      for(const file of [`paper${paper}/math.js`,'scripts/solution-pdf-math.js','scripts/solution-pdf-roots.js'])await pdf.addScriptTag({path:path.join(root,file)});
      const result=await pdf.evaluate(async({formulas,units})=>{
        const host=document.querySelector('#pdf');host.innerHTML=pdfSolutionHtml([...formulas,...units]);await document.fonts.ready;
        const count=host.querySelectorAll('math.math-root').length,math=host.querySelector('math.math-root').outerHTML;
        const fitted=fitPdfRoots(host),once=host.innerHTML;fitPdfRoots(host);
        return {count,fitted,stable:once===host.innerHTML,screen:host.querySelectorAll('.screen-root').length,math,italicMetres:[...host.querySelectorAll('var')].filter(n=>n.textContent==='m').length};
      },{formulas,units});
      assert.equal(result.count,result.fitted);assert.equal(result.stable,true);assert.equal(result.screen,0);assert.equal(result.italicMetres,0);assert.match(result.math,/<msqrt><mtext><span class="math-radicand">/);
      await pdf.close();
    }
    fs.writeFileSync(path.join(output,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
    console.log('Both papers: metre-unit/variable cases, 320/390/1440 root pixels, exact text/MathML preservation, repeated fits, details/dynamic insertion/font/resize events, actual TNR radical, print geometry and PDF-helper compatibility passed. No PDFs generated.');
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
