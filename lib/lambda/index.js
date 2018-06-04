const spawn = require('child_process').spawn,
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
      let child = spawn(this.dockerPath,
        ['run', '--rm', '-v', `${this.path}:/var/task`]
          .concat(envs)
          .concat(['lambci/lambda:' + this.runtime])
          .concat([this.handler, JSON.stringify(event)]),
        {}
      );

      let chunks = [];
      child.stdout.on('data', data => chunks.push(data));

      // passthrough stderr
      child.stderr.on('data', data => process.stdout.write(data));

      child.on('close', code => {
        if(code !== 0) reject(`Lambda container exited with code ${code}`);
        try {
          let out = JSON.parse(chunks.join(''));
          assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
          resolve(out);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

module.exports = Lambda;
