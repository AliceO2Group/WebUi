const objectsFilenames = ['hpx', 'alice', 'canvas_tf1', 'gaussian', 'gaussian2', 'histo', 'root0'];

// force user accounts during demo
const ownerIdUser1 = 100;
const ownerNameUser1 = 'John Doe';
const ownerIdUser2 = 101;
const ownerNameUser2 = 'Samantha Smith';

/**
 * This is a static model running without any datastore to make tests locally for example.
 * It produces layouts, folders, objects and the contents.
 */

// CRUD
module.exports.readObject = readObject;
module.exports.readObjectData = readObjectData;
module.exports.listObjects = listObjects;

module.exports.readLayout = readLayout;
module.exports.writeLayout = writeLayout;
module.exports.listLayouts = listLayouts;
module.exports.createLayout = createLayout;
module.exports.deleteLayout = deleteLayout;

/**
 * Retrieve a monitoring object (TObject)
 * @param {string} agentName
 * @param {string} objectName
 * @return {object} javascript representation of monitoring object
 */

function PromiseResolveWithLatency(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 250);
  });
}

function readObject(path) {
  let object = objects.find(object => object.name === `${path}`);
  return PromiseResolveWithLatency(object ? {name: object.name, quality: object.quality} : null);
}

function readObjectData(name) {
  let object = objects.find(object => object.name === `${name}`);
  return PromiseResolveWithLatency(object ? object.data : null);
}

// List all object without the data which are heavy
function listObjects() {
  return PromiseResolveWithLatency(objects.map(object => {
    return {name: object.name, quality: object.quality}
  }));
}

function createLayout(layout) {
  layout.owner_id = ownerIdUser1;
  layout.owner_name = ownerNameUser1;

  layouts.push(layout);
  return PromiseResolveWithLatency(layout);
}

function listLayouts(filter = {}) {
  if (filter.owner_id) {
    filter.owner_id = ownerIdUser1;
  }

  return PromiseResolveWithLatency(layouts.filter((layout) => {
    if (filter.owner_id && layout.owner_id !== filter.owner_id) {
      return false;
    }

    return true;
  }));
}

function readLayout(layoutName) {
  return PromiseResolveWithLatency(layouts.find(layout => layout.name === layoutName));
}

function writeLayout(layoutName, data) {
  const layout = layouts.find(layout => layout.name === layoutName);
  if (!layout) {
    throw new Error('layout not found');
  }
  Object.assign(layout, data);
  return PromiseResolveWithLatency(layout);
}

function deleteLayout(layoutName) {
  const layout = layouts.find(layout => layout.name === layoutName);
  if (!layout) {
    throw new Error(`layout ${layoutName} not found`);
  }
  const index = layouts.indexOf(layout);
  layouts.splice(index, 1);
  return PromiseResolveWithLatency(null);
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
};

setInterval(() => {
  graphs.histo.fArray[3] += Math.random() * 10000 - 5000;
});

