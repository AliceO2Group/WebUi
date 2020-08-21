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

const assert = require('assert');
const sinon = require('sinon');
const ProfileService = require('../../lib/ProfileService.js');

let profileService;

describe('Profile Service', () => {
  before(() => {
    profileService = new ProfileService({});
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
                profile: 'physicist',
            },
        }; 

        await profileService.getProfile(req,res); 
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(FULL_PROFILE));
    });

    it('should successfully return default profile', async () => {
        const req = {
            query: {
                profile: '',
            },
        }; 

        await profileService.getProfile(req,res); 
        assert.ok(res.status.calledWith(200));
        assert.ok(res.json.calledWith(DEFAULT_PROFILE));
    });
  });
});

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

