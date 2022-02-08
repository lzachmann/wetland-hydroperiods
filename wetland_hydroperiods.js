/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var focalArea2 = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-107.70068276601195, 38.5391466504243],
          [-107.7004038162744, 38.53300351043957],
          [-107.69152034001708, 38.533272073972434],
          [-107.69224990086913, 38.53938162350384]]]),
    focalArea1 = 
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
var utils = require('users/laura_csp/wetland_hydroperiods:utils.js');

// National Park Service & Conservation Science Partners
// Northern Colorado Plateau Network (NCPN) Wetland Hydroperiods Project

// Author: Meghan Halabisky (mhalabisky@gmail.com)
// Countributors: Laura Farwell (laura@csp-inc.org) and Luke Zachmann (luke@csp-inc.org)

// Adapted for NCPN by Laura Farwell
// Last updated: Feb 7, 2022

// Purpose: Wetland hydrograph reconstruction using spectral mixture analysis (SMA);
    // + calculates Normalized Difference Indices (for vegetation, wetness);
    // + summarizes Gridmet + TerraClimate drought and climate indices.

// Inputs: L5/L8 Collection 2; Gridmet, TerraClimate
  // + endmember values, focal wetland polygons (maxExtents).

// -----------------------------------------------------------------
// User-Defined Options
// -----------------------------------------------------------------

// Delineate study area:

// Option 1: Draw a polygon of interest using GEE draw tool
var AOI = focalArea2 // AOI = area of interest
// print(AOI)
// Map.addLayer(AOI, {}, 'wetlands');
// Map.centerObject(AOI, 18);

// Option 2: Load a shapefile of wetland polygon(s) -- can use 'maxExtents' above or load your own
var geometry = maxExtents
// print(geometry)
// Map.addLayer(geometry, {}, 'wetlands');
// Map.centerObject(geometry, 10);

// Set parameters
var cloudCover = 40;
// Optional filter; removes any scenes with > 40% clouds -- reduces noise from cloud/cloud shadow artifacts
var startDate = ee.Date('1984-01-01');
var endDate = ee.Date('2021-12-31');
var startDOY = 136; // Start day of year (ex. May 15 = DOY 136)
var endDOY = 288; // End day of year (ex. Oct. 15 = DOY 288) 
var waterSMA = 'water';
var index1 = 'NDVI' // Choose vegetation index
var index2 = 'NDWI' // Choose wetness index
var climVar1 = 'pdsi'; // Choose Gridmet indices: pdsi = Palmer Drought Severity Index
var climVar2 = 'eddi1y'; // eddi2y = Evaporative Drought Demand Index aggregated over last 1 year
var climVar3 = 'swe'; // Choose TerraClimate indices: swe = Snow Water Equivalent
var climVar4 = 'pr'; // pr = Precipitation accumulation
var sceneID = 'LANDSAT/LC08/C02/T1_L2/LC08_035033_20190707'; // Specific Landsat scene for validation


// -----------------------------------------------------------------
// Image collections
// -----------------------------------------------------------------

// Load image collections Landsat 5 (L5) and Landsat 8 (L8)
var imageL5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
        // Replaced deprecated Collection 1 'LANDSAT/LT05/C01/T1_SR'
        .filterDate(startDate, endDate)
        .filterMetadata('CLOUD_COVER', 'less_than', cloudCover) // Optional % cloud filter to reduce noise
        .filterBounds(geometry) // Use AOI or geometry from above
        .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year')); // Select days of the year for analysis
var imageL8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
        // Replaced deprecated Collection 1 'LANDSAT/LC08/C01/T1_SR'
        .filterDate(startDate, endDate)
        .filterMetadata('CLOUD_COVER', 'less_than', cloudCover) // Optional % cloud filter to reduce noise
        .filterBounds(geometry) // Use AOI or geometry from above
        .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year')); // Select days of the year for analysis

// From USGS: Landsat Collection 2 (C02) marks the second major reprocessing effort on the Landsat archive by the USGS
// that results in several data product improvements that harness recent advancements in data processing,
// algorithm development, and data access and distribution capabilities

// print (imageL5, 'L5 image collection');
  // Useful for looking up individual dates or wonky values
  // (often caused by cloud/cloud shadow not masked out)
print (imageL8, 'L8 image collection');

// Map Landsat scene of interest
var L8_vizParams = {'bands': ['SR_B4','SR_B3','SR_B2'], gamma: 1, min: 1000, max: 65455, opacity: 1}; // Define L8 visualization parameters
var L8_scene = ee.Image(sceneID);
Map.addLayer(L8_scene, L8_vizParams, 'Selected Landsat 8 scene');



// -----------------------------------------------------------------
// Functions
// -----------------------------------------------------------------




// ----------------------------------------------
// Run SMA over image collection - time series
// ----------------------------------------------

// Run SMA function on L5 stack
var smaAllL5 = imageL5
.map(smaUnmixL5)
.map(cloudMask)
// .map(cloudUnmask) // should unmask NA values & replace w -9999 (for export)
; 

