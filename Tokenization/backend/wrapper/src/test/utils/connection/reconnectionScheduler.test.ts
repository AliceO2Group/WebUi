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

import { ReconnectionScheduler } from '../../../utils/connection/reconnectionScheduler';

describe('ReconnectionScheduler', () => {
  let reconnectCallback: jest.Mock;
  let logger: { infoMessage: jest.Mock; errorMessage?: jest.Mock };
  let scheduler: ReconnectionScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    reconnectCallback = jest.fn();
    logger = {
      infoMessage: jest.fn(),
      errorMessage: jest.fn(),
    };

    scheduler = new ReconnectionScheduler(
      reconnectCallback,
      {
        initialDelay: 1000,
        maxDelay: 8000,
      },
      logger as any
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("schedule's first attempt should schedule and call reconnectCallback", () => {
    scheduler.schedule();

    expect(logger.infoMessage).toHaveBeenCalledWith('Recconection attempt #1: Sleep for 2000 ms.');

    expect(reconnectCallback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1999);
    expect(reconnectCallback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(reconnectCallback).toHaveBeenCalledTimes(1);
  });

  test('Schedule attempts should be exponential', () => {
    scheduler.schedule();
    jest.advanceTimersByTime(2000);

    scheduler.schedule();
    expect(logger.infoMessage).toHaveBeenLastCalledWith('Recconection attempt #2: Sleep for 4000 ms.');
    jest.advanceTimersByTime(4000);
    expect(reconnectCallback).toHaveBeenCalledTimes(2);
  });

  test("schedule's delay should be limited by maxDelay", () => {
    scheduler = new ReconnectionScheduler(
      reconnectCallback,
      {
        initialDelay: 1000,
        maxDelay: 3000,
      },
      logger as any
    );

    scheduler.schedule();
    expect(logger.infoMessage).toHaveBeenLastCalledWith('Recconection attempt #1: Sleep for 2000 ms.');
    jest.advanceTimersByTime(2000);

    scheduler.schedule();
    expect(logger.infoMessage).toHaveBeenLastCalledWith('Recconection attempt #2: Sleep for 3000 ms.');
    jest.advanceTimersByTime(3000);

    scheduler.schedule();
    expect(logger.infoMessage).toHaveBeenLastCalledWith('Recconection attempt #3: Sleep for 3000 ms.');
  });

  test('schedule() should not schedule again if it is scheduled', () => {
    scheduler.schedule();
    scheduler.schedule();

    expect(logger.infoMessage).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100000);
    expect(reconnectCallback).toHaveBeenCalledTimes(1);
  });

  test('reset() should clear timer, reset attemptCount and currentDelay', () => {
    scheduler.schedule();

    jest.advanceTimersByTime(500);
    expect(reconnectCallback).not.toHaveBeenCalled();

    scheduler.reset();

    jest.advanceTimersByTime(100000);
    expect(reconnectCallback).not.toHaveBeenCalled();

    scheduler.schedule();
    expect(logger.infoMessage).toHaveBeenLastCalledWith('Recconection attempt #1: Sleep for 2000 ms.');
  });

  test('reset() should ignore another reset due to isResseting variable', () => {
    scheduler.schedule();
    scheduler.reset();
    scheduler.reset();
    scheduler.schedule();

    jest.advanceTimersByTime(2000);
    expect(reconnectCallback).toHaveBeenCalledTimes(1);
  });
});