const objects = [
  {name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', quality: 'good', data: graphs.histo},
  {name: 'DAQ01/EquipmentSize/CPV/CPV', quality: 'good', data: graphs.canvas_tf1},
  {name: 'DAQ01/EquipmentSize/HMPID/HMPID', quality: 'good', data: graphs.gaussian},
  {name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', quality: 'good', data: graphs.hpx},
  {name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', quality: 'good', data: graphs.canvas_tf1},
  {name: 'DAQ01/EquipmentSize/TOF/TOF', quality: 'good', data: graphs.histo},
  {name: 'DAQ01/EquipmentSize/TPC/TPC', quality: 'good', data: graphs.gaussian},
  {name: 'DAQ01/EventSize/ACORDE/ACORDE', quality: 'good', data: graphs.canvas_tf1},
  {name: 'DAQ01/EventSize/CPV/CPV', quality: 'good', data: graphs.hpx},
  {name: 'DAQ01/EventSize/HMPID/HMPID', quality: 'good', data: graphs.gaussian},
  {name: 'DAQ01/EventSize/ITSSDD/ITSSDD', quality: 'good', data: graphs.root0},
  {name: 'DAQ01/EventSize/ITSSSD/ITSSSD', quality: 'good', data: graphs.histo},
  {name: 'DAQ01/EventSize/TOF/TOF', quality: 'bad', data: graphs.gaussian},
  {name: 'DAQ01/EventSize/TPC/TPC', quality: 'good', data: graphs.canvas_tf1},
  {name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', quality: 'good', data: graphs.hpx},
  {name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', quality: 'good', data: graphs.canvas_tf1},
  {name: 'DAQ01/EventSizeClasses/class_C0OB3-ABC', quality: 'good', data: graphs.gaussian},
  {name: 'DAQ01/_EquimentSizeSummmary', quality: 'bad', data: graphs.gaussian},
  {name: 'DAQ01/_EventSizeClusters', quality: 'bad', data: graphs.canvas_tf1},
  {name: 'DAQ01/HistoWithRandom', quality: 'bad', data: graphs.histo},
  {name: 'TOFQAshifter/Default/hTOFRRawHitMap', quality: 'good', data: graphs.gaussian},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM035', quality: 'good', data: graphs.canvas_tf1},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM3671', quality: 'good', data: graphs.root0},
  {name: 'TOFQAshifter/Default/hTOFRRaws', quality: 'good', data: graphs.histo},
  {name: 'TOFQAshifter/Default/hTOFRRawsTime', quality: 'good', data: graphs.canvas_tf1},
  {name: 'TOFQAshifter/Default/hTOFRRawsToT', quality: 'bad', data: graphs.hpx},
  {name: 'TOFQAshifter/Default/hTOFrefMap', quality: 'bad', data: graphs.histo},
  {name: 'TST01/Default/hTOFRRawHitMap', quality: 'good', data: graphs.histo},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM035', quality: 'good', data: graphs.root0},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM3671', quality: 'good', data: graphs.canvas_tf1},
  {name: 'TST01/Default/hTOFRRaws', quality: 'good', data: graphs.gaussian},
  {name: 'TST01/Default/hTOFRRawsTime', quality: 'good', data: graphs.canvas_tf1},
  {name: 'TST01/Default/hTOFRRawsToT', quality: 'good', data: graphs.histo},
  {name: 'TST01/Default/hTOFrefMap', quality: 'good', data: graphs.hpx},
  ...Array.from({length: 2500}, (x, i) => ({name: `BIGTREE/120KB/${i}`, quality: 'good', data: graphs.hpx}))
];

const tabObject = [
  {id: '5aba4a059b755d517e76ef51', options: ['logx'], name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', x: 0, y: 0, w: 2, h: 1},
  {id: '5aba4a059b755d517e76ef52', options: ['logy'], name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef53', options: ['gridx', 'lego'], name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef54', options: ['gridx', 'lego'], name: 'DAQ01/EquipmentSize/CPV/CPV', x: 0, y: 0, w: 1, h: 1},
  {id: '5aba4a059b755d517e76ef55', options: ['gridx', 'lego'], name: 'DAQ01/EquipmentSize/HMPID/HMPID', x: 0, y: 0, w: 1, h: 1},
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
  {id: '5aba4a059b755d517e76ea10', owner_id: ownerIdUser1, name: 'PWG-HF', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea11', owner_id: ownerIdUser1, name: 'PWG-GA', owner_name: ownerNameUser1, tabs: tabs},
  {id: '5aba4a059b755d517e76ea12', owner_id: ownerIdUser1, name: 'AliRoot dashboard', owner_name: ownerNameUser1, tabs: tabs},
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
  {id: '5aba4a059b755d517e76ea24', owner_id: ownerIdUser2, name: 'MC productions dashboard', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea25', owner_id: ownerIdUser2, name: 'DAQ System Dashboard', owner_name: ownerNameUser2, tabs: tabs},
  {id: '5aba4a059b755d517e76ea26', owner_id: ownerIdUser2, name: 'PWG-LF (2)', owner_name: ownerNameUser2, tabs: tabs},
];
