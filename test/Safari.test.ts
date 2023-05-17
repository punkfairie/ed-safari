import {expect, jest, it} from '@jest/globals';

import {Journal} from '../src/models/Journal';
import {Safari} from '../src/models/Safari';

describe('Safari', () => {
  describe('start()', () => {
    it('should return itself', () => {
      const safari = Safari.start(false, true);
      expect(safari).toBeDefined();
    });

    it('should create a new journal', () => {
      const safari = Safari.start(false, true);
      expect(safari.journal).toBeInstanceOf(Journal);
    });
  });

  describe('shutdown()', () => {
    it('should shutdown', async () => {
      const safari = Safari.start(false, true);
      safari.watchJournalDir();
      await expect(safari.shutdown()).resolves.not.toThrow();
    });

    it('should shutdown journal', async () => {
      const safari = Safari.start(false, true);
      const journalShutdown = jest.spyOn(safari.journal, 'shutdown');
      safari.watchJournalDir();
      await safari.shutdown();
      expect(journalShutdown).toHaveBeenCalled();
    });

    it('should shutdown when #watcher is undefined', async () => {
      const safari = Safari.start(false, true);
      await expect(safari.shutdown()).resolves.not.toThrow();
    });
  });
});
