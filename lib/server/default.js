const express = require('express');

module.exports = async function Server() {
  const app = express();
  app.get('/', (req, res) => {
    res.send(`
    <h1>Genesis Dev Server</h1>
    <p>Open the browser's developer tools to access the API Gateway or enable the create-react-app or webpack dev server (<code>--webserver [cra|webpack]</code>).</p>
  `);
  });
  return app;
};
