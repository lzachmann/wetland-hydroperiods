/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var focalArea1 = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-112.86259520906428, 37.585532802895735],
          [-112.80629027742366, 37.58444453915495],
          [-112.80697692293147, 37.63122551158921],
          [-112.86980498689631, 37.62959411252596]]]),
    maxExtents = ee.FeatureCollection("users/laura_csp/maxExtents_test"),
    ponds = ee.FeatureCollection("users/laura_csp/ponds_test");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Imports
var utils = require("users/laura_csp/wetland_hydroperiods:src/utils.js");
// print(utils.getEndmembers("L5", true))

// /*
// Author(s): Meghan Halabisky (mhalabisky@gmail.com)
// Contributor(s): Laura Farwell (laura@csp-inc.org) and Luke Zachmann (luke@csp-inc.org)
// Maintainer(s): Luke Zachmann

// Purpose: Wetland hydrograph reconstruction using spectral mixture analysis (SMA)
// + calculates Normalized Difference Indices (for vegetation, wetness)
// + summarizes Gridmet + TerraClimate drought and climate indices.

// Inputs: L5/L8 Collection 2; Gridmet, TerraClimate
// + endmember values, focal wetland polygons (maxExtents).

// Copyright (C) 2022  Meghan Halabisky, Laura Farwell, and Luke Zachmann

// -----------------------------------------------------------------
// User-Defined Options
// -----------------------------------------------------------------

// Delineate study area:

// Option 1: Draw a polygon of interest using GEE draw tool
var AOI = focalArea1; // AOI = area of interest
// Map.addLayer(AOI, {}, 'wetlands');
Map.centerObject(AOI, 16);

// Option 2: Load a shapefile of wetland polygon(s) -- can use 'maxExtents' above or load your own
var geometry = maxExtents;
// Map.addLayer(geometry, {}, 'wetlands');

// Set parameters
var cloudCover = 30; // Percent cloud cover filter. Filters out all scenes above cloud cover percentage.
var startDate = ee.Date("1984-01-01");
var endDate = ee.Date("2021-12-31");
var startDOY = 136; // Start day of year (ex. May 15 = DOY 136)
var endDOY = 288; // End day of year (ex. Oct. 15 = DOY 288)
var waterSMA = "water";
var index1 = "NDVI"; // Choose vegetation index
var index2 = "NDWI"; // Choose wetness index
var climVar1 = "pdsi"; // Choose Gridmet indices: pdsi = Palmer Drought Severity Index
var climVar2 = "eddi1y"; // eddi2y = Evaporative Drought Demand Index aggregated over last 1 year
var climVar3 = "swe"; // Choose TerraClimate indices: swe = Snow Water Equivalent
var climVar4 = "pr"; // pr = Precipitation accumulation
var sceneID = "LANDSAT/LC08/C02/T1_L2/LC08_035033_20190707"; // Specific Landsat scene for validation
var useCustomEndMembers = false;

// -----------------------------------------------------------------
// Image collections
// -----------------------------------------------------------------

// Load image collections Landsat 5 (L5) and Landsat 8 (L8)
var imageL5 = utils.load_and_filter(
  "LANDSAT/LT05/C02/T1_L2",
  startDate,
  endDate,
  cloudCover,
  geometry,
  startDOY,
  endDOY
);
var imageL8 = utils.load_and_filter(
  "LANDSAT/LC08/C02/T1_L2",
  startDate,
  endDate,
  cloudCover,
  geometry,
  startDOY,
  endDOY
);

// // print (imageL5, 'L5 image collection'); // Useful for looking up individual dates or wonky values (often caused by cloud/cloud shadow not masked out)
// print(imageL8, "L8 image collection");
// // Map Landsat scene of interest
// var L8_scene = ee.Image(sceneID);
// Map.addLayer(L8_scene, utils.viz.params.L8, "Selected Landsat 8 scene");

// ----------------------------------------------
// Run SMA over image collection - time series
// ----------------------------------------------

var smaAllL5 = imageL5
  .map(utils.smaUnmixFun("L5", useCustomEndMembers))
  .map(utils.cloudMask);
