import { basePathOf, toPosixPath } from '../src/path-util';

describe('Path util', () => {
  describe('Base path', () => {
    it('Should resolve sub path', () => expect(basePathOf('some/path')('some/path/on/directory/file.txt')).toBe('../../'));

    it('Should resolve same path to empty', () => expect(basePathOf('some/path')('some/path/file.txt')).toBe(''));
  });

  describe('To posix path', () => {
    it('Should convert windows path to posix', () => {
      expect(toPosixPath('some\\path/with\\multiple/separators')).toBe('some/path/with/multiple/separators');
    });
  });
});
