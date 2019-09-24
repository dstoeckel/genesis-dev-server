const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');
const fs = require('fs');

const { WEBPACK_CONFIG = 'webpack.config.js' } = process.env;

module.exports = async function Server() {

  const configFile = [WEBPACK_CONFIG, 'webpack.dev.js'].find(f => f && fs.existsSync(path.resolve(f)));
  console.log(configFile);
  if (!configFile) {
    console.error('No suitable webpack config file found. Please specify the WEBPACK_CONFIG environment variable.');
    process.exit(1);
  }

  const config = require(path.resolve(configFile));
  const compiler = webpack(config);
  return new WebpackDevServer(compiler, config.devServer);
};
