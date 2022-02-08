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

viz.chart.nd = function(imageCollection, regions, band, color) {
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

viz.chart.gmet = function(imageCollection, region, band) {
  return (
    ui.Chart.image.series(imageCollection.select(band), region)
  .setOptions({	
    interpolateNulls: false,	
    lineWidth: 1,	
    pointSize: 3,	
    title: band.toUpperCase() + " over Time at a Single Polygon",	
    vAxis: { title: band.toUpperCase() },	
    hAxis: { title: "Date", format: "YYYY-MMM", gridlines: { count: 12 } },	
  })
    );
};

viz.chart.tclim = function(imageCollection, region, band, startDate, endDate) {
  var scale = 100
//   var monthlyClim1 = monthlyClim.select(climVar3); // SWE - Snow Water Equivlent
// var monthlyClim2 = monthlyClim.select(climVar4); // PR - Precipitation accumulation

// Create list of dates for time series
var dateListYearly = ee.List.sequence(
  0,
  endDate.difference(startDate, "year").round(),
  1
);
var makeDateListYearly = function (n) {
  return startDate.advance(n, "year");
};
dateListYearly = dateListYearly.map(makeDateListYearly);

// Plot TerraClimate monthly climate date
var options1 = {
  title: band.toUpperCase() + " Monthly",
  fontSize: 12,
  hAxis: { title: "Date" },
  vAxis: { title: band.toUpperCase() + " (mm)" },
  series: { 0: { color: "red" } },
};

  return (
    ui.Chart.image.series(imageCollection.select(band), region, ee.Reducer.mean(), scale)
    .setOptions(options1)
    );
};


exports = viz;