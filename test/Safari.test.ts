import {Safari} from '../src/models/Safari';

describe('Safari', function () {
  it('should return itself', () => {
    const safari = Safari.start(false);
    expect(safari).toBeDefined();
  });
});
