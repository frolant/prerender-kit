const path = require('path');
const fs = require('fs');

const { prerenderService, puppeteerService, webServerService }= require('@prerender-kit/tools');

(async function() {
    const [optionsPath, ...include] = process.argv.slice(2);

    const {
        useExternalWebServer = false,
        ...options
    } = JSON.parse(fs.readFileSync(path.normalize(optionsPath), 'utf8'));

    const processedOptions = {
        ...options,
        crawl: !include.length,
        include: include.length ? include.map((item) => item.slice(1)) : options.include || []
    };

    const services = {
        puppeteerService,
        ...(!useExternalWebServer && {
            webServerService
        })
    };

    prerenderService(processedOptions, services).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}());
