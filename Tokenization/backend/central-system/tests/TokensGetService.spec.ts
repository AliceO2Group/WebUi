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

import { TokensGetService } from '../src/services/TokensGetService';

describe('TokensGetService', () => {
  it('maps tokens and truncates payload to last 5 chars', async () => {
    const tokens = new Map<
      number,
      { tokenId: number; validity: string; payload: string }
    >([
      [1, { tokenId: 1, validity: 'good', payload: 'abc12345' }],
      [2, { tokenId: 2, validity: 'bad', payload: 'payload2' }],
    ]);

    const svc = new TokensGetService();
    const out = await svc.getTokens(tokens);

    // Assert
    expect(out).toEqual([
      { tokenId: 1, validity: 'good', payload: '12345' },
      { tokenId: 2, validity: 'bad', payload: 'load2' },
    ]);
  });
});