// Run SMA function on L8 stack
var smaAllL8 = imageL8
.map(smaUnmixL8)
.map(cloudMask)
// .map(cloudUnmask) // should unmask NA values & replace w -9999 (for export)
;

// Merge SMA datasets.
var smaAll = ee.ImageCollection(smaAllL5.merge(smaAllL8));
var smaAll = smaAll.sort('date');

//Display SMA image - first date
var vizParams = {bands: 'water', gamma: 1, min: 0, max: 900, opacity: 1};
print(smaAll, 'sma all');
Map.addLayer(smaAll,  vizParams, 'water', false); 


// -------------------------------------------------------------------------
// Run Normalized Difference indices over image collection - time series
// -------------------------------------------------------------------------

// Add indices (NDVI, NDMI, NDWI, MNDWI)
var L5index = imageL5
.map(cloudMask)
.map(addIndexL5)
.map(createTimeBand_indices);
// print (L5index);

var L8index = imageL8
.map(cloudMask)
.map(addIndexL8)
.map(createTimeBand_indices);
// print (L8index);

var indicesAll = ee.ImageCollection(L5index.merge(L8index));
// print(indicesAll, 'all indices');
//var indicesAll = indicesAll.sort('CLOUD_COVER');


// -----------------------------------------------------------------
// Plotting for data exploration
// -----------------------------------------------------------------

// Define charts and print to Console.

// Surface water area time series
var smaWater = ui.Chart.image.seriesByRegion(smaAll, AOI,
    ee.Reducer.sum(), waterSMA, 30 , 'date')
    //.setChartType('ScatterChart')
    .setOptions({
      title: 'Hydrograph',
      vAxis: {title: 'hydrograph'},
      hAxis: {title: 'Date', format: 'YYYY-MMM', gridlines: {count: 12}},
      lineWidth: 1,
      pointSize: 4,
      colors:['#0000FF']
});
print(smaWater, 'Hydrograph');


// NDVI time series
var timeSeries_index1 = ui.Chart.image.seriesByRegion(indicesAll, AOI,
    ee.Reducer.mean(), index1, 30, 'system:time_start', 'system:index')
      .setChartType('ScatterChart').setOptions({
        title: index1,
        vAxis: {title: index1},
      lineWidth: 1,
      pointSize: 4,
      colors:['0f8755']
});
print(timeSeries_index1, index1);

// NDWI time series
var timeSeries_index2 = ui.Chart.image.seriesByRegion(indicesAll, AOI,
    ee.Reducer.mean(), index2, 30, 'system:time_start', 'system:index')
      .setChartType('ScatterChart').setOptions({
        title: 'NDWI',
        vAxis: {title: index2},
      lineWidth: 1,
      pointSize: 4,
      colors:['#0000FF']
});
print(timeSeries_index2, index2);


// -----------------------------------------------------------------
// Gridmet & TerraClimate Data
// -----------------------------------------------------------------

// Selected climate metrics user-defined at top of script   

// Load and filter Gridmet Drought data
var gridmet = ee.ImageCollection('GRIDMET/DROUGHT')
    .filterDate(startDate, endDate) // filter by date
    .filterBounds(AOI); // filter by polygon

// PDSI time series
var pdsiSeries = ui.Chart.image.series({
    imageCollection: gridmet.select(climVar1), // PDSI - Palmer Drought Severity Index
    region: geometry // Select focal area or wetland
    }).setOptions({
      interpolateNulls: false,
      lineWidth: 1,
      pointSize: 3,
      title: 'PDSI over Time at a Single Polygon',
      vAxis: {title: 'PDSI'},
      hAxis: {title: 'Date', format: 'YYYY-MMM', gridlines: {count: 12}}
    })
print(pdsiSeries, 'pdsi')

// EDDI time series
var eddiSeries = ui.Chart.image.series({
    imageCollection: gridmet.select(climVar2), // eddi1y - aggregated over last year
    region: AOI // Select focal area or wetland
    }).setOptions({
      interpolateNulls: false,
      lineWidth: 1,
      pointSize: 3,
      title: 'EDDI (1-yr) over Time at a Single Polygon',
      vAxis: {title: 'EDDI'},
      hAxis: {title: 'Date', format: 'YYYY-MMM', gridlines: {count: 12}}
    })
print(eddiSeries, 'eddi')

// Load and filter monthly TerraClimate data
var monthlyClim = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
                .filter(ee.Filter.date( startDate, endDate));
    var monthlyClim1 = monthlyClim.select(climVar3); // SWE - Snow Water Equivlent
    var monthlyClim2 = monthlyClim.select(climVar4); // PR - Precipitation accumulation

// Create list of dates for time series
var dateListYearly = ee.List.sequence(0, endDate.difference(startDate,'year').round(),1);
var makeDateListYearly = function(n) {return startDate.advance(n,'year')};
dateListYearly = dateListYearly.map(makeDateListYearly);

