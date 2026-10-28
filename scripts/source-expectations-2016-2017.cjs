// Source-derived fixtures: local author page audits, independently reviewed before release.
// Keep these independent of the adapted question data.
const figures = ids => ({figures:ids,figureCounts:Object.fromEntries(ids.map(n=>[n,1]))});
module.exports = {
  2016: {
    1: {count:20,sections:{'甲一':9,'甲二':5,'乙部':6},polar:[7],
      ...figures([9,12,13,19]),
      marks:[3,3,3,4,4,4,4,5,5,5,6,7,7,10,3,3,5,6,6,12],
      romanSubparts:{12:['i','ii'],13:['i','ii'],20:['i','ii']}},
    2: {count:45,sections:{'甲部':30,'乙部':15},polar:[],
      ...figures([9,14,15,16,17,18,19,20,21,22,23,29,32,35,37,39,40,44]),
      romanSubparts:{}}
  },
  2017: {
    1: {count:19,sections:{'甲一':9,'甲二':5,'乙部':5},polar:[],
      ...figures([7,10,11,19]),
      marks:[3,3,3,4,4,4,4,5,5,6,7,7,7,8,4,4,6,8,13],
      romanSubparts:{13:['i','ii'],14:['i','ii'],18:['i','ii'],19:['i','ii','iii','iv']}},
    2: {count:45,sections:{'甲部':30,'乙部':15},polar:[25],
      ...figures([9,13,14,16,17,18,19,21,22,23,28,29,31,33,38,39,40]),
      romanSubparts:{}}
  }
};
