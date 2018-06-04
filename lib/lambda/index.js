const execFile = require('child_process').execFile,
  utils = require('../../utils'),
  assert = require('assert');

let envs = [].concat.apply([], utils.ENV_VARS.map(function (x) { return ['-e', x] }))

class Lambda {
  constructor(args) {
    args = Object.assign({
      handler: 'index.handler',
    }, args || {});
    ['name', 'runtime', 'memory', 'timeout', 'handler', 'path'].forEach(a => this[a] = args[a]);
  }

  invoke(event, res) {
    execFile('docker',
      ['run', '--rm', '-v', `${this.path}:/var/task`]
        .concat(envs)
        .concat(['lambci/lambda:' + this.runtime, this.handler, JSON.stringify(event)]), {}, (err, stdout, stderr) => {
          console.log(stderr);
          try {
            let out = JSON.parse(stdout);
            assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
            res.status(out.statusCode);
            // TODO: isBase64Encoded
            // TODO: headers
            res.send(out.body);
          } catch (e) {
            console.error(e.toString());
            res.status(502);
            res.json({ message: 'Bad Gateway' });
          }
        });
  }
}

module.exports = Lambda;
