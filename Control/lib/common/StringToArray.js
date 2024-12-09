/**
 * Convert string to list
 * @param {String|Array} data 
 * @returns {Array} list
 */
const stringToArray = (data) => {

  let list = [];
  if (typeof data === 'string' && data.length > 0) {
    list = data.split(',');
  } else if (Array.isArray(data)) {
    list = data;
  }
  return list;
}
exports.stringToArray = stringToArray;