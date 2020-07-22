const assert = require('assert');
const sinon = require('sinon');
const ProfileService = require('../../lib/ProfileService.js');

const DEFAULT_PROFILE = {
    user: 'default',
    content: {
        colsHeader: {
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
        }, 
        criterias: {
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
        }
    }
};

const FULL_PROFILE = {
    user: 'physicist',
    content: {
        colsHeader: {
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
        }, 
        criterias: {
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
        }
    }
};

describe('Profile Service', () => {
  before(() => {
    profileService = new ProfileService();
  });

  describe('Return requested profile', () => {
    let status,json,res;
    beforeEach(() => {
        status = sinon.stub();
        json = sinon.spy();
        res = { json, status };
        status.returns(res);
    });

    it('should successfully return requested profile', async () => {
        const req = {
            query: {
                profile: "physicist",
            },
        }; 

        await profileService.getProfile(req,res); 
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(FULL_PROFILE));
    });

    it('should successfully return requested profile', async () => {
        const req = {
            query: {
                profile: "",
            },
        }; 

        await profileService.getProfile(req,res); 
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(DEFAULT_PROFILE));
    });
  });
});

