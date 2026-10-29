const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {launchBrowser}=require('./scripts/browser-runtime.cjs');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4284';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
  const browser=await launchBrowser();
  try{
    for(let year=2015;year<=2026;year++)for(const paper of [1,2]){
      const context=await browser.newContext({acceptDownloads:true});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const filename=`dse-original-${year}-paper${paper}-solutions.pdf`;
      await page.goto(`${base}/paper${paper}/?year=${year}#papers`);
      await page.evaluate(()=>document.fonts.ready);
      const link=page.getByRole('link',{name:'參考解答 PDF',exact:true});
      assert.equal(await link.count(),1);
      assert.equal(await link.getAttribute('download'),filename);
      const wait=page.waitForEvent('download');await link.click();const dl=await wait;
      assert.equal(hash(await fs.readFile(await dl.path())),hash(await fs.readFile(path.join(__dirname,'output/pdf',filename))));
      for(const route of ['papers','practice']){
        await page.goto(`${base}/paper${paper}/?year=${year}#${route}`);
        await page.evaluate(()=>document.fonts.ready);
        assert.equal(await link.count(),1);
        assert.equal(await link.getAttribute('download'),filename);
        for(const width of [1440,936,390,320]){
          await page.setViewportSize({width,height:960});
          const box=await link.boundingBox();assert(box&&box.width>100&&box.x>=0&&box.x+box.width<=width+1,`${year} P${paper} ${route} ${width}: button bounds`);
          assert(await link.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
        }
      }
      if(paper===2)assert.equal(await page.getByRole('button',{name:'對答案',exact:true}).count(),2);
      await page.emulateMedia({media:'print'});
      assert.equal(await link.isVisible(),false,'Teacher PDF link must not appear on student printout');
      assert.deepEqual(errors,[]);
      await context.close();console.log(`${year} P${paper}: downloaded bytes, both routes, four widths and print isolation passed`);
    }
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
