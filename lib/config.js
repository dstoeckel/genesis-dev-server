const yaml = require('js-yaml');
const fs = require('fs');
const Lambda = require('./lambda');

module.exports = {
  load: file => new Promise((resolve, reject) => fs.readFile(file, (err, content) => {
    if (err) return reject(err);
    let config = yaml.safeLoad(content) || {};
    config = Object.assign(
      {
        lambda: {
          main: {
            runtime: 'nodejs8.10',
          },
        },
      },
      config['x-genesis'],
    );
    for (const lambda in config.lambda) {
      config.lambda[lambda] = new Lambda(config.lambda[lambda]);
    }
    return resolve(config);
  })),
};
