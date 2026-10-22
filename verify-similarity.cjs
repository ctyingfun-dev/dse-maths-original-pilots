const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const load=file=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),"utf8"),context);
  return context.window;
};
const solutions=new Map();
for(const paper of [1,2]) for(const year of [2020,2023,2024,2025,2026]) {
  const data=Object.values(load(`paper${paper}/data-${year}.js`))[0];
  for(const q of data.questions) {
    const text=paper===1?q.solution.flatMap(part=>part.steps.flatMap(step=>step.text)).join("\n"):q.solution;
    assert.doesNotMatch(text,/[（(]等角[）)]/,`${year} P${paper} Q${q.n}: vague similarity criterion`);
    solutions.set(`${year}/${paper}/${q.n}`,text);
  }
  const html=load(`paper${paper}/math.js`).solutionHtml("△ABC∼△DEF（AA）。");
  assert.match(html,/（AA）/);
  assert.doesNotMatch(html,/<var>AA<\/var>/,"AA must remain upright");
}
assert.equal(solutions.size,320);

const aaCases=[
  ["2023/1/8","JLN","KMN",[["JNL","KNM"],["JLN","KMN"]]],
  ["2026/1/8","LKM","LNP",[["LKM","LNP"],["KLM","NLP"]]],
  ["2023/2/17","JNP","LMP",[["JNP","LMP"],["JPN","LPM"]]],
  ["2023/2/21","JMN","PNK",[["JNM","PKN"],["MJN","NPK"]]],
  ["2024/2/17","MPR","KNJ",[["PMR","NKJ"],["MPR","KNJ"]]],
  ["2024/2/17","LQR","KNJ",[["QLR","NKJ"],["LQR","KNJ"]]],
  ["2024/2/17","KNS","KQR",[["NKS","QKR"],["KNS","KQR"]]],
  ["2025/2/17","RLQ","RKN",[["RLQ","RKN"],["LRQ","KRN"]]],
  ["2025/2/19","KQP","MPN",[["PKQ","PMN"],["KQP","MPN"]]],
  ["2025/2/21","MNT","MJN",[["MTN","MNJ"],["NMT","JMN"]]],
  ["2026/2/18","KNP","MKJ",[["KNP","MKJ"],["NKP","KMJ"]]],
  ["2026/2/20","PKN","MLN",[["PKN","MLN"],["PNK","MNL"]]],
  ["2026/2/21","JKL","LJM",[["JKL","LJM"],["JLK","LMJ"]]],
];
const reviewed=new Set();
for(const [id,left,right,pairs] of aaCases) {
  const relation=`△${left}∼△${right}`;
  const text=solutions.get(id);
  const at=text.indexOf(`${relation}（AA）`);
  assert.ok(at>=0,`${id}: missing AA conclusion for ${relation}`);
  const before=text.slice(0,at);
  const mapping=Object.fromEntries([...left].map((v,i)=>[v,right[i]]));
  assert.equal(new Set(pairs.map(([angle])=>angle[1])).size,2,`${id}: AA needs distinct vertices`);
  for(const [a,b] of pairs) {
    const mapped=[...a].map(v=>mapping[v]).join("");
    assert.ok(mapped===b||mapped===[...b].reverse().join(""),`${id}: incorrect angle correspondence`);
    const explicit=before.includes(`∠${a}=∠${b}`)||before.includes(`∠${b}=∠${a}`);
    const rightAngles=before.includes(`∠${a}=90°`)&&before.includes(`∠${b}=90°`);
    assert.ok(explicit||rightAngles,`${id}: missing supporting equality for ${a}, ${b}`);
  }
  reviewed.add(`${id}:${relation}`);
}

const sideId="2026/2/23",sideRelation="△JKQ∼△KML";
const sideText=solutions.get(sideId);
assert.ok(sideText.indexOf("JK/KM=KQ/ML=JQ/KL=1/√3。")<sideText.indexOf(`${sideRelation}（三邊成比例）`));
assert.ok(sideText.includes("JK/KM=KQ/ML=JQ/KL=1/√3。"));
assert.ok(sideText.includes(`${sideRelation}（三邊成比例）`));
reviewed.add(`${sideId}:${sideRelation}`);

const congruentId="2024/2/21",congruentRelation="△JMN∼△RLP";
const congruentText=solutions.get(congruentId);
assert.match(congruentText,/JN=RP=a，MN=LP=b，JM=RL=√\(a²\+b²\)。\n故 △JMN≅△RLP（SSS）。\n全等三角形必相似，所以 △JMN∼△RLP/);
reviewed.add(`${congruentId}:${congruentRelation}`);

