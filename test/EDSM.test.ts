import {expect, jest} from '@jest/globals';
import {EDSM} from '../src/models/EDSM';
import {System} from '../src/models/System';

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
    const mockFetch = (data?: {[i: string]: any}, ok: boolean = true) => {
      global.fetch = jest.fn(() =>
          Promise.resolve({
            ok: ok,
            json: () => Promise.resolve(data),
          } as Response),
      );
    };

    it('should get system info', async () => {
      const system = new System({ "StarSystem":"LHS 3447", "SystemAddress":0, "StarPos":[0,0,0], "StarClass":"M" });
      const data = {
        "id": 13153,
        "id64": 5306465653474,
        "name": "LHS 3447",
        "url": "https://www.edsm.net/en/system/bodies/id/13153/name/LHS+3447",
        "estimatedValue": 353968,
        "estimatedValueMapped": 1164029,
        "valuableBodies": [
          {
            "bodyId": 3195879,
            "bodyName": "LHS 3447 A 5",
            "distance": 92282,
            "valueMax": 879114
          }
        ]
      };
      mockFetch(data);

      const result = await EDSM.getSystemValue(system);
      expect(result).toEqual(data);
    });

    it('should not get system info if system name is invalid', async () => {
      const system = new System();
      const data = {};
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
