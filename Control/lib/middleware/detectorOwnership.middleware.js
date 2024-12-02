const {User} = require('../dtos/User');
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
    return res.status(400).json({ message: 'Invalid request: missing information' });
  }
  
  try {
    const u = new User(username, name, personid, access);
    console.log(`Checking locks for detector ${detectorId}`);
    if (!u.belongsToDetector(detectorId)) {
      return res
        .status(403)
        .json({ message: `User ${name} does not have ownership of the lock for detector ${detectorId}` });
    }
  
    next(); // Proceed if lock ownership is verified
  } catch (error) {
    console.error(`Error checking locks:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
  
exports.detectorOwnershipMiddleware = detectorOwnershipMiddleware;
