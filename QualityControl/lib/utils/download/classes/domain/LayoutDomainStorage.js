import { LayoutDomain } from './LayoutDomain.js';

/** @import { TabDomain } from './TabDomain.js'; */

/**
 * @augments LayoutDomain
 */
export class LayoutDomainStorage extends LayoutDomain {
  /**
   * constructor
   * @param {string} id - id
   * @param {string} name - name
   * @param {TabDomain[]} tabs - tabs
   * @param {number} downloadUserId - userid of the user who requested this download.
   */
  constructor(id, name, tabs, downloadUserId) {
    super(id, name, tabs);
    this.downloadUserId = downloadUserId;
  }

  downloadUserId;

  /**
   * return a representation of the parent.
   * @returns {LayoutDomain} return
   */
  toSuper() {
    return new LayoutDomain(this.id, this.name, this.tabs);
  }
}
