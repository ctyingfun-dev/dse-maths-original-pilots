const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {launchBrowser}=require('./scripts/browser-runtime.cjs');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4284';
async function checkButtonContrast(page, minimum) {
  const contrast=await page.locator('#question-1 [data-check]').evaluate(button=>{
    const style=getComputedStyle(button);
    const luminance=color=>{
      const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>{
        value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
      });
      return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
    };
    const foreground=luminance(style.color),background=luminance(style.backgroundColor);
    return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
  });
  assert.ok(contrast>=minimum,`Grading button contrast ${contrast} below ${minimum}`);
}
(async()=>{
  const browser=await launchBrowser();
  try {
    for(const year of [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]) {
      const context=await browser.newContext();
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('dialog',dialog=>dialog.accept());
      await page.goto(`${base}/paper2/?year=${year}#practice`);
      assert.equal(await page.locator('[data-finish]').count(),2);
      assert.ok(await page.locator('.practice-header [data-finish]').isVisible());
      await checkButtonContrast(page,3);
      await page.locator('.practice-header [data-finish]').click();
      assert.equal(await page.locator('.exam-result').count(),0,'Empty paper must not finish');
      const key=await page.evaluate(()=>window.PILOT.questions[0].answer);
      const wrong='ABCD'.split('').find(letter=>letter!==key);
      await page.locator(`#question-1 input[value="${wrong}"]`).check();
      await checkButtonContrast(page,4.5);
      await page.locator('.practice-header [data-finish]').click();
      assert.equal(await page.locator('.feedback.error').count(),1);
      assert.equal(await page.locator('.feedback').count(),1,'Unanswered items stay unmarked');
      assert.match(await page.locator('.exam-result').textContent(),/已批改 1 題，答對 0 題/);
      await page.locator(`#question-1 input[value="${key}"]`).check();
      await page.locator('.finish [data-finish]').click();
      assert.equal(await page.locator('.feedback.success').count(),1);
      assert.match(await page.locator('.exam-result').textContent(),/已批改 1 題，答對 1 題/);
      await page.reload();
      assert.ok(await page.locator('.practice-header [data-finish]').isVisible());
      assert.equal(await page.locator('.feedback.success').count(),1);
      for(const width of [1056,390,320]) {
        await page.setViewportSize({width,height:892});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        assert.ok(await page.locator('.practice-header [data-finish]').isVisible());
        if(year===2026&&width===1056) {
          await fs.mkdir(path.join(__dirname,'tmp/qa-check-answers'),{recursive:true});
          await page.evaluate(()=>scrollTo(0,0));
          await page.screenshot({path:path.join(__dirname,'tmp/qa-check-answers/2026-desktop.png')});
          await page.locator('#question-1 .study-tools').screenshot({path:path.join(__dirname,'tmp/qa-check-answers/2026-controls.png')});
        }
      }
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(`${year}: direct link, empty guard, both buttons, recheck, reload and mobile passed`);
    }
    const context=await browser.newContext();
    const page=await context.newPage();
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(`${base}/paper2/?year=2026#papers`);
    await page.locator('[data-start="timed"]').click();
    await page.locator('#timer').waitFor({state:'visible'});
    assert.ok(await page.locator('#timer').isVisible());
    await page.locator('#question-1 input[value="A"]').check();
    await page.locator('.practice-header [data-finish]').click();
    assert.equal(await page.locator('#timer').count(),0);
    assert.ok(await page.locator('.exam-result').isVisible());
    await context.close();
    console.log('Timed submission still stops timer and grades answers');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
