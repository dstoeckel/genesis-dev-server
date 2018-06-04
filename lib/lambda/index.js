const execFile = require('child_process').execFile,
  utils = require('../../utils'),
  assert = require('assert');

let envs = [].concat.apply([], utils.ENV_VARS.map(function (x) { return ['-e', x] }))

class Lambda {
  constructor(args) {
    args = Object.assign({
      handler: 'index.handler',
      dockerPath: 'docker',
    }, args || {});
    ['name', 'runtime', 'memory', 'timeout', 'handler', 'path', 'dockerPath']
      .forEach(a => this[a] = args[a]);
  }

  invoke(event) {
    return new Promise((resolve, reject) => {
      execFile(this.dockerPath,
        ['run', '--rm', '-v', `${this.path}:/var/task`]
          .concat(envs)
          .concat(['lambci/lambda:' + this.runtime])
          .concat([this.handler, JSON.stringify(event)]),
        {},
        this.handleResponse.bind(this, resolve, reject)
      );
    });
  }

  handleResponse(resolve, reject, err, stdout, stderr) {
    if (err) return reject(err);
    console.log(stderr);
    try {
      let out = JSON.parse(stdout);
      assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
      resolve(out);
    } catch (e) {
      reject(e);
    }
  }
}

module.exports = Lambda;
