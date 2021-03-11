/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const log = new (require('@aliceo2/web-ui').Log)('InfoLogger');

/**
 * Gateway for all Infologger profile calls
 */
class ProfileService {
  /**
   * Initialize connector
   * @param {JsonFileConnector} jsonDb
   */
  constructor(jsonDb) {
    // TODO: Connect SQLite connector
    this.jsonDb = jsonDb;
    this.defaultUserConfig = {
      date: {size: 'cell-m', visible: false},
      time: {size: 'cell-m', visible: true},
      hostname: {size: 'cell-m', visible: false},
      rolename: {size: 'cell-m', visible: true},
      pid: {size: 'cell-s', visible: false},
      username: {size: 'cell-m', visible: false},
      system: {size: 'cell-s', visible: true},
      facility: {size: 'cell-m', visible: true},
      detector: {size: 'cell-s', visible: false},
      partition: {size: 'cell-m', visible: false},
      run: {size: 'cell-s', visible: false},
      errcode: {size: 'cell-s', visible: true},
      errline: {size: 'cell-s', visible: false},
      errsource: {size: 'cell-m', visible: false},
      message: {size: 'cell-xl', visible: true}
    };
    this.defaultCriterias = {
      timestamp: {since: '', until: ''},
      hostname: {match: '', exclude: ''},
      rolename: {match: '', exclude: ''},
      pid: {match: '', exclude: ''},
      username: {match: '', exclude: ''},
      system: {match: '', exclude: ''},
      facility: {match: '', exclude: ''},
      detector: {match: '', exclude: ''},
      partition: {match: '', exclude: ''},
      run: {match: '', exclude: ''},
      errcode: {match: '', exclude: ''},
      errline: {match: '', exclude: ''},
      errsource: {match: '', exclude: ''},
      message: {match: '', exclude: ''},
      severity: {in: 'I W E F'},
      level: {max: null},
    };
  }

  /**
   * Method which handles the request for a profile, if profile doesn't exist, send back default
   * @param {Request} req
   * @param {Response} res
   */
  async getProfile(req, res) {
    const profile = req.query.profile;
    if (profile.trim()) {
      log.info(`[ProfileService] User profile ${profile} fetched successfully`);
      res.status(200).json({user: profile, content:
         {colsHeader: this.defaultUserConfig, criterias: this.defaultCriterias}});
    } else {
      log.warn(`[ProfileService] User profile ${profile} not found, sending default instead`);
      res.status(200).json({user: 'default', content:
        {colsHeader: this.defaultUserConfig, criterias: this.defaultCriterias}});
    }
  }

  /**
   * Method which handles the request for the user profile
   * @param {Request} req
   * @param {Response} res
   */
  async getUserProfile(req, res) {
    const user = parseInt(req.query.user);
    this.jsonDb.getProfileByUsername(user).then((profile) => {
      if (profile) {
        res.status(200).json(profile);
      } else {
        res.status(200).json({user: 'default', content: {colsHeader: this.defaultUserConfig}});
      }
    })
      .catch((err) => this.handleError(res, err));
  }

  /**
  * Method which handles the request for saving the user profile
  * @param {Request} req
  * @param {Response} res
  */
  async saveUserProfile(req, res) {
    const user = parseInt(req.body.user);
    const content = req.body.content;
    this.jsonDb.getProfileByUsername(user).then((profile) => {
      if (!profile) {
        this.jsonDb.createNewProfile(user, content)
          .then((newProfile) => {
            if (newProfile) {
              res.status(200).json({message: 'New profile was successfully created and saved'});
            } else {
              res.status(500).json({message: 'Profile was not found and a new profile could not be created'});
            }
          })
          .catch((err) => this.handleError(res, err));
      } else {
        this.jsonDb.updateProfile(user, content)
          .then(() => res.status(200).json({message: 'Profile updates were saved successfully'}))
          .catch((err) => this.handleError(res, err));
      }
    }).catch((err) => this.handleError(res, err));
  }

  /**
   * Catch all HTTP errors
   * @param {Object} res
   * @param {Error} error
   * @param {number} status
   */
  handleError(res, error, status=500) {
    log.trace(error);
    res.status(status).json({message: error.message});
  }
}


module.exports = ProfileService;
