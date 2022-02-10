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
// Author: M. Halabisky
// Purpose: Select endmembers for use in spectral mixture analysis

var verbose = true;
var endmembers = {};

// Set parameters
var cloudCover = 20; // Percent cloud cover filter. Filters out all scenes above cloud cover percentage.
var startDate = ee.Date("1984-01-01");
var endDate = ee.Date("2021-12-31");
var startDOY = 136; // Start day of year (ex. May 15 = DOY 136)
var endDOY = 288; // End day of year (ex. Oct. 15 = DOY 288)

// For endmember extraction used the days where ponds were dry-
// only August months w/ 20% or less cloud cover. 213 - 243

// Image collections L5 and L8
var emL5 = ee
  .ImageCollection("LANDSAT/LT05/C02/T1_L2")
  .filterDate(startDate, endDate)
  .filterMetadata("CLOUD_COVER", "less_than", cloudCover)
  //.filterBounds(geometry) // Use AOI or geometry from above
  .filter(ee.Filter.calendarRange(startDOY, endDOY, "day_of_year")); // select days of the year for analysis

var emL8 = ee
  .ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterDate(startDate, endDate)
  .filterMetadata("CLOUD_COVER", "less_than", cloudCover)
  //.filterBounds(geometry) // Use AOI or geometry from above
  .filter(ee.Filter.calendarRange(startDOY, endDOY, "day_of_year")); // select days of the year for analysis

//print (emL5, "L5 endmember image collection");
//print (emL8, "L8 endmember image collection");

// A general model uses mean estimates from a range of dates. A refined model uses spectral estimates from each image scene.
// Endmember polygons can be derived from multiple locations or a single known location.

// Endmembers for Landsat 5
var emL5_noClouds = emL5
  .filterMetadata("CLOUD_COVER", "less_than", 10)
  .select("SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B7")
  .mean();
// print(emL5_noClouds, "endmember_L5_noClouds");
// water
var waterL5 = emL5_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: water_em,
  scale: 30,
  maxPixels: 1e8,
});
var waterValuesMeanL5 = waterL5.values();
//print (waterValuesMeanL5, 'L5 waterValues');
// grass
var grassL5 = emL5_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: grassland_em,
  scale: 30,
  maxPixels: 1e8,
});
var grassValuesMeanL5 = grassL5.values();
//print (grassValuesMeanL5, "L5 grassValues");
// tree
var treeL5 = emL5_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: tree_em,
  scale: 30,
  maxPixels: 1e8,
});
var treeValuesMeanL5 = treeL5.values();
//print (treeValuesMeanL5, "L5 treeValues");
// mud
var mudL5 = emL5_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: mud_em,
  scale: 30,
  maxPixels: 1e8,
});
var mudValuesMeanL5 = mudL5.values();
//print (mudValuesMeanL5, "L5 mudValues");
// veg
var vegL5 = emL5_noClouds.reduceRegion({
  reducer: ee.Reducer.intervalMean(50, 95),
  geometry: veg_em,
  scale: 30,
  maxPixels: 1e8,
});
var vegValuesMeanL5 = vegL5.values();
//print (vegValuesMeanL5, "L5 vegValues");
// combined
// var spectralSigs_L5 = ee.Array([waterValuesMeanL5, vegValuesMeanL5, treeValuesMeanL5, grassValuesMeanL5, mudValuesMeanL5])
var spectralSigsL5 = ee.Array([
  waterValuesMeanL5,
  grassValuesMeanL5,
  treeValuesMeanL5,
  vegValuesMeanL5,
]);
if (verbose) print(spectralSigsL5, "spectralSigs_L5");

// Endmembers for Landsat 8
var emL8_noClouds = emL8
  .filterMetadata("CLOUD_COVER", "less_than", 10)
  .select("SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7")
  .median();
