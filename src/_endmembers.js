var endmembers = {};

// ---- defaults: landsat 5 ----

var waterValuesL5 = [
  8043.208015554676, 8080.756670825777, 7789.540509624151, 7786.326487501702,
  7509.152834991363, 7483.721189208322
]; // Taken from water_em values calculated above, avg. values of clear pixels
var grassValuesL5 = [
  8843.37311330939, 9922.24659323189, 9820.30642513859, 18351.052552552545,
  15204.579925163256, 11326.970255970258
];
var treeValuesL5 = [
  8311.864019220891, 8844.313522976367, 8811.815648494348, 12704.090524526127,
  11673.094150957473, 9795.830875338168
];
// var mudValuesL5 = [1122.4565217391305,1459.6521739130435,1596.0072463768115,2802.565217391304,3012.8695652173915,2041.4347826086957];
var vegValuesL5 = [
  9594.75831120915, 10436.032429814142, 10806.023896222036, 14749.24782185492,
  16684.446507257042, 13830.471471619629
];

// ---- defaults: landsat 8 ----

var waterValuesL8 = [
  8043.208015554676, 8080.756670825777, 7789.540509624151, 7786.326487501702,
  7509.152834991363, 7483.721189208322
]; // Taken from water_em values calculated above, avg. values of clear pixels
var grassValuesL8 = [
  8843.37311330939, 9922.24659323189, 9820.30642513859, 18351.052552552545,
  15204.579925163256, 11326.970255970258
];
var treeValuesL8 = [
  8311.864019220891, 8844.313522976367, 8811.815648494348, 12704.090524526127,
  11673.094150957473, 9795.830875338168
];
// var mudValuesL8 = [1122.4565217391305,1459.6521739130435,1596.0072463768115,2802.565217391304,3012.8695652173915,2041.4347826086957];
var vegValuesL8 = [
  9594.75831120915, 10436.032429814142, 10806.023896222036, 14749.24782185492,
  16684.446507257042, 13830.471471619629
];

endmembers.dflt = {};
endmembers.dflt.L5 = [waterValuesL5, grassValuesL5, treeValuesL5, vegValuesL5];
endmembers.dflt.L8 = [waterValuesL8, grassValuesL8, treeValuesL8, vegValuesL8];
// print(ee.Array(ee.List(dflt.L5)))

exports = endmembers;
