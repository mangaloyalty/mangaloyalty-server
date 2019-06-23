import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-dist';
import * as api from 'express-openapi-json';
import * as app from '.';
const openapiData = require('../openapi.json');
const packageData = require('../package.json');
openapiData.info.version = packageData.version;

// Initialize the openapi router.
const openapi = api.createCore(openapiData)
  .controller(new app.RemoteController())
  .controller(new app.SessionController())
  .router();

// Initialize the server.
const server = express();
server.disable('x-powered-by');
server.use(bodyParser.json());
server.use(cors());

// Initialize the server router.
server.use(express.static(`${__dirname}/../public`));
server.use(express.static(swaggerUi.absolutePath()));
server.use(openapi);
server.listen(7783, () => {
  console.log(`Server running on http://localhost:7783/`);
  app.browserHelper.browserAsync();
});
