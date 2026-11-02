const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const {classify,forQuestion,names} = require("./assets/topic-classification.js");
const same = (labels, expected) => {
  for (const label of labels) assert.deepEqual(classify(label).sort(),[...expected].sort(),label);
};
same(["不等式與整數","複合不等式","聯立一次不等式","不等式的聯集"],["不等式"]);
same(["公式變換","公式主項","公式主項變換"],["公式變換"]);
same(["折扣與盈利","盈利與折扣","成本、標價與售價"],["百分數與商業數學"]);
same(["指數律","指數定律","負整數指數"],["指數定律"]);
same(["相似立體與表面積","相似立體與表面面積","相似立體與總表面面積"],["相似形","面積與體積"]);
same(["平均數、中位數與眾數","平均值、眾數及中位數"],["集中趨勢"]);
same(["等距軌跡","固定距離的軌跡","定距軌跡"],["軌跡"]);
same(["等差數列與對數","對數與等差數列"],["數列與求和","指數與對數"]);
same(["全等與相似三角形","相似形與全等"],["全等三角形","相似形"]);
same(["平方差","平方差因式分解"],["因式分解"]);
same(["三角比與恆等關係"],["三角比與平面三角學"]);
assert.deepEqual(classify("待審核的新課題"),["待審核的新課題"],"Unreviewed labels must remain visible, not silently disappear");
const questions = new Map();
const labels = new Set();
let total=0;
for (const paper of [1,2]) for (let year=2014;year<=2026;year++) {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(`paper${paper}/data-${year}.js`,"utf8"),context);
  for (const q of (context.window[`PILOT_${year}`]||context.window.PILOT).questions) {
    const key=`${paper}-${year}-${q.n}`,topics=forQuestion(q,year,paper);
    assert.ok(topics.length,key);
    assert.equal(new Set(topics).size,topics.length,key);
    for (const topic of topics) assert.ok(names.includes(topic),`${key}: unreviewed label ${q.topic} -> ${topic}`);
    questions.set(key,topics);
    labels.add(q.topic);
    total++;
  }
}
const contains = (key, included, excluded=[]) => {
  const topics=questions.get(key);
  for (const topic of included) assert.ok(topics.includes(topic),`${key}: missing ${topic}`);
  for (const topic of excluded) assert.ok(!topics.includes(topic),`${key}: incorrect ${topic}`);
};
contains("1-2017-5",["不等式"]);
contains("1-2018-6",["不等式"]);
contains("2-2019-19",["畢氏定理","面積與體積"],["相似形"]);
contains("2-2022-17",["面積與體積"],["相似形"]);
contains("2-2022-4",["二次方程","因式分解"],["一次方程"]);
contains("2-2014-26",["圓的坐標幾何","直線坐標幾何"]);
contains("1-2020-7",["二次函數與配方法","二次方程"],["直線坐標幾何"]);
contains("1-2021-10",["二次函數與配方法","變分"],["直線坐標幾何"]);
contains("2-2020-34",["函數與圖像","直線坐標幾何"],["坐標變換"]);
contains("2-2023-40",["立體三角學"],["面積與體積"]);
contains("1-2015-12",["集中趨勢","離散程度","統計圖表"]);
contains("1-2025-12",["離散程度","統計圖表"]);
contains("1-2026-19",["二次函數與配方法","函數圖像變換","三角形中心"]);
assert.equal(total,833);
console.log(`${total} questions, ${labels.size} original labels: covered by ${names.length} shared categories; aliases, multi-topic membership and reviewed ambiguities passed.`);
