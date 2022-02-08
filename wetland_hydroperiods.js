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

// Pixel quality attributes generated from Landsat's internal CFMASK algorithm
  // stored in the QA_PIXEL Bitmask (Quality Assessment band)
        // 1-digit bits: 0 = not a high confidence pixel, 1 = high confidence pixel
        // 2-digit bits identify low (0-33%), medium (34-66%), high (67-100%) confidence pixels
  // See README file for more details

// Function to extract target QA bits
var getQAbits = function(image, start, end, newName) {
  // Compute the bits we want to extract
  var pattern = 0;
  for (var i = start; i <= end; i++) {
    pattern += Math.pow(2, i);
  }
  // Return a single band image of the extracted QA bits,
    // giving the band a new name
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};
// Function to mask medium and high confidence CLOUD
var cloud = function(image) {
   // Select the QA band
   var QA = image.select(['QA_PIXEL']); 
   // Return an image masking med-high cloud pixels
   return getQAbits(QA, 8, 9, 'cloud').lte(1);
   // *lte (less than or equal to) low confidence (=1)
};
// Function to mask medium and high confidence CLOUD SHADOW
var cloudShadow = function(image) {
   // Select the QA band
   var QA = image.select(['QA_PIXEL']);
   // Return an image masking med-high cloud-shadow pixels 
   return getQAbits(QA, 10, 11, 'cloud_shadow').lte(1);
};
// Function to mask medium and high confidence SNOW/ICE
var snowIce = function(image) {
  // Select the QA band
  var QA = image.select(['QA_PIXEL']); 
  // Return an image masking med-high snow/ice pixels
  return getQAbits(QA, 12, 13, 'snow_ice').lte(1);
};
// Function to mask medium and high confidence CIRRUS
var cirrus = function(image) {
  // Select the QA band
  var QA = image.select(['QA_PIXEL']); 
  // Return an image masking med-high cirrus pixels
  return getQAbits(QA, 14, 15, 'cirrus').lte(1);
};
// Combined cloud, cloud shadow, snow/ice, cirrus mask
var cloudMask = function(image) {
  image = image.updateMask(cloud(image));
  image = image.updateMask(cloudShadow(image));
  image = image.updateMask(snowIce(image));
  return image.updateMask(cirrus(image));
};

// Function to unmask an image and replace masked NA values of (0) with (-9999) for export
var cloudUnmask = function(image) {
  return image.unmask(-9999);
};


// Function to add a time band to the image (for mapping time series)
var createTimeBand_indices = function(image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata('system:time_start').divide(1e18));
};


// Function to run full Spectral Mixture Analysis (SMA) for Landsat 5
var smaUnmixL5 = function(image) {
  // Select 6 spectral bands
  var s_image = image.select('SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7');
  // Add time band
  var date = image.get('system:time_start');
  // Get the pixel QA band
  var QA = image.select(['QA_PIXEL']); 
  // Grab endmember ('pure pixel') values for dominant cover types, for each of 6 bands
  // *endmember values listed here = avg. endmember values from research in Yellowstone by M. Halabisky; needs fine tuning)


//-------------------------------
// Luke, can we add an if/then statement here
// e.g., if endmember parameters set above, use those,
// else use default "dummy' endmembers from Yellowstone
// (see Meghan's code for similar example)


  var waterValuesL5 = [8043.208015554676, 8080.756670825777, 7789.540509624151, 7786.326487501702, 7509.152834991363, 7483.721189208322]; // Taken from water_em values calculated above, avg. values of clear pixels 
  var grassValuesL5 = [8843.37311330939,9922.24659323189, 9820.30642513859,18351.052552552545, 15204.579925163256, 11326.970255970258];
  var treeValuesL5 = [8311.864019220891, 8844.313522976367,8811.815648494348, 12704.090524526127, 11673.094150957473,9795.830875338168 ];
  // var mudValuesL5 = [1122.4565217391305,1459.6521739130435,1596.0072463768115,2802.565217391304,3012.8695652173915,2041.4347826086957];
  var vegValuesL5 = [9594.75831120915, 10436.032429814142,10806.023896222036, 14749.24782185492,16684.446507257042,13830.471471619629];
  // Constrained to one (no negative values)
  var unmixed = s_image.unmix([waterValuesL5, grassValuesL5, treeValuesL5,  vegValuesL5], true, true);
  // Add RMSE 
  var endmembers = ee.List([waterValuesL5, grassValuesL5, treeValuesL5,  vegValuesL5]); 
  var endArray = ee.Image.constant(ee.Array(endmembers).transpose(0, 1));
  var unmixArray = unmixed.toArray().toArray(1);
  var origArray = s_image.toArray().toArray(1);
  // Compute modeled value
  var model = endArray.matrixMultiply(unmixArray);
  var mse = model.subtract(origArray).pow(2).arrayReduce(ee.Reducer.sum(), [0, 1]).arrayGet([0, 0]);
  // Convert to area
  var unmixedArea =  unmixed.multiply(900); // Option: multiply by 900 for approx area of each 30x30m pixel
  // Setting a custom time metadata key.
  var unmixedOutput = unmixedArea.addBands(mse.sqrt()).addBands(QA).set('date', date).rename('water', 'grass', 'tree', 'veg', 'rmse', 'QA_PIXEL');
  return unmixedOutput;
};


