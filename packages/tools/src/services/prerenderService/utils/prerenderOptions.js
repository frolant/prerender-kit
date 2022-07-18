const getStyledMessage = require('../../../utils/getStyledMessage');
const { defaultOptions } = require('../constants');

/**
 *
 * @param {{source: ?string, destination: ?string, include: ?Array<string>, sourceMaps: ?boolean, skipThirdPartyRequests: ?boolean }} userOptions
 * @return {*}
 */
const getDefaultOptions = (userOptions) => {
    const options = {
        ...defaultOptions,
        ...userOptions
    };

    options.destination = options.destination || options.source;

    let exit = false;

    if (!options.include || !options.include.length) {
        console.log(getStyledMessage.error('include option should be an non-empty array'));
        exit = true;
    }

    if (options.preloadResources) {
        console.log(getStyledMessage.error('preloadResources option deprecated. Use preloadImages or cacheAjaxRequests'));
        exit = true;
    }

    if (options.minifyOptions) {
        console.log(getStyledMessage.error('minifyOptions option renamed to minifyHtml'));
        options.minifyHtml = options.minifyOptions;
    }

    if (options.asyncJs) {
        console.log(getStyledMessage.error('asyncJs option renamed to asyncScriptTags'));
        options.asyncScriptTags = options.asyncJs;
    }

    if (exit) {
        throw new Error();
    }

    if (options.minifyHtml && !options.minifyHtml.minifyCSS) {
        options.minifyHtml.minifyCSS = options.minifyCss;
    }

    if (!options.publicPath.startsWith('/')) {
        options.publicPath = `/${options.publicPath}`;
    }

    options.publicPath = options.publicPath.replace(/\/$/, '');

    options.include = options.include.map((include) => options.publicPath + include);

    return options;
};

module.exports = {
    getDefaultOptions
};
