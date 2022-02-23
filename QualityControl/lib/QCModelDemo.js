/* eslint-disable max-len */
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

const LayoutController = require('./controllers/LayoutController');
const UserService = require('./services/UserService');
const StatusService = require('./StatusService.js');
const config = require('./../test/test-config.js');
const projPackage = require('./../package.json');
const ObjectController = require('./controllers/ObjectController');

// force user accounts during demo
const ownerIdUser1 = 0;
const ownerNameUser1 = 'John Doe';
const ownerIdUser2 = 101;
const ownerNameUser2 = 'Samantha Smith';

/**
 * This is a static model running without any datastore to make tests locally for example.
 * It produces layouts, folders, objects and the contents.
 */

// --------------------------------------------------------

/**
 * Fake promise latency
 * @param {Any} data
 * @return {Promise} data is returned
 */
function promiseResolveWithLatency(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 250);
  });
}

/**
 * Fake promise latency
 * @return {Promise} error is returned
 */
function promiseRejectWithLatency() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Object could not be displayed')), 250);
  });
}

/**
 * Read object's data or null if it fails
 * @param {string} name - Object's path like agentName/objectName/objectNameSub
 * @return {Object|null}
 */
function readObjectData(name) {
  if (name === 'DAQ01/EventSize/ACORDE/ACORDE') {
    // test to cover errors thrown by QC
    return promiseRejectWithLatency();
  }
  const object = objects.find((object) => object.name === `${name}`);
  return promiseResolveWithLatency({qcObject: (object ? object.data : 'Object not found'), timestamps: []});
}

/**
 * List all object without the data which are heavy
 * @return {Array<Layout>}
 */
function listObjects() {
  return promiseResolveWithLatency(objects.map((object) => {
    return {name: object.name, createTime: parseInt(object['Created']), lastModified: parseInt(object['Last-Modified'])};
  }));
}

/**
 * Return an empty array
 * @return {Array<Layout>}
 */
function getObjectTimestampList() {
  return promiseResolveWithLatency([]);
}

/**
 * Return true for checking online mode connection
 * @return {Array<Layout>}
 */
function isOnlineModeConnectionAlive() {
  return promiseResolveWithLatency({running: true});
}

/**
 * Create a layout
 * @param {Layout} layout
 * @return {Object} Empty details
 */
function createLayout(layout) {
  layout.owner_id = ownerIdUser1;
  layout.owner_name = ownerNameUser1;

  layouts.push(layout);
  return promiseResolveWithLatency({});
}

/**
 * List layouts, can be filtered
 * @param {Object} filter - undefined or {owner_id: XXX}
 * @return {Array<Layout>}
 */
function listLayouts(filter = {}) {
  filter.owner_id = filter.owner_id !== undefined ? ownerIdUser1 : filter.owner_id;
  return promiseResolveWithLatency(
    layouts.filter((layout) => (filter.owner_id === undefined || layout.owner_id === filter.owner_id)));
}

/**
 * Retrieve a layout or null
 * @param {string} layoutId - layout id
 * @return {Layout|null}
 */
function readLayout(layoutId) {
  return promiseResolveWithLatency(layouts.find((layout) => layout.id === layoutId));
}

/**
 * Update a single layout by its id
 * @param {string} layoutId
 * @param {Layout} data
 * @return {Object} Empty details
 */
function updateLayout(layoutId, data) {
  const layout = layouts.find((layout) => layout.id === layoutId);
  if (!layout) {
    throw new Error('layout not found');
  }
  Object.assign(layout, data);
  return promiseResolveWithLatency({});
}

/**
 * Delete a single layout by its id
 * @param {string} layoutId
 * @return {Object} Empty details
 */
function deleteLayout(layoutId) {
  const layout = layouts.find((layout) => layout.id === layoutId);
  if (!layout) {
    throw new Error(`layout ${layoutId} not found`);
  }
  const index = layouts.indexOf(layout);
  layouts.splice(index, 1);
  return promiseResolveWithLatency({});
}

// Fake data, not normalized but should be if inserted in relational DB

const graphs = {
  histo: require('./demoData/histo.json'),
  canvas_tf1: require('./demoData/canvas_tf1.json'),
  gaussian: require('./demoData/gaussian.json'),
  gaussian2: require('./demoData/gaussian2.json'),
  hpx: require('./demoData/hpx.json'),
  root0: require('./demoData/root0.json'),
  alice: require('./demoData/alice.json'),
  string: require('./demoData/string.json'),
  checker: require('./demoData/checker.json')
};

setInterval(() => {
  graphs.histo.fArray[0] = Math.random() * 10000 - 5000;
  graphs.histo.fArray[1] = Math.random() * 10000 - 5000;
  graphs.histo.fArray[2] = Math.random() * 10000 - 5000;
  graphs.histo.fArray[3] = Math.random() * 10000 - 5000;
  graphs.histo.fArray[4] = Math.random() * 10000 - 5000;
  graphs.histo.fArray[5] = Math.random() * 10000 - 5000;
}, 100);