// Given similarity is used, not re-proved; solid similarity has separate rules.
const givenId="2025/1/8",givenRelation="△JLN∼△MPN";
assert.ok(solutions.get(givenId).includes(`按 ${givenRelation} 的次序`));
assert.doesNotMatch(solutions.get(givenId),/（AA|兩邊成比例且夾角相等|三邊成比例/);
reviewed.add(`${givenId}:${givenRelation}`);
for(const id of ["2023/1/14","2024/1/13","2025/1/14","2026/1/13","2026/2/17"]) {
  assert.doesNotMatch(solutions.get(id),/（AA|兩邊成比例且夾角相等|三邊成比例/);
}
for(const [id,relation] of [
  ["2024/1/8","△JKL≅△KJM（RHS）"],
  ["2025/1/8","△JLN≅△KMN（ASA）"],
  ["2026/1/8","△JKL≅△LNP（SAS）"],
  ["2025/2/19","△KLP≅△MLP（SAS）"],
  ["2026/2/23","△JQP≅△KQL（SSS）"],
]) assert.ok(solutions.get(id).includes(relation),`${id}: congruence criterion changed`);
const found=new Set();
for(const [id,text] of solutions) {
  // The 2020 papers' independent verifiers cover their new geometric models.
  if(id.startsWith("2020/")) continue;
  for(const [relation] of text.matchAll(/△[A-Z]{3}∼△[A-Z]{3}/g)) {
    found.add(`${id}:${relation}`);
  }
}
assert.deepEqual([...found].sort(),[...reviewed].sort(),"Every triangle similarity conclusion needs review");

// Coordinate models independently check the new named angles and side ratios.
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const angle=(points,label)=>{
  const [a,b,c]=[...label].map(v=>points[v]);
  const u=a.map((v,i)=>v-b[i]),v=c.map((x,i)=>x-b[i]);
  return (u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));
};
let geometryChecks=0;
const checkGeometry=(id,points)=>{
  for(const [,left,right,pairs] of aaCases.filter(row=>row[0]===id)) {
    for(const [a,b] of pairs) close(angle(points,a),angle(points,b));
    const ratios=[[0,1],[1,2],[0,2]].map(([a,b])=>distance(points[left[a]],points[left[b]])/distance(points[right[a]],points[right[b]]));
    close(ratios[0],ratios[1]);
    close(ratios[1],ratios[2]);
    geometryChecks++;
  }
};
for(const [u,h] of [[0,4],[2,7],[-1,3]]) {
  checkGeometry("2023/2/17",{J:[0,0],K:[6,0],L:[u+6,h],M:[u,h],N:[4,0],P:[.4*(u+6),.4*h]});
  checkGeometry("2025/2/17",{J:[0,0],K:[6,0],L:[u+6,h],M:[u,h],N:[6/5,0],Q:[u+5,h],R:[6+24*u/19,24*h/19]});
  checkGeometry("2026/2/18",{J:[0,0],K:[4,0],L:[u+7,h],M:[u,h],N:[1.6+.6*u,.6*h],P:[4+.6*u,.6*h]});
}
checkGeometry("2024/2/17",{J:[0,1],K:[0,0],L:[1,0],M:[1,1],N:[.5,0],P:[2/3,1],Q:[7/6,0],R:[1,1/3],S:[3/7,1/7]});
const t=1/Math.sqrt(2);
checkGeometry("2025/2/19",{J:[0,0],K:[1,0],L:[1,1],M:[0,1],N:[t,1+t],P:[1+t,1+t],Q:[2+2*t,1+2*t]});
checkGeometry("2025/2/21",{J:[0,0],M:[25,0],N:[49/25,168/25],T:[49/25,0]});
for(const [a,b] of [[2,3],[7,2]]) {
  const points={J:[-a,0],M:[0,b],N:[0,0],R:[2*a,b],L:[a,0],P:[a,b]};
  for(const [left,right] of [["JN","RP"],["MN","LP"],["JM","RL"]]) {
    close(distance(points[left[0]],points[left[1]]),distance(points[right[0]],points[right[1]]));
  }
  geometryChecks++;
}
const hexagon={J:[1,0],K:[.5,Math.sqrt(3)/2],L:[-.5,Math.sqrt(3)/2],M:[-1,0],Q:[.5,Math.sqrt(3)/6]};
for(const [left,right] of [["JK","KM"],["KQ","ML"],["JQ","KL"]]) {
  close(distance(hexagon[left[0]],hexagon[left[1]])/distance(hexagon[right[0]],hexagon[right[1]]),1/Math.sqrt(3));
}
geometryChecks++;
console.log(`Similarity notation scanned in ${solutions.size} questions; 2023-2026: ${aaCases.length} AA proofs, 1 three-side-ratio proof, 1 congruence inference, ${geometryChecks} independent geometry checks. Run verify-2020.cjs for the 2020 geometric models.`);