// Set scale for TerraClimate data
var scale = 100; // what does scale = 100 do here?

// Plot TerraClimate monthly climate date
var options1 = { // Monthly 
  title: 'SM Monthly',
  fontSize: 12,
  hAxis: {title: 'Date'},
  vAxis: {title: 'SM (mm)'},
  series: {0: {color: 'red'}}
};
print(ui.Chart.image.series(monthlyClim1, AOI, ee.Reducer.mean(), scale).setOptions(options1));
print(ui.Chart.image.series(monthlyClim2, AOI, ee.Reducer.mean(), scale).setOptions(options1));


// -----------------------------------------------------------------
// Export Data
// -----------------------------------------------------------------

//  SMA
var smaSum = smaAll.map(function(i) {
// Sum SMA proportions by wetland polygon
return i.reduceRegions(AOI, ee.Reducer.sum());
});
// Flatten collection and remove geometry for export
var smaTimeSeries = smaSum.flatten().select(['.*'], null, false);
// Export csv file of data summary to user Google Drive account
Export.table.toDrive(smaTimeSeries, 'SMA_timeSeries');


// NDVI, NDWI
var indicesMean = indicesAll.map(function(i) {
// Calculate mean Normalized index per wetland polygon
return i.reduceRegions(geometry, ee.Reducer.mean()); 
});
// Flatten collection and remove geometry for export
var indicesTimeSeries = indicesMean.flatten().select(['.*'], null, false);
// Export csv file
Export.table.toDrive(indicesTimeSeries, 'Normalized_indices_timeSeries');

// Pixel count
var pixelQA = smaAll.select('QA_PIXEL');
// Count pixels per wetland polygon
var pixelCount = pixelQA.map(function(i) {
return i.reduceRegions(geometry, ee.Reducer.count()); 
});
// Flatten collection and remove geometry for export
var pixelCountTimeSeries = pixelCount.flatten().select(['.*'], null, false);
// Export csv file
Export.table.toDrive(pixelCountTimeSeries,'Pixel_count_timeSeries');


// --------------------------------------
// GRIDMET & TERRACLIMATE DATA EXPORTS

//  Extract and summarize GRIDMET drought metrics for export
var Gridmet = ee.ImageCollection('GRIDMET/DROUGHT')
    .filterDate(startDate, endDate) // filter by date
    .filterBounds(geometry); // filter by polygon

// PDSI
var pdsiTimeSeries = Gridmet.map(function(image) {
// Calculate mean PDSI per wetland polygon
  return image.select('pdsi').reduceRegions({
    collection: geometry.select('pond_ID'), 
    reducer: ee.Reducer.mean(), 
    scale: 30
  }).filter(ee.Filter.neq('mean', null))
    .map(function(f) { 
      return f.set('date', image.id());
    });
// Flatten collection and remove geometry for export
}).flatten().select(['.*'], null, false);
// Export csv file
Export.table.toDrive(pdsiTimeSeries, 'PDSI_timeSeries');

// EDDI 1-yr
var eddiTimeSeries = Gridmet.map(function(image) {
// Calculate mean EDDI per wetland polygon
  return image.select('eddi1y').reduceRegions({
    collection: geometry.select('pond_ID'), 
    reducer: ee.Reducer.mean(), 
    scale: 30
  }).filter(ee.Filter.neq('mean', null))
    .map(function(f) { 
      return f.set('date', image.id());
    });
// Flatten collection and remove geometry for export
}).flatten().select(['.*'], null, false);
// Export csv file
Export.table.toDrive(eddiTimeSeries, 'EDDI-1yr_timeSeries');


//  Extract and summarize TERRACLIMATE metrics for export
var TerraClimate = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
    .filterDate(startDate, endDate) // filter by date
    .filterBounds(geometry); // filter by polygon

// SWE (snow water equiv)
var sweTimeSeries = TerraClimate.map(function(image) {
// Calculate mean SWE per wetland polygon
  return image.select('swe').reduceRegions({
    collection: geometry.select('pond_ID'), 
    reducer: ee.Reducer.mean(), 
    scale: 30
  }).filter(ee.Filter.neq('mean', null))
    .map(function(f) { 
      return f.set('date', image.id());
    });
// Flatten collection and remove geometry for export
}).flatten().select(['.*'], null, false);
// Export csv file
Export.table.toDrive(sweTimeSeries, 'SWE_timeSeries');

// PR (precip accum)
var prTimeSeries = TerraClimate.map(function(image) {
// Calculate mean PR per wetland polygon
  return image.select('pr').reduceRegions({
    collection: geometry.select('pond_ID'), 
    reducer: ee.Reducer.mean(), 
    scale: 30
  }).filter(ee.Filter.neq('mean', null))
    .map(function(f) { 
      return f.set('date', image.id());
    });
// Flatten collection and remove geometry for export
}).flatten().select(['.*'], null, false);
// Export csv file
Export.table.toDrive(prTimeSeries, 'PR_timeSeries');