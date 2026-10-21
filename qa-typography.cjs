const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {launchBrowser}=require("./scripts/browser-runtime.cjs");
const base=process.env.PREVIEW_URL||"http://127.0.0.1:4284";
const output=path.join(__dirname,"tmp/qa-typography");
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const browser=await launchBrowser();
  try {
    const page=await browser.newPage();
    for(const paper of [1,2]) for(const year of [2021,2022,2023,2024,2025,2026]) {
      for(const route of ["practice","find","papers","years","topics","guide","saved"]) {
        await page.goto(`${base}/paper${paper}/?year=${year}#${route}`);
        if(route==="practice") await page.locator(".worked-answer").evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
        for(const width of route==="practice"?[1056,390,320]:[1056]) {
          await page.setViewportSize({width,height:892});
          await page.evaluate(()=>document.fonts.ready);
          const issues=await page.locator("body *").evaluateAll(nodes=>nodes.flatMap(n=>{
            if(["SCRIPT","STYLE","OPTION"].includes(n.tagName)||!n.getClientRects().length)return [];
            const text=[...n.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join("");
            if(!/[A-Za-z0-9]/.test(text))return [];
            const font=getComputedStyle(n).fontFamily;
            return font.startsWith('"Times New Roman"')?[]:[{tag:n.tagName,class:n.getAttribute("class"),text:text.slice(0,80),font}];
          }));
          assert.deepEqual(issues,[],`${paper}/${year}/${route}/${width}: non-Times Latin/numbers`);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
          if(route==="practice") {
            assert.ok(await page.locator("sup").count()>0);
            assert.equal(await page.locator(".exam-stem,.exam-part,.scheme-answer,.options").evaluateAll(nodes=>nodes.some(n=>/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀-₉]/.test(n.textContent))),false);
            if(paper===1) {
              const n=await page.evaluate(()=>(window.PILOT.questions.find(q=>q.topic.includes("指數"))||window.PILOT.questions.find(q=>/[⁴⁵⁻]/.test(q.prompt))||window.PILOT.questions[0]).n);
              await page.locator(`#question-${n}`).screenshot({path:path.join(output,`p1-${year}-exponents-${width}.png`)});
            }
          }
        }
        if(route==="practice") {
          await page.emulateMedia({media:"print"});
          const fonts=await page.locator(".exam-stem,var,.math-frac,sup,sub").evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).fontFamily));
          assert.ok(fonts.every(font=>font.startsWith('"Times New Roman"')));
          await page.emulateMedia({media:"screen"});
        }
      }
      console.log(`P${paper}/${year}: Times priority, exponent/subscript markup, 7 views, mobile and print passed.`);
    }
    await page.goto(base);
    assert.match(await page.locator("h1").evaluate(n=>getComputedStyle(n).fontFamily),/^"Times New Roman"/);
    // Inspect actual glyphs in addition to CSS declarations.
    await page.evaluate(()=>{
      const probe=document.createElement("p");
      probe.id="font-probe";probe.style.fontFamily='"Times New Roman", serif';probe.textContent="0123456789 ABCDE xyz";
      document.body.append(probe);
    });
    const cdp=await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");await cdp.send("CSS.enable");
    const {root}=await cdp.send("DOM.getDocument");
    const {nodeId}=await cdp.send("DOM.querySelector",{nodeId:root.nodeId,selector:"#font-probe"});
    const {fonts}=await cdp.send("CSS.getPlatformFontsForNode",{nodeId});
    assert.ok(fonts.length&&fonts.every(font=>font.familyName==="Times New Roman"),JSON.stringify(fonts));
    console.log("Actual Latin/digit glyphs use installed Times New Roman; Chinese fallback stacks remain intact.");
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
