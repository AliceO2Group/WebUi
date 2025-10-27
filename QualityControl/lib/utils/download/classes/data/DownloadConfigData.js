import { DownloadMode } from '../../enums/DownloadMode.js';

export class DownloadConfigData {
  /**
   * constructor
   * @param {string[]} tabIds
   * @param {string[]} objectIds
   * @param {string[]} archiveNameTemplateOptions
   * @param {string[]} objectNameTemplateOptions
   * @param {string} downloadMode
   * @param {boolean} pathNameStructure
   */
  // eslint-disable-next-line @stylistic/js/max-len
  constructor(tabIds, objectIds, archiveNameTemplateOptions, objectNameTemplateOptions, downloadMode, pathNameStructure) {
    this.tabIds = tabIds,
    this.objectIds = objectIds,
    this.archiveNameTemplateOptions = archiveNameTemplateOptions,
    this.objectNameTemplateOptions = objectNameTemplateOptions,
    this.downloadMode = downloadMode,
    this.pathNameStructure = pathNameStructure;
  }

  tabIds;

  objectIds;

  archiveNameTemplateOptions;

  objectNameTemplateOptions;

  downloadMode;

  pathNameStructure;

  /**
   * mapper from plain object to instance of DownloadConfigData.
   * @static
   * @param {any} downloadConfigPlain
   * @returns {DownloadConfigData}
   */
  static mapFromPlain(downloadConfigPlain) {
    if (!downloadConfigPlain || typeof downloadConfigPlain !== 'object') {
      throw new Error('invalid DownloadConfig');
    }
    // eslint-disable-next-line @stylistic/js/max-len
    return new DownloadConfigData(Array.isArray(downloadConfigPlain.tabIds) ? downloadConfigPlain.tabIds : downloadConfigPlain.tabIds?.split(',') ?? [], Array.isArray(downloadConfigPlain.objectIds) ? downloadConfigPlain.objectIds : downloadConfigPlain.objectIds?.split(',') ?? [], Array.isArray(downloadConfigPlain.archiveNameTemplateOptions) ? downloadConfigPlain.archiveNameTemplateOptions : downloadConfigPlain.archiveNameTemplateOptions?.split(',') ?? [], Array.isArray(downloadConfigPlain.objectNameTemplateOptions) ? downloadConfigPlain.objectNameTemplateOptions : downloadConfigPlain.objectNameTemplateOptions?.split(',') ?? [], downloadConfigPlain?.downloadMode ?? DownloadMode.object, downloadConfigPlain?.pathNameStructure == 'true' ? true : false);
  }
}
