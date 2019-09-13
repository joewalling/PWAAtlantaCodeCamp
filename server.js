'use strict';

const express = require('express');
const fetch = require('node-fetch');
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

//  Change this to add a delay (ms) before the server responds.
const DISPATCH_DELAY = 0;
const BASE_URL = process.env.API_URL + '/api/dispatches';

/**
 * Gets the dispatch data.
 *
 * @param {Request} req request object from Express.
 * @param {Response} resp response object from Express.
 */
function getDispatches(req, resp) {
  fetch(BASE_URL).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(resp.statusText);
    }
    return resp.json();
  }).then((data) => {
    setTimeout(() => {
      resp.json(data);
    }, DISPATCH_DELAY);
  }).catch((err) => {
    console.error('Dispatch Error:', err.message);
  });
}

/**
 * Starts the Express server.
 *
 * @return {ExpressServer} instance of the Express server.
 */
function startServer() {
  const app = express();
  const port = process.env.PORT;

  // Redirect HTTP to HTTPS,
  app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));

  // Logging for each request
  app.use((req, resp, next) => {
    // eslint-disable-next-line no-console
    console.log(resp);
    next();
  });

  // Handle requests for the data
  //app.get('/', getDispatches);

  // Handle requests for static files
  app.use(express.static('public'));

  // Start the server
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log('Server started on port ' + port + '...');
  });
}

startServer();
