/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var water_em = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-110.36364746532547, 44.489384394875316],
          [-110.36330414257156, 44.484240854633285],
          [-110.35412025890457, 44.48454703043786],
          [-110.35446358165848, 44.48956808435282],
          [-110.36296081981766, 44.489445624765416]]]),
    veg_em = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-110.59731371734728, 44.956415293811354],
          [-110.59764631126512, 44.9563241873209],
          [-110.59764631126512, 44.95608882821774],
          [-110.59709914062609, 44.95611919718854],
          [-110.59710986946214, 44.95646843919731]]]),
    grassland_em = 
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-110.36432083592672, 44.9160080073943],
          [-110.36281879887838, 44.915924434329646],
          [-110.36287244305868, 44.9171552253594],
          [-110.36434229359884, 44.9171552253594]]]),
    mud_em = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-110.60784054931759, 44.953544218253064],
          [-110.60778690513729, 44.953540421962224],
          [-110.60770107444881, 44.95356319970333],
          [-110.60770643886684, 44.95365810686052],
          [-110.60782982048153, 44.95365810686052]]]),
    tree_em = 
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-110.41244969991112, 44.9011194758638],
          [-110.41244969991112, 44.8995311554942],
          [-110.40970311787987, 44.8995311554942],
          [-110.40970311787987, 44.9011194758638]]], null, false),
    geometry = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-119.47572331980219, 47.35843884671611],
          [-119.47726827219476, 47.35419427025484],
          [-119.47426419809808, 47.34262170448998],
          [-119.46885686472406, 47.33191918498283],
          [-119.46276288584222, 47.330639390717494],
          [-119.45924382761469, 47.333955157398776],
          [-119.4749508436059, 47.35867141638131]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Author: M.Halabisky 
// Purpose: Select endmembers for use in spectral mixture analysis


// Set parameters
var Cloud_cover = 20; // Percent cloud cover filter. Filters out all scenes above cloud cover percentage.
var start_date = '1984-01-01';
var end_date = '2021-12-31';
var start_doy = 121; // Julian day of year (From Andy May 1 = 121, except big snow years) I selected May 15th because some days looked snowy. 136
var end_doy = 288; // (From Andy Oct. 15 = DOY 288) 

// For endmember extraction used the days where ponds were dry-
  // only August months w/ 20% or less cloud cover. 213 - 243
// Image collections L5 and L8
var em_L8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
        .filterDate(start_date, end_date)
        .filterMetadata('CLOUD_COVER', 'less_than', Cloud_cover)
        //.filterBounds(geometry) // Use AOI or geometry from above
        .filter(ee.Filter.calendarRange(start_doy, end_doy, 'day_of_year')); // select days of the year for analysis

var em_L5= ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
        .filterDate(start_date, end_date)
        .filterMetadata('CLOUD_COVER', 'less_than', Cloud_cover)
        //.filterBounds(geometry) // Use AOI or geometry from above
        .filter(ee.Filter.calendarRange(start_doy, end_doy, 'day_of_year')); // select days of the year for analysis

// Load image collections Landsat 5 (L5) and Landsat 8 (L8)
// var imageL5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
//         // Replaced deprecated Collection 1 'LANDSAT/LT05/C01/T1_SR'
//         .filterDate(startDate, endDate)
//         .filterMetadata('CLOUD_COVER', 'less_than', cloudCover) // Optional % cloud filter to reduce noise
//         .filterBounds(geometry) // Use AOI or geometry from above
//         .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year')); // Select days of the year for analysis
// var imageL8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
//         // Replaced deprecated Collection 1 'LANDSAT/LC08/C01/T1_SR'
//         .filterDate(startDate, endDate)
//         .filterMetadata('CLOUD_COVER', 'less_than', cloudCover) // Optional % cloud filter to reduce noise
//         .filterBounds(geometry) // Use AOI or geometry from above
//         .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year')); // Select days of the year for analysis

//print (em_L5, "L5 endmember image collection");
//print (em_L8, "L8 endmember image collection");

// A general model uses mean estimates from a range of dates. A refined model uses spectral estimates from each image scene.
// Endmember polygons can be derived from multiple locations or a single knwoen location.

