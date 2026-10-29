// Source fixtures independently reviewed against P1's 24 question / 15 scheme
// pages and all 15 P2 question pages. Keep these independent of authored data.
const figures = ids => ({figures:ids,figureCounts:Object.fromEntries(ids.map(n=>[n,1]))});
module.exports = {
  1: {
    count:19,
    sections:{'甲一':9,'甲二':5,'乙部':5},
    durationMinutes:135,
    polar:[],
    marks:[3,3,3,4,4,4,4,5,5,6,6,7,7,9,4,4,5,9,13],
    markGroups:{
      4:{a:1,b:3},5:{a:3,b:1},6:{a:2,b:2},9:{a:2,b:3},
      10:{a:4,b:2},11:{a:3,b:3},12:{a:3,b:4},13:{a:2,b:3,c:2},
      14:{a:6,b:3},15:{a:2,b:2},16:{a:2,b:2},17:{a:2,b:3},
      18:{a:2,b:3,c:4},19:{a:7,b:6}
    },
    ...figures([8,12,13,15,19]),
    // Q19's two source panels (net and folded solid) share one authored SVG.
    // Both visible panel labels are asserted separately from the group count.
    panelLabels:{19:['圖 (a)','圖 (b)']},
    romanSubparts:{14:['i','ii'],19:['i','ii','iii']}
  },
  2: {
    count:45,
    sections:{'甲部':30,'乙部':15},
    durationMinutes:75,
    polar:[23],
    identities:[5],
    // Q13 contains three dot-pattern panels within one source figure group.
    ...figures([8,13,15,16,17,18,20,25,28,29,32,36,39,40]),
    romanSubparts:{}
  }
};
