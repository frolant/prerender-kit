const DEFAULT_OPTIONS = {
    publicPath: '/',
    proxy: {
        routes: {},
        allowedForCachingPostRequestsEntries: []
    },
    puppeteerArgs: [
        '--disable-setuid-sandbox',
        '--no-sandbox'
    ]
};

module.exports = {
    DEFAULT_OPTIONS
};
