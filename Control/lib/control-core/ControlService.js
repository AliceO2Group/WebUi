const log = new (require('@aliceo2/web-ui').Log)('ControlService');

/**
 * Gateway for all AliECS - Core calls
 * @param {Padlock} padLock
 * @param {ControlProxy} ctrlProx
 * @return {JSON}
 */
function ControlService(padLock, ctrlProx) {
  /**
   * Method to execute one core-command and send back results
   * @param {Request} req
   * @param {Response} res
   */
  function executeCommand(req, res) {
    const method = parseMethodString(req.path);
    if (isConnectionReady(res) && isLockSetUp(method, req, res)) {
      ctrlProx[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504));
    }
  }

  /**
   * Method to check if control-core connection is up and running
   * @param {Response} res
   * @return {boolean}
   */
  function isConnectionReady(res) {
    if (!ctrlProx.connectionReady) {
      errorHandler(`Could not establish gRPC connection to Control-Core`, res, 503);
      return false;
    }
    return true;
  }

  /**
   * Method to check if lock is needed and if yes acquired
   * @param {string} method
   * @param {Request} req
   * @param {Response} res
   * @return {boolean}
   */
  function isLockSetUp(method, req, res) {
    // disallow 'not-Get' methods if not owning the lock
    if (!method.startsWith('Get') && method !== 'ListRepos') {
      if (padLock.lockedBy == null) {
        errorHandler(`Control is not locked`, res, 403);
        return false;
      }
      if (req.session.personid != padLock.lockedBy) {
        errorHandler(`Control is locked by ${padLock.lockedByName}`, res, 403);
        return false;
      }
    }
    return true;
  }

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
    res.status(status).send({message: err.message || err});
  }

  /**
   * Method to remove `/` if exists from method
   * @param {string} method
   * @return {string}
   */
  function parseMethodString(method) {
    if (method.indexOf('/') === 0) {
      return method.substring(1, method.length);
    } else {
      return method;
    }
  }

  return {
    executeCommand
  };
}

module.exports = ControlService;
