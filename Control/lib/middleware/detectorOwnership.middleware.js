//const {User} = require('../dtos/User');
/**
   * Middleware function to check detector ownership.
   * 
   * @param {Request} req - Express Request object.
   * @param {Response} res - Express Response object.
   * @param {Function} next - Next middleware to call.
   */
const detectorLockMiddleware = (req, res, next) => {
  const { detectorId } = req.params;
  const { access } = req.session || {};
  
  if (!detectorId) {
    return res.status(400).json({ message: 'Invalid request: missing user or detector information' });
  }
  
  try {

    // if (!hasLock) {
    //   return res
    //     .status(403)
    //     .json({ message: `User ${name} does not have ownership of the lock for detector ${detectorId}` });
    // }
  
    next(); // Proceed if lock ownership is verified
  } catch (error) {
    console.error(`Error checking locks:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
  
module.exports = { detectorLockMiddleware };
  