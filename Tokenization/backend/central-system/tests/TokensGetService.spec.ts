import { TokensGetService } from '../src/services/TokensGetService';

describe('TokensGetService', () => {
  it('maps tokens and truncates payload to last 5 chars', async () => {
    const tokens = new Map<number, { tokenId: number; validity: string; payload: string }>([
      [1, { tokenId: 1, validity: 'good', payload: 'abc12345' }],
      [2, { tokenId: 2, validity: 'bad',  payload: 'payload2' }]
    ]);

    const svc = new TokensGetService();
    const out = await svc.getTokens(tokens);

    // Assert
    expect(out).toEqual([
      { tokenId: 1, validity: 'good', payload: '12345' },
      { tokenId: 2, validity: 'bad',  payload: 'load2' }
    ]);
  });
});
