const objectsFilenames = ['hpx', 'alice', 'canvas_tf1', 'gaussian', 'gaussian2', 'histo', 'root0'];

/**
 * This is a static model running without any datastore to make tests locally for example.
 * It produces layouts, folders, objects and the contents.
 */

// CRUD
module.exports.readObject = readObject;
module.exports.readObjectData = readObjectData;
module.exports.listObjects = listObjects;

module.exports.readLayout = readLayout;
module.exports.listLayouts = listLayouts;

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
    }, 500);
  });
}

function readObject(path) {
  let object = objects.find(object => object.name === `${path}`);
  return PromiseResolveWithLatency(object ? {name: object.name, status: object.status} : null);
}

function readObjectData(name) {
  let object = objects.find(object => object.name === `${name}`);
  return PromiseResolveWithLatency(object ? object.data : null);
}

// List all object without the data which are heavy
function listObjects() {
  return PromiseResolveWithLatency(objects.map(object => {
    return {name: object.name, status: object.status}
  }));
}

function listLayouts() {
  return PromiseResolveWithLatency(layouts);
}

function readLayout(layoutName) {
  return PromiseResolveWithLatency(layouts.find(layout => layout.name === layoutName));
}

// Fake data, not normalized but should be if inserted in relational DB

const graphs = {
  histo: require('./demo/histo.json'),
  canvas_tf1: require('./demo/canvas_tf1.json'),
  gaussian: require('./demo/gaussian.json'),
  gaussian2: require('./demo/gaussian2.json'),
  hpx: require('./demo/hpx.json'),
  root0: require('./demo/root0.json'),
  alice: require('./demo/alice.json'),
};

