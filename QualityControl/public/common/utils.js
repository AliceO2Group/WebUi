/**
 * Generates a new ObjectId
 * @return {string} 16 random chars, base 16
 */
export function objectId() {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
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
  return function(...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      fn(...args); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
    }, time);
  };
}

let pointers = new WeakMap();
let currentAddress = 0;

/**
 * Generates a unique number for the provided object like a pointer or id
 * Two calls with the same object will provide the same number.
 * Uses a WeekMap so no memory leak.
 * @param {object} obj - the object that needs to be identified
 * @return {number} a unique pointer number
 */
export function pointerId(obj) {
  let ptr = pointers.get(obj);
  if (!ptr) {
    ptr = currentAddress++;
    pointers.set(obj, ptr);
  }
  return ptr;
}
