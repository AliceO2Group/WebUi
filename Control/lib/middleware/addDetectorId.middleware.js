/**
 * Middleware function to add detectorID to the request object
 * @return {function(req, res, next): void} - middleware function
 */
const addDetectorIdMiddleware = (detectorId) => {
  return async (req, res, next) => {
    req.params.detectorId = detectorId;
    next();
  };
}
exports.addDetectorIdMiddleware = addDetectorIdMiddleware