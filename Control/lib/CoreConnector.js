const log = new (require('@aliceo2/web-ui').Log)('CoreConnector');

/**
 * Gateway for all AliECS - Core calls
 * @param {Padlock} padLock
 * @param {ControlProxy} ctrlProx
 * @return {JSON}
 */
function CoreConnector(padLock, ctrlProx) {
  /**
   * Method to check provided options for command and execute it through AliECS-Core
   * @param {Request} req
   * @param {Response} res
   */
  function executeRocCommand(req, res) {
    res.status(502).send({message: 'Not supported yet'});
  }

  /**
   * Method to execute one of the core-commands
   * @param {Request} req
   * @param {Response} res
   */
  function executeCommand(req, res) {
    const method = req.path.substring(1, req.path.length);
    if (!ctrlProx.connectionReady) {
      errorHandler(`Could not establish gRPC connection to Control-Core`, res, 503);
      return;
    }
    // disallow 'not-Get' methods if not owning the lock
    if (!method.startsWith('Get') && method !== 'ListRepos') {
      if (padLock.lockedBy == null) {
        errorHandler(`Control is not locked`, res, 403);
        return;
      }
      if (req.session.personid != padLock.lockedBy) {
        errorHandler(`Control is locked by ${padLock.lockedByName}`, res, 403);
        return;
      }
    }
    ctrlProx[method](req.body)
      .then((response) => res.json(response))
      .catch((error) => errorHandler(error, res, 504));
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

  return {
    executeRocCommand,
    executeCommand
  };
}

module.exports = CoreConnector;
