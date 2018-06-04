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

  describe('execFile', function() {
    it('run docker', function() {
      let lambda = new Lambda({
        name: 'test',
        path: path.resolve('.'),
        runtime: 'nodejs8.10',
        dockerPath: path.resolve('test/bin/docker.js'),
      });
      lambda.invoke({ test: 'event' }).then(res => {
        assert.equal(res.statusCode, 200, 'status code is 200');
      });
    });
  });


});
