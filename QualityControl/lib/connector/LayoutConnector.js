const log = new (require('@aliceo2/web-ui').Log)('QualityControl-LayoutConnector');
const assert = require('assert');

/**
 * Gateway for all Layout calls
 */
class LayoutConnector {
  /**
   * Setup Layout Connector
   * @param {JSONFileConnector} jsonFileConnector
   */
  constructor(jsonFileConnector) {
    assert(jsonFileConnector, 'Missing JSON File Connector');
    this.jsonFileConnector = jsonFileConnector;
  }

  /**
   * List all layouts, can be filtered by owner_id
   * @param {Request} req
   * @param {Response} res
   */
  async listLayouts(req, res) {
    const filter = {};
    if (req.body.owner_id !== undefined) {
      filter.owner_id = parseInt(req.body.owner_id, 10);
    }
    this.jsonFileConnector.listLayouts(filter)
      .then((data) => res.status(200).json(data))
      .catch((err) => this.errorHandler(err, res));
  }

  /**
   * Read a single layout specified by layoutId
   * @param {Request} req
   * @param {Response} res
   */
  async readLayout(req, res) {
    const layoutId = req.body.layoutId;

    if (!layoutId) {
      res.status(400).send('layoutId parameter is needed');
      return;
    }

    this.jsonFileConnector.readLayout(layoutId)
      .then((data) => res.status(data ? 200 : 404).json(data))
      .catch((err) => this.errorHandler(err, res));
  }

  /**
   * Update a single layout specified by layoutId and body
   * @param {Request} req
   * @param {Response} res
   */
  async updateLayout(req, res) {
    const layoutId = req.query.layoutId;
    const data = req.body;

    if (!layoutId) {
      res.status(400).send('layoutId parameter is needed');
      return;
    }

    if (!data) {
      res.status(400).send('body is needed');
      return;
    }

    this.jsonFileConnector.updateLayout(layoutId, data)
      .then((data) => res.status(200).json(data))
      .catch((err) => this.errorHandler(err, res));
  }

  /**
   * Delete a single layout specified by layoutId
   * @param {Request} req
   * @param {Response} res
   */
  async deleteLayout(req, res) {
    const layoutId = req.params.layoutId;

    if (!layoutId) {
      res.status(400).send('layoutId is needed');
      return;
    }

    this.jsonFileConnector.deleteLayout(layoutId)
      .then((data) => res.status(204).json(data))
      .catch((err) => this.errorHandler(err, res));
  }

  /**
   * Create a layout specified by body
   * @param {Request} req
   * @param {Response} res
   */
  async createLayout(req, res) {
    const layout = req.body;

    if (!layout.name) {
      res.status(400).send('layout.name parameter is needed');
      return;
    }
    if (layout.owner_id === undefined) { // integer from 0 to Infinity
      res.status(400).send('layout.owner_id parameter is needed');
      return;
    }
    if (!layout.owner_name) {
      res.status(400).send('layout.owner_name parameter is needed');
      return;
    }
    if (!layout.tabs) {
      res.status(400).send('layout.tabs parameter is needed');
      return;
    }

    this.jsonFileConnector.createLayout(layout)
      .then((data) => res.status(201).json(data))
      .catch((err) => this.errorHandler(err, res, 409));
  }

  /**
   * Global HTTP error handler, sends status 500
   * @param {string} err - Message error
   * @param {Response} res - Response object to send to
   * @param {number} status - status code 4xx 5xx, 500 will print to debug
   */
  errorHandler(err, res, status = 500) {
    if (status === 500) {
      if (err.stack) {
        log.trace(err);
      }
      log.error(err.message || err);
    }
    res.status(status).send({message: err.message || err});
  }
}

module.exports = LayoutConnector;
