const {User} = require('../dtos/User');

const {UnauthorizedAccessError} = require('./../errors/UnauthorizedAccessError.js');
const {updateExpressResponseFromNativeError} = require('./../errors/updateExpressResponseFromNativeError.js');
/**
   * Middleware function to check detector ownership.
   * Based on the session object, it checks if the user has ownership of the detector lock.
   * @param {Request} req - Express Request object.
   * @param {Response} res - Express Response object.
   * @param {Function} next - Next middleware to call.
   */
const detectorOwnershipMiddleware = (req, res, next) => {
  const { detectorId } = req.params;
  const { name, username, personid, access } = req.session || {};

  if (!detectorId || !access) {
    updateExpressResponseFromNativeError(res, new UnauthorizedAccessError('Invalid request: missing information')); 
  }
  
  try {
    const user = new User(username, name, personid, access);
    if (!user.belongsToDetector(detectorId)) {
      updateExpressResponseFromNativeError(res, 
        new UnauthorizedAccessError(`User ${name} does not have ownership of the lock for detector ${detectorId}`));
    }
  
    next(); // Proceed if lock ownership is verified
  } catch (error) {
    updateExpressResponseFromNativeError(res, error);
  }
};
  
exports.detectorOwnershipMiddleware = detectorOwnershipMiddleware;
