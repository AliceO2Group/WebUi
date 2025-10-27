export class DownloadConfigDomain {
  /**
   * constructor
   * @param {string[]} tabIds - tabIds to download
   * @param {string[]} objectIds - objectIds to download
   * @param {NameTemplateOption[]} archiveNameTemplateOptions - name options for the archive (*.tar.gz)
   * @param {NameTemplateOption[]} objectNameTemplateOptions - name options for the individual object files
   * @param {DownloadMode} downloadMode - download mode (layout/tab/object)
   * @param {boolean} pathNameStructure - enable full pathname structure
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
