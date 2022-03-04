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

module.exports = {
  demoData: true,
  http: {
    port: 8181,
    hostname: 'localhost',
    tls: false
  },
  mysql: {
    host: 'aaaa',
    user: 'aaaa',
    password: 'aaaa',
    database: 'quality_control'
  },
  tobject2json: {
    host: 'localhost',
    port: 7777
  },
  consul: {
    hostname: 'localhost',
    port: 8500
  },
  ccdb: {
    hostname: 'ccdb',
    port: 8500,
    prefix: 'test',
  },
  quality_control: {
    version: '0.19.5-1'
  }
};
