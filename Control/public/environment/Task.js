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
    this.openedTasks = {};
    this.list = {}; // map of (taskId, RemoteData)
  }

  /**
   * Toggle the view of a task by its id
   * @param {string} taskId
  */
  async toggleTaskView(taskId) {
    this.openedTasks[taskId] = !this.openedTasks[taskId];
    this.notify();
  }

  /**
   * Method to make an HTTP Request to get details about a task by its Id
   * @param {JSON} body {taskId: string}
   */
  async getTaskById(body) {
    this.list[body.taskId] = RemoteData.loading();
    this.openedTasks[body.taskId] = false;
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetTask`, body);
    if (!ok) {
      this.list[body.taskId] = RemoteData.failure(result.message);
    } else {
      const commandInfo = this.parseTaskCommandInfo(result.task.commandInfo, body.taskId);
      commandInfo.className = result.task.classInfo.name;
      this.list[body.taskId] = RemoteData.success(commandInfo);
      this.notify();
    }
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
