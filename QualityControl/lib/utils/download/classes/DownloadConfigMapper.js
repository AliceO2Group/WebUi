import { DownloadConfigDomain } from '../classes/domain/DownloadConfigDomain.js';
import { NameTemplateOption } from '../enum/NameTemplateOption.js';
import { DownloadMode } from '../enum/DownloadMode.js';

/**
 * map download config to domain model
 * @param downloadConfigData
 * @returns
 */
export function mapDownloadConfigToDomain(downloadConfigData) {
  const archiveNameTemplateOptions = downloadConfigData.archiveNameTemplateOptions.map(mapNameTemplateOption);
  const objectNameTemplateOptions = downloadConfigData.objectNameTemplateOptions.map(mapNameTemplateOption);
  const downloadMode = mapDownloadMode(downloadConfigData.downloadMode);
  // eslint-disable-next-line @stylistic/js/max-len
  return new DownloadConfigDomain(downloadConfigData.tabIds, downloadConfigData.objectIds, archiveNameTemplateOptions, objectNameTemplateOptions, downloadMode, downloadConfigData.pathNameStructure);
}

/**
 * map string to name template option
 * @param nameTemplateOption
 * @returns {number}
 */
function mapNameTemplateOption(nameTemplateOption) {
  if (typeof nameTemplateOption === 'string') {
    nameTemplateOption = nameTemplateOption.trim();
    nameTemplateOption = nameTemplateOption.toLowerCase();
    const mappedNameTemplateOption = NameTemplateOption[nameTemplateOption];
    if (mappedNameTemplateOption === undefined) {
      throw new Error('Failed to map NameTemplateOption, perhaps an invalid option was passed?');
    } else {
      return mappedNameTemplateOption;
    }
  } else {
    throw new Error('Failed to map NameTemplateOption, it should be a string');
  }
}

/**
 * map number to download mode.
 * @param downloadMode
 * @returns {number}
 */
function mapDownloadMode(downloadMode) {
  if (typeof downloadMode === 'string') {
    downloadMode = downloadMode.trim();
    downloadMode = downloadMode.toLowerCase();
    const mappedDownloadMode = DownloadMode[downloadMode];
    if (mappedDownloadMode === undefined) {
      throw new Error('Failed to map DownloadMode, perhaps an invalid option was passed?');
    } else {
      return mappedDownloadMode;
    }
  } else {
    throw new Error('Failed to map DownloadMode, it should be a string');
  }
}
//# sourceMappingURL=DownloadConfigMapper.js.map