var smaAllL8 = imageL8
  .map(utils.smaUnmixFun("L8", useCustomEndMembers))
  .map(utils.cloudMask);
var smaAll = ee.ImageCollection(smaAllL5.merge(smaAllL8));
var smaAll = smaAll.sort("date");

// Display SMA image - first date
print(smaAll, "sma all");
Map.addLayer(smaAll, utils.viz.params.sma, "water", true);
Map.addLayer(smaAll.map(utils.maskedNA_filter), utils.viz.params.sma, 'water_unmask', true)
// smaAll.map(utils.cloudUnmask)

// -------------------------------------------------------------------------
// Run Normalized Difference indices over image collection - time series
// -------------------------------------------------------------------------

// Add indices (NDVI, NDMI, NDWI, MNDWI)
var L5index = imageL5
  .map(utils.cloudMask)
  .map(utils.addIndexL5)
  .map(utils.createTimeBand_indices);

var L8index = imageL8
  .map(utils.cloudMask)
  .map(utils.addIndexL8)
  .map(utils.createTimeBand_indices);

var indicesAll = ee.ImageCollection(L5index.merge(L8index));
// print(indicesAll, 'all indices');
// var indicesAll = indicesAll.sort('CLOUD_COVER');

// -----------------------------------------------------------------
// Plotting for data exploration
// -----------------------------------------------------------------

// Define charts and print to Console.

// Surface water area time series
var smaWater = ui.Chart.image
  .seriesByRegion(smaAll, AOI, ee.Reducer.sum(), waterSMA, 30, "date")
  //.setChartType('ScatterChart')
  .setOptions({
    title: "Hydrograph",
    vAxis: { title: "hydrograph" },
    hAxis: { title: "Date", format: "YYYY-MMM", gridlines: { count: 12 } },
    lineWidth: 1,
    pointSize: 4,
    colors: ["#0000FF"],
  });
print(smaWater, "Hydrograph");

// NDVI time series
var timeSeries_index1 = utils.viz.chart.nd(indicesAll, AOI, index1, "#0f8755");
print(timeSeries_index1, index1);

// NDWI time series
var timeSeries_index2 = utils.viz.chart.nd(indicesAll, AOI, index2, "#0000FF");
print(timeSeries_index2, index2);

// -----------------------------------------------------------------
// Gridmet & TerraClimate Data
// -----------------------------------------------------------------

// Selected climate metrics user-defined at top of script

// Load and filter Gridmet Drought data
var gridmet = ee
  .ImageCollection("GRIDMET/DROUGHT")
  .filterDate(startDate, endDate) // filter by date
  .filterBounds(AOI); // filter by polygon

// PDSI time series
var pdsiSeries = utils.viz.chart.gmet(gridmet, AOI, climVar1); // TODO: why geometry and not AOI?
print(pdsiSeries, climVar1);

// EDDI time series
var eddiSeries = utils.viz.chart.gmet(gridmet, AOI, climVar2);
print(eddiSeries, climVar2);

// Load and filter monthly TerraClimate data
var monthlyClim = ee
  .ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
  .filter(ee.Filter.date(startDate, endDate));

var sweSeries = utils.viz.chart.tclim(
  monthlyClim,
  AOI,
  climVar3,
  startDate,
  endDate
);
print(sweSeries, climVar3);

var prSeries = utils.viz.chart.tclim(
  monthlyClim,
  AOI,
  climVar4,
  startDate,
  endDate
);
print(prSeries, climVar4);

// -----------------------------------------------------------------
// Export Data
// -----------------------------------------------------------------

//  SMA
// print(smaAll)
// if there's any -1 in the polygon, return a negative value
// qaImage consists of either -1 or 1 for every pixel
// min(qaImage) * the sum  
var smaSum = smaAll
    // .map(utils.cloudUnmask) // should unmask NA values & replace w -9999 (for export)
    .map(function (i) {
  // Sum SMA areas (or proportions) by wetland polygon
  return i.reduceRegions(geometry, ee.Reducer.sum());
});
// Flatten collection and remove geometry for export
var smaTimeSeries = smaSum.flatten().select([".*"], null, false);
// Export csv file of data summary to user Google Drive account
Export.table.toDrive(smaTimeSeries, "SMA_timeSeries");

