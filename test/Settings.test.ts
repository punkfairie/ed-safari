import {expect} from '@jest/globals';
import {Settings} from '../src/models/Settings';

jest.mock('fs');

describe('Settings', () => {
  const settingsFile = {
    minValue:    500000,
    maxDistance: 10000,
    matrixFile:  '',
  };

  beforeEach(() => {
    require('fs').__setFileContents(JSON.stringify(settingsFile));
  });

  describe('get()', () => {
    it('should get instance', () => {
      expect(Settings.get()).toBeInstanceOf(Settings);
    });

    it('should set initial values', () => {
      const minValue = Settings.get().minValue;
      expect(minValue).toBeDefined();
      expect(typeof minValue).toBe('number');

      const maxDistance = Settings.get().maxDistance;
      expect(maxDistance).toBeDefined();
      expect(typeof maxDistance).toBe('number');

      const matrix = Settings.get().matrix;
      expect(matrix).toBeUndefined();
    });
  });

  describe('save()', () => {
    it('should return boolean', async () => {
      const result = await Settings.get().save(settingsFile);
      expect(typeof result).toBe('boolean');

      require('fs').__setWritePromise(true);
      const resultResolve = await Settings.get().save(settingsFile);
      expect(resultResolve).toBe(true);

      require('fs').__setWritePromise(false);
      const resultReject = await Settings.get().save(settingsFile);
      expect(resultReject).toBe(false);
    });
  });
});
