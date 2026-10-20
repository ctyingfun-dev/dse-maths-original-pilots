const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {launchBrowser} = require("./scripts/browser-runtime.cjs");
const base = (process.env.PREVIEW_URL || "http://127.0.0.1:4284").replace(/\/$/, "");
const output = path.join(__dirname, "tmp/single-question-20261015");

async function readable(page) {
  const issues = await page.evaluate(() => {
    const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = values => values.slice(0, 3).map(v => {
      const c = v / 255;
      return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
    }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const problems = [];
    for (const el of document.querySelectorAll("a,button,label,p,small,h1,h2,h3,summary,var,.exam-part,.exam-subpart,.brand strong,.scheme-answer,.scheme-score,.year-refs,.dse-example span,.dse-legend span,.year-legend span,.stats span")) {
      if (!el.getClientRects().length || !el.textContent.trim() || el.closest("[disabled]")) continue;
      const style = getComputedStyle(el);
      let node = el, background;
      while (node) {
        const current = getComputedStyle(node);
        if (Number(current.opacity) < 1) break;
        const color = rgb(current.backgroundColor);
        if (color.length === 3 || color[3] === 1) {background = color; break;}
        node = node.parentElement;
      }
      if (!background) continue;
      const foreground = luminance(rgb(style.color)), back = luminance(background);
      const ratio = (Math.max(foreground, back) + .05) / (Math.min(foreground, back) + .05);
      if (ratio < 4.5) problems.push({element: el.className || el.tagName, text: el.textContent.trim().slice(0, 30), ratio});
    }
    return problems;
  });
  assert.deepEqual(issues, [], "Text contrast must be at least 4.5:1");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, "Page overflows horizontally");
}

async function printSnapshot(page) {
  return page.locator("html,body,.practice-main,.exam-title,.exam-stem,.exam-section,.diagram svg,.diagram text,.exam-table,.math-frac,.print-answer-space").evaluateAll(elements => elements.map(el => {
    const css = getComputedStyle(el), rect = el.getBoundingClientRect();
    return [el.tagName, el.className.baseVal ?? el.className, css.color, css.backgroundColor, css.borderColor, css.fill, css.stroke, css.display, rect.width, rect.height];
  }));
}

