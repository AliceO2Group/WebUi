/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { RetryQueue, RetryTask } from "../../../utils/queues/RetryQueue";

describe("RetryQueue", () => {
  let queue: RetryQueue;

  beforeEach(() => {
    jest.useFakeTimers();
    queue = new RetryQueue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should enqueue a task and increase size", () => {
    const task = createTask();
    queue.enqueue(task);
    expect(queue.size()).toBe(1);
  });

  it("should execute a task after delay and resolve", async () => {
    const exec = jest.fn().mockResolvedValue("done");
    const resolve = jest.fn();
    const reject = jest.fn();
    const task = createTask({ exec, resolve, reject });

    queue.enqueue(task);
    jest.runOnlyPendingTimers();

    // Wait for promise resolution
    await Promise.resolve();
    expect(exec).toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledWith("done");
    expect(reject).not.toHaveBeenCalled();
  });

  it("should retry failed task up to maxRetries and then reject", async () => {
    jest.useFakeTimers();

    const exec = jest.fn().mockRejectedValue(new Error("fail"));
    const resolve = jest.fn();
    const reject = jest.fn();

    const task = createTask({ exec, resolve, reject, tryNo: 0 });

    const queue = new RetryQueue({
      maxRetries: 2,
      baseDelayMs: 1,
      maxDelayMs: 10,
      jitter: false,
    });

    queue.enqueue(task);

    await jest.runAllTimersAsync();

    expect(exec).toHaveBeenCalledTimes(3);
    expect(reject).toHaveBeenCalledTimes(1);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("should call drainNow and execute all tasks immediately", async () => {
    const exec = jest.fn().mockResolvedValue("drained");
    const resolve = jest.fn();
    const reject = jest.fn();
    const task = createTask({ exec, resolve, reject });

    queue.enqueue(task);
    queue.drainNow();

    await Promise.resolve();
    expect(exec).toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledWith("drained");
    expect(reject).not.toHaveBeenCalled();
  });

  it("should set lastRunAt when task is executed", async () => {
    const exec = jest.fn().mockResolvedValue("ok");
    const resolve = jest.fn();
    const reject = jest.fn();
    const task = createTask({ exec, resolve, reject });

    queue.enqueue(task);
    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(typeof task.lastRunAt).toBe("number");
    expect(task.lastRunAt).toBeLessThanOrEqual(Date.now());
  });

  function createTask(overrides: Partial<RetryTask> = {}): RetryTask {
    return {
      id: "id1",
      tryNo: 0,
      createdAt: Date.now(),
      exec: jest.fn().mockResolvedValue(undefined),
      resolve: jest.fn(),
      reject: jest.fn(),
      ...overrides,
    };
  }
});