const objects = [
  {name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', Created: 2, data: graphs.histo, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/CPV/CPV', Created: 3, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/HMPID/HMPID', Created: 4, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', Created: 5, data: graphs.hpx, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', Created: 6, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/TOF/TOF', Created: 7, data: graphs.histo, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/TPC/TPC', Created: 8, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'DAQ01/EquipmentSize/TPC/STRING', Created: 9, data: graphs.string, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/ACORDE/ACORDE', Created: 10, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/CPV/CPV', Created: 11, data: graphs.hpx, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/HMPID/HMPID', Created: 12, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/ITSSDD/ITSSDD', Created: 13, data: graphs.root0, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/ITSSSD/ITSSSD', Created: 14, data: graphs.histo, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/TOF/TOF', Created: 15, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'DAQ01/EventSize/TPC/TPC', Created: 16, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', Created: 17, data: graphs.hpx, 'Last-Modified': 1020},
  {name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', Created: 18, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'DAQ01/EventSizeClasses/class_C0OB3-ABC', Created: 19, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'DAQ01/_EquimentSizeSummmary', Created: 11, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'DAQ01/_EventSizeClusters', Created: 12, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'DAQ01/HistoWithRandom', Created: 13, data: graphs.histo, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFRRawHitMap', Created: 14, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM035', Created: 15, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM3671', Created: 11, data: graphs.root0, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFRRaws', Created: 12, data: graphs.histo, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFRRawsTime', Created: 11, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFRRawsToT', Created: 13, data: graphs.hpx, 'Last-Modified': 100},
  {name: 'TOFQAshifter/Default/hTOFrefMap', Created: 14, data: graphs.histo, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFRRawHitMap', Created: 15, data: graphs.histo, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM035', Created: 14, data: graphs.root0, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM3671', Created: 14, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFRRaws', Created: 11, data: graphs.gaussian, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFRRawsTime', Created: 21, data: graphs.canvas_tf1, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFRRawsToT', Created: 21, data: graphs.histo, 'Last-Modified': 100},
  {name: 'TST01/Default/hTOFrefMap', Created: 21, data: graphs.hpx, 'Last-Modified': 100},
  ...Array.from({length: 2500}, (x, i) => (
    {name: `BIGTREE/120KB/${i}`, Created: i, data: graphs.hpx, 'Last-Modified': 100}
  )),
  // Checker
  {name: 'qcg/checker/AB', Created: 2, data: graphs.checker, 'Last-Modified': 100},
];

const tabObject = [
  {id: '5aba4a059b755d517e76ef51', options: ['logx'], name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', x: 0, y: 0, w: 2, h: 1},
  {id: '5aba4a059b755d517e76ef52', options: ['logy'], name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef53', options: ['gridx'], name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef54', options: ['gridx'], name: 'DAQ01/EquipmentSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef55', options: ['gridx'], name: 'DAQ01/EquipmentSize/HMPID/HMPID', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef56', options: [], name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef57', options: [], name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef58', options: [], name: 'DAQ01/EquipmentSize/TOF/TOF', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef59', options: [], name: 'DAQ01/EquipmentSize/TPC/TPC', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef50', options: [], name: 'DAQ01/EventSize/ACORDE/ACORDE', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef60', options: [], name: 'DAQ01/EventSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1},
];

const tabs = [
  {id: '5aba4a059b755d517e76eb61', name: 'SDD', objects: tabObject},
  {id: '5aba4a059b755d517e76eb62', name: 'SPD', objects: []},
  {id: '5aba4a059b755d517e76eb63', name: 'TOF', objects: []},
  {id: '5aba4a059b755d517e76eb64', name: 'T0_beam', objects: []},
  {id: '5aba4a059b755d517e76eb65', name: 'MUON', objects: []},
];

const layouts = [
  {id: '5aba4a059b755d517e76ea11', owner_id: ownerIdUser1, name: 'PWG-GA', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea10', owner_id: ownerIdUser1, name: 'AliRoot', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea12', owner_id: ownerIdUser1, name: 'PWG-HF', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea13', owner_id: ownerIdUser1, name: 'PWG-CF', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea14', owner_id: ownerIdUser1, name: 'PWG-PP', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea15', owner_id: ownerIdUser2, name: 'Run Coordination', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea16', owner_id: ownerIdUser2, name: 'PWG-LF', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea17', owner_id: ownerIdUser2, name: 'PWG-DQ', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea18', owner_id: ownerIdUser2, name: 'PWG-JE', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea19', owner_id: ownerIdUser2, name: 'MC productions', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea21', owner_id: ownerIdUser2, name: 'Run Coordination 2017', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea22', owner_id: ownerIdUser2, name: 'O2 Milestones', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea23', owner_id: ownerIdUser2, name: 'O2 TDR', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea24', owner_id: ownerIdUser2, name: 'MC prod dashboard', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea25', owner_id: ownerIdUser2, name: 'DAQ System Dashboard', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea26', owner_id: ownerIdUser2, name: 'PWG-LF (2)', owner_name: ownerNameUser2, tabs: tabs},
];

// --------------------------------------------------------

module.exports.readObjectData = readObjectData;
module.exports.listObjects = listObjects;
module.exports.listOnlineObjects = listObjects;
module.exports.isOnlineModeConnectionAlive = isOnlineModeConnectionAlive;

const dataConnector = {
  readLayout,
  updateLayout,
  listLayouts,
  createLayout,
  deleteLayout
};

const ccdb = {
  getObjectLatestVersionByPath: readObjectData
}
module.exports.layoutService = new LayoutController(dataConnector);
module.exports.objectController = new ObjectController(ccdb)
module.exports.userService = new UserService(dataConnector);
module.exports.getObjectTimestampList = getObjectTimestampList;

module.exports.statusService = new StatusService(config, projPackage);
