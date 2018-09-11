const crypto = require('crypto'),
  cookieParser = require('cookie-parser'),
  express = require('express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  url = require('url'),
  fs = require('fs'),
  assert = require('assert'),
  utils = require('./utils'),
  Lambda = require('./lib/lambda'),
  history = require('connect-history-api-fallback');

module.exports = (args, config) => {

  const app = express();
  app.use('/public', express.static('public'));

  app.use(cookieParser());
  app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }));

  app.use((req, res, next) => {
    // TODO: validate and/or set xsrf-token
    next();
  });

  app.all('/api/*', (req, res) => {
    let parsedUrl = url.parse(req.url, true);
    let event = {
      resource: '/api/{proxy+}',
      path: req.path,
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters: parsedUrl.search ? parsedUrl.query : null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        authorizer: {
          muid: 'm252249',
          email: 'moritz.onken@merckgroup.com',
          principalId: '824ebb6f-dd89-4062-9156-8743043733fd',
        },
        requestTimeEpoch: new Date().getTime(),
        identity: {
          userAgent: 'Amazon CloudFront',
          sourceIp: '127.0.0.1',
        },
      },
      body: req.body instanceof Buffer ? req.body.toString() : null,
      isBase64Encoded: false,
    };
    let task = path.resolve(args.lambdaBaseDirectory, 'main');
    let lambda = config.lambda['main'];
    lambda.path = task;
    lambda.invoke(event).then(out => {
      assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
      res.status(out.statusCode);
      // TODO: isBase64Encoded
      // TODO: headers
      res.send(out.body);
    }).catch(err => {
      console.error(err.toString());
      res.status(502);
      res.json({ message: 'Internal server error' });
    });
  });

  app.post('/oauth2/user', (req, res) => {
    res.json({ "at_hash": "U1zvHrfQFBOeBiHapVF23g", "sub": "824ebb6f-dd89-4062-9156-8743043733fd", "cognito:groups": ["us-east-2_ytLIDC5V6_Merck"], "email_verified": false, "iss": "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_ytLIDC5V6", "cognito:username": "Merck_M252249", "preferred_username": "M252249@eu.merckgroup.com", "given_name": "Moritz", "aud": "6ofje021s1673b12mtid3qsubo", "identities": [{ "userId": "M252249", "providerName": "Merck", "providerType": "SAML", "issuer": "https://sts.windows.net/db76fb59-a377-4120-bc54-59dead7d39c9/", "primary": "true", "dateCreated": "1506095170719" }], "token_use": "id", "auth_time": 1527689699, "exp": 1527693299, "iat": 1527689699, "family_name": "Onken", "email": "moritz.onken@merckgroup.com" });
  });

  app.post('/oauth2/refresh', (req, res) => {
    let token = crypto.randomBytes(16).toString('hex');
    res.cookie('xsrf-token', token, { expires: new Date(Date.now() + 3600000) });
  });

  // Fallback to index.html if no static file was served.
  app.use(history());

  if (fs.existsSync(args.webpackConfig)) {
    const webpack = require('webpack'),
      middleware = require('webpack-dev-middleware'),
      compiler = webpack(require(path.resolve(args.webpackConfig)));
    app.use(middleware(compiler, {
      // webpack-dev-middleware options
    }));
  } else {
    app.get('/', (req, res) => {
      res.send(`
      <h1>Genesis Dev Server</h1>
      <p>Open the browser's developer tools to access the API Gateway or enable the webpack dev server (<code>--webpack</code>).</p>
    `);
    })
  }

  return app;
}