// Function to run full SMA for Landsat 8
var smaUnmixL8 = function(image) {
  // Select 6 spectral bands
  var s_image = image.select('SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7');
  // Add time band
  var date = image.get('system:time_start');
  // Get the pixel QA band
  var QA = image.select(['QA_PIXEL']); 
  // Grab endmember ('pure pixel') values for dominant cover types, for each of 6 bands
  // *endmember values listed here = avg. endmember values from research in Yellowstone by M. Halabisky; needs fine tuning)
  var waterValuesL8 = [8043.208015554676, 8080.756670825777, 7789.540509624151, 7786.326487501702, 7509.152834991363, 7483.721189208322]; // Taken from water_em values calculated above, avg. values of clear pixels 
  var grassValuesL8 = [8843.37311330939,9922.24659323189, 9820.30642513859,18351.052552552545, 15204.579925163256, 11326.970255970258];
  var treeValuesL8 = [8311.864019220891, 8844.313522976367,8811.815648494348, 12704.090524526127, 11673.094150957473,9795.830875338168 ];
  // var mudValuesL8 = [1122.4565217391305,1459.6521739130435,1596.0072463768115,2802.565217391304,3012.8695652173915,2041.4347826086957];
  var vegValuesL8 = [9594.75831120915, 10436.032429814142,10806.023896222036, 14749.24782185492,16684.446507257042,13830.471471619629];
  // Constrained to one (no negative values)
  var unmixed = s_image.unmix([waterValuesL8, grassValuesL8, treeValuesL8,  vegValuesL8],true,true);
  // Add RMSE 
  var endmembers = ee.List([waterValuesL8, grassValuesL8, treeValuesL8,  vegValuesL8]); 
  var endArray = ee.Image.constant(ee.Array(endmembers).transpose(0, 1));
  var unmixArray = unmixed.toArray().toArray(1);
  var origArray = s_image.toArray().toArray(1);
  // Compute modeled value
  var model = endArray.matrixMultiply(unmixArray);
  var mse = model.subtract(origArray).pow(2).arrayReduce(ee.Reducer.sum(), [0, 1]).arrayGet([0, 0]);
  // Convert to area
  var unmixedArea =  unmixed.multiply(900); // Option: multiply by 900 for approx area of each 30x30m pixel
  // Setting a custom time metadata key.
  var unmixedOutput = unmixedArea.addBands(mse.sqrt()).addBands(QA).set('date', date).rename('water', 'grass', 'tree',  'veg', 'rmse', 'QA_PIXEL');
  return unmixedOutput;
};


// Functions to add Normalized Difference Indices:
    // NDVI = Normalized Difference Vegetation Index (NIR, red) - greenness
    // NDMI = Normalized Difference Moisture Index (NIR, SWIR) - water content of veg (Gao 1996)
    // NDWI = Normalized Difference Wetness Index (green, NIR) - water content of water bodies (McFeeters 1996)
    // MNDWI = Modified NDWI (green, SWIR) - distinguishes built areas from water (Xu 2006, modified from McFeeters 1996)

// for Landsat 5
var addIndexL5 = function(image) {
  return image
  // NDVI  near infrared and red
  .addBands(image.normalizedDifference(['SR_B4','SR_B3']).rename('NDVI')) // L5: SR_B4=NIR, SR_B3=red
  // NDMI  near infrared and short wave infrared 1
  .addBands(image.normalizedDifference(['SR_B4','SR_B5']).rename('NDMI')) // L5: SR_B4=NIR, SR_B5=SWIR (Gao 1996)
  // NDWI  green and near infrared
  .addBands(image.normalizedDifference(['SR_B2','SR_B4']).rename('NDWI')) // L5: SR_B2=green, SR_B4=NIR (McFeeters 1996)
  // MNDWI  green and short wave infrared 1
  .addBands(image.normalizedDifference(['SR_B2','SR_B5']).rename('MNDWI')); // L5: SR_B2=green, SR_B5=SWIR (Xu 2006)
};
// for Landsat 8
var addIndexL8 = function(image) {
  return image
  // NDVI  near infrared and red
  .addBands(image.normalizedDifference(['SR_B5','SR_B4']).rename('NDVI')) // L8: SR_B5=NIR, SR_B4=red
  // NDMI  near infrared and short wave infrared 1
  .addBands(image.normalizedDifference(['SR_B5','SR_B6']).rename('NDMI')) // L8: SR_B5=NIR, SR_B6=SWIR (Gao 1996)
  // NDWI  green and near infrared
  .addBands(image.normalizedDifference(['SR_B3','SR_B5']).rename('NDWI')) // L8: SR_B3=green, SR_B5=NIR (McFeeters 1996)
  // MNDWI  green and short wave infrared 1
  .addBands(image.normalizedDifference(['SR_B3','SR_B6']).rename('MNDWI')); // L8: SR_B3=green, SR_B6=SWIR (Xu 2006)
};


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