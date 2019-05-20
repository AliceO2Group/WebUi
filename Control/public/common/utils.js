
/**
 * Method to display JSON fields in a particular way
 * @param {Object} item
 * @param {string} key
 * @return {string}
 */
export default function parseObject(item, key) {
  switch (key) {
    case 'tasks':
      return item.length;
    case 'version':
      return item.productName + ' v' + item.versionStr + '(revision ' + item.build + ')';
    case 'deploymentInfo':
      return '';
    default:
      return JSON.stringify(item);
  }
}
