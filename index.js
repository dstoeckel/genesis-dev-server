const crypto = require('crypto'),
  cookieParser = require('cookie-parser'),
  express = require('express'),
  bodyParser = require('body-parser'),
  execFile = require('child_process').execFile,
  path = require('path'),
  url = require('url'),
  fs = require('fs'),
  assert = require('assert');

const ENV_VARS = [
  'AWS_REGION',
  'AWS_DEFAULT_REGION',
  'AWS_ACCOUNT_ID',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_LAMBDA_FUNCTION_NAME',
  'AWS_LAMBDA_FUNCTION_VERSION',
  'AWS_LAMBDA_FUNCTION_MEMORY_SIZE',
  'AWS_LAMBDA_FUNCTION_TIMEOUT',
  'AWS_LAMBDA_FUNCTION_HANDLER',
  'AWS_LAMBDA_EVENT_BODY',
  'DOCKER_LAMBDA_USE_STDIN',
]

module.exports = args => {

  const app = express();

  if (fs.existsSync('webpack.config.js')) {
    const webpack = require('webpack'),
      middleware = require('webpack-dev-middleware'),
      compiler = webpack(require(path.resolve('webpack.config.js')));
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

  app.use(cookieParser());
  app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }));

  app.use((req, res, next) => {
    //if(req.cookies['xsrf-token'])
    next();
  });

  app.all('/api/*', (req, res) => {
    let parsedUrl = url.parse(req.url, true);
    let event = JSON.stringify({
      resource: '/api/{proxy+}',
      path: req.path,
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters: parsedUrl.search ? parsedUrl.query : null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        requestTimeEpoch: new Date().getTime(),
        identity: {
          caller: 'AROAIYDPCAQXTFCBHLO4U:m252249',
          user: 'AROAIYDPCAQXTFCBHLO4U:m252249',
          userArn: 'arn:aws:sts::368326717666:assumed-role/Developer/m252249',
          sourceIp: '127.0.0.1',
        },
      },
      body: req.body instanceof Buffer ? req.body.toString() : null,
      isBase64Encoded: false,
    });
    let task = path.resolve(args.lambdaBaseDirectory, 'main'),
      envs = [].concat.apply([], ENV_VARS.map(function (x) { return ['-e', x] }));

    execFile('docker',
      ['run', '--rm', '-v', `${task}:/var/task`]
        .concat(envs)
        .concat(['lambci/lambda:nodejs8.10', 'index.handler', event]), {}, (err, stdout, stderr) => {
          console.log(stderr);
          try {
            let out = JSON.parse(stdout);
            assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
            res.status(out.statusCode);
            // TODO: isBase64Encoded
            // TODO: headers
            res.send(out.body);
          } catch (e) {
            console.error(e.toString());
            res.status(502);
            res.json({ message: 'Bad Gateway' });
          }
        });
    //res.json({ api: true });
  });
  app.post('/oauth2/user', (req, res) => {
    res.json({ "at_hash": "U1zvHrfQFBOeBiHapVF23g", "sub": "824ebb6f-dd89-4062-9156-8743043733fd", "cognito:groups": ["us-east-2_ytLIDC5V6_Merck"], "email_verified": false, "iss": "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_ytLIDC5V6", "cognito:username": "Merck_M252249", "preferred_username": "M252249@eu.merckgroup.com", "given_name": "Moritz", "aud": "6ofje021s1673b12mtid3qsubo", "identities": [{ "userId": "M252249", "providerName": "Merck", "providerType": "SAML", "issuer": "https://sts.windows.net/db76fb59-a377-4120-bc54-59dead7d39c9/", "primary": "true", "dateCreated": "1506095170719" }], "token_use": "id", "auth_time": 1527689699, "exp": 1527693299, "iat": 1527689699, "family_name": "Onken", "email": "moritz.onken@merckgroup.com" });
  });

  app.post('/oauth2/refresh', (req, res) => {
    let token = crypto.randomBytes(16).toString('hex');
    res.cookie('xsrf-token', token, { expires: new Date(Date.now() + 3600000) });
  });

  return app;
}