//print(emL8_noClouds,'endmember_L8_noClouds');
// water
var waterL8 = emL8_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: water_em,
  scale: 30,
  maxPixels: 1e8,
});
var waterValuesMeanL8 = waterL8.values();
//print (waterValuesMeanL8, 'L8 waterValues');
// grass
var grassL8 = emL8_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: grassland_em,
  scale: 30,
  maxPixels: 1e8,
});
var grassValuesMeanL8 = grassL8.values();
//print (grassValuesMeanL8, 'L8 grassValues');
// tree
var treeL8 = emL8_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: tree_em,
  scale: 30,
  maxPixels: 1e8,
});
var treeValuesMeanL8 = treeL8.values();
//print (treeValuesMeanL8, 'L8 treeValues');
// mud
var mudL8 = emL8_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: mud_em,
  scale: 30,
  maxPixels: 1e8,
});
var mudValuesMeanL8 = mudL8.values();
//print (mudValuesMeanL8, "L8 mudValues");
// veg
var vegL8 = emL8_noClouds.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: veg_em,
  scale: 30,
  maxPixels: 1e8,
});
var vegValuesMeanL8 = vegL8.values();
//print (vegValuesMeanL8, "L8 vegValues");
// combined
// var spectralSigsL8 = ee.Array([waterValuesMeanL8, vegValuesMeanL8, treeValuesMeanL8, grassValuesMeanL8, mudValuesMeanL8])
var spectralSigsL8 = ee.Array([
  waterValuesMeanL8,
  grassValuesMeanL8,
  treeValuesMeanL8,
  vegValuesMeanL8,
]);
if (verbose) print(spectralSigsL8, "spectralSigs_L8");

// Make a BarChart from the table and options. //

// Plotting endmember from selected polygons
var em = ee.FeatureCollection([
  ee.Feature(water_em, { label: "water" }),
  ee.Feature(grassland_em, { label: "grass" }),
  ee.Feature(tree_em, { label: "tree" }),
  ee.Feature(mud_em, {'label': 'mud'}),
  ee.Feature(veg_em, { label: "veg" }),
]);
// Map.addLayer(em, {}, 'endmembers');

// Define customization options.
var options = {
  title: "Endmembers spectral signature",
  hAxis: { title: "Wavelength" },
  vAxis: { title: "Reflectance" },
  lineWidth: 1,
  pointSize: 4,
  series: {
    0: { color: "0000FF" }, // water
    1: { color: "00FFF0" }, // grass
    2: { color: "FF0000" }, // tree
    3: {color: 'A66221'}, // mud
    4: { color: "00FF00" }, // veg
  },
};

// Define a list of Landsat wavelengths for X-axis labels.
var wavelengths = [1, 2, 3, 4, 5, 6];

// Create the L5 chart and set options.
var spectraChartL5 = ui.Chart.image
  .regions(
    // scene2.select("SR_B1","SR_B2","SR_B3","SR_B4","SR_B5","SR_B7"),
    emL5
      .filterMetadata("CLOUD_COVER", "less_than", 10)
      .select("SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B7")
      .median(),
    em,
    ee.Reducer.mean(),
    30,
    "label",
    wavelengths
  )
  .setChartType("ScatterChart")
  .setOptions(options);
if (verbose) print(spectraChartL5, "L5 spectral em chart"); // Display the L5 chart.

// Create the L8 chart and set options.
var spectraChartL8 = ui.Chart.image
  .regions(
    //sceneL8.select("SR_B2","SR_B3","SR_B4","SR_B5","SR_B6","SR_B7"),
    emL8
      .filterMetadata("CLOUD_COVER", "less_than", 10)
      .select("SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7")
      .median(),
    em,
    ee.Reducer.mean(),
    30,
    "label",
    wavelengths
  )
  .setChartType("ScatterChart")
  .setOptions(options);
if (verbose) print(spectraChartL8, "L8 spectral em chart"); // Display the L8 chart.

endmembers.cstm = {};
endmembers.cstm.L5 = spectralSigsL5;
endmembers.cstm.L8 = spectralSigsL8;

exports = endmembers;
