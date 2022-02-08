// Bring this file into your scripts with:
// var viz = require('users/laura_csp/wetland_hydroperiods:viz.js');

var viz = {};
viz.params = {}; // visualization parameter
viz.chart = {};

// ==== parameters ====

viz.params.L8 = {
  bands: ["SR_B4", "SR_B3", "SR_B2"],
  gamma: 1,
  min: 1000,
  max: 65455,
  opacity: 1,
};

viz.params.sma = { bands: "water", gamma: 1, min: 0, max: 900, opacity: 1 };


// ==== plotting ====

viz.chart.vi = function(imageCollection, regions, band) {
  return (
    ui.Chart.image.seriesByRegion(	
    imageCollection,	
    regions,	
    ee.Reducer.mean(),	
    band,	
    30,	
    "system:time_start",	
    "system:index"	
  )	
  .setChartType("ScatterChart")	
  .setOptions({	
    title: band,	
    vAxis: { title: band },	
    lineWidth: 1,	
    pointSize: 4,	
    colors: [color],	
  })
    );
};

exports = viz;