var smaNaSum = smaAll
    .map(utils.maskedNA_filter) 
    .map(function (i) {
  // Sum SMA areas (or proportions) by wetland polygon
  return i.reduceRegions(geometry, ee.Reducer.sum());
});
// Flatten collection and remove geometry for export
var smaNaTimeSeries = smaNaSum.flatten().select([".*"], null, false);
// Export csv file of data summary to user Google Drive account
Export.table.toDrive(smaNaTimeSeries, "SMA_NA_timeSeries");

// NDVI, NDWI
var indicesMean = indicesAll
  // .map(utils.cloudUnmask)
  .map(function (i) {
  // Calculate mean Normalized index per wetland polygon
  return i.reduceRegions(geometry, ee.Reducer.mean());
});
// Flatten collection and remove geometry for export
var indicesTimeSeries = indicesMean.flatten().select([".*"], null, false);
// Export csv file
Export.table.toDrive(indicesTimeSeries, "Normalized_indices_timeSeries");

// --------------------------------------
// GRIDMET & TERRACLIMATE DATA EXPORTS

//  Extract and summarize GRIDMET drought metrics for export
var Gridmet = ee
  .ImageCollection("GRIDMET/DROUGHT")
  .filterDate(startDate, endDate) // filter by date
  .filterBounds(geometry); // filter by polygon

// PDSI
var pdsiTimeSeries = Gridmet.map(function (image) {
  // Calculate mean PDSI per wetland polygon
  return image
    .select("pdsi")
    .reduceRegions({
      collection: geometry.select("pond_ID"),
      reducer: ee.Reducer.mean(),
      scale: 30,
    })
    .filter(ee.Filter.neq("mean", null))
    .map(function (f) {
      return f.set("date", image.id());
    });
  // Flatten collection and remove geometry for export
})
  .flatten()
  .select([".*"], null, false);
Export.table.toDrive(pdsiTimeSeries, "PDSI_timeSeries");

// EDDI 1-yr
var eddiTimeSeries = Gridmet.map(function (image) {
  // Calculate mean EDDI per wetland polygon
  return image
    .select("eddi1y")
    .reduceRegions({
      collection: geometry.select("pond_ID"),
      reducer: ee.Reducer.mean(),
      scale: 30,
    })
    .filter(ee.Filter.neq("mean", null))
    .map(function (f) {
      return f.set("date", image.id());
    });
  // Flatten collection and remove geometry for export
})
  .flatten()
  .select([".*"], null, false);
Export.table.toDrive(eddiTimeSeries, "EDDI-1yr_timeSeries");

//  Extract and summarize TERRACLIMATE metrics for export
var TerraClimate = ee
  .ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
  .filterDate(startDate, endDate) // filter by date
  .filterBounds(geometry); // filter by polygon

// SWE (snow water equiv)
var sweTimeSeries = TerraClimate.map(function (image) {
  // Calculate mean SWE per wetland polygon
  return image
    .select("swe")
    .reduceRegions({
      collection: geometry.select("pond_ID"),
      reducer: ee.Reducer.mean(),
      scale: 30,
    })
    .filter(ee.Filter.neq("mean", null))
    .map(function (f) {
      return f.set("date", image.id());
    });
  // Flatten collection and remove geometry for export
})
  .flatten()
  .select([".*"], null, false);
Export.table.toDrive(sweTimeSeries, "SWE_timeSeries");

// PR (precip accum)
var prTimeSeries = TerraClimate.map(function (image) {
  // Calculate mean PR per wetland polygon
  return image
    .select('pr')
    .reduceRegions({
      collection: geometry.select("pond_ID"),
      reducer: ee.Reducer.mean(),
      scale: 30,
    })
    .filter(ee.Filter.neq("mean", null))
    .map(function (f) {
      return f.set("date", image.id());
    });
  // Flatten collection and remove geometry for export
})
  .flatten()
  .select([".*"], null, false);
Export.table.toDrive(prTimeSeries, "PR_timeSeries");

// Export table of focal polygon data
Export.table.toDrive(maxExtents, 'maxExtents_export');

//*/