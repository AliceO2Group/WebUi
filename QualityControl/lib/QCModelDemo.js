const LayoutConnector = require('./connector/LayoutConnector');

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
    setTimeout(() => resolve(data, 250));
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
  return promiseResolveWithLatency(object ? object.data : 'Object not found');
}

/**
 * List all object without the data which are heavy
 * @return {Array<Layout>}
 */
function listObjects() {
  return promiseResolveWithLatency(objects.map((object) => {
    return {name: object.name, createTime: parseInt(object.createTime), lastModified: parseInt(object.lastModified)};
  }));
}

/**
 * WC
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
  {name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', createTime: 2, data: graphs.histo, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/CPV/CPV', createTime: 3, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/HMPID/HMPID', createTime: 4, data: graphs.gaussian, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', createTime: 5, data: graphs.hpx, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', createTime: 6, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/TOF/TOF', createTime: 7, data: graphs.histo, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/TPC/TPC', createTime: 8, data: graphs.gaussian, lastModified: 100},
  {name: 'DAQ01/EquipmentSize/TPC/STRING', createTime: 9, data: graphs.string, lastModified: 100},
  {name: 'DAQ01/EventSize/ACORDE/ACORDE', createTime: 10, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'DAQ01/EventSize/CPV/CPV', createTime: 11, data: graphs.hpx, lastModified: 100},
  {name: 'DAQ01/EventSize/HMPID/HMPID', createTime: 12, data: graphs.gaussian, lastModified: 100},
  {name: 'DAQ01/EventSize/ITSSDD/ITSSDD', createTime: 13, data: graphs.root0, lastModified: 100},
  {name: 'DAQ01/EventSize/ITSSSD/ITSSSD', createTime: 14, data: graphs.histo, lastModified: 100},
  {name: 'DAQ01/EventSize/TOF/TOF', createTime: 15, data: graphs.gaussian, lastModified: 100},
  {name: 'DAQ01/EventSize/TPC/TPC', createTime: 16, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', createTime: 17, data: graphs.hpx, lastModified: 1020},
  {name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', createTime: 18, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'DAQ01/EventSizeClasses/class_C0OB3-ABC', createTime: 19, data: graphs.gaussian, lastModified: 100},
  {name: 'DAQ01/_EquimentSizeSummmary', createTime: 11, data: graphs.gaussian, lastModified: 100},
  {name: 'DAQ01/_EventSizeClusters', createTime: 12, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'DAQ01/HistoWithRandom', createTime: 13, data: graphs.histo, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFRRawHitMap', createTime: 14, data: graphs.gaussian, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM035', createTime: 15, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM3671', createTime: 11, data: graphs.root0, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFRRaws', createTime: 12, data: graphs.histo, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFRRawsTime', createTime: 11, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFRRawsToT', createTime: 13, data: graphs.hpx, lastModified: 100},
  {name: 'TOFQAshifter/Default/hTOFrefMap', createTime: 14, data: graphs.histo, lastModified: 100},
  {name: 'TST01/Default/hTOFRRawHitMap', createTime: 15, data: graphs.histo, lastModified: 100},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM035', createTime: 14, data: graphs.root0, lastModified: 100},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM3671', createTime: 14, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'TST01/Default/hTOFRRaws', createTime: 11, data: graphs.gaussian, lastModified: 100},
  {name: 'TST01/Default/hTOFRRawsTime', createTime: 21, data: graphs.canvas_tf1, lastModified: 100},
  {name: 'TST01/Default/hTOFRRawsToT', createTime: 21, data: graphs.histo, lastModified: 100},
  {name: 'TST01/Default/hTOFrefMap', createTime: 21, data: graphs.hpx, lastModified: 100},
  ...Array.from({length: 2500}, (x, i) => (
    {name: `BIGTREE/120KB/${i}`, createTime: i, data: graphs.hpx, lastModified: 100}
  )),
  // Checker
  {name: 'qcg/checker/AB', createTime: 2, data: graphs.checker, lastModified: 100},
];

const tabObject = [
  {id: '5aba4a059b755d517e76ef51',
    options: ['logx'], name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', x: 0, y: 0, w: 2, h: 1},
  {id: '5aba4a059b755d517e76ef52',
    options: ['logy'], name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef53',
    options: ['gridx'], name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef54',
    options: ['gridx'], name: 'DAQ01/EquipmentSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef55',
    options: ['gridx'], name: 'DAQ01/EquipmentSize/HMPID/HMPID', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef56',
    options: [], name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef57',
    options: [], name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef58',
    options: [], name: 'DAQ01/EquipmentSize/TOF/TOF', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef59',
    options: [], name: 'DAQ01/EquipmentSize/TPC/TPC', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef50',
    options: [], name: 'DAQ01/EventSize/ACORDE/ACORDE', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef60',
    options: [], name: 'DAQ01/EventSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1},
];

const tabs = [
  {id: '5aba4a059b755d517e76eb61', name: 'SDD', objects: tabObject},
  {id: '5aba4a059b755d517e76eb62', name: 'SPD', objects: []},
  {id: '5aba4a059b755d517e76eb63', name: 'TOF', objects: []},
  {id: '5aba4a059b755d517e76eb64', name: 'T0_beam', objects: []},
  {id: '5aba4a059b755d517e76eb65', name: 'MUON', objects: []},
];

const layouts = [
  {id: '5aba4a059b755d517e76ea10',
    owner_id: ownerIdUser1, name: 'AliRoot', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea11',
    owner_id: ownerIdUser1, name: 'PWG-GA', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea12',
    owner_id: ownerIdUser1, name: 'PWG-HF', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea13',
    owner_id: ownerIdUser1, name: 'PWG-CF', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea14',
    owner_id: ownerIdUser1, name: 'PWG-PP', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea15',
    owner_id: ownerIdUser2, name: 'Run Coordination', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea16',
    owner_id: ownerIdUser2, name: 'PWG-LF', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea17',
    owner_id: ownerIdUser2, name: 'PWG-DQ', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea18',
    owner_id: ownerIdUser2, name: 'PWG-JE', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea19',
    owner_id: ownerIdUser2, name: 'MC productions', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea21',
    owner_id: ownerIdUser2, name: 'Run Coordination 2017', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea22',
    owner_id: ownerIdUser2, name: 'O2 Milestones', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea23',
    owner_id: ownerIdUser2, name: 'O2 TDR', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea24',
    owner_id: ownerIdUser2, name: 'MC prod dashboard', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea25',
    owner_id: ownerIdUser2, name: 'DAQ System Dashboard', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea26',
    owner_id: ownerIdUser2, name: 'PWG-LF (2)', owner_name: ownerNameUser2, tabs: tabs},
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

module.exports.layoutConnector = new LayoutConnector(dataConnector);
