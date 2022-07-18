'use strict'

/*
 * Imported below prerenderService and puppeteerService was created using parts of code
 * of the deprecated and not supported currently library:
 * https://github.com/stereobooster/react-snap
 */

const puppeteerService = require('./services/puppeteerService');
const prerenderService = require('./services/prerenderService');
const webServerService = require('./services/webServerService');

const getStyledMessage = require('./utils/getStyledMessage');

module.exports = {
    prerenderService,
    puppeteerService,
    webServerService,
    getStyledMessage
};
