const log = new (require('@aliceo2/web-ui').Log)('Control');
/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (status > 500) {
    if (err.stack) {
      log.trace(err);
    }
    log.error(err.message || err);
  }
  res.status(status);
  res.json({message: err.message || err});
}

module.exports = {
  errorHandler
};
