const spawn = require('child_process').spawn;
const assert = require('assert');
const utils = require('../../utils');

const envs = [].concat.apply([], utils.ENV_VARS.map(x => ['-e', x]));

class Lambda {
  constructor(args) {
    args = Object.assign(
      {
        handler: 'index.handler',
        dockerPath: 'docker',
        environment: {},
      },
      args || {},
    );
    [
      'name',
      'runtime',
      'memory',
      'timeout',
      'handler',
      'path',
      'dockerPath',
      'environment',
    ].forEach(a => (this[a] = args[a]));
  }

  buildEnvironmentalVariables() {
    const env = this.environment;
    return [].concat.apply(
      [],
      Object.keys(env).map(k => ['-e', env[k] === null ? k : `${k}=${env[k]}`]),
    );
  }

  invoke(event) {
    return new Promise((resolve, reject) => {
      const child = spawn(
        this.dockerPath,
        ['run', '--rm', '-v', `${this.path}:/var/task`]
          .concat(this.buildEnvironmentalVariables())
          .concat(envs)
          .concat([`lambci/lambda:${this.runtime}`])
          .concat([this.handler, JSON.stringify(event)]),
        {},
      );

      const chunks = [];
      child.stdout.on('data', data => chunks.push(data));

      // passthrough stderr
      child.stderr.on('data', data => process.stdout.write(data));

      child.on('close', (code) => {
        if (code !== 0) reject(`Lambda container exited with code ${code}`);
        try {
          const out = JSON.parse(chunks.join(''));
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
