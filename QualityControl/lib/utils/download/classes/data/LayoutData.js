import { LayoutDomain } from '../../classes/domain/LayoutDomain.js';
import { TabData } from './TabData.js';
export class LayoutData {
  /**
   * constructor
   * @param {string} id
   * @param {string} name
   * @param {number} owner_id
   * @param {string} owner_name
   * @param {TabData[]} tabs
   * @param {any[]} collaborators
   * @param {boolean} displayTimestamp
   * @param {number} autoTabChange
   * @param {boolean} isOfficial
   */
  constructor(id, name, owner_id, owner_name, tabs, collaborators, displayTimestamp, autoTabChange, isOfficial) {
    this.id = id;
    this.name = name,
    this.owner_id = owner_id,
    this.owner_name = owner_name,
    this.tabs = tabs,
    this.collaborators = collaborators,
    this.displayTimestamp = displayTimestamp,
    this.autoTabChange = autoTabChange,
    this.isOfficial = isOfficial;
  }

  id;

  name;

  owner_id;

  owner_name;

  tabs;

  collaborators;

  displayTimestamp;

  autoTabChange;

  isOfficial;

  /**
   *  map to an instance of LayoutData from a plain object.
   * @static
   * @param {any} layoutPlain
   * @returns {LayoutData}
   */
  static mapFromPlain(layoutPlain) {
    if (!layoutPlain || typeof layoutPlain !== 'object' || layoutPlain.id == undefined) {
      throw new Error('invalid layout');
    }
    // eslint-disable-next-line @stylistic/js/max-len
    return new LayoutData(layoutPlain.id, layoutPlain.name, Number(layoutPlain.owner_id), layoutPlain.owner_name, Array.isArray(layoutPlain.tabs) ? layoutPlain.tabs.map(TabData.mapFromPlain) : [], Array.isArray(layoutPlain.collaborators) ? layoutPlain.collaborators : [], Boolean(layoutPlain.displayTimestamp), Number(layoutPlain.autoTabChange), Boolean(layoutPlain.isOfficial));
  }

  /**
   * mapper to Domain model
   * @returns {LayoutDomain} Resulting LayoutDomain.
   */
  mapToDomain() {
    return new LayoutDomain(this.id, this.name, this.tabs.map((tab) => tab.mapToDomain()));
  }
}
