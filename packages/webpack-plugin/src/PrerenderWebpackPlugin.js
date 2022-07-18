const { prerenderService, puppeteerService, webServerService }= require('@prerender-kit/tools');

const { getCompilationTimeMessage } = require('./utils');

const { DEFAULT_OPTIONS } = require('./constants');

const services = {
    webServerService,
    puppeteerService
};

class PrerenderWebpackPlugin {
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };
    }

    runPrerender() {
        const startTime = new Date().getTime();
        let isErrorCatched;

        prerenderService(this.options, services)
            .catch((error) => {
                isErrorCatched = true;
                console.error(error);
                process.exit(1);
            })
            .finally(() => {
                const compilationTimeMessage = getCompilationTimeMessage(startTime, isErrorCatched);
                console.log(compilationTimeMessage);
            });
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tap('PrerenderWebpackPlugin', () => {
            console.log();
            this.runPrerender();
        });
    }
}

module.exports = PrerenderWebpackPlugin;
