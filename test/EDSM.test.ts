import { expect, jest } from '@jest/globals';
import { EDSM } from '../src/models/EDSM';
import { ExtendedNavRouteSystem, System } from '../src/models/System';
import { mockEdsmResponses, mockObjects } from './mockData';

describe('EDSM', () => {
  describe('connect()', () => {
    it('should create new instance', () => {
      expect(EDSM.connect()).toBeInstanceOf(EDSM);
    });

    it('should get previously created instance', () => {
      const edsm = EDSM.connect();
      expect(EDSM.connect()).toBeInstanceOf(EDSM);
    });
  });

  describe('getSystemValue()', () => {
    const mockFetch = (data?: { [i: string]: any }, ok: boolean = true) => {
      global.fetch = jest.fn(() =>
          Promise.resolve({
            ok:   ok,
            json: () => Promise.resolve(data),
          } as Response),
      );
    };

    it('should get system info', async () => {
      const system = new System(mockObjects.navRouteSystem as ExtendedNavRouteSystem);
      const data   = mockEdsmResponses.systemValue;
      mockFetch(data);

      const result = await EDSM.getSystemValue(system);
      expect(result).toEqual(data);
    });

    it('should not get system info if system name is invalid', async () => {
      const system = new System();
      const data   = {};
      mockFetch({});

      const result = await EDSM.getSystemValue(system);
      expect(result).toEqual(data);
    });

    it('should return undefined if response is not ok', async () => {
      const system = new System();
      mockFetch({}, false);

      const result = await EDSM.getSystemValue(system);
      expect(result).toBeUndefined();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });
});
