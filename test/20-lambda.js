const assert = require('assert'),
  path = require('path'),
  Lambda = require('../lib/lambda');

describe('Lambda', () => {
  describe('new object', () => {
    it('constructor', () => {
      let lambda = new Lambda({
        name: 'test',
      });
      assert.equal(lambda.name, 'test');
    });
  });
});
