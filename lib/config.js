const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const Lambda = require('./lambda');

function readFileAsync(file) {
  return new Promise((resolve, reject) => fs.readFile(file, (err, content) => {
    if (err && err.code === 'ENOENT') return resolve({});
    if (err) return reject(err);
    return resolve(yaml.safeLoad(content) || {});
  }));
}

module.exports = {
  load: async (base) => {
    const [openapi, env] = await Promise.all([
      readFileAsync(path.resolve(base, 'api.openapi.yml')),
      readFileAsync(path.resolve(base, 'environment.json')),
    ]);
    const genesisConfig = openapi['x-genesis'] || {
      lambda: {
        main: {
          runtime: 'nodejs10.x',
        },
      },
    };
    const config = {};
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const lambda in genesisConfig.lambda) {
      config[lambda] = new Lambda({
        environment: env,
        ...genesisConfig.lambda[lambda],
      });
    }
    return { lambda: config };
  },
};
