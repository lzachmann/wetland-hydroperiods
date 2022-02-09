// Bring this file into your scripts with:
// var utils = require('users/laura_csp/wetland_hydroperiods:src/utils.js');

var utils = {};
// utils.dir = 'TBD'; // base path for all assets

// ---- Import submodules ----

// Vizualization utilities
utils.viz = require("users/laura_csp/wetland_hydroperiods:src/_viz.js");
// Default endmembers
utils.endmembers = require("users/laura_csp/wetland_hydroperiods:src/_endmembers.js");
// Custom endmembers
var other_endmembers = require("users/laura_csp/wetland_hydroperiods:select-endmembers.js");

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

// Function to unmask an image and replace masked NA values with -9999 for export,
// otherwise, these NAs would be turned into zeros upon export, and can't be distinguished
// from true zeros.
utils.cloudUnmask = function (image) {
  return image.unmask(-9999);
};

utils.oneOrNotOne = function (image) {
  // anything that is not NA is 1, anything that is NA is -1
};

// Function to add a time band to the image (for mapping time series)
utils.createTimeBand_indices = function (image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata("system:time_start").divide(1e18));
};

utils.getSpectralBands = function (image, stack) {
  if (stack === "L5") {
    return image.select("SR_B1", "SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B7");
  } else if (stack === "L8") {
    return image.select("SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7");
  }
};

utils.getEndmembers = function (stack, useCustomEndMembers) {
  if (useCustomEndMembers) {
    return other_endmembers.cstm[stack].getInfo(); // was: utils.endmembers.cstm
  } else {
    return utils.endmembers.dflt[stack];
  }
};

// Function to run full Spectral Mixture Analysis (SMA) for Landsat 5
utils.smaUnmix = function (image, stack, endmembers) {
  if (endmembers === undefined) endmembers = utils.endmembers.dflt[stack];
  // Select 6 spectral bands
  var s_image = utils.getSpectralBands(image, stack);
  // Add time band
  var date = image.get("system:time_start");
  // Get the pixel QA band
  var QA = image.select(["QA_PIXEL"]);
  // Grab endmember ('pure pixel') values for dominant cover types, for each of 6 bands
  // *endmember values listed here = avg. endmember values from research in Yellowstone by M. Halabisky; needs fine tuning)

  // Constrained to one (no negative values)
  var unmixed = s_image.unmix(endmembers, true, true);
  // Add RMSE
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
  var unmixedArea = unmixed; //.multiply(900); // Option: multiply by 900 for approx area of each 30x30m pixel
  // Setting a custom time metadata key.
  var unmixedOutput = unmixedArea
    .addBands(mse.sqrt())
    .addBands(QA)
    .set("date", date)
    .rename("water", "grass", "tree", "veg", "rmse", "QA_PIXEL");
  return unmixedOutput;
};

utils.smaUnmixFun = function (stack, useCustomEndMembers) {
  return function (image) {
    return utils.smaUnmix(
      image,
      stack,
      utils.getEndmembers(stack, useCustomEndMembers)
    );
  };
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

utils.load_and_filter = function (
  id,
  startDate,
  endDate,
  cloudCover,
  geometry,
  startDOY,
  endDOY
) {
  return ee
    .ImageCollection(id)
    .filterDate(startDate, endDate)
    .filterMetadata("CLOUD_COVER", "less_than", cloudCover) // Optional % cloud filter to reduce noise
    .filterBounds(geometry) // Use AOI or geometry from above
    .filter(ee.Filter.calendarRange(startDOY, endDOY, "day_of_year")); // Select days of the year for analysis
};


utils.export_ts = function(ImageCollection) {
  // region, band
  var ts = ImageCollection.map(function (image) {
  // Calculate mean EDDI per wetland polygon
  return image
    .select(band)
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
  Export.table.toDrive(ts, "EDDI-1yr_timeSeries");
}; //utils.export_ts(Gridmet, "eddi1y");


exports = utils;
