/**
 * Make criteria more readable.
 * This code is a close copy of InfoLogger/public/logFilter/LogFilter.js LN 101 toObject()
 * @param {object} criteria - criteria to be minified
 * @returns {object} minimal filter object
 */
function minifyCriteria(criteria) {
  // Copy everything
  const criterias = JSON.parse(JSON.stringify(criteria));

  // Clean-up the whole structure

  for (const field in criterias) {
    for (const operator in criterias[field]) {
      // Remote parsed properties (generated with fromJSON)
      if (operator.includes('$')) {
        delete criterias[field][operator];
      }

      // Remote empty inputs
      if (!criterias[field][operator]) {
        delete criterias[field][operator];
      } else if (operator === 'match' || operator === 'exclude') {
        // Encode potential breaking characters and escape double quotes as are used by browser by default
        criterias[field][operator] = encodeURI(criterias[field][operator].replace(/["]+/g, '\\"'));
      }

      // Remove empty fields
      if (!Object.keys(criterias[field]).length) {
        delete criterias[field];
      }
    }
  }
  return criterias;
}

module.exports.minifyCriteria = minifyCriteria;
