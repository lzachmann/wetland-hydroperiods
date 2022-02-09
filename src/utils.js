// Bring this file into your scripts with:
// var utils = require('users/laura_csp/wetland_hydroperiods:src/utils.js');

var utils = {};
// utils.dir = 'TBD'; // base path for all assets

// ---- Import submodules ----
var viz = require("users/laura_csp/wetland_hydroperiods:src/_viz.js");
utils.viz = viz;

utils.endmembers = require("users/laura_csp/wetland_hydroperiods:src/_endmembers.js");
// utils.endmembers = endmembers;

// Pixel quality attributes generated from Landsat's internal CFMASK algorithm
// stored in the QA_PIXEL Bitmask (Quality Assessment band)
// 1-digit bits: 0 = not a high confidence pixel, 1 = high confidence pixel
// 2-digit bits identify low (0-33%), medium (34-66%), high (67-100%) confidence pixels
// See README file for more details

// Function to extract target QA bits
var getQAbits = function (image, start, end, newName) {
  // Compute the bits we want to extract
  var pattern = 0;
  for (var i = start; i <= end; i++) {
    pattern += Math.pow(2, i);
  }
  // Return a single band image of the extracted QA bits,
  // giving the band a new name
  return image.select([0], [newName]).bitwiseAnd(pattern).rightShift(start);
};
// Function to mask medium and high confidence CLOUD
var cloud = function (image) {
  // Select the QA band
  var QA = image.select(["QA_PIXEL"]);
  // Return an image masking med-high cloud pixels
  return getQAbits(QA, 8, 9, "cloud").lte(1);
  // *lte (less than or equal to) low confidence (=1)
};
// Function to mask medium and high confidence CLOUD SHADOW
var cloudShadow = function (image) {
  // Select the QA band
  var QA = image.select(["QA_PIXEL"]);
  // Return an image masking med-high cloud-shadow pixels
  return getQAbits(QA, 10, 11, "cloud_shadow").lte(1);
};
// Function to mask medium and high confidence SNOW/ICE
var snowIce = function (image) {
  // Select the QA band
  var QA = image.select(["QA_PIXEL"]);
  // Return an image masking med-high snow/ice pixels
  return getQAbits(QA, 12, 13, "snow_ice").lte(1);
};
// Function to mask medium and high confidence CIRRUS
var cirrus = function (image) {
  // Select the QA band
  var QA = image.select(["QA_PIXEL"]);
  // Return an image masking med-high cirrus pixels
  return getQAbits(QA, 14, 15, "cirrus").lte(1);
};

// Combined cloud, cloud shadow, snow/ice, cirrus mask
utils.cloudMask = function (image) {
  image = image.updateMask(cloud(image));
  image = image.updateMask(cloudShadow(image));
  image = image.updateMask(snowIce(image));
  return image.updateMask(cirrus(image));
};

// Function to unmask an image and replace masked NA values of (0) with (-9999) for export
utils.cloudUnmask = function (image) {
  return image.unmask(-9999);
};

// Function to add a time band to the image (for mapping time series)
utils.createTimeBand_indices = function (image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata("system:time_start").divide(1e18));
};

// Function to run full Spectral Mixture Analysis (SMA) for Landsat 5
utils.smaUnmixL5 = function (image, endmembers) {
  if (endmembers === undefined) endmembers = utils.endmembers.dflt.L5;
  // Select 6 spectral bands
  var s_image = image.select(
    "SR_B1",
    "SR_B2",
    "SR_B3",
    "SR_B4",
    "SR_B5",
    "SR_B7"
  );
  // Add time band
  var date = image.get("system:time_start");
  // Get the pixel QA band
  var QA = image.select(["QA_PIXEL"]);
  // Grab endmember ('pure pixel') values for dominant cover types, for each of 6 bands
  // *endmember values listed here = avg. endmember values from research in Yellowstone by M. Halabisky; needs fine tuning)

  //-------------------------------
  // Luke, can we add an if/then statement here
  // e.g., if endmember parameters set above, use those,
  // else use default "dummy' endmembers from Yellowstone
  // (see Meghan's code for similar example)

  // Constrained to one (no negative values)
  var unmixed = s_image.unmix(
    endmembers,
    true,
    true
  );
  // Add RMSE
  // var endmembers = ee.List([
  //   waterValuesL5,
  //   grassValuesL5,
  //   treeValuesL5,
  //   vegValuesL5,
  // ]);
  var endArray = ee.Image.constant(ee.Array(endmembers).transpose(0, 1));
  var unmixArray = unmixed.toArray().toArray(1);
  var origArray = s_image.toArray().toArray(1);
  // Compute modeled value
  var model = endArray.matrixMultiply(unmixArray);
  var mse = model
    .subtract(origArray)
    .pow(2)
    .arrayReduce(ee.Reducer.sum(), [0, 1])
    .arrayGet([0, 0]);
  // Convert to area
  var unmixedArea = unmixed.multiply(900); // Option: multiply by 900 for approx area of each 30x30m pixel
  // Setting a custom time metadata key.
  var unmixedOutput = unmixedArea
    .addBands(mse.sqrt())
    .addBands(QA)
    .set("date", date)
    .rename("water", "grass", "tree", "veg", "rmse", "QA_PIXEL");
  return unmixedOutput;
};

