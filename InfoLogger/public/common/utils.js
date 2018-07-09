/**
 * Limit the number of calls to `fn` to 1 per `time` maximum.
 * First call is immediate if `time` have been waited already.
 * All other calls before end of `time` window will lead to 1 exececution at the end of window.
 * @param {string} fn - function to be called
 * @param {string} time - ms
 * @return {function} lambda function to be called to call `fn`
 * @example
 * let f = callRateLimiter((arg) => console.log('called', arg), 1000);
 * 00:00:00 f(1);f(2);f(3);f(4);
 * 00:00:00 called 1
 * 00:00:01 called 4
 */
export function callRateLimiter(fn, time) {
  let timer;
  let lastCall;
  return (...args) => {
    // first call or last call was far in the past: let's exec
    if (!lastCall || (Date.now() - lastCall) > time) {
      lastCall = Date.now();
      fn.call(null, ...args);
      return;
    }

    // exec already planed, replace it with new arguments
    if (timer) {
      clearTimeout(timer);
    }

    // plan an exec for near future
    timer = setTimeout(function() {
      lastCall = Date.now();
      fn.call(null, ...args);
      timer = null;
    }, time - (Date.now() - lastCall));
  };
}
