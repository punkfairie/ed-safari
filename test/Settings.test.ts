import {expect, jest} from '@jest/globals';
import {EliteMatrix} from 'elite-matrix';
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
    const writeFileMock = jest.spyOn(require('fs/promises'), 'writeFile');
    const readFileMock = jest.spyOn(require('fs/promises'), 'readFile');

    it('should return boolean', async () => {
      writeFileMock.mockResolvedValue(undefined);
      readFileMock.mockResolvedValue(settingsFile);
      const result = await Settings.get().save(settingsFile);
      expect(typeof result).toBe('boolean');
    });

    it('should return false when writeFile fails', async () => {
      writeFileMock.mockImplementation(() => {
        throw new Error();
      });
      const result = await Settings.get().save(settingsFile);
      expect(result).toBe(false);
    });

    it('should return true when readFile fails', async () => {
      writeFileMock.mockResolvedValue(undefined);
      readFileMock.mockImplementation(() => {
        throw new Error();
      });
      const result = await Settings.get().save(settingsFile);
      expect(result).toBe(true);
    });
  });

  describe('#setMatrix()', () => {
    const readFileMock = jest.spyOn(require('fs/promises'), 'readFile');

    it('should set matrix from GraphicsConfiguration.xml', (done) => {
      const settingsFile = {
        minValue:    500000,
        maxDistance: 10000,
        matrixFile:  'GraphicsConfiguration.xml',
      };
      require('fs').__setFileContents(JSON.stringify(settingsFile));
      const matrixFile = '<GraphicsConfig><GUIColour><Default><MatrixRed>1,0,0</MatrixRed><MatrixGreen>0,1,0</MatrixGreen><MatrixBlue>0,0,1</MatrixBlue></Default></GUIColour></GraphicsConfig>';
      readFileMock.mockResolvedValue(matrixFile);

      const settings = Settings.get();

      settings.on('CUSTOM_COLORS_SET', () => {
        expect(Settings.get().matrix).toBeDefined();
        expect(Settings.get().matrix).toBeInstanceOf(EliteMatrix);
        done();
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    Settings.destroy();
  });
});
