#!/usr/bin/env node

const path = require('path'),
  app = require('../index'),
  config = require('../lib/config'),
  args = require('yargs').env('GENESIS').options({
    verbose: {
      alias: 'v',
      default: false,
    },
    config: {
      alias: 'c',
      default: 'genesis.config.yml',
      description: 'location and name of genesis config file',
    },
    'webpack-config': {
      default: 'webpack.config.js',
      description: 'location and name of webpack config file',
    },
    webpack: {
      alias: 'w',
      default: false,
      description: 'run webpack dev server',
    },
    'lambda-base-directory': {
      alias: 'l',
      default: path.resolve(process.cwd(), 'lambda'),
      description: 'location of base directory that contains lambda functions',
    }
  }).argv;

config.load(path.resolve(args.lambdaBaseDirectory, 'api.openapi.yml')).then(res => {
  let server = app(args, res);
  server.listen(8080, () => console.log('Project is running at http://localhost:8080/'))
});
