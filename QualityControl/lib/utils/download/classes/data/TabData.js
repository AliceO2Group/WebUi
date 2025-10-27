import { TabDomain } from '../domain/TabDomain.js';
import { ObjectData } from './ObjectData.js';

export class TabData {
  /**
   * constructor
   * @param {string} id
   * @param {string} name
   * @param {ObjectData[]} objects
   * @param {number} columns
   */
  constructor(id, name, objects, columns) {
    this.id = id,
    this.name = name,
    this.objects = objects,
    this.columns = columns;
  }

  id;

  name;

  objects;

  columns;

  /**
   * mapFromPlain, map to an instance of TabData from a plain object.
   * @static
   * @param {any} tabPlain
   * @returns {TabData}
   */
  static mapFromPlain(tabPlain) {
    if (!tabPlain || typeof tabPlain !== 'object') {
      throw new Error('invalid tab');
    }
    // eslint-disable-next-line @stylistic/js/max-len
    return new TabData(tabPlain.id, tabPlain.name, Array.isArray(tabPlain.objects) ? tabPlain.objects.map(ObjectData.mapFromPlain) : [], Number(tabPlain.columns));
  }

  /**
   * mapper to Domain model.
   * @returns {TabDomain}
   */
  mapToDomain() {
    return new TabDomain(this.id, this.name, this.objects.map((object) => object.mapToDomain()));
  }
}
