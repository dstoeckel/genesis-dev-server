// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const url = require('url');
const fs = require('fs');
const assert = require('assert');

function makeEvent(req) {
  const parsedUrl = url.parse(req.url, true);
  return {
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
      requestTimeEpoch: Date.now(),
      identity: {
        userAgent: 'Amazon CloudFront',
        sourceIp: '127.0.0.1',
      },
    },
    body: req.body instanceof Buffer ? req.body.toString() : null,
    isBase64Encoded: false,
  };
}

function invokeLambda(lambda, event, res) {
  lambda
    .invoke(event)
    .then((out) => {
      assert.equal(typeof out.statusCode, 'number', 'statusCode must be a number.');
      const headers = {
        ...(out.headers || {}),
        ...(out.multiValueHeaders || {}),
      };
      Object.keys(headers).forEach((k) => {
        res.setHeader(k, headers[k]);
      });
      res.status(out.statusCode);
      // TODO: isBase64Encoded
      res.send(out.body);
    })
    .catch((err) => {
      console.error(err.toString());
      res.status(502);
      res.json({ message: 'Internal server error' });
    });
}

// Resolve the location of all configured lambdas once on startup
function setupLambdas(base, lambda) {
  for(const l in lambda) {
    if(lambda.hasOwnProperty(l)) {
      lambda[l].path = path.resolve(base, lambda[l].path || l);
    }
  }
}

module.exports = (args, config) => {
  const app = express();
  setupLambdas(args.lambdaBaseDirectory, config.lambda)

  app.disable('x-powered-by');

  app.use(cookieParser());
  app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }));

  app.use((req, res, next) => {
    // TODO: validate and/or set xsrf-token
    next();
  });

  app.all('/api/:sub*', (req, res) => {
    const event = makeEvent(req);
    const sub = req.params.sub;

    if(sub in config.lambda) {
      invokeLambda(config.lambda[sub], event, res);
    } else if('main' in config.lambda) {
      invokeLambda(config.lambda.main, event, res)
    } else {
      res.status(404);
      res.json({ message: 'Unknown endpoint' })
    }
  });

  if(config.lambda.main !== undefined) {
    app.all('/api/?', (req, res) => {
      const event = makeEvent(req);
      invokeLambda(config.lambda.main, event, res)
    });
  }

  app.post('/oauth2/user', (req, res) => {
    res.json({
      at_hash: 'U1zvHrfQFBOeBiHapVF23g',
      sub: '824ebb6f-dd89-4062-9156-8743043733fd',
      'cognito:groups': ['us-east-2_ytLIDC5V6_Merck'],
      email_verified: false,
      iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_ytLIDC5V6',
      'cognito:username': 'Merck_M252249',
      preferred_username: 'M252249@eu.merckgroup.com',
      given_name: 'Moritz',
      aud: '6ofje021s1673b12mtid3qsubo',
      identities: [
        {
          userId: 'M252249',
          providerName: 'Merck',
          providerType: 'SAML',
          issuer: 'https://sts.windows.net/db76fb59-a377-4120-bc54-59dead7d39c9/',
          primary: 'true',
          dateCreated: '1506095170719',
        },
      ],
      token_use: 'id',
      auth_time: 1527689699,
      exp: 1527693299,
      iat: 1527689699,
      family_name: 'Onken',
      email: 'moritz.onken@merckgroup.com',
    });
  });

  app.post('/oauth2/refresh', (req, res) => {
    const token = crypto.randomBytes(16).toString('hex');
    res.cookie('xsrf-token', token, { expires: new Date(Date.now() + 3600000) });
  });

  const { webserver = 'default' } = args;
  let serverFactory;

  try {
    const libLocation = path.join(__dirname, `lib/server/${webserver}.js`);
    fs.statSync(libLocation);

    // eslint-disable-next-line global-require
    serverFactory = require(libLocation);
  } catch (e) {
    if(e.code === 'ENOENT') {
      console.error('Specified web server does not exist.');
    } else if(e.code === 'MODULE_NOT_FOUND') {
      console.error('Some web server dependencies could not be loaded:', e.message);
    } else {
      console.error(e.toString());
    }
    process.exit(1);
  }
  return serverFactory(app, args).then((server) => {
    return server;
  });
};
