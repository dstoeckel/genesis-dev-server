const assert = require('assert'),
  path = require('path'),
  Lambda = require('../lib/lambda'),
  config = require('../lib/config');

describe('Config', () => {
  describe('load', () => {
    it('load', () => {
      return config.load('test/conf').then(res => {
        for(l in res.lambda) {
          assert.ok(res.lambda[l] instanceof Lambda, 'all lambdas have been inflated to objects');
        }
      });
    });
  });
});
