/* eslint-disable jsdoc/require-param-description */
/* eslint-disable jsdoc/reject-any-type */
import { ObjectDomain } from '../../classes/domain/ObjectDomain.js';
export class ObjectData {
  /**
   * constructor
   * @param {string} id
   * @param {number} x
   * @param {number} y
   * @param {number} h
   * @param {number} w
   * @param {string} name
   * @param {string[]} options
   * @param {boolean} autoSize
   * @param {boolean} ignoreDefaults
   */
  constructor(id, x, y, h, w, name, options, autoSize, ignoreDefaults) {
    this.id = id,
    this.x = x,
    this.y = y,
    this.h = h,
    this.w = w,
    this.name = name;
    this.options = options,
    this.autoSize = autoSize,
    this.ignoreDefaults = ignoreDefaults;
  }

  id;

  x;

  y;

  h;

  w;

  name;

  options;

  autoSize;

  ignoreDefaults;

  /**
   * mapper to map from plain object to instance of ObjectData.
   * @static
   * @param {any} objectPlain - plain js object
   * @returns {ObjectData} - mapped object data
   */
  static mapFromPlain(objectPlain) {
    if (!objectPlain || typeof objectPlain !== 'object') {
      throw new Error('invalid object');
    }
    return new ObjectData(objectPlain.id, Number(objectPlain.x ??
        0), Number(objectPlain.y ?? 0), Number(objectPlain.h ??
        0), Number(objectPlain.w ??
        0), objectPlain.name, Array.isArray(objectPlain.options) ? objectPlain.options :
      [], Boolean(objectPlain.autoSize), Boolean(objectPlain.ignoreDefaults));
  }

  /**
   * mapper to domain model.
   * @returns {ObjectDomain} - mapped objectDomain model.
   */
  mapToDomain() {
    return new ObjectDomain(this.id, this.name);
  }
}
