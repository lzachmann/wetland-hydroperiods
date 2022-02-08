// Bring this file into your scripts with:
// var viz = require('users/laura_csp/wetland_hydroperiods:viz.js');

var viz = {};

viz.params.L8 = {
  bands: ["SR_B4", "SR_B3", "SR_B2"],
  gamma: 1,
  min: 1000,
  max: 65455,
  opacity: 1,
}; // Define L8 visualization parameters

viz.params.sma = { bands: "water", gamma: 1, min: 0, max: 900, opacity: 1 };

exports = viz;