const objects = [
  {name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', status: 'active', data: graphs.histo},
  {name: 'DAQ01/EquipmentSize/CPV/CPV', status: 'active', data: graphs.canvas_tf1},
  {name: 'DAQ01/EquipmentSize/HMPID/HMPID', status: 'active', data: graphs.gaussian},
  {name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', status: 'active', data: graphs.hpx},
  {name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', status: 'active', data: graphs.canvas_tf1},
  {name: 'DAQ01/EquipmentSize/TOF/TOF', status: 'active', data: graphs.histo},
  {name: 'DAQ01/EquipmentSize/TPC/TPC', status: 'active', data: graphs.gaussian},
  {name: 'DAQ01/EventSize/ACORDE/ACORDE', status: 'active', data: graphs.canvas_tf1},
  {name: 'DAQ01/EventSize/CPV/CPV', status: 'active', data: graphs.hpx},
  {name: 'DAQ01/EventSize/HMPID/HMPID', status: 'active', data: graphs.gaussian},
  {name: 'DAQ01/EventSize/ITSSDD/ITSSDD', status: 'active', data: graphs.root0},
  {name: 'DAQ01/EventSize/ITSSSD/ITSSSD', status: 'active', data: graphs.histo},
  {name: 'DAQ01/EventSize/TOF/TOF', status: 'inactive', data: graphs.gaussian},
  {name: 'DAQ01/EventSize/TPC/TPC', status: 'active', data: graphs.canvas_tf1},
  {name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', status: 'active', data: graphs.hpx},
  {name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', status: 'active', data: graphs.canvas_tf1},
  {name: 'DAQ01/EventSizeClasses/class_C0OB3-ABC', status: 'active', data: graphs.gaussian},
  {name: 'DAQ01/_EquimentSizeSummmary', status: 'inactive', data: graphs.gaussian},
  {name: 'DAQ01/_EventSizeClusters', status: 'inactive', data: graphs.canvas_tf1},
  {name: 'DAQ01/_EventSizeSummary', status: 'inactive', data: graphs.histo},
  {name: 'TOFQAshifter/Default/hTOFRRawHitMap', status: 'active', data: graphs.gaussian},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM035', status: 'active', data: graphs.canvas_tf1},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM3671', status: 'active', data: graphs.root0},
  {name: 'TOFQAshifter/Default/hTOFRRaws', status: 'active', data: graphs.histo},
  {name: 'TOFQAshifter/Default/hTOFRRawsTime', status: 'active', data: graphs.canvas_tf1},
  {name: 'TOFQAshifter/Default/hTOFRRawsToT', status: 'inactive', data: graphs.hpx},
  {name: 'TOFQAshifter/Default/hTOFrefMap', status: 'inactive', data: graphs.histo},
  {name: 'TST01/Default/hTOFRRawHitMap', status: 'active', data: graphs.histo},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM035', status: 'active', data: graphs.root0},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM3671', status: 'active', data: graphs.canvas_tf1},
  {name: 'TST01/Default/hTOFRRaws', status: 'active', data: graphs.gaussian},
  {name: 'TST01/Default/hTOFRRawsTime', status: 'active', data: graphs.canvas_tf1},
  {name: 'TST01/Default/hTOFRRawsToT', status: 'active', data: graphs.histo},
  {name: 'TST01/Default/hTOFrefMap', status: 'active', data: graphs.hpx},
];

const foldersObjects = [
  {name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', scaleX: 3, scaleY: 1, scale: 1, orientation: 'landscape'},
  {name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', scaleX: 3, scaleY: 1, scale: 0.5, orientation: 'landscape'},
  {name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', scaleX: 3, scaleY: 1, scale: 0.5, orientation: 'landscape'},
  {name: 'DAQ01/EquipmentSize/CPV/CPV', scaleX: 3, scaleY: 2, scale: 0.5, orientation: 'portrait'},
  {name: 'DAQ01/EquipmentSize/HMPID/HMPID', scaleX: 3, scaleY: 2, scale: 0.5, orientation: 'portrait'},
  {name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', scaleX: 3, scaleY: 1, scale: 0.5, orientation: 'landscape'},
  {name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', scaleX: 2, scaleY: 1, scale: 0.5, orientation: 'landscape'},
  {name: 'DAQ01/EquipmentSize/TOF/TOF', scaleX: 2, scaleY: 1, scale: 0.5, orientation: 'landscape'},
  {name: 'DAQ01/EquipmentSize/TPC/TPC', scaleX: 1, scaleY: 1, scale: 0.5, orientation: 'landscape'},
  {name: 'DAQ01/EventSize/ACORDE/ACORDE', scaleX: 1, scaleY: 1, scale: 1, orientation: 'landscape'},
  {name: 'DAQ01/EventSize/CPV/CPV', scaleX: 1, scaleY: 3, scale: 1, orientation: 'landscape'},
];

const folders = [
  {name: 'SDD', objects: foldersObjects},
  {name: 'SPD', objects: []},
  {name: 'TOF', objects: []},
  {name: 'T0_beam', objects: []},
  {name: 'MUON', objects: []},
];

const layouts = [
  {name: 'PWG-HF', owner: 'Francesco Prino', folders: folders},
  {name: 'PWG-GA', owner: 'Yuri Kharlov', folders: folders},
  {name: 'AliRoot dashboard', owner: 'Alina Gabriela Grigoras', folders: folders},
  {name: 'PWG-CF', owner: 'Michael Weber', folders: folders},
  {name: 'PWG-PP', owner: 'Ruben Shahoyan', folders: folders},
  {name: 'Run Coordination', owner: 'Barthelemy Von Haller', folders: folders},
  {name: 'PWG-LF', owner: 'Lee Barnby ', folders: folders},
  {name: 'PWG-DQ', owner: 'Giuseppe Bruno', folders: folders},
  {name: 'PWG-JE', owner: 'Marco Van Leeuwen', folders: folders},
  {name: 'MC productions', owner: 'Marco Van Leeuwen', folders: folders},
  {name: 'Run Coordination 2017', owner: 'Grazia Luparello', folders: folders},
  {name: 'O2 Milestones', owner: 'Vasco Chibante Barroso', folders: folders},
  {name: 'O2 TDR', owner: 'Barthelemy Von Haller', folders: folders},
  {name: 'MC productions dashboard', owner: 'Catalin-Lucian Ristea', folders: folders},
  {name: 'DAQ System Dashboard', owner: 'Barthelemy Von Haller ', folders: folders},
  {name: 'PWG-LF (2)', owner: 'Lee Barnby', folders: folders},
];
