import { reload } from '../../src/filters/reload';

describe('Reload', () => {
  it('Should not add reload script', () => {
    expect(reload(false)()).toBe('');
  });
  it('Should add reload script', () => {
    expect(reload(true)()).toBe('<script src="/reload/reload.js"></script>');
  });
});
