// Independently transcribed from the source paper and question-specific scheme.
// A combined SVG may contain multiple source panels; test their labels too.
const figures = ids => ({figures:ids,figureCounts:Object.fromEntries(ids.map(n=>[n,1]))});
module.exports = {
  1: {
    count:19,
    sections:{'甲一':9,'甲二':5,'乙部':5},
    durationMinutes:135,
    polar:[],
    marks:[3,3,3,3,4,4,5,5,5,6,6,7,8,8,3,4,7,8,13],
    markGroups:{
      2:{a:1,b:2},3:{a:1,b:1,c:1},5:{a:2,b:2},6:{a:2,b:2},
      7:{a:3,b:2},8:{a:2,b:3},9:{a:2,b:3},10:{a:2,b:2,c:2},
      11:{a:3,b:3},12:{a:2,b:5},13:{a:4,b:4},14:{a:4,b:4},
      17:{a:2,b:5},18:{a:4,b:4},19:{a:3,b:10}
    },
    ...figures([4,9,10,11,14,15,16,17,18,19]),
    panelLabels:{17:['圖 (a)','圖 (b)']},
    romanSubparts:{12:['i','ii','iii'],19:['i','ii','iii']}
  },
  2: {
    count:45,
    sections:{'甲部':30,'乙部':15},
    durationMinutes:75,
    polar:[23],
    identities:[3],
    ...figures([5,15,16,17,18,20,21,25,29,30,32,38,40,41]),
    panelLabels:{38:['圖 I','圖 II','圖 III','圖 IV']},
    romanSubparts:{}
  }
};
