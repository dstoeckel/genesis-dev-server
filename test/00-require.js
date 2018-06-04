const assert = require('assert'),
  path = require('path');

const files = ['lib/config', 'lib/lambda', 'utils', 'index'].map(f => path.resolve(f));

describe('require', () => {
  files.map(file => {
    describe(file, () => {
      it('require should not throw exception', () => assert.ok(require(file)));
    });
  })
});
