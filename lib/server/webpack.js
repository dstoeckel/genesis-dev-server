const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');
const fs = require('fs');

const { WEBPACK_CONFIG = 'webpack.config.js' } = process.env;

module.exports = async function Server(app) {

  const configFile = [WEBPACK_CONFIG, 'webpack.dev.js'].find(f => f && fs.existsSync(path.resolve(f)));
  console.log(configFile);
  if (!configFile) {
    console.error('No suitable webpack config file found. Please specify the WEBPACK_CONFIG environment variable.');
    process.exit(1);
  }

  const config = require(path.resolve(configFile));
  const compiler = webpack(config);
  const { devServer: serverConfig = {} } = config;
  const { before } = serverConfig;
  serverConfig.before = (devServerApp, server) => {
    devServerApp.use(app);
    return before && before(devServerApp, server);
  };
  return new WebpackDevServer(compiler, serverConfig);
};