// Endmembers for Landsat 5
var em_L5_noclouds = em_L5.filterMetadata('CLOUD_COVER','less_than',10).select("B1","B2","B3","B4","B5","B7").mean();
print(em_L5_noclouds, "endmember_L5_noclouds");
// water
var waterL5 = em_L5_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:water_em, scale: 30, maxPixels: 1e8});
var watervaluesmeanL5 = waterL5.values();
//print (watervaluesmeanL5, 'L5 watervalues');
// grass
var grassL5 = em_L5_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:grassland_em, scale: 30, maxPixels: 1e8});
var grassvaluesmeanL5 = grassL5.values();
//print (grassvaluesmeanL5, "L5 grassvalues");
// tree
var treeL5 = em_L5_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:tree_em, scale: 30, maxPixels: 1e8});
var treevaluesmeanL5 = treeL5.values();
//print (treevaluesmeanL5, "L5 treevalues");
// mud
var mudL5 = em_L5_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:mud_em, scale: 30, maxPixels: 1e8});
var mudvaluesmeanL5 = mudL5.values();
//print (mudvaluesmeanL5, "L5 mudvalues");
// veg
var vegL5 = em_L5_noclouds.reduceRegion({reducer: ee.Reducer.intervalMean(50, 95),
geometry:veg_em, scale: 30, maxPixels: 1e8});
var vegvaluesmeanL5 = vegL5.values();
//print (vegvaluesmeanL5, "L5 vegvalues");
// combined
// var spectralsigs_L5 = ee.Array([watervaluesmeanL5, vegvaluesmeanL5, treevaluesmeanL5, grassvaluesmeanL5, mudvaluesmeanL5])
var spectralsigs_L5 = ee.Array([watervaluesmeanL5, grassvaluesmeanL5, treevaluesmeanL5, vegvaluesmeanL5])
print(spectralsigs_L5, "spectralsigs_L5")

// Endmembers for Landsat 8
var em_L8_noclouds = em_L8.filterMetadata('CLOUD_COVER','less_than',10).select("B2","B3","B4","B5","B6","B7").median();
//print(em_L8_noclouds,'endmember_L8_noclouds');
// water
var waterL8 = em_L8_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:water_em, scale: 30, maxPixels: 1e8});
var watervaluesmeanL8 = waterL8.values();
//print (watervaluesmeanL8, 'L8 watervalues');
// grass
var grassL8 = em_L8_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:grassland_em, scale: 30, maxPixels: 1e8});
var grassvaluesmeanL8 = grassL8.values();
//print (grassvaluesmeanL8, 'L8 grassvalues');
// tree
var treeL8 = em_L8_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:tree_em, scale: 30, maxPixels: 1e8});
var treevaluesmeanL8 = treeL8.values();
//print (treevaluesmeanL8, 'L8 treevalues');
// mud
var mudL8 = em_L8_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:mud_em, scale: 30, maxPixels: 1e8});
var mudvaluesmeanL8 = mudL8.values();
//print (mudvaluesmeanL8, "L8 mudvalues");
// veg
var vegL8 = em_L8_noclouds.reduceRegion({reducer: ee.Reducer.mean(),
geometry:veg_em, scale: 30, maxPixels: 1e8});
var vegvaluesmeanL8 = vegL8.values();
//print (vegvaluesmeanL8, "L8 vegvalues");
// combined
// var spectralsigs_L8 = ee.Array([watervaluesmeanL8, vegvaluesmeanL8, treevaluesmeanL8, grassvaluesmeanL8, mudvaluesmeanL8])
var spectralsigs_L8 = ee.Array([watervaluesmeanL8, grassvaluesmeanL8, treevaluesmeanL8, vegvaluesmeanL8])
print(spectralsigs_L8, "spectralsigs_L8")

// Make a BarChart from the table and options. //

// Plotting endmember from selected polygons
var em = ee.FeatureCollection([
  ee.Feature(water_em, {'label': 'water'}),
   ee.Feature(grassland_em, {'label': 'grass'}),
   ee.Feature(tree_em, {'label': 'tree'}),
   // ee.Feature(mud_em, {'label': 'mud'}),
  ee.Feature(veg_em, {'label': 'veg'})
]);
// Map.addLayer(em, {}, 'endmembers');

// Define customization options.
var options = {
  title: 'Endmembers spectral signature',
  hAxis: {title: 'Wavelength'},
  vAxis: {title: 'Reflectance'},
  lineWidth: 1,
  pointSize: 4,
  series: {
    0: {color: '0000FF' }, // water
    1: {color: '00FFF0'}, // grass
    2: {color: 'FF0000'}, // tree
    // ?: {color: 'A66221'}, // mud
    3: {color: '00FF00'}, // veg
}};

// Define a list of Landsat wavelengths for X-axis labels.
var wavelengths = [1, 2, 3, 4, 5, 6];

// Create the L5 chart and set options.
var spectraChartL5 = ui.Chart.image.regions(
   // scene2.select("B1","B2","B3","B4","B5","B7"),
    em_L5.filterMetadata('CLOUD_COVER', 'less_than', 10).select("B1","B2","B3","B4","B5","B7").median(),
    em,  ee.Reducer.mean(), 30, 'label', wavelengths)
        .setChartType('ScatterChart')
        .setOptions(options);
print(spectraChartL5, 'L5 spectral em chart'); // Display the L5 chart.

// Create the L8 chart and set options.
var spectraChartL8 = ui.Chart.image.regions(
    //sceneL8.select("B2","B3","B4","B5","B6","B7"),
    em_L8.filterMetadata('CLOUD_COVER', 'less_than', 10).select("B2","B3","B4","B5","B6","B7").median(),
    em,  ee.Reducer.mean(), 30, 'label', wavelengths)
        .setChartType('ScatterChart')
        .setOptions(options);
print(spectraChartL8, 'L8 spectral em chart'); // Display the L8 chart.

