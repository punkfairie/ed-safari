import { expect, jest, it } from '@jest/globals';
import { CMDR } from '../src/models/CMDR';
import { Safari } from '../src/models/Safari';

describe('Safari', () => {
  describe('start()', () => {
    it('should return itself', () => {
      const safari = Safari.start(false);
      expect(safari).toBeDefined();
    });

    it('should create a new CMDR', () => {
      const safari = Safari.start(false);
      expect(safari.CMDR).toBeInstanceOf(CMDR);
    });
  });

  describe('shutdown()', () => {
    it('should shutdown journal', async () => {
      const safari          = Safari.start(false);
      const journalShutdown = jest.spyOn(safari.CMDR, 'shutdown');
      safari.shutdown();
      expect(journalShutdown).toHaveBeenCalled();
    });
  });
});
