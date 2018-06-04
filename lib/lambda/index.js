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
      //console.log(this.dockerPath);
      execFile(this.dockerPath,
        ['run', '--rm', '-v', `${this.path}:/var/task`]
          .concat(envs)
          .concat(['lambci/lambda:' + this.runtime, this.handler, JSON.stringify(event)]), {}, (err, stdout, stderr) => {
            if(err) return reject(err);
            console.log(stderr);
            try {
              let out = JSON.parse(stdout);
              assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
              resolve(out);
              //res.status(out.statusCode);
              // TODO: isBase64Encoded
              // TODO: headers
              //res.send(out.body);
            } catch (e) {
              reject(e);
              //console.error(e.toString());
              //res.status(502);
              //res.json({ message: 'Bad Gateway' });
            }
          });
    });
  }
}

module.exports = Lambda;
