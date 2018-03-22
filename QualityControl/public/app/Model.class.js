class Model extends Observable {

  routeCollections() {
    this.state.route = this.ROUTE_SHOW_COLLECTIONS;
    this.notify();
  }

  routeCollection(collection, folder) {
    if (!collection) throw new Error('collection argument is required');

    this.state.route = this.ROUTE_SHOW_COLLECTION;
    this.state.collection = collection;
    this.notify();
  }

  routeObjects() {
    this.state.route = this.ROUTE_SHOW_OBJECTS;
    this.state.collection = collection;
    this.notify();
  }

  setRoute() {

  }

  constructor() {
    super();

    this.router = new Router();
    this.router.fallback('/a/collections');

    this.router.match('/a/collections', () => {
      this.state.route = this.ROUTE_SHOW_COLLECTIONS;
      this.notify();
    });

    this.router.match('/a/objects', () => {
      this.state.route = this.ROUTE_SHOW_OBJECTS;
      this.notify();
    });

    this.router.match('/a/collections/:collectionName', (params) => {
      var collection = this.state.collections.find(collection => collection.name === params.collectionName);
      if (!collection) {
        alert(`Sorry, this collection ${params.collectionName} does not exist`);
      }

      this.state.route = this.ROUTE_SHOW_COLLECTION;
      this.state.collection = collection;
      this.notify();
    });

    this.router.match('/a/collections/:collectionName/:folderName', (params) => {console.log('params:', params);
      var collection = this.state.collections.find(collection => collection.name === params.collectionName);
      if (!collection) {
        alert(`Sorry, this collection ${params.collectionName} does not exist`);
      }
      var folder = collection.folders.find(folder => folder === params.folderName);
      if (!folder) {
        alert(`Sorry, this folder ${params.folderName} does not exist`);
        return this.router.go(`/a/collections/${params.collectionName}`);
      }

      this.state.route = this.ROUTE_SHOW_COLLECTION;
      this.state.collection = collection;
      this.state.folder = folder;
      this.notify();
    });

    // Route enums
    this.ROUTE_SHOW_OBJECTS = 'ROUTE_SHOW_OBJECTS';
    this.ROUTE_SHOW_COLLECTIONS = 'ROUTE_SHOW_COLLECTIONS';
    this.ROUTE_SHOW_COLLECTION = 'ROUTE_SHOW_COLLECTION';

    this.state = {
      count: 0,
      sidebar: true,

      route: this.ROUTE_SHOW_COLLECTION,
      collection: null,
      folder: null,
      object: null,
      searchInput: null,
      zoom: 3,
      searchCollectionInput: '',
      searchCollectionResult: '',
      searchObjectInput: '',
      searchObjectResult: '',

      collections: [],
      folders: [
      ],
      objects: [],
      objectsTree: null, // computed when objects is set

      currentTab: null,
      tabs: [
        {
          name: 'SDD',
          charts: [
            `https://vcap.me:8443/api/readObjectData?token=${token}&path=DAQ01/EquipmentSize/ACORDE/ACORDE`,
          ],
        },
        {
          name: 'SPD',
          charts: [
            `https://vcap.me:8443/api/readObjectData?token=${token}&path=DAQ01/EquipmentSize/ACORDE/ACORDE`,
            `https://vcap.me:8443/api/readObjectData?token=${token}&path=DAQ01/EquipmentSize/ACORDE/ACORDE`,
            `https://vcap.me:8443/api/readObjectData?token=${token}&path=DAQ01/EquipmentSize/ACORDE/ACORDE`,
            `https://vcap.me:8443/api/readObjectData?token=${token}&path=DAQ01/EquipmentSize/ACORDE/ACORDE`,
            `https://vcap.me:8443/api/readObjectData?token=${token}&path=DAQ01/EquipmentSize/ACORDE/ACORDE`,
          ],        },
        {
          name: 'TOF',
          charts: [
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
          ],        },
        {
          name: 'T0_beam',
          charts: [
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
          ],        },
        {
          name: 'MUON',
          charts: [
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
            `https://vcap.me:8443/api/retrieve?token=${token}&agentName=daqTask&objectName=PayloadSizeSubBlocks`,
          ],        },
      ],
    };

    this.state.currentTab = this.state.tabs[1];
    this.set('objects', window.objects);
    this.set('collections', window.collections);

    // this.load();

    this.inc = this.inc.bind(this);
    this.count = this.count.bind(this);

    document.body.addEventListener('keydown', this.onKeydown.bind(this));
  }

  /**
   * Check if the name provided is a valid one. The criterias are:
   * - can be put in a URL wihout special chars like "%20"
   * - number of chars, to avoid breaking design and allow user to be creative
   * @param {string} argName - blabla
   * @return {string} blabla
   */
  checkName(name) {
    if (!name) {
      return false;
    }

    if (typeof name !== 'string') {
      return false;
    }

    // 16 chars like MS-DOS
    // but seriously, more easy for humans to write down on an email
    // and don't take too much place on the design, a name should be short
    if (name.length >= 16) {
      return false;
    }

    return true;
  }

  onKeydown(e) {
    console.log(`e.keyCode=${e.keyCode}, e.metaKey=${e.metaKey}, e.ctrlKey=${e.ctrlKey}, e.altKey=${e.altKey}`);

    // don't listen to keys when it comes from an input (they transform into letters)
    // except spacial ones which are not chars
    // http://www.foreui.com/articles/Key_Code_Table.htm
    if (e.target.tagName.toLowerCase() === 'input' && e.keyCode > 47) {
      return;
    }

    // shortcuts
    switch (e.keyCode) {
      case 83: // s
        this.sidebar(!this.sidebar());
        e.preventDefault();
        break;
      case 70: // f
        if (e.metaKey || e.ctrlKey) this.sidebar(true);
        e.preventDefault();
        break;
      case 27: // esc
        this.sidebar(false);
        e.preventDefault();
        break;
    }
  }

  retrieve() {
    const params = new URLSearchParams();
    params.set('token', token);
    params.set('agentName', 'daqTask');
    params.set('objectName', 'PayloadSizeSubBlocks');

    return fetch('/api/readObject?' + params.toString(), {method: 'POST'})
      .then(res => res.text())
      // .then(txt => JSROOT.parse(txt));
  }

  load() {
    this.retrieve()
      .then(json => this.chart(json))
      .then(json => this.notify());
  }

  inc() {
    this.state.count++;
    this.notify();
  }

  count(value) {
    if (arguments.length) {
      this.state.count = value;
      this.notify();
    }
    return this.state.count;
  }

  charts(value) {
    if (arguments.length) {
      this.state.charts = value;
      this.notify();
    }
    return this.state.charts;
  }

  tabs(value) {
    if (arguments.length) {
      this.state.tabs = value;
      this.notify();
    }
    return this.state.tabs;
  }

  currentTab(value) {
    if (arguments.length) {
      this.state.currentTab = value;
      this.notify();
    }
    return this.state.currentTab;
  }

  sidebar(value) {
    if (arguments.length) {
      this.state.sidebar = value;
      this.notify();
    }
    return this.state.sidebar;
  }

  searchInput(value) {
    if (arguments.length) {
      this.state.searchInput = value;
      this.notify();
    }
    return this.state.searchInput;
  }

  // Diviser, 1 = entire screen, 3 = smaller
  zoom(value) {
    if (arguments.length) {
      if (value < 1) {
        value = 1;
      }
      if (value > 4) {
        value = 4;
      }
      this.state.zoom = value;
      this.notify();
    }
    return this.state.zoom;
  }

  searchResult() {
    if (!this.state.searchInput) {
      return null;
    }

    var result = {};
    result.collections = this.state.collections.filter(collection => collection.name.indexOf(this.state.searchInput) >= 0);
    result.objects = this.state.objects.filter(object => object.indexOf(this.state.searchInput) >= 0);
    return result;
  }

  get(property) {
    return this.state[property];
  }

  set(property, value) {
    // Set the value to internal state
    this.state[property] = value;

    // Call post-hook to transform the value and/or set other properties
    const hookFn = this['on' + property.substr(0, 1).toUpperCase() + property.substr(1)];
    if (hookFn) {
      hookFn.call(this);
    }

    // Notify observers like views
    this.notify();

    // Return the new value
    return this.state[property];
  }

  /**
   * Hook called when the property is set
   */
  onSearchCollectionInput() {

  }

  /**
   * Hook called when the property is set
   * Creates the tree based on objects name
   */
  onObjects() {
    const objects = this.state.objects;
    const treeRoot = new ObjectTree();
    objects.forEach(object => treeRoot.addChildren(object));
    treeRoot.observe(e => this.notify());
    this.state.objectsTree = treeRoot;
  }
}


