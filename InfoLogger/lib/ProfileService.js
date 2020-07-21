const log = new (require('@aliceo2/web-ui').Log)('ProfileService');

/**
 * Gateway for all Infologger profile calls
 */
class ProfileService {
  /**
   * Initialize connector
   */
  constructor() {
      // TODO: Connect SQLite connector 
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
        hostname: {match: '',exclude: ''},
        rolename: {match: '',exclude: ''},
        pid: {match: '',exclude: ''},
        username: {match: '',exclude: ''},
        system: {match: '',exclude: ''},
        facility: {match: '',exclude: ''},
        detector: {match: '',exclude: ''},
        partition: {match: '',exclude: ''},
        run: {match: '',exclude: ''},
        errcode: {match: '',exclude: ''},
        errline: {match: '',exclude: ''},
        errsource: {match: '',exclude: ''},
        message: {match: '',exclude: ''},
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
    if(profile.trim()) {
        log.info(`User profile ${profile} fetched successfully`);
        res.status(200).json({user: profile, content: {colsHeader: this.defaultUserConfig, criterias: this.defaultCriterias}});
    } else {
        log.warn(`User profile ${profile} not found, sending default instead`);
        res.status(200).json({user: 'default', content: {colsHeader: this.defaultUserConfig, criterias: this.defaultCriterias}});
    }
  }
}


module.exports = ProfileService;