// Function to run full SMA for Landsat 8
utils.smaUnmixL8 = function (image, endmembers) {
  if (endmembers === undefined) endmembers = utils.endmembers.dflt.L8;
  // Select 6 spectral bands
  var s_image = image.select(
    "SR_B2",
    "SR_B3",
    "SR_B4",
    "SR_B5",
    "SR_B6",
    "SR_B7"
  );
  // Add time band
  var date = image.get("system:time_start");
  // Get the pixel QA band
  var QA = image.select(["QA_PIXEL"]);
  // Grab endmember ('pure pixel') values for dominant cover types, for each of 6 bands
  // *endmember values listed here = avg. endmember values from research in Yellowstone by M. Halabisky; needs fine tuning)
  
  // Constrained to one (no negative values)
  var unmixed = s_image.unmix(
    endmembers,
    true,
    true
  );
  // Add RMSE
  // var endmembers = ee.List([
  //   waterValuesL8,
  //   grassValuesL8,
  //   treeValuesL8,
  //   vegValuesL8,
  // ]);
  var endArray = ee.Image.constant(ee.Array(endmembers).transpose(0, 1));
  var unmixArray = unmixed.toArray().toArray(1);
  var origArray = s_image.toArray().toArray(1);
  // Compute modeled value
  var model = endArray.matrixMultiply(unmixArray);
  var mse = model
    .subtract(origArray)
    .pow(2)
    .arrayReduce(ee.Reducer.sum(), [0, 1])
    .arrayGet([0, 0]);
  // Convert to area
  var unmixedArea = unmixed.multiply(900); // Option: multiply by 900 for approx area of each 30x30m pixel
  // Setting a custom time metadata key.
  var unmixedOutput = unmixedArea
    .addBands(mse.sqrt())
    .addBands(QA)
    .set("date", date)
    .rename("water", "grass", "tree", "veg", "rmse", "QA_PIXEL");
  return unmixedOutput;
};

// Functions to add Normalized Difference Indices:
// NDVI = Normalized Difference Vegetation Index (NIR, red) - greenness
// NDMI = Normalized Difference Moisture Index (NIR, SWIR) - water content of veg (Gao 1996)
// NDWI = Normalized Difference Wetness Index (green, NIR) - water content of water bodies (McFeeters 1996)
// MNDWI = Modified NDWI (green, SWIR) - distinguishes built areas from water (Xu 2006, modified from McFeeters 1996)

// for Landsat 5
utils.addIndexL5 = function (image) {
  return (
    image
      // NDVI  near infrared and red
      .addBands(image.normalizedDifference(["SR_B4", "SR_B3"]).rename("NDVI")) // L5: SR_B4=NIR, SR_B3=red
      // NDMI  near infrared and short wave infrared 1
      .addBands(image.normalizedDifference(["SR_B4", "SR_B5"]).rename("NDMI")) // L5: SR_B4=NIR, SR_B5=SWIR (Gao 1996)
      // NDWI  green and near infrared
      .addBands(image.normalizedDifference(["SR_B2", "SR_B4"]).rename("NDWI")) // L5: SR_B2=green, SR_B4=NIR (McFeeters 1996)
      // MNDWI  green and short wave infrared 1
      .addBands(image.normalizedDifference(["SR_B2", "SR_B5"]).rename("MNDWI"))
  ); // L5: SR_B2=green, SR_B5=SWIR (Xu 2006)
};
// for Landsat 8
utils.addIndexL8 = function (image) {
  return (
    image
      // NDVI  near infrared and red
      .addBands(image.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")) // L8: SR_B5=NIR, SR_B4=red
      // NDMI  near infrared and short wave infrared 1
      .addBands(image.normalizedDifference(["SR_B5", "SR_B6"]).rename("NDMI")) // L8: SR_B5=NIR, SR_B6=SWIR (Gao 1996)
      // NDWI  green and near infrared
      .addBands(image.normalizedDifference(["SR_B3", "SR_B5"]).rename("NDWI")) // L8: SR_B3=green, SR_B5=NIR (McFeeters 1996)
      // MNDWI  green and short wave infrared 1
      .addBands(image.normalizedDifference(["SR_B3", "SR_B6"]).rename("MNDWI"))
  ); // L8: SR_B3=green, SR_B6=SWIR (Xu 2006)
};

utils.load_and_filter = function (id, startDate, endDate, cloudCover, geometry, startDOY, endDOY) {
  return (
    ee.ImageCollection(id)
      .filterDate(startDate, endDate)
      .filterMetadata("CLOUD_COVER", "less_than", cloudCover) // Optional % cloud filter to reduce noise
      .filterBounds(geometry) // Use AOI or geometry from above
      .filter(ee.Filter.calendarRange(startDOY, endDOY, "day_of_year")) // Select days of the year for analysis
  );
};

exports = utils;