(async () => {
  await fs.mkdir(output, {recursive: true});
  const browser = await launchBrowser();
  try {
    for (const paper of [1, 2]) for (const year of [2024, 2025, 2026]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const width of [1440, 1004, 390, 320]) {
        let promptAnatomy;
        await page.setViewportSize({width, height: 900});
        for (const route of ["papers", "practice", "topics", "years", "find", "guide", "programs", "saved"]) {
          await page.goto(`${base}/paper${paper}/?year=${year}#${route}`);
          await page.locator(".site-header").waitFor();
          assert.equal(await page.locator(".sidebar").count(), 0, "Old sidebar must be absent");
          assert.equal(await page.locator("html").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(240, 247, 255)");
          assert.equal(await page.locator(".site-header").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
          assert.equal(await page.locator("html").evaluate(el => getComputedStyle(el).getPropertyValue("--accent").trim()), "#285ba8");
          const currentNav = ["topics", "years", "guide", "programs"].includes(route) ? ".resource-nav" : ".primary-nav";
          assert.equal(await page.locator(`${currentNav} [aria-current="page"]`).getAttribute("href"), `#${route === "practice" ? "papers" : route}`);
          assert.equal(await page.locator(".resource-menu").count(), 0, "Tools must not be collapsible");
          const toolLinks = page.locator(".resource-nav a");
          assert.equal(await toolLinks.count(), 4);
          for (const link of await toolLinks.all()) assert.equal(await link.isVisible(), true, "All four tools must stay visible");
          const navBoxes = await page.locator(".navigation-inner a").evaluateAll(links => links.map(link => {
            const rect=link.getBoundingClientRect();
            return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};
          }));
          for (let i=0;i<navBoxes.length;i++) {
            const a=navBoxes[i];
            assert.ok(a.left>=0 && a.right<=width, "Navigation leaves viewport");
            for (const b of navBoxes.slice(i+1)) assert.ok(a.right<=b.left || b.right<=a.left || a.bottom<=b.top || b.bottom<=a.top, "Navigation links overlap");
          }
          const logo = await page.locator("img.brand-mark").evaluate(async image => {
            await image.decode();
            const rect = image.getBoundingClientRect(), label = image.nextElementSibling.getBoundingClientRect();
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 48;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, 48, 48);
            const pixels = context.getImageData(0, 0, 48, 48).data;
            let blue = 0, green = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              const [r, g, b] = pixels.slice(i, i + 3);
              if (b > r + 30 && b > g + 20) blue++;
              if (g > r + 10 && g > b + 5) green++;
            }
            return {loaded: image.naturalWidth > 100, width: rect.width, height: rect.height, gap: label.left - rect.right, blue, green};
          });
          assert.ok(logo.loaded && logo.blue > 50 && logo.green > 10, "Logo missing or blank");
          assert.equal(logo.width, width > 900 ? 48 : 40);
          assert.equal(logo.height, logo.width);
          assert.ok(logo.gap >= 9, "Logo overlaps brand name");
          assert.match(await page.locator('link[rel="icon"]').getAttribute("href"), /assets\/dse-maths-logo\.png/);
          await readable(page);
          if (route === "find") {
            assert.equal(await page.locator(".result").count(), paper === 1 ? 19 : 45);
            const listAnatomy=await page.locator(".result-prompt").evaluateAll(prompts=>prompts.map(prompt=>[
              prompt.querySelectorAll(".exam-stem").length,
              prompt.querySelectorAll(".exam-part").length,
              prompt.querySelectorAll(".exam-subpart").length,
              prompt.querySelectorAll(".diagram").length,
              prompt.querySelectorAll(".exam-table,.stemleaf").length
            ]));
            assert.deepEqual(listAnatomy,promptAnatomy,"Search must retain every stem, subquestion, diagram and data table");
            assert.equal(await page.locator(".result .print-answer-space,.result .print-continuation").count(),0);
            const rows = await page.locator(".result").evaluateAll(rows => rows.slice(0,2).map(row => {
              const rect=row.getBoundingClientRect();
              return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};
            }));
            assert.equal(rows[0].left, rows[1].left, "Results must use one column");
            assert.equal(rows[0].right, rows[1].right);
            assert.ok(rows[1].top >= rows[0].bottom, "Result rows overlap");
            const expand=page.locator("[data-open]").first();
            const row=page.locator(".result").first();
            const prompt=await row.locator(".result-prompt").innerHTML();
            assert.equal(await expand.innerText(),paper===1?"提示與解答":"作答與批改");
            await expand.click();
            assert.equal(await expand.getAttribute("aria-expanded"), "true");
            await row.locator(".inline-practice").waitFor();
            const unique=async()=>{
              assert.equal(await row.locator(".result-prompt").innerHTML(),prompt,"Original question must stay unchanged");
              assert.equal(await row.locator(".exam-stem").count(),1,"Question stem must occur only once");
              assert.equal(await row.locator("[data-bookmark]").count(),1,"Bookmark must occur only once");
              assert.equal(await row.locator(".inline .exam-stem,.inline .exam-body,.inline .diagram,.inline .exam-table,.inline .stemleaf").count(),0,"Inline controls must not repeat question content");
            };
            await unique();
            const inlineHint=row.locator(".inline [data-hint]");
            if(await inlineHint.isEnabled()) await inlineHint.click();
            await unique();
            if(paper===1) {
              await row.locator(".worked-answer summary").click();
              assert.equal(await row.locator(".marking-scheme").count(),1);
            } else {
              assert.equal(await row.locator(".options input").count(),4);
              const correct=await page.evaluate(()=>window.PILOT.questions[0].answer);
              await row.locator(`.options input[value="${correct}"]`).check({force:true});
              await row.locator("[data-check]").click();
              assert.equal(await row.locator(".result-status").innerText(),"答對");
            }
            await unique();
            await readable(page);
            if([1004,390].includes(width)) {
              await page.evaluate(()=>scrollTo(0,0));
              await page.screenshot({path:path.join(output,`p${paper}-${year}-expanded-${width}.png`)});
            }
            await expand.click();
            assert.equal(await expand.getAttribute("aria-expanded"), "false");
            assert.equal(await page.locator(".inline-practice").count(), 0);
            assert.equal(await row.locator(".exam-stem").count(),1,"Collapsing must keep the original question");
            if(width===1440) {
              for(const toggle of await page.locator("[data-open]").all()) {
                const n=await toggle.getAttribute("data-open");
                const item=page.locator(`[data-result="${n}"]`);
                await toggle.click();
                assert.equal(await item.locator(".exam-stem").count(),1,`Question ${n}: repeated stem`);
                assert.equal(await item.locator("[data-bookmark]").count(),1,`Question ${n}: repeated bookmark`);
                assert.equal(await item.locator(".inline .exam-body,.inline .diagram,.inline .exam-table,.inline .stemleaf").count(),0);
                assert.equal(await item.locator(paper===1?".inline .worked-answer":".inline .options input").count(),paper===1?1:4);
                await toggle.click();
              }
            }
            await page.locator("#query-filter").fill("no-matching-question");
            assert.equal(await page.locator(".result").count(), 0);
            assert.equal(await page.locator(".count").innerText(), "0 題");
            await page.locator("#query-filter").fill("");
            await page.locator("#topic-filter").selectOption({index:1});
            assert.ok(await page.locator(".result").count() > 0);
            await page.locator("#topic-filter").selectOption("全部");
            await page.locator(".skip-link").focus();
            await page.keyboard.press("Enter");
            assert.equal(await page.locator("main").evaluate(el=>el===document.activeElement), true);
            assert.equal(new URL(page.url()).hash, "#find", "Skip link must not change route");
          }
          if (route === "practice") {
            assert.equal(await page.locator(".exam-question").count(), paper === 1 ? 19 : 45);
            promptAnatomy=await page.locator(".exam-question .exam-content").evaluateAll(prompts=>prompts.map(prompt=>[
              prompt.querySelectorAll(".exam-stem").length,
              prompt.querySelectorAll(".exam-part").length,
              prompt.querySelectorAll(".exam-subpart").length,
              prompt.querySelectorAll(".diagram").length,
              prompt.querySelectorAll(".exam-table,.stemleaf").length
            ]));
            assert.equal(await page.locator(".practice-main").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
            const hint = page.locator("#question-1 [data-hint]");
            if (await hint.isEnabled()) await hint.click();
            await readable(page);
            if (paper === 1) {
              await page.locator("#question-1 .worked-answer summary").click();
            } else {
              const correct = await page.evaluate(() => window.PILOT.questions[0].answer);
              const wrong = [..."ABCD"].find(letter => letter !== correct);
              await page.locator(`#question-1 .options input[value="${wrong}"]`).check({force: true});
              await page.locator("#question-1 [data-check]").click();
              await readable(page);
              await page.locator(`#question-1 .options input[value="${correct}"]`).check({force: true});
              await page.locator("#question-1 [data-check]").click();
            }
            await readable(page);
            await page.keyboard.press("Tab");
            await page.locator("#question-1 [data-bookmark]").focus();
            const focus = await page.locator("#question-1 [data-bookmark]").evaluate(el => ({
              active: document.activeElement === el,
              visible: el.matches(":focus-visible"),
              outline: getComputedStyle(el).outlineColor,
              token: getComputedStyle(el).getPropertyValue("--focus")
            }));
            assert.deepEqual(focus, {active: true, visible: true, outline: "rgb(161, 98, 7)", token: "#a16207"});
            await page.evaluate(() => scrollTo(0, 0));
          }
          if (["practice", "topics"].includes(route) && [1004, 390].includes(width)) {
            await page.screenshot({path: path.join(output, `p${paper}-${year}-${route}-${width}.png`)});
          }
        }
      }
      await page.goto(`${base}/paper${paper}/?year=${year}#practice`);
      await page.emulateMedia({media: "print"});
      await page.evaluate(() => document.fonts.ready);
      const current = await printSnapshot(page);
      const stylesheet = await fs.readFile(path.join(__dirname, `paper${paper}/style.css`), "utf8");
      const original = stylesheet.split("/* Screen palette only;")[0].replace(/var\(--[a-z-]+,(#[0-9a-f]+)\)/gi, "$1");
      await page.addStyleTag({content: original});
      assert.deepEqual(await printSnapshot(page), current, "Print colors or layout changed");
      assert.deepEqual(errors, [], "Browser errors");
      console.log(`Paper ${paper}, ${year}: 8 views at 4 widths; horizontal navigation, list, contrast, states and print parity passed.`);
      await context.close();
    }
    const preview = await browser.newContext();
    const page = await preview.newPage();
    for (const [name, width] of [["desktop", 1056], ["mobile", 390]]) {
      await page.setViewportSize({width, height: 892});
      await page.goto(`${base}/paper2/?year=2025#practice`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator("img.brand-mark").evaluate(image => image.decode());
      await page.screenshot({path: path.join(output, `site-preview-${name}.png`)});
      await page.goto(`${base}/paper2/?year=2025#find`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator("img.brand-mark").evaluate(image => image.decode());
      await page.screenshot({path: path.join(output, `find-preview-${name}.png`)});
    }
    await preview.close();
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
