#!/usr/bin/env node

const path = require('path');
const yargs = require('yargs');
const app = require('../index');
const config = require('../lib/config');

const args = yargs.env('GENESIS').options({
  verbose: {
    alias: 'v',
    default: false,
  },
  config: {
    alias: 'c',
    default: 'genesis.config.yml',
    description: 'location and name of genesis config file',
  },
  webserver: {
    alias: 'w',
    description: 'run front-end dev server, supports cra and webpack',
  },
  'lambda-base-directory': {
    alias: 'l',
    default: path.resolve(process.cwd(), 'lambda'),
    description: 'location of base directory that contains lambda functions',
  },
  host: {
    alias: 'h',
    default: process.env.HOST || '127.0.0.1',
  },
  port: {
    alias: 'p',
    default: '3000',
  },
}).argv;

config
  .load(path.resolve(args.lambdaBaseDirectory, 'api.openapi.yml'))
  .then(res => app(args, res))
  .then((server) => {
    server.listen(args.port, args.host, () => console.log(`Project is running at http://${args.host}:${args.port}/`));
  });
