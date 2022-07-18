const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');

const getStyledMessage = require('../../utils/getStyledMessage');

const { getDefaultOptions } = require('./utils/prerenderOptions');

const { getPuppeteerOptions } = require('./utils/puppeteerOptions');

const prerenderService = async (userOptions, services) => {
    let options;

    try {
        options = getDefaultOptions(userOptions);
    } catch (e) {
        return Promise.reject(e.message);
    }

    const sourceDir = path.normalize(`${process.cwd()}/${options.source}`);
    const destinationDir = path.normalize(`${process.cwd()}/${options.destination}`);

    if (options.crawl || options.include.includes('/')) {
        if (destinationDir === sourceDir && fs.existsSync(path.join(sourceDir, '200.html'))) {
            console.log(getStyledMessage.error(`200.html is present in the sourceDir (${sourceDir}). You can not run prerendering process twice - this will break the build`));
            return Promise.reject('');
        }

        if (destinationDir !== sourceDir) {
            mkdirp.sync(destinationDir);
        }

        fs.createReadStream(path.join(sourceDir, 'index.html')).pipe(fs.createWriteStream(path.join(destinationDir, '200.html')));
    }

    const server = services.webServerService ? services.webServerService({
        sourceDir,
        options
    }) : null;

    const puppetierOptions = getPuppeteerOptions({
        sourceDir,
        destinationDir,
        options,
        server
    });

    await services.puppeteerService(puppetierOptions);
};

module.exports = prerenderService;
