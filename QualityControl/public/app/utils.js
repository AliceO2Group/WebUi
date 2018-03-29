
export function Uuid32From(reference) {

}

export function Uuid32Random() {

}

/**
 * Generates a new ObjectId
 */
export function objectId() {
  var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
}

/**
 * Make a deep clone of object provided
 * @param {object} obj
 * @return {object} a deep copy
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
