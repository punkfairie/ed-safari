import { expect, jest } from '@jest/globals';
import { EliteMatrix } from 'elite-matrix';
import { Settings } from '../src/models/Settings';
import { mockSettings } from './mockData';

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

  afterEach(() => {
    jest.resetAllMocks();
    Settings.destroy();
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
    const readFileMock  = jest.spyOn(require('fs/promises'), 'readFile');

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

    it.each([
      { file: 'GraphicsConfiguration.xml', contents: mockSettings.graphicsConfigXml },
      { file: 'XML-Profile.ini', contents: mockSettings.xmlProfileIni },
    ])('should set matrix from $file', ({ file, contents }, done) => {
      const settingsFile = {
        minValue:    500000,
        maxDistance: 10000,
        matrixFile:  file,
      };
      require('fs').__setFileContents(JSON.stringify(settingsFile));
      readFileMock.mockResolvedValue(contents);

      const settings = Settings.get();

      settings.on('CUSTOM_COLORS_SET', () => {
        expect(Settings.get().matrix).toBeDefined();
        expect(Settings.get().matrix).toBeInstanceOf(EliteMatrix);
        done();
      });
    });
  });
});
