export class DownloadConfigDomain {
  /**
   * constructor
   * @param {string[]} tabIds
   * @param {string[]} objectIds
   * @param {NameTemplateOption[]} archiveNameTemplateOptions
   * @param {NameTemplateOption[]} objectNameTemplateOptions
   * @param {DownloadMode} downloadMode
   * @param {boolean} pathNameStructure
   */
  constructor(
    tabIds, objectIds, archiveNameTemplateOptions,
    objectNameTemplateOptions, downloadMode, pathNameStructure,
  ) {
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
}
