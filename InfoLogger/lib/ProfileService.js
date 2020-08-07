const log = new (require('@aliceo2/web-ui').Log)('ProfileService');

/**
 * Gateway for all Infologger profile calls
 */
class ProfileService {
  /**
   * Initialize connector
   * @param {JsonFileConnector} jsonDb
   * @param {SQLiteConnector} sqliteDb
   */
  constructor(jsonDb, sqliteDb) {
    this.jsonDb = jsonDb;
    this.sqliteDb = sqliteDb;
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
    const profileName = req.query.profile;
    if (!profileName.trim()) {
      log.warn(`User profile ${profileName} not passed, sending default instead`);
      this.getDefaultProfile(res, profileName);
    } else {
      // eslint-disable-next-line max-len
      const profileQuery ='SELECT * FROM columns INNER JOIN filters USING (profile_id) WHERE profile_id= (SELECT profile_id FROM profiles WHERE profile_name=?)';
      await this.sqliteDb.query(profileQuery, [profileName], true).then((config) => {
        if (config) {
          log.info(`User profile ${profileName} fetched successfully`);
          const [filters, columns] = this.getConfig(config);
          res.status(200).json({user: profileName, content:
                    {colsHeader: columns, criterias: filters}});
        } else {
          log.warn(`Config for this profile not found, sending default instead`);
          this.getDefaultProfile(res, profileName);
        }
      }).catch((err) => {
        log.error(err.message);
        this.getDefaultProfile(res, profileName);
      });
    }
  }
  /**
   * return default profile response
   * @param {Object} config
   * @return {Array} [filters, columns]
   */
  getConfig(config) {
    const columns = {
      date: {size: config.date_size, visible: !!config.date_visible},
      time: {size: config.time_size, visible: !!config.time_visible},
      hostname: {size: config.hostname_size, visible: !!config.hostname_visible},
      rolename: {size: config.rolename_size, visible: !!config.rolename_visible},
      pid: {size: config.pid_size, visible: !!config.pid_visible},
      username: {size: config.username_size, visible: !!config.username_visible},
      system: {size: config.system_size, visible: !!config.system_visible},
      facility: {size: config.facility_size, visible: !!config.facility_visible},
      detector: {size: config.detector_size, visible: !!config.detector_visible},
      partition: {size: config.partition_size, visible: !!config.partition_visible},
      run: {size: config.run_size, visible: !!config.run_visible},
      errcode: {size: config.errcode_size, visible: !!config.errcode_visible},
      errline: {size: config.errline_size, visible: !!config.errline_visible},
      errsource: {size: config.errsource_size, visible: !!config.errsource_visible},
      message: {size: config.message_size, visible: !!config.message_visible}
    };

    const filters = {
      timestamp: {since: config.timestamp_since, until: config.timestamp_until},
      hostname: {match: config.hostname_match, exclude: config.hostname_exclude},
      rolename: {match: config.rolename_match, exclude: config.rolename_exclude},
      pid: {match: config.pid_match, exclude: config.pid_exclude},
      username: {match: config.username_match, exclude: config.username_exclude},
      system: {match: config.system_match, exclude: config.system_exclude},
      facility: {match: config.facility_match, exclude: config.facility_exclude},
      detector: {match: config.detector_match, exclude: config.detector_exclude},
      partition: {match: config.partition_match, exclude: config.partition_exclude},
      run: {match: config.run_match, exclude: config.run_exclude},
      errcode: {match: config.errcode_match, exclude: config.errcode_exclude},
      errline: {match: config.errline_match, exclude: config.errline_exclude},
      errsource: {match: config.errsource_match, exclude: config.errsource_exclude},
      message: {match: config.message_match, exclude: config.message_exclude},
      severity: {in: config.severity_in},
      level: {max: config.level_max},
    };
    return [filters, columns];
  }

  /**
   * return default profile response
    * @param {Object} res
    * @param {string} profile
   */
  getDefaultProfile(res, profile) {
    log.warn(`User profile ${profile} not found, sending default instead`);
    res.status(200).json({user: 'default', content:
          {colsHeader: this.defaultUserConfig, criterias: this.defaultCriterias}});
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
        const defaultUserConfig = {
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
        res.status(200).json({user: 'default', content: {colsHeader: defaultUserConfig}});
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
