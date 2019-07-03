import {BrowserStorage, Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Task CRUD
 */
export default class Task extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.storage = new BrowserStorage('AliECS');
    this.remoteTasks = RemoteData.notAsked();
    this.openedTasks = [];
  }

  /**
   * Load Task into list of tasks
   * @param {JSON} body {taskId: <string>}
  */
  async updateOpenedTasks(body) {
    const indexOfSelectedTask = this.getIndexOfTask(body.taskId);

    if (indexOfSelectedTask >= 0) { // if Task is already opened then remove from list
      this.openedTasks.splice(indexOfSelectedTask, 1);
    } else {
      const commandInfo = this.storage.getLocalItem(body.taskId);
      if (commandInfo) {
        this.openedTasks.push(commandInfo);
        this.remoteTasks = RemoteData.success(this.openedTasks);
      } else {
        this.getTaskById(body);
      }
    }
    this.remoteTasks = RemoteData.success(this.openedTasks);
    this.notify();
  }

  /**
   * Method to retrieve index of a task in the existing opened task list
   * @param {string} taskId
   * @return {number}
   */
  getIndexOfTask(taskId) {
    return this.openedTasks.map((task) => task.taskId).indexOf(taskId);
  }

  /**
   * Method to make an HTTP Request to get details about a task by its Id
   * @param {JSON} body {taskId: string}
   */
  async getTaskById(body) {
    this.remoteTasks = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetTask`, body);
    if (!ok) {
      this.openedTasks.push({taskId: body.taskId, message: result.message});
    } else {
      const commandInfo = this.parseTaskCommandInfo(result.task.commandInfo, body.taskId);
      this.storage.setLocalItem(body.taskId, commandInfo);
      this.openedTasks.push(commandInfo);
    }
    this.remoteTasks = RemoteData.success(this.openedTasks);
    this.notify();
  }

  /**
   * Method to add & remove fields regarding the task
   * @param {JSON} commandInfo
   * @param {string} taskId
   * @return {JSON}
   */
  parseTaskCommandInfo(commandInfo, taskId) {
    delete commandInfo.shell;
    commandInfo.env = commandInfo.env.join('\n');
    commandInfo.arguments = commandInfo.arguments.join(' ');
    commandInfo.taskId = taskId;
    return commandInfo;
  }
}
