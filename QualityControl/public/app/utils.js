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

/**
 * Produces a lambda function waiting `time` ms before calling fn.
 * No matter how many calls are done to lambda, the last call is the waiting starting point.
 * @param {function} fn - function to be called after `time` ms
 * @param {number} time - ms
 * @return {function} the lambda function produced
 */
export function timerDebouncer(fn, time) {
  let timer;
  return function() {
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      fn.apply(null, args);
    }, time);
  };
}