window.objects = [
  {name: 'DAQ01/EquipmentSize/ACORDE/ACORDE', status: 'active'},
  {name: 'DAQ01/EquipmentSize/CPV/CPV', status: 'active'},
  {name: 'DAQ01/EquipmentSize/HMPID/HMPID', status: 'active'},
  {name: 'DAQ01/EquipmentSize/ITSSDD/ITSSDD', status: 'active'},
  {name: 'DAQ01/EquipmentSize/ITSSSD/ITSSSD', status: 'active'},
  {name: 'DAQ01/EquipmentSize/TOF/TOF', status: 'active'},
  {name: 'DAQ01/EquipmentSize/TPC/TPC', status: 'active'},
  {name: 'DAQ01/EventSize/ACORDE/ACORDE', status: 'active'},
  {name: 'DAQ01/EventSize/CPV/CPV', status: 'active'},
  {name: 'DAQ01/EventSize/HMPID/HMPID', status: 'active'},
  {name: 'DAQ01/EventSize/ITSSDD/ITSSDD', status: 'active'},
  {name: 'DAQ01/EventSize/ITSSSD/ITSSSD', status: 'active'},
  {name: 'DAQ01/EventSize/TOF/TOF', status: 'inactive'},
  {name: 'DAQ01/EventSize/TPC/TPC', status: 'active'},
  {name: 'DAQ01/EventSizeClasses/class_C0AMU-ABC', status: 'active'},
  {name: 'DAQ01/EventSizeClasses/class_C0ALSR-ABC', status: 'active'},
  {name: 'DAQ01/EventSizeClasses/class_C0OB3-ABC', status: 'active'},
  {name: 'DAQ01/_EquimentSizeSummmary', status: 'inactive'},
  {name: 'DAQ01/_EventSizeClusters', status: 'inactive'},
  {name: 'DAQ01/_EventSizeSummary', status: 'inactive'},
  {name: 'TOFQAshifter/Default/hTOFRRawHitMap', status: 'active'},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM035', status: 'active'},
  {name: 'TOFQAshifter/Default/hTOFRRawTimeVsTRM3671', status: 'active'},
  {name: 'TOFQAshifter/Default/hTOFRRaws', status: 'active'},
  {name: 'TOFQAshifter/Default/hTOFRRawsTime', status: 'active'},
  {name: 'TOFQAshifter/Default/hTOFRRawsToT', status: 'inactive'},
  {name: 'TOFQAshifter/Default/hTOFrefMap', status: 'inactive'},
  {name: 'TST01/Default/hTOFRRawHitMap', status: 'active'},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM035', status: 'active'},
  {name: 'TST01/Default/hTOFRRawTimeVsTRM3671', status: 'active'},
  {name: 'TST01/Default/hTOFRRaws', status: 'active'},
  {name: 'TST01/Default/hTOFRRawsTime', status: 'active'},
  {name: 'TST01/Default/hTOFRRawsToT', status: 'active'},
  {name: 'TST01/Default/hTOFrefMap', status: 'active'},
];

window.collections = [
  {name: 'PWG-HF', owner: 'Francesco Prino', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-GA', owner: 'Yuri Kharlov', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'AliRoot dashboard', owner: 'Alina Gabriela Grigoras', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-CF', owner: 'Michael Weber', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-PP', owner: 'Ruben Shahoyan', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'Run Coordination', owner: 'Barthelemy Von Haller', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-LF', owner: 'Lee Barnby ', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-DQ', owner: 'Giuseppe Bruno', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-JE', owner: 'Marco Van Leeuwen', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'MC productions', owner: 'Marco Van Leeuwen', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'Run Coordination 2017', owner: 'Grazia Luparello', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'O2 Milestones', owner: 'Vasco Chibante Barroso', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'O2 TDR', owner: 'Barthelemy Von Haller', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'MC productions dashboard', owner: 'Catalin-Lucian Ristea', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'DAQ System Dashboard', owner: 'Barthelemy Von Haller ', folders: ['SDD', 'SPD', 'TOF', 'T0_beam', 'MUON']},
  {name: 'PWG-LF (2)', owner: 'Lee Barnby'},
];
