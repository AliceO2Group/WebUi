// eslint-disable-next-line no-unused-vars
import { ObjectDomain } from './ObjectDomain';

export class TabDomain {
  /**
   * constructor
   * @param {string} id - id
   * @param {string} name - name
   * @param {ObjectDomain[]} objects - objects
   */
  constructor(id, name, objects) {
    this.id = id,
    this.name = name,
    this.objects = objects;
  }

  id;

  name;

  objects;
}
