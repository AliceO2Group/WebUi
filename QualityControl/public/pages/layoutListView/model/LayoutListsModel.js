import Folder from '../../../folder/Folder.js';
import { Observable, RemoteData } from '/js/src/index.js';

export default class LayoutListModel extends Observable {
  constructor(model) {
    super(model);
    this.folder = new Folder(this);
    this.folder.addFolder({
      title: 'Official', isOpened: true, list: RemoteData.notAsked(), searchInput: '', classList: 'bg-primary white',
    });
    this.folder.addFolder({ title: 'My Layouts', isOpened: true, list: RemoteData.notAsked(), searchInput: '' });
    this.folder.addFolder({ title: 'All Layouts', isOpened: false, list: RemoteData.notAsked(), searchInput: '' });
    this.folder.bubbleTo(this);
  }
}
