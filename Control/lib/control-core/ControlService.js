const log = new (require('@aliceo2/web-ui').Log)('ControlService');
const assert = require('assert');

/**
 * Gateway for all AliECS - Core calls
 */
class ControlService {
  /**
   * Constructor initializing dependencies
   * @param {Padlock} padLock
   * @param {ControlProxy} ctrlProx
   */
  constructor(padLock, ctrlProx) {
    assert(padLock, 'Missing PadLock dependency');
    assert(ctrlProx, 'Missing ControlProxy dependency');
    this.padLock = padLock;
    this.ctrlProx = ctrlProx;
  }
  /**
   * Method to execute command contained by req.path and send back results
   * @param {Request} req
   * @param {Response} res
   */
  executeCommand(req, res) {
    const method = this.parseMethodNameString(req.path);
    if (this.isConnectionReady(res) && this.isLockSetUp(method, req, res)) {
      this.ctrlProx[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => this.errorHandler(error, res, 504));
    }
  }

  /**
  * Method to check provided options for command and execute it through AliECS-Core
  * @param {Request} req
  * @param {Response} res
  */
  executeRocCommand(req, res) {
    res.status(502);
    res.send({message: 'ROC-CONFIG - not supported yet'});
  }

  /**
   * Method to check if control-core connection is up and running
   * @param {Response} res
   * @return {boolean}
   */
  isConnectionReady(res) {
    if (!this.ctrlProx.connectionReady) {
      this.errorHandler(`Could not establish gRPC connection to Control-Core`, res, 503);
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
  isLockSetUp(method, req, res) {
    // disallow 'not-Get' methods if not owning the lock
    if (!method.startsWith('Get') && method !== 'ListRepos') {
      if (this.padLock.lockedBy == null) {
        this.errorHandler(`Control is not locked`, res, 403);
        return false;
      }
      if (req.session.personid != this.padLock.lockedBy) {
        this.errorHandler(`Control is locked by ${this.padLock.lockedByName}`, res, 403);
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
  errorHandler(err, res, status = 500) {
    if (status > 500) {
      if (err.stack) {
        log.trace(err);
      }
      log.error(err.message || err);
    }
    res.status(status);
    res.send({message: err.message || err});
  }

  /**
   * Method to remove `/` if exists from method name
   * @param {string} method
   * @return {string}
   */
  parseMethodNameString(method) {
    if (method && method.indexOf('/') === 0) {
      return method.substring(1, method.length);
    } else {
      return method;
    }
  }
}

module.exports = ControlService;
