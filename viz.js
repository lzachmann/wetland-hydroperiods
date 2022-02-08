// Bring this file into your scripts with:
// var viz = require('users/laura_csp/wetland_hydroperiods:viz.js');

viz = {};

viz.L8_vizParams = {
  bands: ["SR_B4", "SR_B3", "SR_B2"],
  gamma: 1,
  min: 1000,
  max: 65455,
  opacity: 1,
}; // Define L8 visualization parameters

exports = viz;